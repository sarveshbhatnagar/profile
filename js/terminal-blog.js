/**
 * terminal-blog.js
 * Sarvesh Bhatnagar Portfolio — Blog System
 *
 * posts.json  → metadata index [{id, title, date, excerpt, tags, file?, content?}]
 * posts/*.md  → one markdown file per post (fetched when `content` is absent)
 *
 * No ES module imports — single file loads reliably on static hosts and CDNs.
 */

/* -------------------------------------------------------
   Configuration — paths resolve correctly from both
   /blog/index.html and /blog/post.html
------------------------------------------------------- */
const POSTS_BASE = (function () {
  return window.location.pathname.includes('/blog/') ? 'posts/' : 'blog/posts/';
})();

function hasInlinePostBody(post) {
  return post != null && typeof post.content === 'string';
}

function postsJsonUrl() {
  return new URL(POSTS_BASE + 'posts.json', window.location.href).toString();
}

/* -------------------------------------------------------
   Utility: Markdown → HTML
   Covers: headings, bold, italic, code blocks, inline code,
   blockquotes, unordered/ordered lists, links, images, hr
------------------------------------------------------- */
function mdToHtml(md) {
  if (!md) return '';

  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="lang-${lang || 'text'}">${code.trim()}</code></pre>`
  );

  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm,  '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm,   '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm,    '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm,     '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm,      '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/((?:^[\*\-] .+\n?)+)/gm, block => {
    const items = block.trim().split('\n')
      .map(l => `<li>${l.replace(/^[\*\-] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, block => {
    const items = block.trim().split('\n')
      .map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Inline: bold, italic, inline code, images, links
  html = html.replace(/\*\*(.+?)\*\*/g,         '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g,              '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g,              '<code>$1</code>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,  '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Paragraphs
  const blockTags = ['<h1','<h2','<h3','<h4','<h5','<h6','<ul','<ol','<pre','<hr','<blockquote','</ul','</ol','</pre','</blockquote'];
  const lines = html.split('\n');
  const out = [];
  let inBlock = false;

  for (const line of lines) {
    const l = line.trim();
    if (!l) { inBlock = false; continue; }
    const isBlock = blockTags.some(t => l.startsWith(t));
    if (isBlock) {
      inBlock = false;
      out.push(l);
    } else if (!inBlock) {
      out.push('<p>' + l);
      inBlock = true;
    } else {
      out[out.length - 1] += ' ' + l;
    }
  }

  return out.map(line =>
    (line.startsWith('<p>') && !line.endsWith('</p>')) ? line + '</p>' : line
  ).join('\n');
}

/* -------------------------------------------------------
   Date helpers
------------------------------------------------------- */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function formatDateLs(dateStr) {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,' ')} ${d.getFullYear()}`;
  } catch { return dateStr; }
}

/* -------------------------------------------------------
   Fetch posts index
   Prefers window.BLOG_POSTS (set by posts-data.js, works on
   file:// and http) and falls back to fetching posts.json.
------------------------------------------------------- */
async function fetchPosts() {
  if (Array.isArray(window.BLOG_POSTS)) return window.BLOG_POSTS;
  const res = await fetch(postsJsonUrl(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* -------------------------------------------------------
   Blog Listing Page (blog/index.html)
   Renders posts as terminal ls -la output + tag filter
------------------------------------------------------- */
(function initBlogListing() {
  const container = document.getElementById('blog-listing');
  if (!container) return;

  function uniqueSortedTags(posts) {
    const set = new Set();
    for (const p of posts) {
      for (const t of p.tags || []) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function countPostsWithTag(posts, tag) {
    return posts.filter(p => (p.tags || []).includes(tag)).length;
  }

  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /** Attribute value: quote only; do not entity-encode & (breaks dataset / matching). */
  function attrQuote(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  container.innerHTML = '<div class="loading">Fetching posts</div>';

  fetchPosts()
    .then(posts => {
      if (!posts || posts.length === 0) {
        container.innerHTML = `
          <div class="error-state">
            <div class="error-code">404</div>
            <div class="error-msg">No posts found.</div>
            <div class="error-hint">// Add .md files and entries to posts.json</div>
          </div>`;
        return;
      }

      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      const countEl = document.getElementById('post-count');
      if (countEl) countEl.textContent = posts.length;

      const tagList = uniqueSortedTags(posts);
      const filterBarHtml =
        tagList.length === 0
          ? ''
          : `<div class="filter-bar blog-tag-filter" role="group" aria-label="Filter posts by tag">
        <span class="filter-label">tags</span>
        <button type="button" class="filter-btn active" data-filter-tag="all">all (${posts.length})</button>
        ${tagList
          .map(
            t =>
              `<button type="button" class="filter-btn" data-filter-tag="${attrQuote(t)}">${escAttr(t)} (${countPostsWithTag(posts, t)})</button>`
          )
          .join('')}
      </div>`;

      const rows = posts
        .map(post => {
          const tags = (post.tags || []).map(t => `<span class="tag">${escAttr(t)}</span>`).join('');
          const filename = post.file || post.id + '.md';
          return `
          <a class="ls-entry" href="post.html?id=${encodeURIComponent(post.id)}" data-post-id="${attrQuote(post.id)}" aria-label="Read: ${escAttr(post.title)}">
            <span class="ls-perms">-rw-r--r--</span>
            <span class="ls-date">${formatDateLs(post.date)}</span>
            <span class="ls-name">${escAttr(filename)}</span>
            <span class="ls-tags">${tags}</span>
          </a>`;
        })
        .join('');

      container.innerHTML = `
        ${filterBarHtml}
        <div class="terminal-window blog-listing-terminal">
          <div class="terminal-titlebar">
            <div class="terminal-titlebar-dots">
              <div class="t-dot t-dot-red"></div>
              <div class="t-dot t-dot-amber"></div>
              <div class="t-dot t-dot-green"></div>
            </div>
            <span class="terminal-title">sarvesh@blog:~/posts$ ls -la</span>
          </div>
          <div class="terminal-body">
            <div class="ls-header">
              <span>PERMISSIONS</span>
              <span>DATE</span>
              <span>FILE</span>
              <span style="text-align:right">TAGS</span>
            </div>
            ${rows}
          </div>
        </div>`;

      if (tagList.length === 0) return;

      const filterBtns = container.querySelectorAll('.blog-tag-filter [data-filter-tag]');
      const entries = container.querySelectorAll('.ls-entry');

      function applyTagFilter(selected) {
        entries.forEach(el => {
          const id = el.dataset.postId;
          const post = posts.find(p => p.id === id);
          if (!post) return;
          const show =
            selected === 'all' || (post.tags || []).includes(selected);
          el.hidden = !show;
        });
        filterBtns.forEach(b => {
          b.classList.toggle('active', b.dataset.filterTag === selected);
        });
      }

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          applyTagFilter(btn.dataset.filterTag);
        });
      });
    })
    .catch(err => {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-code">ERR</div>
          <div class="error-msg">Failed to load posts.</div>
          <div class="error-hint">// ${err.message}</div>
        </div>`;
    });
})();

