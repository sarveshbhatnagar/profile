/**
 * github-publish.js
 * Publishes a post entry directly to blog/posts/posts.json via the GitHub Contents API.
 *
 * Requires a GitHub Personal Access Token (PAT) with `contents: write` on this repo.
 * The token is stored in localStorage — never sent anywhere except api.github.com.
 */

(function initGitHubPublisher() {
  const OWNER      = 'sarveshbhatnagar';
  const REPO       = 'profile';
  const BRANCH     = 'master';
  const POSTS_PATH = 'blog/posts/posts.json';
  const TOKEN_KEY  = 'gh_pat_blog';
  const API_BASE   = 'https://api.github.com';

  /* ---- Token storage ---- */
  function getToken()      { return localStorage.getItem(TOKEN_KEY) || ''; }
  function saveToken(t)    { localStorage.setItem(TOKEN_KEY, t.trim()); }
  function clearToken()    { localStorage.removeItem(TOKEN_KEY); }

  /* ---- Slug helper ---- */
  function toSlug(str) {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /* ---- GitHub API helpers ---- */
  function apiHeaders(token) {
    return {
      'Authorization':        'Bearer ' + token,
      'Accept':               'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type':         'application/json',
    };
  }

  async function readPostsJson(token) {
    const res = await fetch(
      `${API_BASE}/repos/${OWNER}/${REPO}/contents/${POSTS_PATH}?ref=${BRANCH}`,
      { headers: apiHeaders(token) }
    );
    if (res.status === 401) throw new Error('Invalid token — check your PAT.');
    if (res.status === 403) throw new Error('Token lacks write permission on this repo.');
    if (!res.ok) throw new Error('Could not read posts.json (' + res.status + ').');

    const json = await res.json();
    const content = JSON.parse(
      decodeURIComponent(escape(atob(json.content.replace(/\n/g, ''))))
    );
    return { sha: json.sha, posts: content };
  }

  async function writePostsJson(token, sha, posts, commitMsg) {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2))));
    const res = await fetch(
      `${API_BASE}/repos/${OWNER}/${REPO}/contents/${POSTS_PATH}`,
      {
        method: 'PUT',
        headers: apiHeaders(token),
        body: JSON.stringify({
          message: commitMsg,
          content: encoded,
          sha,
          branch: BRANCH,
        }),
      }
    );
    if (res.status === 401) throw new Error('Invalid token — check your PAT.');
    if (res.status === 403) throw new Error('Token lacks write permission on this repo.');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'GitHub API error (' + res.status + ').');
    }
    return res.json();
  }

  /* ---- Main publish function ---- */
  async function publishPost({ title, date, tags, markdown, author, source }) {
    const token = getToken();
    if (!token) throw new Error('No GitHub token saved. Enter your PAT first.');

    const slug    = toSlug(title) || 'untitled-post';
    const html    = window.mdToHtml ? window.mdToHtml(markdown) : markdown;
    const rawText = markdown.replace(/^#+\s*/gm, '').replace(/[*_`\[\]]/g, '');
    const firstPara = rawText.split(/\n\n/)[0].replace(/\n/g, ' ').trim();
    const excerpt = firstPara.length > 160 ? firstPara.slice(0, 157) + '...' : firstPara;

    const entry = { id: slug, title, date, excerpt, content: html, tags };
    if (author) entry.author = author;
    if (source) entry.source = source;

    const { sha, posts } = await readPostsJson(token);
    const updated = [entry, ...posts.filter(p => p.id !== slug)];

    // Write posts.json
    const writeResult = await writePostsJson(token, sha, updated, `blog: add "${title}"`);

    // Also write posts-data.js so post.html (which loads it as a script and
    // prefers window.BLOG_POSTS over fetching posts.json) gets the new post.
    const postsDataJs = 'window.BLOG_POSTS = ' + JSON.stringify(updated, null, 2) + ';\n';
    const postsDataEncoded = btoa(unescape(encodeURIComponent(postsDataJs)));
    const POSTS_DATA_PATH = 'blog/posts/posts-data.js';

    // Get current SHA of posts-data.js (required for update)
    const getDataJs = await fetch(
      `${API_BASE}/repos/${OWNER}/${REPO}/contents/${POSTS_DATA_PATH}?ref=${BRANCH}`,
      { headers: apiHeaders(token) }
    );
    if (getDataJs.ok) {
      const dataJsMeta = await getDataJs.json();
      const syncRes = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${POSTS_DATA_PATH}`, {
        method: 'PUT',
        headers: apiHeaders(token),
        body: JSON.stringify({
          message: `blog: sync posts-data.js for "${title}"`,
          content: postsDataEncoded,
          sha: dataJsMeta.sha,
          branch: BRANCH,
        }),
      });
      if (!syncRes.ok) {
        const err = await syncRes.json().catch(() => ({}));
        throw new Error(`posts.json updated but posts-data.js sync failed (${syncRes.status}): ${err.message || 'unknown error'}. Run: python3 blog/build_blog.py --build-all`);
      }
    }

    return { slug, url: `https://sarveshbhatnagar.com/blog/post.html?id=${slug}` };
  }

  /* ---- UI wiring ---- */
  function initUI() {
    const tokenInput   = document.getElementById('gh-token-input');
    const saveTokenBtn = document.getElementById('gh-save-token');
    const clearTokenBtn= document.getElementById('gh-clear-token');
    const tokenStatus  = document.getElementById('gh-token-status');
    const publishBtn   = document.getElementById('publish-btn');
    const publishStatus= document.getElementById('publish-status');

    if (!publishBtn) return;

    function refreshTokenState() {
      const stored = getToken();
      if (stored) {
        tokenStatus.textContent  = '// token saved';
        tokenStatus.dataset.type = 'success';
        if (tokenInput)    tokenInput.value = '';
        if (clearTokenBtn) clearTokenBtn.style.display = '';
        if (saveTokenBtn)  saveTokenBtn.textContent = 'update';
      } else {
        tokenStatus.textContent  = '// no token — enter a PAT with contents:write';
        tokenStatus.dataset.type = 'warn';
        if (clearTokenBtn) clearTokenBtn.style.display = 'none';
        if (saveTokenBtn)  saveTokenBtn.textContent = 'save';
      }
    }

    if (saveTokenBtn) {
      saveTokenBtn.addEventListener('click', () => {
        const val = tokenInput?.value.trim();
        if (!val) { tokenStatus.textContent = 'Paste your token first.'; tokenStatus.dataset.type = 'error'; return; }
        saveToken(val);
        refreshTokenState();
      });
    }

    if (clearTokenBtn) {
      clearTokenBtn.addEventListener('click', () => {
        clearToken();
        refreshTokenState();
      });
    }

    publishBtn.addEventListener('click', async () => {
      const title    = document.getElementById('post-title')?.value.trim();
      const date     = document.getElementById('post-date')?.value.trim();
      const rawTags  = document.getElementById('post-tags')?.value.trim();
      const markdown = document.getElementById('md-editor')?.value.trim();
      const author   = document.getElementById('post-author')?.value.trim();
      const source   = document.getElementById('post-source')?.value.trim();

      if (!title)    { publishStatus.textContent = 'Add a title first.';    publishStatus.dataset.type = 'error'; return; }
      if (!markdown) { publishStatus.textContent = 'Write some content first.'; publishStatus.dataset.type = 'error'; return; }

      const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];

      publishBtn.disabled = true;
      publishBtn.textContent = 'publishing…';
      publishStatus.textContent = 'Committing to GitHub…';
      publishStatus.dataset.type = 'info';

      try {
        const result = await publishPost({ title, date, tags, markdown, author, source });
        publishStatus.innerHTML =
          '// published! Live in ~30 s → <a href="' + result.url + '" target="_blank" rel="noopener">' + result.url + '</a>';
        publishStatus.dataset.type = 'success';
      } catch (err) {
        publishStatus.textContent = err.message;
        publishStatus.dataset.type = 'error';
      } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish to GitHub';
      }
    });

    refreshTokenState();
  }

  document.addEventListener('DOMContentLoaded', initUI);

  // Expose for console debugging
  window.GitHubPublisher = { getToken, saveToken, clearToken };
})();
