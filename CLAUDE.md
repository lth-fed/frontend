# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Overview

Teknologappen (`se.teknologappen.tappen`) is a client-only SvelteKit 2 / Svelte 5 SPA (runes mode
forced on) shipped as a website and, via Capacitor 8, as iOS and Android apps. It uses
`adapter-static` with an `index.html` fallback; the root `+layout.ts` sets `ssr = false`,
`prerender = true`, `trailingSlash = 'always'`.

The repo holds several apps. It is **not** a pnpm workspace — each app has its own lockfile and
needs its own `pnpm install` (e.g. `pnpm --dir auth install`).

| Path              | What                                                                                     | Dev port |
| ----------------- | ---------------------------------------------------------------------------------------- | -------- |
| `src/` (root)     | The main app                                                                             | 5173     |
| `auth/`           | Frontend for the fed-auth login flows (auth.teknologappen.se)                            | 5174     |
| `public-website/` | Marketing site (teknologappen.se)                                                        | 5176     |
| `auth-lib/`       | OIDC (code + PKCE) client as raw TS, linked into the root app and `auth/`; no build step | —        |
| `lib/`            | Shared Svelte components, used only by `auth/` (as `common-lib`)                         | —        |

Root `pnpm check` / `pnpm build` and CI cover only `src/` (plus `auth-lib`, which it imports). Root
`pnpm lint` covers every app. When you change `auth/` or `public-website/`, run that app's own
`check`/`build` (e.g. `pnpm --dir auth check`). `auth/` consumes `lib/` from its packaged `dist/`,
so run `pnpm --dir lib run package` after changing `lib/`; `build-push.sh` shows the full install →
package → build order.

## Commands

```sh
pnpm install
pnpm dev                 # main app on :5173
podman compose up        # backend from published images, auto-seeded: minilith :8000, fed-auth :8001, transactions :8002
pnpm check               # svelte-kit sync + Paraglide compile + svelte-check
pnpm lint                # prettier --check . && eslint .
pnpm format              # prettier --write .
pnpm build               # runs the node test below, then vite build → build/
pnpm api:generate        # regenerate src/lib/api/generated/*.d.ts (needs the backend running)
pnpm ios / pnpm android  # build, cap sync, open Xcode / Android Studio
```

CI (`.github/workflows/ci.yml`) runs lint, check and build on PRs and pushes to `main`. There are
deliberately no local pre-commit checks; the only git hook is commitlint. Prettier also formats
Markdown (`proseWrap: always`), so run `pnpm format` after editing docs, including this file.

**Tests:** there is no unit-test suite. The only automated test is
`node --test scripts/qr-decoder.test.mjs` (also run by `pnpm build`). It checks that the bundled
`zxing-wasm` binary matches what `barcode-detector` expects, so bump those two dependencies
together.

**Verifying UI changes:** `docs/agentic-testing.md` requires a non-trivial UI change to be seen
running (screenshots or asserted DOM) before it counts as done.

- `pnpm render-pass` (`scripts/render-pass.mjs`, Playwright) logs in and screenshots every screen
  against the real backend plus `pnpm dev`. Its Brave path is hardcoded for macOS; elsewhere use
  `node scripts/render-pass.mjs --engine firefox` (or `webkit`).
- Dev login uses fed-auth's passwordless `test` provider with seeded stil-ids such as `si1234mc-s`.
- `pnpm dev:swish-pay` simulates a Swish payment callback, but it assumes a sibling `../backend`
  checkout (`docker compose … exec postgres`, database `transactions62`). It won't work against this
  repo's `compose.yaml` as-is.

## Architecture (main app)

### Boot, auth and shell

- `src/routes/+layout.svelte` is the app gate. It runs `bootstrapAuth()`
  (`src/lib/auth/bootstrap.ts`) while the native splash screen stays up, then renders `Landing`, a
  sign-in fallback or the app. It also handles:
  - app resume (cache invalidation, server-clock sync, purchase resync)
  - deep/app links (`/activity/<uuid>/`) and push-notification taps
  - view transitions
  - setting `data-guild` on `<html>`/`<body>` from `session.themeGuild`
- Auth is OIDC against fed-auth through `auth-lib`: the `test` provider in dev, `lu` in production.
  Native login uses an in-app browser that redirects to `tappen://oauth_callback`; on the web, login
  redirects back to `/auth/callback/`. Session state lives in `$lib/state/session.svelte`.
- Screens live in the `src/routes/(shell)/` group. Its layout renders the top bar, the bottom tab
  bar or action button, and the purchase pill. A page customizes them with
  `useAppBars(() => ({ topBar, bottom }))` from `$lib/state/appBars.svelte`. Helpers:
  `detailTopBar`, `slots.*`, `buyTicketsBottom`, `emptyBottom`. The bars reset when the page
  unmounts.

### Routing and navigation

- Add every route to the `Routes` class in `src/lib/navigation/routes.ts`, with a trailing slash.
  Because the root layout prerenders, routes with dynamic segments need
  `export const prerender = false` (see `(shell)/activity/+layout.ts`).
