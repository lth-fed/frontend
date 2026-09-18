# Mobile release process

Publishing a GitHub Release triggers `.github/workflows/release.yml`, which builds the iOS and
Android apps and ships them straight to the App Store and Google Play (production track) via
[fastlane](https://fastlane.tools) (`fastlane/Fastfile`).

That GitHub Release itself is prepared automatically by
[release-please](https://github.com/googleapis/release-please)
(`.github/workflows/release-please.yml`) from
[Conventional Commits](https://www.conventionalcommits.org/) on `main` — see below.

## How versioning and changelogs work

Every push to `main` runs `release-please`, which looks at the Conventional Commit messages since
the last release and, if there's anything release-worthy (`feat`/`fix`/etc.), opens or updates a
standing pull request titled something like `chore(main): release 1.5.0`. That PR contains only two
kinds of change: the version bump in `package.json` and an update to the root `CHANGELOG.md`. The
version bump follows semver from commit types — `fix:` bumps patch, `feat:` bumps minor, a `!` or a
`BREAKING CHANGE:` footer bumps major — so **you don't choose the version by hand anymore**; write
your commits correctly (see the `conventional-commit-message` skill) and the version follows.

Merging that PR is the trigger: release-please tags the merge commit (`v1.5.0`) and creates a
**draft** GitHub Release with the full changelog entry as its body — every commit type gets its own
section (Features, Bug Fixes, Documentation, Continuous Integration, ...), which is deliberately the
_complete_ technical changelog, not App Store copy (see [Release notes](#release-notes) below).

**The draft is the safety gate that replaces manually creating a release.** Nothing ships until a
human opens that draft on the repo's Releases page and clicks **Publish release** — that's the
`release: published` event `release.yml` actually listens for. Review the changelog, edit it if you
want, then publish when you're ready to ship to both stores. Marking it a pre-release before
publishing still works exactly as before (see below) to dry-run the pipeline.

Build _numbers_ (the invisible per-upload counter, not the marketing version) are still fetched live
from App Store Connect / Play Console and incremented by fastlane — the `MARKETING_VERSION`/
`CURRENT_PROJECT_VERSION` in `App.xcodeproj` and `versionName`/`versionCode` in
`android/app/build.gradle` only matter for local dev builds (`pnpm ios` / `pnpm android`).

**To test the release pipeline without shipping to real users**, mark the draft (or any manually
created) GitHub Release as a "pre-release" before publishing it. Both jobs still run in full —
build, sign, package — but the `upload_to_app_store` / `upload_to_play_store` steps are skipped, so
nothing reaches App Store Connect or Play Console. The signed `.ipa`/`.aab` are attached to the
workflow run as downloadable artifacts either way (Actions tab -> the run -> **Artifacts**, kept 14
days).

You can still create a GitHub Release by hand (e.g. for a one-off hotfix tag) — `release.yml`
doesn't care who or what created the release it's reacting to, only that it was published.

## Release notes

`CHANGELOG.md` and the GitHub Release body are the **full** technical changelog — every commit type,
useful for developers, not filtered. Neither is what should reach end users on the App Store or Play
Store: nobody wants "ci: bump JDK to 21" in their update notes.

Instead, the `version` job in `release.yml` runs the release body through
`.github/scripts/curate-release-notes.sh`, which keeps only the **Features** and **Bug Fixes**
sections, strips the trailing commit-link reference and any Markdown (neither store renders it), and
falls back to "General improvements and bug fixes." if a release happens to contain neither (e.g. an
all-`chore` release). That curated, plain-text result — not the raw release body — is what's passed
to fastlane as `RELEASE_NOTES`. If you want a different cut (e.g. also surface `perf` commits), edit
the section list at the top of that script.

If you want the store text to say something different from what your commit messages produce
mechanically, publish the draft release, then edit its description in the GitHub UI to whatever you
want _before_ editing/re-publishing — or just accept the mechanical cut, since good commit subjects
(per the `conventional-commit-message` skill) already read like changelog bullets.

The two stores take this text through different mechanisms: `deliver` (iOS) accepts a
`release_notes` parameter directly; `supply` (Android) has no such parameter at all — it only reads
changelog text from disk, under `fastlane/metadata/android/<locale>/changelogs/<version_code>.txt`.
The Android lane writes that file itself each run before calling `upload_to_play_store`; that
directory is gitignored since it's regenerated every release.

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

## One-time setup: release-please permissions

`release-please.yml` opens/updates its release PR using the default `GITHUB_TOKEN` — no new secret
needed — but repos default to denying Actions the ability to open PRs. Enable **Settings → Actions →
General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**, or the
release PR step fails silently on a repo that hasn't had this flipped before.

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
