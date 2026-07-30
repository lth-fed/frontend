# Agentic testing

How an AI agent (or a human) drives the app to verify a change actually works — not just that it
typechecks. Every non-trivial UI change must be **seen running** before it's called done.

## The requirement

A change to a screen, flow, or component is not complete until it has been exercised in a running
app and the result inspected (screenshot or asserted DOM). Coverage required, in order of preference
for what's available on the machine:

| Target                                   | Engine                   | Required                                                                                                                            |
| ---------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Chromium** (via **Brave**, not Chrome) | Blink                    | **always** — one Chromium-family pass                                                                                               |
| **Firefox**                              | Gecko                    | **always**                                                                                                                          |
| **Safari**                               | WebKit                   | **always** — Playwright's `webkit` covers the engine; use `safaridriver` for a true-Safari pass when WebKit results look suspicious |
| **iOS**                                  | iPhone simulator (Xcode) | when Xcode is installed                                                                                                             |
| **Android**                              | Pixel AVD (Android SDK)  | when the SDK is installed                                                                                                           |

The three browser engines are non-negotiable because they diverge on exactly the things this app
leans on — backdrop-filter, view transitions, date/`Intl` formatting, flex/grid sizing, and
CapacitorHttp's response shaping. A change that looks right in one engine regularly breaks in
another (see the history in `mvp-tech-spec.md` §10 — WebKit surfaced a real 500-handling bug the
others hid).

Use Brave rather than Google Chrome for the Chromium pass (project preference; Playwright launches
it via `executablePath`).

## Browser matrix — `pnpm render-pass`

`scripts/render-pass.mjs` (Playwright) is the standing regression gate. It drives the **real app
against the real backend**: full OIDC login through the test provider, then every screen, full-page
screenshot per engine, across Brave + Firefox + WebKit. It fails non-zero on any page error,
uncaught rejection, failed request, or unexpected ≥400 response, and writes
`render-pass-output/report.json` plus `render-pass-output/<engine>/*.png`.

```sh
pnpm render-pass                 # all three engines
node scripts/render-pass.mjs --engine brave     # one engine
node scripts/render-pass.mjs --out /tmp/shots   # custom output dir
```

Prereqs (see "Environment" below): backend on :8000 (seeded) and :8001, and `pnpm dev` on :5173.

Contract-level exceptions are filtered in the script, not ignored blindly — e.g. a `404` on
`GET /tickets/queue` is the documented "not queued" signal (spec §4.2) and vite's HMR-aborted module
requests on the first load after an edit. When you add a flow whose happy path legitimately produces
a ≥400, filter it there with a comment, don't loosen the whole gate.

### One-off / flow-specific probes

For a specific interaction (a purchase, a cancel, a state transition), write a throwaway probe in
the scratchpad rather than bloating `render-pass.mjs`. Pattern (see the `*-probe.mjs` files used
during development):

```js
import { firefox } from '/abs/path/to/frontend/node_modules/playwright/index.mjs';
const page = await (
	await firefox.launch()
)
	.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
	.then((c) => c.newPage());
// log in via test provider, drive the flow, screenshot, assert
```

Assert the outcome (a DOM string, a URL, a request count) and print it — a probe that only
screenshots can't fail CI. Counting backend requests is how the cache's "minimize refetching"
guarantee was verified (5 GETs across a full nav sequence, not 16).

Selectors: prefer `getByRole`/placeholder text over CSS classes (Tailwind classes churn). The login
inputs are `input[placeholder="aa0000bb-s"]` (stil-id) and `input[placeholder="Full name"]`.

## Simulating a Swish payment locally

Real Swish needs Swish-issued merchant certs we don't have in dev, so a **paid** purchase can't
complete against the live Swish API. Two dev-only pieces bridge it:

1. The transactions service, in debug builds, skips the live Swish MSS call and fabricates a
   payment-request token (so the transaction is actually created and the app enters "Completing
   payment…").
2. **`pnpm dev:swish-pay`** (`scripts/dev-swish-pay.mjs`) fires the exact callback Swish would —
   POST `/v0/swish-callback` for the pending transaction — driving the real completion chain
   (transactions → minilith → ticket). Run it in a terminal while sitting on the paying screen:

   ```sh
   pnpm dev:swish-pay
   ```

   The app flips to purchased within ~5s (the paying poll cadence). Free tickets don't need this —
   they settle inline.

> This depends on the transactions service running a **debug** build with the Swish-stub; it's a
> local convenience only. See the backend asks in `mvp-tech-spec.md` (B22 + the Swish-sandbox note)
> for making the paid flow testable without hand-patching.

## Device smoke — iOS (Xcode)

```sh
pnpm build && npx cap sync ios
cd ios/App && xcodebuild -project App.xcodeproj -scheme App \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath /tmp/dd build
xcrun simctl boot "iPhone 17 Pro"
xcrun simctl install booted /tmp/dd/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted se.teknologappen.tappen
xcrun simctl io booted screenshot /tmp/ios.png
```

Visual verification works today. For scripted tapping in the simulator, add `idb` (brew) or Appium.
For live-reload dev against localhost, set Capacitor's `server.url` to `http://localhost:5173` in
`capacitor.config.ts` (don't commit it).

## Device smoke — Android (SDK)

```sh
export ANDROID_HOME=~/Library/Android/sdk ANDROID_AVD_HOME=~/.config/.android/avd
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
$ANDROID_HOME/emulator/emulator -avd tappen-pixel -no-window -no-audio -no-snapshot &
pnpm build && npx cap sync android
cd android && ./gradlew assembleDebug
$ANDROID_HOME/platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk
$ANDROID_HOME/platform-tools/adb shell am start -n se.teknologappen.tappen/.MainActivity
$ANDROID_HOME/platform-tools/adb exec-out screencap -p > /tmp/android.png
```

Android is the most scriptable device target: `adb shell input tap/swipe/text` drives it fully,
`screencap` captures. Create the AVD once with
`avdmanager create avd -n tappen-pixel -k "system-images;android-36;google_apis;arm64-v8a" -d pixel_8`.

> Machine quirks worth knowing: the shell has a lazy `node` function that shadows PATH in
> non-interactive use — call the node binary by absolute path (`~/.nvm/versions/node/<v>/bin/node`)
> in scripts. New Android cmdline-tools write AVDs to `~/.config/.android/avd` while the emulator
> reads `~/.android/avd`; set `ANDROID_AVD_HOME` to bridge it.

## Environment the tests need

- **Postgres** (`docker compose up -d` in `backend/`), databases `fed`/`auth`, or `fed62` for the
  PR-#62 stack.
- **minilith** :8000, **fed-auth** :8001 (+ **transactions** :8002 for the paid purchase flow). Seed
  fixtures with `cargo run --bin seed-dev`.
- **`pnpm dev`** :5173.
- Test users (test provider, any name, no password): `si1234mc-s` (D-guild), `ma5657ed-s` /
  `er7826an-s` (E-guild). A brand-new stil-id logs in but starts with no memberships (default theme,
  empty activity list until added to a group).

## Before declaring a UI change done

1. `pnpm check` (svelte-check) — 0 errors.
2. `pnpm lint` — no _new_ issues.
3. `pnpm render-pass` — 0 problems across all three engines.
4. Inspect the screenshots for the changed screens (both light and, where the design commits to it,
   dark).
5. For a new flow, a probe that asserts the outcome; for device-affecting changes, an iOS and/or
   Android smoke where available.
