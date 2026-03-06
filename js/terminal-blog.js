/**
 * terminal-blog.js
 * Sarvesh Bhatnagar Portfolio — Blog System
 * Handles: post listing (ls output), post viewer, markdown editor/writer
 */

/* -------------------------------------------------------
   Configuration
------------------------------------------------------- */
const POSTS_URL = (function() {
  // Resolve relative to this script's location
  const path = window.location.pathname;
  if (path.includes('/blog/')) {
    return 'posts/posts.json';
  }
  return 'blog/posts/posts.json';
})();

/* -------------------------------------------------------
   Utility: Simple Markdown → HTML
   Covers: headings, bold, italic, code blocks, inline code,
   blockquotes, unordered/ordered lists, links, hr, paragraphs
------------------------------------------------------- */
function mdToHtml(md) {
  if (!md) return '';

  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks  ```lang\n...\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="lang-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

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

  // Unordered lists — group consecutive items
  html = html.replace(/((?:^[\*\-] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[\*\-] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Inline: bold, italic, inline code, links, images
  html = html.replace(/\*\*(.+?)\*\*/g,  '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g,      '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g,      '<code>$1</code>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,  '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Paragraphs — wrap non-block-level lines
  const lines = html.split('\n');
  const out   = [];
  let inBlock = false;
  const blockTags = ['<h1','<h2','<h3','<h4','<h5','<h6','<ul','<ol','<pre','<hr','<blockquote','</ul','</ol','</pre','</blockquote'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { inBlock = false; continue; }

    const isBlock = blockTags.some(t => line.startsWith(t));
    if (isBlock) {
      inBlock = false;
      out.push(line);
    } else {
      if (!inBlock) {
        out.push('<p>' + line);
        inBlock = true;
      } else {
        out[out.length - 1] += ' ' + line;
      }
    }
  }

  // Close open paragraphs
  return out.map(line => {
    if (line.startsWith('<p>') && !line.endsWith('</p>')) return line + '</p>';
    return line;
  }).join('\n');
}

/* -------------------------------------------------------
   Format date nicely
------------------------------------------------------- */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

/* -------------------------------------------------------
   Format date as ls-style: "Jan 15 2024"
------------------------------------------------------- */
function formatDateLs(dateStr) {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,' ')} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

/* -------------------------------------------------------
   Fetch posts.json
------------------------------------------------------- */
async function fetchPosts() {
  const response = await fetch(POSTS_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/* -------------------------------------------------------
   Blog Listing Page (blog/index.html)
   Renders posts in terminal ls -la style
------------------------------------------------------- */
(function initBlogListing() {
  const container = document.getElementById('blog-listing');
  if (!container) return;

  container.innerHTML = '<div class="loading">Fetching posts</div>';

  fetchPosts()
    .then(posts => {
      if (!posts || posts.length === 0) {
        container.innerHTML = '<div class="error-state"><div class="error-code">404</div><div class="error-msg">No posts found.</div><div class="error-hint">// Check back soon</div></div>';
        return;
      }

      // Sort newest first
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Update post count in terminal title
      const countEl = document.getElementById('post-count');
      if (countEl) countEl.textContent = posts.length;

      const rows = posts.map(post => {
        const tags = (post.tags || []).map(t =>
          `<span class="tag">${t}</span>`
        ).join('');

        return `
          <a class="ls-entry" href="post.html?id=${encodeURIComponent(post.id)}" aria-label="Read: ${post.title}">
            <span class="ls-perms">-rw-r--r--</span>
            <span class="ls-date">${formatDateLs(post.date)}</span>
            <span class="ls-name">${post.id}.md</span>
            <span class="ls-tags">${tags}</span>
          </a>`;
      }).join('');

      // Also render a summary list below
      const summaries = posts.map(post => {
        const tags = (post.tags || []).map(t =>
          `<span class="tag">${t}</span>`
        ).join('');
        return `
          <div class="blog-summary-item" style="padding: var(--space-md) 0; border-bottom: 1px solid var(--border);">
            <div style="display:flex; align-items:baseline; gap:var(--space-md); flex-wrap:wrap; margin-bottom:0.35em;">
              <a href="post.html?id=${encodeURIComponent(post.id)}" style="font-size:1rem; font-weight:700; color:var(--text);">${post.title}</a>
              <span style="font-size:0.75rem; color:var(--amber);">${formatDate(post.date)}</span>
            </div>
            <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.5em;">${post.excerpt || ''}</p>
            <div class="tags">${tags}</div>
          </div>`;
      }).join('');

      container.innerHTML = `
        <div class="terminal-window mb-lg">
          <div class="terminal-titlebar">
            <div class="terminal-titlebar-dots">
              <div class="t-dot t-dot-red"></div>
              <div class="t-dot t-dot-amber"></div>
              <div class="t-dot t-dot-green"></div>
            </div>
            <span class="terminal-title">sarvesh@blog:~$ ls -la ./posts/</span>
          </div>
          <div class="terminal-body">
            <div class="ls-header">
              <span>PERMISSIONS</span>
              <span>DATE</span>
              <span>FILENAME</span>
              <span style="text-align:right">TAGS</span>
            </div>
            ${rows}
          </div>
        </div>
        <div id="blog-summaries" class="stagger">${summaries}</div>`;
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
   Reads ?id=slug, finds post, renders it
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
        <div class="error-hint">// Usage: post.html?id=slug-here</div>
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
            <div class="error-hint">// No entry matching that slug</div>
            <div style="margin-top:var(--space-lg)"><a class="btn btn-outline btn-sm" href="index.html">← back to posts</a></div>
          </div>`;
        return;
      }

      // Update page title
      document.title = `${post.title} — Sarvesh Bhatnagar`;

      const tags = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

      // Render content: if it looks like HTML use it, otherwise parse as markdown
      const isHtml = post.content && (post.content.trim().startsWith('<') || post.content.includes('</p>'));
      const bodyHtml = isHtml ? post.content : mdToHtml(post.content || '');

      container.innerHTML = `
        <div class="post-meta-bar">
          <div class="post-meta-info">
            <span><span class="meta-date">// ${formatDate(post.date)}</span></span>
            <span class="meta-author">sarveshbhatnagar</span>
          </div>
          <div class="tags">${tags}</div>
        </div>
        <div class="post-content fade-in">
          <h1>${post.title}</h1>
          ${bodyHtml}
        </div>
        <div style="margin-top:var(--space-lg); display:flex; gap:var(--space-md);">
          <a class="btn btn-ghost btn-sm" href="index.html">← all posts</a>
        </div>`;
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
   Blog Writer (blog/write.html)
   Live preview, generate JSON entry, copy to clipboard
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

  // Set default date to today
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${y}-${m}-${d}`;
  }

  // Live preview update
  function updatePreview() {
    if (!previewPanel) return;
    const md = editorTextarea.value;
    previewPanel.innerHTML = mdToHtml(md) || '<span style="color:var(--text-faint)">// Preview will appear here...</span>';
  }

  editorTextarea.addEventListener('input', updatePreview);

  // Handle tab key in editor
  editorTextarea.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editorTextarea.selectionStart;
      const end   = editorTextarea.selectionEnd;
      editorTextarea.value = editorTextarea.value.slice(0, start) + '  ' + editorTextarea.value.slice(end);
      editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 2;
      updatePreview();
    }
  });

  // Generate slug from title
  function toSlug(str) {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate JSON
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const title   = (titleInput?.value || 'Untitled Post').trim();
      const date    = (dateInput?.value  || new Date().toISOString().slice(0,10)).trim();
      const rawTags = (tagsInput?.value  || '').trim();
      const content = editorTextarea.value.trim();

      const tags = rawTags
        ? rawTags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Convert markdown to HTML for the content field
      const htmlContent = mdToHtml(content);

      // Build excerpt from first non-empty paragraph (strip tags, truncate)
      const excerptMatch = htmlContent.match(/<p>([\s\S]*?)<\/p>/);
      let excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]+>/g, '') : '';
      if (excerpt.length > 160) excerpt = excerpt.slice(0, 157) + '...';

      const entry = {
        id:      toSlug(title) || 'untitled-post',
        title:   title,
        date:    date,
        excerpt: excerpt,
        content: htmlContent,
        tags:    tags
      };

      const json = JSON.stringify(entry, null, 2);

      if (jsonOutput) {
        jsonOutput.textContent = json;
        jsonOutput.classList.add('visible');
      }

      // Enable copy button
      if (copyBtn) copyBtn.disabled = false;
    });
  }

  // Copy JSON to clipboard
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!jsonOutput) return;
      const text = jsonOutput.textContent;
      if (!text) return;
      window.copyToClipboard(text, copyBtn);
    });
  }

  // Initial preview state
  updatePreview();
})();
