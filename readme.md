# Profile Website

Personal static website and blog for Sarvesh Bhatnagar.

## Local development

Serve the site locally:

```bash
python3 -m http.server 8000
```

Then open:
- `http://localhost:8000/`
- `http://localhost:8000/blog/`

## Tests

Run blog helper tests:

```bash
node --test tests/*.mjs
```

## Deployment

GitHub Pages deploys from `.github/workflows/static.yml` on pushes to `master`.
The workflow uploads the repository root as the site artifact.

## Blog note

The active blog is JSON-driven (`blog/posts/posts.json` + `js/terminal-blog.js`).
See `blog/README.md` for post authoring details and legacy generator notes.