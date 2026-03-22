/* ============================================================
   blog.js — Blog system: listing, post viewer, markdown editor
   Zero external dependencies — pure vanilla JS
   ============================================================ */

(function () {
  'use strict';

  const POSTS_URL = '/blog/posts/posts.json';

  /* ── Fetch posts ────────────────────────────────────────── */
  async function fetchPosts() {
    try {
      const res = await fetch(POSTS_URL);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return await res.json();
    } catch (err) {
      console.error('Blog fetch error:', err);
      return [];
    }
  }

  /* ── Format date ────────────────────────────────────────── */
  function formatDate(dateStr) {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  /* ── Tag colour cycling ─────────────────────────────────── */
  const TAG_COLOURS = ['tag-violet', 'tag-blue', 'tag-cyan', 'tag-emerald', 'tag-pink'];
  function tagClass(i) { return TAG_COLOURS[i % TAG_COLOURS.length]; }

  /* ── Build tag chips HTML ───────────────────────────────── */
  function buildTags(tags) {
    return (tags || []).map((t, i) =>
      `<span class="tag ${tagClass(i)}">${escHtml(t)}</span>`
    ).join('');
  }

  /* ── Escape HTML ────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Get URL param ──────────────────────────────────────── */
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* ════════════════════════════════════════════════════════
     BLOG INDEX (blog/index.html)
     ════════════════════════════════════════════════════════ */
  async function initBlogIndex() {
    const container = document.getElementById('blog-list');
    if (!container) return;

    const loading = document.getElementById('blog-loading');

    const posts = await fetchPosts();
    if (loading) loading.remove();

    if (!posts.length) {
      container.innerHTML = `
        <div class="empty-state" style="text-align:center;padding:5rem 0;color:var(--text-muted)">
          <div style="font-size:3rem;margin-bottom:1rem;opacity:0.3">✦</div>
          <p>No posts yet. Check back soon!</p>
        </div>`;
      return;
    }

    // Sort newest first
    const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.className = 'blog-grid reveal-stagger';
    container.innerHTML = sorted.map(post => `
      <article class="glass-card blog-card">
        <div class="blog-meta">
          <time class="blog-date">${formatDate(post.date)}</time>
        </div>
        <h2 class="blog-title">${escHtml(post.title)}</h2>
        <p class="blog-excerpt">${escHtml(post.excerpt)}</p>
        <div class="blog-tags">${buildTags(post.tags)}</div>
        <a href="/blog/post.html?id=${encodeURIComponent(post.id)}" class="blog-read-link">
          Read article <span aria-hidden="true">→</span>
        </a>
      </article>
    `).join('');

    // Trigger stagger reveal
    requestAnimationFrame(() => container.classList.add('visible'));
  }

  /* ════════════════════════════════════════════════════════
     BLOG POST VIEWER (blog/post.html)
     ════════════════════════════════════════════════════════ */
  async function initPostViewer() {
    const container = document.getElementById('post-content');
    if (!container) return;

    const id = getParam('id');
    if (!id) {
      container.innerHTML = renderPostError('No post ID specified.');
      return;
    }

    const posts = await fetchPosts();
    const post = posts.find(p => p.id === id);

    if (!post) {
      container.innerHTML = renderPostError(`Post "${escHtml(id)}" not found.`);
      return;
    }

    // Update page title
    document.title = `${post.title} — Sarvesh Bhatnagar`;

    container.innerHTML = `
      <div class="post-container">
        <a href="/blog/" class="post-back">← Back to Blog</a>
        <h1 class="post-title">${escHtml(post.title)}</h1>
        <div class="post-info">
          <time class="blog-date" style="font-family:var(--font-mono);font-size:0.875rem;color:var(--text-muted)">
            ${formatDate(post.date)}
          </time>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap">${buildTags(post.tags)}</div>
        </div>
        <div class="post-body">${post.content}</div>
        <div style="margin-top:3rem;padding-top:2rem;border-top:1px solid var(--glass-border)">
          <a href="/blog/" class="post-back">← Back to Blog</a>
        </div>
      </div>
    `;
  }

  function renderPostError(msg) {
    return `
      <div class="post-container" style="text-align:center;padding:5rem 0;color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:1rem;opacity:0.3">✦</div>
        <p>${msg}</p>
        <a href="/blog/" style="display:inline-flex;align-items:center;gap:.4rem;margin-top:1.5rem;color:#c4b5fd">← Back to Blog</a>
      </div>`;
  }

  /* ════════════════════════════════════════════════════════
     BLOG WRITER (blog/write.html)
     ════════════════════════════════════════════════════════ */
  function initWriter() {
    const textarea = document.getElementById('md-input');
    if (!textarea) return;

    const preview     = document.getElementById('md-preview');
    const titleInput  = document.getElementById('post-title');
    const dateInput   = document.getElementById('post-date');
    const tagsInput   = document.getElementById('post-tags');
    const jsonOutput  = document.getElementById('json-output');
    const genBtn      = document.getElementById('btn-generate');
    const copyBtn     = document.getElementById('btn-copy');

    // Default date to today
    if (dateInput) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    /* ── Simple Markdown to HTML ─── */
    function mdToHtml(md) {
      let html = md;

      // Escape HTML first (process raw md)
      html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Code blocks (``` ... ```)
      html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
        `<pre><code>${code.trim()}</code></pre>`
      );

      // Inline code
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

      // Headings
      html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

      // Bold and italic
      html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

      // Blockquotes
      html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

      // Unordered lists
      html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
      html = html.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');

      // Links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>');

      // Paragraphs: lines separated by blank lines
      html = html.split(/\n{2,}/).map(block => {
        block = block.trim();
        if (!block) return '';
        if (/^<(h[1-6]|ul|ol|li|blockquote|pre|div)/.test(block)) return block;
        return `<p>${block.replace(/\n/g, ' ')}</p>`;
      }).join('\n');

      return html;
    }

    /* ── Live preview ─── */
    function updatePreview() {
      if (preview) preview.innerHTML = mdToHtml(textarea.value);
    }

    textarea.addEventListener('input', updatePreview);
    updatePreview();

    /* ── Toolbar buttons ─── */
    function wrapSelection(before, after) {
      const start = textarea.selectionStart;
      const end   = textarea.selectionEnd;
      const sel   = textarea.value.slice(start, end) || 'text';
      const replacement = before + sel + after;
      textarea.setRangeText(replacement, start, end, 'select');
      textarea.focus();
      updatePreview();
    }

    function insertAtLineStart(prefix) {
      const start = textarea.selectionStart;
      const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
      textarea.setRangeText(prefix, lineStart, lineStart, 'end');
      textarea.focus();
      updatePreview();
    }

    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        switch (action) {
          case 'bold':   wrapSelection('**', '**'); break;
          case 'italic': wrapSelection('*', '*');   break;
          case 'h2':     insertAtLineStart('## ');  break;
          case 'h3':     insertAtLineStart('### '); break;
          case 'code':   wrapSelection('`', '`');   break;
          case 'link':   wrapSelection('[', '](url)'); break;
        }
      });
    });

    /* ── Slug generator ─── */
    function toSlug(str) {
      return str.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80);
    }

    /* ── Generate JSON ─── */
    if (genBtn) {
      genBtn.addEventListener('click', () => {
        const title   = titleInput ? titleInput.value.trim() : '';
        const date    = dateInput  ? dateInput.value.trim()  : new Date().toISOString().slice(0, 10);
        const tagsRaw = tagsInput  ? tagsInput.value.trim()  : '';
        const tags    = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
        const content = mdToHtml(textarea.value);
        const excerpt = textarea.value
          .replace(/#{1,6} /g, '')
          .replace(/[*`[\]]/g, '')
          .trim()
          .slice(0, 200)
          .replace(/\n/g, ' ') + '…';

        const entry = {
          id:      toSlug(title || 'untitled-post'),
          title:   title || 'Untitled Post',
          date,
          excerpt,
          content,
          tags
        };

        if (jsonOutput) {
          jsonOutput.value = JSON.stringify(entry, null, 2);
          jsonOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    /* ── Copy to clipboard ─── */
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!jsonOutput || !jsonOutput.value) {
          alert('Generate JSON first!');
          return;
        }
        try {
          await navigator.clipboard.writeText(jsonOutput.value);
          const orig = copyBtn.textContent;
          copyBtn.textContent = 'Copied ✓';
          copyBtn.style.background = 'rgba(16, 185, 129, 0.3)';
          setTimeout(() => {
            copyBtn.textContent = orig;
            copyBtn.style.background = '';
          }, 2000);
        } catch {
          jsonOutput.select();
          document.execCommand('copy');
        }
      });
    }
  }

  /* ── Init based on page ─────────────────────────────────── */
  function init() {
    const path = window.location.pathname;
    if (path.includes('write')) {
      initWriter();
    } else if (path.includes('post.html')) {
      initPostViewer();
    } else {
      initBlogIndex();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