/* -------------------------------------------------------
   Blog Post Viewer (blog/post.html)
   Reads ?id=slug → fetches metadata from posts.json
   → if `content` is set, renders that HTML; else fetches .md → markdown → HTML
------------------------------------------------------- */
(function initPostViewer() {
  const container = document.getElementById('post-viewer');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (!id) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-code">400</div>
        <div class="error-msg">No post ID specified.</div>
        <div class="error-hint">// Usage: post.html?id=slug</div>
        <div style="margin-top:var(--space-lg)"><a class="btn btn-outline btn-sm" href="index.html">← back to posts</a></div>
      </div>`;
    return;
  }

  container.innerHTML = '<div class="loading">Loading post</div>';

  fetchPosts()
    .then(posts => {
      const post = posts.find(p => p.id === id);
      if (!post) {
        container.innerHTML = `
          <div class="error-state">
            <div class="error-code">404</div>
            <div class="error-msg">Post not found: <code>${id}</code></div>
            <div class="error-hint">// No entry matching that slug in posts.json</div>
            <div style="margin-top:var(--space-lg)"><a class="btn btn-outline btn-sm" href="index.html">← back to posts</a></div>
          </div>`;
        return;
      }

      function renderPostBody(bodyHtml) {
        document.title = `${post.title} — Sarvesh Bhatnagar`;

        // Update meta tags for social sharing (helps crawlers that execute JS)
        const desc = post.excerpt || `${post.title} — Blog post by Sarvesh Bhatnagar`;
        const url  = window.location.href;
        const setMeta = (sel, val) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', val); };
        setMeta('meta[name="description"]',          desc);
        setMeta('meta[property="og:title"]',         post.title);
        setMeta('meta[property="og:description"]',   desc);
        setMeta('meta[property="og:url"]',           url);
        setMeta('meta[name="twitter:title"]',        post.title);
        setMeta('meta[name="twitter:description"]',  desc);

        const tags = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

        container.innerHTML = `
            <div class="post-meta-bar">
              <div class="post-meta-info">
                <span class="meta-date">// ${formatDate(post.date)}</span>
                <span class="meta-author">sarveshbhatnagar</span>
              </div>
              <div class="tags">${tags}</div>
            </div>
            <div class="post-content fade-in">
              <h1>${post.title}</h1>
              ${bodyHtml}
            </div>
            <div style="margin-top:var(--space-lg);">
              <a class="btn btn-ghost btn-sm" href="index.html">← all posts</a>
            </div>`;
      }

      if (hasInlinePostBody(post)) {
        renderPostBody(post.content);
        return;
      }

      const filename = post.file || post.id + '.md';
      return fetch(new URL(POSTS_BASE + filename, window.location.href).toString(), { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error(`Could not load ${filename} (HTTP ${res.status})`);
          return res.text();
        })
        .then(md => renderPostBody(mdToHtml(md)));
    })
    .catch(err => {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-code">ERR</div>
          <div class="error-msg">Failed to load post.</div>
          <div class="error-hint">// ${err.message}</div>
          <div style="margin-top:var(--space-lg)"><a class="btn btn-outline btn-sm" href="index.html">← back</a></div>
        </div>`;
    });
})();

