# Mobile release process

Publishing a GitHub Release triggers `.github/workflows/release.yml`, which builds the iOS and
Android apps and ships them straight to the App Store and Google Play (production track) via
[fastlane](https://fastlane.tools) (`fastlane/Fastfile`).

## How versioning works

The release's **tag name** is the marketing version shipped to both stores (a leading `v` is
stripped, so both `v1.4.0` and `1.4.0` become `1.4.0`). Build numbers are _not_ read from the repo —
the fastlane lanes fetch the latest build number already on TestFlight / the Play production track
and increment it. This means the `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` in `App.xcodeproj`
and `versionName`/`versionCode` in `android/app/build.gradle` only matter for local dev builds
(`pnpm ios` / `pnpm android`); you don't need to hand-bump them before tagging a release anymore.

Tag/release the same version you want on the stores, e.g. create a GitHub Release with tag `1.5.0`
to ship `1.5.0` to both platforms. **Nothing here auto-decides a patch/minor/major bump** — the
workflow just mirrors whatever tag you type. Going from `1.2` to `1.3` vs `2.0` vs `2.2` is entirely
your call when you create the release; if you want that convention enforced, it'd need to be a
separate check (e.g. a script comparing against the last published tag), which isn't set up.

**To test the workflow without shipping to real users**, mark the GitHub Release as a "pre-release".
Both jobs still run in full — build, sign, package — but the `upload_to_app_store` /
`upload_to_play_store` steps are skipped, so nothing reaches App Store Connect or Play Console. The
signed `.ipa`/`.aab` are attached to the workflow run as downloadable artifacts either way (Actions
tab -> the run -> **Artifacts**, kept 14 days), which is the easiest way to sanity-check a release
build without shipping it.

## Release notes

The GitHub Release's **description** (the markdown body you write in the release form — not the tag)
is uploaded verbatim as the App Store "What's New" text and the Play Store release notes. Apple
_requires_ non-empty release notes for every update submission (not the first one), so don't publish
a release with an empty description — if you do, the lane falls back to a placeholder string ("No
release notes provided.") rather than failing, but real notes are obviously better.

Notes are truncated to each store's limit (4000 chars for the App Store, 500 for Play) and uploaded
under `sv` (App Store Connect) / `sv-SE` (Play Console) by default, since the listings are Swedish.
**Verify these against the exact locale codes shown in each store's console before your first real
release** — Apple and Google use different conventions for the same language (Apple generally lists
Swedish as `sv`, no region; Play lists it as `sv-SE`), and if the code doesn't match an existing
localization, deliver/supply create a _new_ one instead of updating yours, which can fail submission
(a fresh App Store Connect localization needs its own screenshots). Check App Store Connect → your
app → App Information → Localizable Information for the exact code, and override via the
`ASC_LOCALE` / `PLAY_LOCALE` **repository variables** (Settings → Secrets and variables → Actions →
Variables tab, not Secrets — these aren't sensitive) if they differ from the defaults above.

## One-time setup: required GitHub secrets

Add these under **Settings → Secrets and variables → Actions** on the repo. Base64 a file with
`base64 -i <file> | pbcopy` (macOS) before pasting it in as a secret.

### iOS

| Secret                            | What it is                                                                                                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IOS_DIST_CERTIFICATE_BASE64`     | Base64 of your **Apple Distribution** certificate, exported as a `.p12` from Keychain Access (with its private key).                                                                                                  |
| `IOS_DIST_CERTIFICATE_PASSWORD`   | The password you set when exporting the `.p12`.                                                                                                                                                                       |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64 of the **App Store** distribution provisioning profile (`.mobileprovision`) for `se.teknologappen.tappen`, downloaded from [developer.apple.com](https://developer.apple.com/account/resources/profiles/list). |
| `IOS_PROVISIONING_PROFILE_NAME`   | The profile's exact **name** as shown in App Store Connect / the Apple Developer portal (not the filename) — fastlane needs this to map it during signing.                                                            |
| `ASC_API_KEY_ID`                  | Key ID of an App Store Connect API key ([Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/api)).                                                                     |
| `ASC_API_ISSUER_ID`               | Issuer ID shown on the same API Keys page.                                                                                                                                                                            |
| `ASC_API_KEY_BASE64`              | Base64 of the API key's downloaded `.p8` file (Apple only lets you download it once).                                                                                                                                 |

The API key needs at least the **App Manager** role. Create it under the team with ID `J77J9HFNJC`
(see `fastlane/Appfile`).

### Android

| Secret                       | What it is                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`    | Base64 of the release `.jks`/`.keystore` file used to sign `se.teknologappen.tappen`.                                                                                         |
| `ANDROID_KEYSTORE_PASSWORD`  | Keystore password.                                                                                                                                                            |
| `ANDROID_KEY_ALIAS`          | Key alias inside the keystore.                                                                                                                                                |
| `ANDROID_KEY_PASSWORD`       | Password for that key (often the same as the keystore password).                                                                                                              |
| `PLAY_STORE_JSON_KEY_BASE64` | Base64 of a Google Play service-account JSON key with **Release Manager** access to the app, created in [Play Console → Setup → API access](https://play.google.com/console). |

**Important:** whichever keystore you put in `ANDROID_KEYSTORE_BASE64` must be the same one the app
was originally signed/uploaded with (or the keystore Play App Signing expects as the upload key) —
Play Store rejects bundles signed with an unrecognized key.

## What each job does

- **`ios`** (`macos-26` runner, pinned to **Xcode 26.4.1** via `DEVELOPER_DIR`): `pnpm build` →
  `cap sync ios` → imports the distribution cert into a throwaway CI keychain → installs the
  provisioning profile → bumps version/build number → `xcodebuild` archive & export via fastlane's
  `build_app` → uploads to App Store Connect and submits for review with `automatic_release: true`
  (so it goes live automatically once Apple approves it — CI can't skip Apple's review itself).

  **The Xcode pin matters and needs to be kept in sync with local dev.** The native Swift plugins
  use iOS 26 "Liquid Glass" UIKit APIs that don't exist in older SDKs at all (not a runtime
  `@available` issue — a compile-time one: the symbols aren't declared in the SDK). If you bump the
  app's minimum supported Xcode locally, bump `DEVELOPER_DIR` in `release.yml` to match — check
  available versions in the
  [`macos-26` runner image readme](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md)
  before picking a new pin, since GitHub only keeps a handful of versions installed at a time. Run
  `xcodebuild -version` locally to see what you're actually building against.

- **`android`** (`ubuntu-latest` runner): `pnpm build` → `cap sync android` → decodes the keystore →
  `./gradlew bundleRelease` (signed, via the `signingConfigs.release` block added to
  `android/app/build.gradle`) → `upload_to_play_store` with `release_status: completed` on the
  `production` track.

Both jobs build the web app and run `cap sync` independently since they run on different OSes;
there's no shared build artifact between them.

## Known assumption

This workflow adds _new_ builds to **existing** App Store Connect / Play Console app listings. It
assumes both apps already have their required store metadata (description, screenshots, content
rating, etc.) filled in from a prior manual submission. `skip_screenshots` is set on the iOS lane so
fastlane doesn't touch screenshots on every release (not required for updates). `skip_metadata` is
**not** set, specifically so release notes can be uploaded — deliver only touches the fields it's
explicitly given (release notes), so your manually-set description/keywords/etc. are left alone.
