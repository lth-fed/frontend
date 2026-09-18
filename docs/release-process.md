# Mobile release process

Promoting a GitHub prerelease to a full release triggers `.github/workflows/release.yml`, which
builds the iOS and Android apps and ships them straight to the App Store and Google Play (production
track) via [fastlane](https://fastlane.tools) (`fastlane/Fastfile`).

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

Merging that PR is the trigger: release-please tags the merge commit (`v1.5.0`) and creates the
GitHub Release **directly** — a real release with a real tag, immediately, not a draft — with the
full changelog entry as its body (every commit type gets its own section: Features, Bug Fixes,
Documentation, Continuous Integration, ...). That's deliberately the _complete_ technical changelog,
not App Store copy (see [Release notes](#release-notes) below). A real tag matters: release-please
only knows where "the last release" was by looking at actual git tags, and a GitHub _draft_ doesn't
create one until published — creating it directly means the next push to `main` always computes the
right diff, with nothing left ambiguous.

`release-please.yml` then immediately marks that release **Pre-release** itself, in a separate step
— not via release-please's own `prerelease` config option, which turned out not to do what it sounds
like: internally it's gated on the version having a semver prerelease suffix (like `1.1.0-beta.1`)
or a `0.x` major version, so it silently does nothing for a plain `1.4.0`. Marking it ourselves
works unconditionally regardless of version shape.

**The prerelease is the safety gate that replaces manually creating a release.** Nothing runs
automatically at creation time — GitHub deliberately never fires workflow runs for events caused by
a workflow's own `GITHUB_TOKEN` (both release-please-action's release creation and our own
prerelease-marking step use it), so there's no automatic build here, just the label. Nothing reaches
the stores until a human opens the release on the repo's Releases page, edits it, unchecks **Set as
a pre-release**, and saves — that promotion is a genuine user action, not `GITHUB_TOKEN`, so it
fires normally: GitHub's `release: released` event, the only trigger `release.yml` ever uploads on.
Add your [App Store Notes](#release-notes) to the body before promoting.

You don't have to promote every prerelease, and you don't have to promote them in order. A
prerelease you never touch just sits there, clearly labeled, forever — merge another release PR on
top of it, skip straight to a later version, whatever you need. Version numbers come purely from git
tags + `.release-please-manifest.json`, not from what's promoted, so this never gets confused. The
only thing to remember: only the version you actually promote reaches real users, so if you skip
one, make sure the next one's App Store Notes cover everything meaningful since the last version you
_did_ ship.

Build _numbers_ (the invisible per-upload counter, not the marketing version) are still fetched live
from App Store Connect / Play Console and incremented by fastlane — the `MARKETING_VERSION`/
`CURRENT_PROJECT_VERSION` in `App.xcodeproj` and `versionName`/`versionCode` in
`android/app/build.gradle` only matter for local dev builds (`pnpm ios` / `pnpm android`).

You can still create a GitHub Release by hand (e.g. for a one-off hotfix tag) — create it as a
prerelease too, for the same free build-verification pass, then promote it the same way. (If you
skip straight to a full release, `release.yml` still only uploads on the promotion-shaped trigger,
so it can't double-ship — but you lose the "watch it build first" step, since there's nothing left
to promote.)

## Release notes

`CHANGELOG.md` and the GitHub Release body are the **full** technical changelog — every commit type,
useful for developers, not filtered. Neither is what should reach end users on the App Store or Play
Store: nobody wants "ci: bump JDK to 21" in their update notes, and this is enforced, not just a
default.

Before promoting a release, edit its body and add a section, anywhere in it:

```markdown
### App Store Notes

Fixed links opening incorrectly, and polished the login screen.
```

That's a short, human-written summary — your own words, not commit messages. When you promote, the
`version` job in `release.yml` fetches the release body fresh and runs it through
`.github/scripts/curate-release-notes.sh`, which extracts **only** that section's text. **If the
section is missing or empty, the job fails on purpose** rather than falling back to the technical
changelog — fix the release body and re-run the failed job (it re-fetches the body live, so an
edit-and-retry loop works). There is no mechanical fallback by design: nothing auto-derived from
commit messages is considered acceptable App Store copy.

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

### Why the release PR's checks sometimes need manual approval

The release PR is opened using the default `GITHUB_TOKEN`, and GitHub has a special case for exactly
this: a `pull_request` opened/updated by `GITHUB_TOKEN` still runs its checks, but the very first
run sits as **"Expected — waiting for status to be reported"** until a human clicks **Approve and
run** on it (Actions tab → the run). Once you've approved a run for that PR once, subsequent pushes
to the same PR run automatically without asking again. This is a GitHub platform behavior, not
something this repo's workflows configure.

If you'd rather not deal with this at all — and also want the free "does it still build" check back
on every release-please-created release (see above; it's currently skipped because `GITHUB_TOKEN`
can't trigger `release.yml` either) — replace `github.token` in `release-please.yml` with a
[fine-grained PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
(`contents: write`, `pull requests: write` on this repo) or a GitHub App installation token, stored
as a repo secret. Either sidesteps both limitations, since neither is subject to the `GITHUB_TOKEN`
restrictions above — but it also means release-please's automation runs with a real identity instead
of the tightly-scoped default token, which is worth deciding deliberately rather than defaulting
into.

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
