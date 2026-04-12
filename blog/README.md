# Blog System

This repo currently has **two blog systems**. The active one is terminal-style and JSON-driven.

## Active blog flow (use this)

Source of truth for posts:
- `blog/posts/posts.json`

Rendering path:
- `blog/index.html` (listing)
- `blog/post.html` (single post)
- `js/terminal-blog.js` (loads `posts.json`, filters tags, renders content)

Post body options in `posts.json`:
- Inline HTML via `content`
- Markdown file via `file` (resolved under `blog/posts/`)

### Add or edit a post

1. Add/update an entry in `blog/posts/posts.json`.
2. For markdown-backed posts, create `blog/posts/<slug>.md` and set `"file": "<slug>.md"`.
3. Preview locally with a static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000/blog/
```

## Tests

Run:

```bash
node --test tests/*.mjs
```

Note: tests mirror helper logic in `js/terminal-blog.js` (they do not import it directly), so keep behavior in sync when editing those helpers.

## Legacy generator (optional / separate)

`blog/build_blog.py` and `blog/blog.sh` generate standalone HTML pages from `blog/markdown/*.md` and update `blog/mainPage.html`.

Important:
- Both are hard-coded to `/Users/sarveshbhatnagar/Downloads/profile/blog` by default.
- In this repo, pass an explicit path if you use the generator:

```bash
python3 blog/build_blog.py --blog-dir /Users/sarveshbhatnagar/Development/profile/blog --build-all
```

Do not assume running the legacy generator updates the active terminal-style blog.