- Navigate only with `pushNavigation` / `replaceNavigation` / `goBackOrHome` from
  `$lib/navigation/stackNavigation`. They track `navDepth` in page state, which drives back behavior
  (including Android's hardware back button in `hooks.client.ts`) and view-transition direction.
- ESLint warns on `goto`, `pushState`, `replaceState` and `location.href`. Internal `<a href>`
  values go through `resolve()`.

### Data layer (`src/lib/api/`)

1. **`generated/{api,auth}.d.ts`** is openapi-typescript output. Never edit it, and never import it
   outside `src/lib/api/`.
2. **Resource wrappers** (`activities.ts`, `tickets.ts`, …) call the `openapi-fetch` clients. They
   map wire shapes to camelCase domain types at the boundary:
   - `{ en, sv }` strings via `pickI18n`
   - timestamps via `parseDate`
   - ltree group paths via `guildFromPath`
   - money stays integer öre; format it with `$lib/format/money`

   Wrap each call in one of two helpers:
   - `unwrap()`: any failure throws a SvelteKit `error()` carrying a `kind`, which `+error.svelte`
     branches on.
   - `attempt()`: a 400 comes back as `{ badRequest: { message, field } }` so it can be shown
     inline. Backend 400 messages are the only user-facing backend error text.

   Wrappers have `DEMO_MODE` branches with mock data; keep the mocks in sync when shapes change.

3. **`cache.ts`** is a session-scoped stale-while-revalidate cache.
   - Each wrapper exports `cached*` helpers with their TTLs.
   - `+page.ts` loads call those helpers and **must pass `depends`**: background revalidation
     re-runs loads via SvelteKit `invalidate('app:cache:<key>')`.
   - After a mutation, call `invalidate` / `invalidatePrefix`, or `evict` when the next page must
     see fresh data. Import these from `$lib/api/cache`, **not** `invalidate` from
     `$app/navigation`: SvelteKit's version re-runs the load without marking the entry stale, so
     `cached()` just returns the old value while it is still within its TTL.
   - `clearCache()` runs on logout and on locale change.

Requests from the `api` client go through CapacitorHttp via `auth-lib`'s `authenticatedFetch`
(bearer token plus single-flight refresh), not SvelteKit's `fetch`. Base URLs switch on
`import.meta.env.DEV` in `clients.ts`.

### Time

Per `AGENTS.md`, use server time for every "now" reference: comparisons with backend timestamps,
countdowns, QR payload timestamps and relative-date display.

- Call `serverNow()` from `$lib/api/serverClock` instead of `Date.now()` / `new Date()`. It returns
  a `Date` and is not re-exported from `$lib/api`.
- The clock offset is measured via `GET /time` on boot and on app resume.
- The device clock (`Date.now()`) is only for measuring elapsed intervals: cache TTLs, poll timers
  and the clock-sync round trip.

### Purchase flow

`src/lib/purchase/purchase.svelte.ts` is a global state machine: release queue → lottery →
reservation queue → reserved → paying → purchased. It survives navigation and reloads.

Its network discipline is a correctness requirement, not a style choice:

- `PUT /tickets/queue` is sent exactly once per attempt. A repeat PUT moves the user to the back of
  the queue.
- Polling only happens in states where the server can have news. The file's header comment explains
  why.

Payment providers plug in through `PaymentGateway` in `src/lib/payment/gateway.ts`.

### i18n

The app uses Paraglide.

- Add every key to both `messages/en.json` and `messages/sv.json`; `en` is the base locale.
- Use `m.key()` from `$lib/paraglide/messages.js`. `src/lib/paraglide/` is generated by `pnpm dev` /
  `pnpm check` and is gitignored.
- `$lib/state/locale.svelte` patches Paraglide so locale switches are reactive without a page
  reload.

### Theming

Each student guild (sektion) has a palette in `src/lib/styles/guild-theme.css`: nine semantic
`--guild-*` tokens under `[data-guild='x']`, exposed as Tailwind `guild-*` utilities through
`@theme inline`.

- Use only the semantic utilities (`bg-guild-primary`, `text-guild-on-surface`, …), never raw guild
  colors.
- Scope another guild's content with `data-guild={creatorGuild}`.
- Native plugins read resolved colors via `readGuildVar()`.

### Native (Capacitor)

- Custom plugins have a TS bridge in `src/lib/plugins/` (`registerPlugin`, usually with a `web.ts`
  fallback). Their native code is in `ios/App/App/Plugins/` and
  `android/app/src/main/java/se/teknologappen/tappen/`.
- The iOS 26 "Liquid Glass" overlays (NavigationBar, TabsBar, ToolBar, NativeButton) go through
  `useNativeOverlay` and activate only when `isIos26Plus()` is true. Otherwise the web component
  renders as the fallback, gated on `!overlay.isActive`.
- Web changes reach the native apps only after `pnpm build && npx cap sync`.
- iOS builds need Xcode 26; the CI pin is in `release.yml`.

## Commits and releases

A commitlint `commit-msg` hook enforces Conventional Commits, and the commit messages drive
releases. release-please derives the version bump and `CHANGELOG.md` from commit types (`fix` →
patch, `feat` → minor, `!` → major), so don't hand-edit the `package.json` version or the changelog.
Use the `conventional-commit-message` skill when writing commit messages. Store releases and web
deploys are covered in `README.md` and `docs/release-process.md`.

## Design docs

`docs/mvp-tech-spec.md` explains the backend semantics that code comments cite as "spec §X" (the
release lottery, queue placement, error policy). It predates the current code, so trust the code
where the two disagree. Known differences:

- The purchase store moved to `src/lib/purchase/`.
- The queue entry window is 15 minutes (`ENTRY_WINDOW_MS`), not 10.
- The clock syncs via `GET /time`, not the `Date` header.
- The `/_proxy/api` dev proxy no longer exists.
