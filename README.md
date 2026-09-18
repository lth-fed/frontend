# FED Frontend

Teknologappen (`se.teknologappen.tappen`) — a SvelteKit app shipped as a website and, via
[Capacitor](https://capacitorjs.com), as native iOS and Android apps.

## Project structure

- `src/` — the main app.
- `auth/` — a separate SvelteKit app handling authentication flows.
- `public-website/` — the marketing site (teknologappen.se).
- `lib/`, `auth-lib/` — small local packages shared between the apps above.
- `android/`, `ios/` — native Capacitor projects. Only relevant for building/running the mobile
  apps; not touched for regular web development.
- `fastlane/` — mobile app store release automation (see [Mobile apps](#mobile-apps) below).
- `docs/` — deeper docs: [release process](docs/release-process.md), push notification setup,
  agentic testing, MVP tech spec.

## Local development

Install dependencies and run the main frontend:

```sh
pnpm install
pnpm dev
```

Run the other apps from their own directory, e.g. `pnpm --dir auth dev` or
`pnpm --dir public-website dev`.

Run the backend using `podman compose up`.

## Checks

```sh
pnpm lint    # prettier --check + eslint
pnpm check   # svelte-check (type-checking)
pnpm build   # production build
```

These run automatically on every pull request and push to `main` via GitHub Actions
(`.github/workflows/ci.yml`) — they're intentionally **not** run as local git hooks, so commits and
pushes stay instant. Run them yourself before pushing if you want the same feedback earlier.

## Commit messages

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/) (`type: subject`,
e.g. `fix: correct token refresh race condition`) via a commitlint hook that runs on every commit.
Version bumps and the changelog are generated from these messages — see
[docs/release-process.md](docs/release-process.md) — so a well-formed commit message isn't just
style, it drives the release. If you have the `conventional-commit-message` skill available, use it
when writing commit messages.

## Releasing

1. Merge the standing `chore(main): release X.Y.Z` pull request (opened automatically by
   release-please).
2. Find the release it creates on the repo's **Releases** page — it's created as a **Pre-release**,
   so nothing has shipped yet.
3. Edit the release and add this section to its body:

   ```markdown
   ### App Store Notes

   A short, human-written summary of what changed.
   ```

   > **Required.** This is the _only_ text that reaches the App Store and Play Store — the rest of
   > the release body is a technical changelog. Skip this and the release step fails on purpose.

4. When ready to ship, edit the release again, uncheck **Set as a pre-release**, and save — this
   builds, signs, and uploads to both stores.

Full reasoning, one-time setup, and troubleshooting:
[docs/release-process.md](docs/release-process.md).

## Mobile apps

```sh
pnpm ios      # build, sync, and open the native iOS project in Xcode
pnpm android  # build, sync, and open the native Android project in Android Studio
```

Some Capacitor plugins are custom-written and maintained in this repo rather than pulled from npm —
e.g. `TicketWalletPlugin` and `ReceiptPlugin` (both platforms), plus iOS-only UI plugins
(`NavigationBar`, `TabsBar`, `ToolBar`, `NativeButton`) and Android's `NativeCapabilitiesPlugin`.
They live alongside the rest of the native project:
`android/app/src/main/java/se/teknologappen/tappen/` and `ios/App/App/Plugins/`.

The
[WebNative VS Code extension](https://marketplace.visualstudio.com/items?itemName=webnative.webnative)
(formerly Ionic's) is handy for day-to-day Capacitor work — building, syncing, running, etc. —
without having to remember the underlying CLI commands.

## Build and push production web images

Run `./build-push.sh`.

## Deploy pushed images

The deployment host only needs `compose.prod.yaml` and an untracked `.env`:

```dotenv
CONTAINER_REGISTRY=registry.esek.se/esek
CONTAINER_TAG=0.0.1-alpha.1

TRAEFIK_NETWORK=traefik
TRAEFIK_ENTRYPOINT=websecure
TRAEFIK_CERT_RESOLVER=letsencrypt
PUBLIC_DOMAIN=teknologappen.se
FRONTEND_DOMAIN=app.teknologappen.se
AUTH_DOMAIN=auth.teknologappen.se
```

It also needs:

- DNS records for both domains pointing to the host.
- A running Traefik instance with its Docker provider connected to the Podman API socket.
- A `websecure` entrypoint and an ACME certificate resolver named `letsencrypt` (or matching values
  in `.env`).
- The external network shared by Traefik and this stack:

```sh
podman network exists traefik || podman network create traefik
```

Pull and start the pushed images without rebuilding:

```sh
podman compose pull
podman compose up -d --no-build
```

Traefik serves the main frontend at `app.teknologappen.se` and the auth frontend at
`auth.teknologappen.se`.
