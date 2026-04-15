/**
 * blog-import.js
 * Import a blog post from any URL into the write.html editor.
 *
 * Dependencies (loaded before this script in write.html):
 *   - Readability.js  (@mozilla/readability)
 *   - TurndownService (turndown)
 *
 * Medium URLs are routed through freedium.cfd which server-renders
 * Medium articles as clean HTML that Readability can parse properly.
 */

(function initBlogImport() {
  const importBtn = document.getElementById('import-btn');
  const urlInput  = document.getElementById('import-url');
  const statusEl  = document.getElementById('import-status');

  if (!importBtn || !urlInput) return;

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.dataset.type = type || '';
  }

  function setLoading(on) {
    importBtn.disabled = on;
    importBtn.textContent = on ? 'importing…' : 'import';
    urlInput.disabled = on;
  }

  /**
   * Rewrite Medium article URLs to scribe.rip, which server-renders Medium
   * articles as clean HTML without Cloudflare bot protection.
   *
   * Medium URL patterns:
   *   https://medium.com/@user/slug-hash          → scribe.rip/@user/slug-hash
   *   https://medium.com/publication/slug-hash    → scribe.rip/publication/slug-hash
   *   https://pub.medium.com/slug-hash            → scribe.rip/slug-hash
   */
  function resolveFetchUrl(rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.hostname === 'medium.com' || u.hostname.endsWith('.medium.com')) {
        const path = u.pathname; // e.g. /gitconnected/slug or /@user/slug
        return { fetchUrl: 'https://scribe.rip' + path, via: 'scribe.rip' };
      }
    } catch (_) {}
    return { fetchUrl: rawUrl, via: null };
  }

  /** Try a single fetch and return text, or throw. */
  async function tryFetch(url, label, timeoutMs = 15000) {
    setStatus('Trying ' + label + '…', 'info');
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(label + ' returned HTTP ' + res.status);
    return res.text();
  }

  /** Fetch through proxies, trying each in order. */
  async function fetchViaProxy(targetUrl, tryDirect) {
    // 1. Local Python proxy (most reliable — run proxy_server.py alongside the dev server)
    const localProxy = {
      label: 'local proxy',
      url: () => 'http://localhost:8002/proxy?url=' + encodeURIComponent(targetUrl),
    };

    // 2. For Freedium URLs try a direct browser fetch — they may allow CORS
    if (tryDirect) {
      try {
        const html = await tryFetch(targetUrl, 'Freedium direct', 10000);
        if (html) return html;
      } catch (_) { /* fall through */ }
    }

    // 3. Public fallback proxies (unreliable — used only when local proxy isn't running)
    const publicProxies = [
      { label: 'codetabs',    url: () => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(targetUrl) },
      { label: 'allorigins',  url: () => 'https://api.allorigins.win/raw?url='       + encodeURIComponent(targetUrl) },
      { label: 'corsproxy.io',url: () => 'https://corsproxy.io/?url='                + encodeURIComponent(targetUrl) },
    ];

    let lastErr;
    for (const proxy of [localProxy, ...publicProxies]) {
      try {
        const html = await tryFetch(proxy.url(), proxy.label);
        if (html) return html;
      } catch (err) {
        lastErr = err;
      }
    }
    throw new Error(
      'All proxies failed. Run `python3 proxy_server.py` in your project folder for reliable imports.'
    );
  }

  /** Strip Turndown noise: excessive blank lines, trailing whitespace. */
  function cleanMarkdown(md) {
    return md
      .replace(/\n{3,}/g, '\n\n')   // collapse 3+ blank lines → 2
      .replace(/[ \t]+$/gm, '')      // strip trailing spaces per line
      .trim();
  }

  async function doImport() {
    const rawUrl = urlInput.value.trim();
    if (!rawUrl) { setStatus('Paste a URL first.', 'error'); return; }

    let targetUrl;
    try { targetUrl = new URL(rawUrl); } catch (_) {
      setStatus("That doesn't look like a valid URL.", 'error'); return;
    }
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      setStatus('Only http/https URLs are supported.', 'error'); return;
    }
    if (!window.Readability) {
      setStatus('Readability not loaded — check your connection.', 'error'); return;
    }
    if (!window.TurndownService) {
      setStatus('Turndown not loaded — check your connection.', 'error'); return;
    }

    setLoading(true);

    const { fetchUrl, via } = resolveFetchUrl(rawUrl);
    if (via) setStatus('Medium detected — routing through ' + via + '…', 'info');

    // 1. Fetch
    let html;
    try {
      html = await fetchViaProxy(fetchUrl, false);
    } catch (err) {
      setStatus(err.message, 'error');
      setLoading(false);
      return;
    }

    // 2. Extract with Readability
    setStatus('Extracting article…', 'info');
    let article;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Resolve relative URLs against the *original* URL (not Freedium)
      const base = doc.createElement('base');
      base.href = rawUrl;
      doc.head.prepend(base);

      // Strip Freedium / Medium chrome before Readability sees it
      doc.querySelectorAll(
        '.freedium-header, .freedium-footer, .metabar, nav, header, footer, ' +
        '[data-testid="headerStickyContainer"], [data-testid="audioPlayButton"], ' +
        '.pw-responses-container'
      ).forEach(el => el.remove());

      article = new Readability(doc, { charThreshold: 100 }).parse();
      if (!article?.content) throw new Error('No article content found on that page.');
    } catch (err) {
      setStatus('Extraction failed: ' + err.message, 'error');
      setLoading(false);
      return;
    }

    // 3. Convert HTML → Markdown
    setStatus('Converting to Markdown…', 'info');
    let markdown;
    try {
      const td = new TurndownService({
        headingStyle:     'atx',
        hr:               '---',
        bulletListMarker: '-',
        codeBlockStyle:   'fenced',
        fence:            '```',
      });

      // Keep tables
      if (window.turndownPluginGfm) {
        td.use(turndownPluginGfm.gfm);
      }

      // Drop decorative / nav elements
      td.remove([
        'figure > figcaption + *', // duplicate caption elements
        'button', 'nav', 'aside',
        '[role="navigation"]', '[role="banner"]',
        '.related-posts', '.comments', '.responses',
      ]);

      // Pre-process: wrap bare <pre> (no <code> child) in <code> so Turndown
      // recognises them as fenced code blocks instead of plain paragraphs.
      // scribe.rip (and many sites) use <pre>text</pre> without a <code> child.
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = article.content;
      tempDiv.querySelectorAll('pre').forEach(pre => {
        if (!pre.querySelector('code')) {
          const code = document.createElement('code');
          code.textContent = pre.textContent; // textContent decodes HTML entities
          pre.innerHTML = '';
          pre.appendChild(code);
        }
      });

      // Collapse multiple consecutive blank lines Turndown sometimes emits
      markdown = cleanMarkdown(td.turndown(tempDiv.innerHTML));
    } catch (err) {
      setStatus('Markdown conversion failed: ' + err.message, 'error');
      setLoading(false);
      return;
    }

    // 4. Populate form fields
    const titleEl  = document.getElementById('post-title');
    const authorEl = document.getElementById('post-author');
    const sourceEl = document.getElementById('post-source');
    const editorEl = document.getElementById('md-editor');

    if (titleEl && article.title) titleEl.value = article.title.trim();

    // Readability exposes the byline when it finds it; fall back to meta tags
    // which Medium/scribe.rip reliably populate even when byline parsing fails.
    if (authorEl) {
      const byline = article.byline?.trim();
      if (byline) {
        authorEl.value = byline;
      } else {
        const parser2 = new DOMParser();
        const doc2 = parser2.parseFromString(html, 'text/html');
        const metaSelectors = [
          'meta[name="author"]',
          'meta[property="article:author"]',
          'meta[name="twitter:creator"]',
          'meta[property="og:article:author"]',
        ];
        for (const sel of metaSelectors) {
          const val = doc2.querySelector(sel)?.getAttribute('content')?.trim();
          if (val) { authorEl.value = val; break; }
        }
      }
    }

    // Always record the original URL as source
    if (sourceEl) sourceEl.value = rawUrl;

    if (editorEl) {
      editorEl.value = markdown;
      editorEl.dispatchEvent(new Event('input')); // refresh live preview
    }

    setLoading(false);
    setStatus(
      'Imported "' + (article.title || 'article') + '"' +
      (article.byline ? ' by ' + article.byline : '') +
      '. Review content, add tags, then publish.',
      'success'
    );
  }

  importBtn.addEventListener('click', doImport);
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') doImport(); });
})();
