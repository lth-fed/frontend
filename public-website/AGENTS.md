# public-website

Static SvelteKit site (adapter-static, `ssr = false`, `prerender = true`,
`trailingSlash = 'always'`).

## Conventions

- Styling lives in `src/routes/layout.css` (plain CSS, Tailwind v4 imported at top). New pages
  append their styles there; keep the existing design tokens (`#173f31` green, `#c85532` accent,
  `#f5f1e8`/`#fffdf8` backgrounds, `.button`, `.eyebrow`, `.section`, `.section-inner`).
- i18n via paraglide: add keys to `messages/sv.json` + `messages/en.json`, then run
  `./node_modules/.bin/paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide`.
  Generated files in `src/lib/paraglide/` are gitignored — never edit them.
- Static assets go in `frontend/static/` (NOT `public-website/static/` — svelte.config.js maps
  `kit.files.assets` to `../static`). They are served from the site root.
- Lint: `eslint src/`, format: `prettier --check src messages`, types: `svelte-check`.
  `src/lib/paraglide/` and `project.inlang/` are ignored by both.

## Routing / locales

- baseLocale is `en`; paraglide prepends `/sv/` for Swedish URLs. Non-localized pages (e.g.
  `/organisationer`, which is Swedish-only) are reachable both with and without the `/sv` prefix —
  `hooks.ts` `reroute` strips the locale prefix.

## Pages

- `/` — landing page (hero, features, legal).
- `/i` — install redirect page (detects iOS/Android, redirects to store).
- `/organisationer` — Swedish-only sales-pitch page for Teknologappen aimed at organisations
  (sektioner, studentföreningar). All copy lives in `src/lib/tappen-content.ts` (not in
  messages/\*.json). Assets in `static/public-salesdeck/`.
  - YouTube videos: add video IDs to `VIDEO_IDS` in `tappen-content.ts` — they render inline.
  - Presentation PDFs: gallery cards link to files in `static/public-salesdeck/` with `download`.

# My learnings

- `kit.files.assets` in `public-website/svelte.config.js` points to `frontend/static/` (the parent
  app's static dir), so files placed in `public-website/static/` are silently NOT copied to the
  build. Always put public-website assets in `frontend/static/`.
- With `trailingSlash = 'always'` + adapter-static, `/organisationer` 307-redirects to
  `/organisationer/`. The prerendered `build/organisationer/index.html` is the SPA shell
  (ssr=false), so the page renders client-side; verify content in the built JS chunks, not the HTML.
- eslint rule `svelte/no-navigation-without-resolve` fires on `<a href>` to static assets too — use
  `resolve()` for internal routes and an eslint-disable comment for asset links.