/* -------------------------------------------------------
   Blog Writer (blog/write.html) — kept for convenience
   Generates a posts.json entry to copy-paste
------------------------------------------------------- */
(function initBlogWriter() {
  const editorTextarea = document.getElementById('md-editor');
  const previewPanel   = document.getElementById('md-preview');
  const titleInput     = document.getElementById('post-title');
  const dateInput      = document.getElementById('post-date');
  const tagsInput      = document.getElementById('post-tags');
  const generateBtn    = document.getElementById('generate-btn');
  const copyBtn        = document.getElementById('copy-btn');
  const jsonOutput     = document.getElementById('json-output');

  if (!editorTextarea) return;

  if (dateInput && !dateInput.value) {
    const today = new Date();
    dateInput.value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  }

  function updatePreview() {
    if (!previewPanel) return;
    previewPanel.innerHTML = mdToHtml(editorTextarea.value)
      || '<span style="color:var(--text-faint)">// Preview will appear here...</span>';
  }

  editorTextarea.addEventListener('input', updatePreview);

  editorTextarea.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editorTextarea.selectionStart;
      const e2 = editorTextarea.selectionEnd;
      editorTextarea.value = editorTextarea.value.slice(0, s) + '  ' + editorTextarea.value.slice(e2);
      editorTextarea.selectionStart = editorTextarea.selectionEnd = s + 2;
      updatePreview();
    }
  });

  function toSlug(str) {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const title   = (titleInput?.value || 'Untitled Post').trim();
      const date    = (dateInput?.value  || new Date().toISOString().slice(0,10)).trim();
      const rawTags = (tagsInput?.value  || '').trim();
      const content = editorTextarea.value.trim();

      const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const slug = toSlug(title) || 'untitled-post';

      // Build excerpt from first paragraph
      const firstPara = content.split(/\n\n/)[0].replace(/^#+ /, '').replace(/[*_`]/g, '').trim();
      const excerpt = firstPara.length > 160 ? firstPara.slice(0, 157) + '...' : firstPara;

      const entry = { id: slug, title, date, excerpt, tags, file: slug + '.md' };
      const json  = JSON.stringify(entry, null, 2);

      const instructions = `// 1. Save the markdown below as: blog/posts/${slug}.md\n// 2. Add this JSON entry to: blog/posts/posts.json\n\n${json}`;

      if (jsonOutput) {
        jsonOutput.textContent = instructions;
        jsonOutput.classList.add('visible');
      }
      if (copyBtn) copyBtn.disabled = false;
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!jsonOutput) return;
      window.copyToClipboard(jsonOutput.textContent, copyBtn);
    });
  }

  updatePreview();
})();
