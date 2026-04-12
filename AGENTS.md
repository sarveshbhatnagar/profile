# AGENTS

## Repo reality (source of truth)
+- This is a static site repo (HTML/CSS/JS + assets); there is no root `package.json` or workspace toolchain.
+- GitHub Pages deploy is defined in `.github/workflows/static.yml` and publishes the entire repository root (`path: '.'`) on pushes to `master`.
+- `.travis.yml` references `npm test` and `gulp`, but those commands are not runnable from this repo as checked in (no Node manifest/tooling at root).

## Verified commands
+- Run tests: `node --test tests/*.mjs`
+- Serve locally (needed for blog fetch calls): `python3 -m http.server 8000` then open `http://localhost:8000/blog/`

## Blog architecture (important: two systems coexist)
+- Active terminal-style blog UI is driven by `blog/index.html` + `blog/post.html` + `js/terminal-blog.js` + `blog/posts/posts.json`.
+- `posts.json` entries are the primary index for blog listing and filtering. A post body can be either:
+  - inline HTML via `content`, or
+  - markdown file reference via `file` (resolved under `blog/posts/`).
+- `tests/*.mjs` intentionally mirror small helper logic from `js/terminal-blog.js` (not imported directly); keep mirrored behavior/comments in sync when editing that file.

## Legacy blog generator (do not assume it updates active blog)
+- `blog/build_blog.py` and `blog/blog.sh` generate standalone HTML pages from `blog/markdown/*.md` and update `blog/mainPage.html`.
+- Both scripts are hard-coded to `/Users/sarveshbhatnagar/Downloads/profile/blog` by default (`blog.sh` vars + Python default `--blog-dir`), which does not match this repo path.
+- If you must use the generator, pass an explicit repo-local blog dir (`python3 blog/build_blog.py --blog-dir /Users/sarveshbhatnagar/Development/profile/blog ...`) or fix the hard-coded path first.