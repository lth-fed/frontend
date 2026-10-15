# Changelog

## [1.2.0](https://github.com/lth-fed/frontend/compare/v1.1.0...v1.2.0) (2026-10-15)


### Features

* add public showcase & salesdeck ([d4e6728](https://github.com/lth-fed/frontend/commit/d4e6728b3129534fda6d8c3a358d9eba652f05b1))


### Bug Fixes

* add last explainer video ([0521b0a](https://github.com/lth-fed/frontend/commit/0521b0a73f25455009cc14c4b3b8f1e9b631fbff))
* update android modal on web ([4375db0](https://github.com/lth-fed/frontend/commit/4375db05180df06e57f3620e95c62c40993b0a1c))
* use server time for the Home ticket cutoff and QR timestamps ([cf83ac5](https://github.com/lth-fed/frontend/commit/cf83ac549b79ce314029b1fc24be32e219f4fc1e))


### Documentation

* add `CLAUDE.md` with repository guidance for Claude Code ([f786efd](https://github.com/lth-fed/frontend/commit/f786efde42174b982613e4b69fa8bd09ae68d1fb))
* warn against platform names in App Store Notes ([ae493a5](https://github.com/lth-fed/frontend/commit/ae493a54eafa9162dba9fa565b3dd988eaa61d2a))


### Styles

* wrap long condition in PurchasePill ([eff3a9b](https://github.com/lth-fed/frontend/commit/eff3a9b142cc96fd4ab2f456c220700ff9a54c08))

## [1.1.0](https://github.com/lth-fed/frontend/compare/v1.0.7...v1.1.0) (2026-10-11)


### Features

* addons page at checkout, in app links, share button etc ([e7ce639](https://github.com/lth-fed/frontend/commit/e7ce639bbf94c567c221b7b9a8929fedd5403e38))
* remove overscroll on android ([eb876c6](https://github.com/lth-fed/frontend/commit/eb876c69319d434ddbe4e76bd9e11edcefa1f86c))

## [1.0.7](https://github.com/lth-fed/frontend/compare/v1.0.6...v1.0.7) (2026-09-22)


### Bug Fixes

* normalize github \n\r for release script ([c2d52e4](https://github.com/lth-fed/frontend/commit/c2d52e47e4942f356c82a667156865ddb29b19f0))

## [1.0.6](https://github.com/lth-fed/frontend/compare/v1.0.5...v1.0.6) (2026-09-22)


### Bug Fixes

* scanner not initializing due to unmatching versions ([12a1b0c](https://github.com/lth-fed/frontend/commit/12a1b0caf1a1c587d97ac7df38069bc029142367))


### Documentation

* add quick-start Releasing steps to README ([152b1f5](https://github.com/lth-fed/frontend/commit/152b1f5b3152bbe95585cb8099c671da551f94ab))

## [1.0.5](https://github.com/lth-fed/frontend/compare/v1.0.4...v1.0.5) (2026-09-18)


### Bug Fixes

* **release:** mark releases prerelease ourselves, not via release-please config ([a05457a](https://github.com/lth-fed/frontend/commit/a05457a6951e5e3c068e69f9b0496c84c45baaba))

## [1.0.4](https://github.com/lth-fed/frontend/compare/v1.0.3...v1.0.4) (2026-09-18)


### Bug Fixes

* **ci:** run the CLA check job for bots instead of skipping it ([16c7ee2](https://github.com/lth-fed/frontend/commit/16c7ee26f258aed68d66cb9afea5f71902f03af8))
* generate Paraglide messages before type-checking ([017dc7e](https://github.com/lth-fed/frontend/commit/017dc7eb770b4a6a27239f35cd330f2b0a6e70c9))
* **release:** create real prereleases instead of drafts, require App Store Notes ([6bfdd5a](https://github.com/lth-fed/frontend/commit/6bfdd5aa9fdb4c60e5224b66d02f1ea0cea026ca))
* **release:** ignore CHANGELOG.md in prettier ([174194e](https://github.com/lth-fed/frontend/commit/174194ef54ce201415ffb0cbd1c8e887cb417609))

## [1.0.3](https://github.com/lth-fed/frontend/compare/v1.0.2...v1.0.3) (2026-09-18)


### Bug Fixes

* mark dynamic external links with rel="external" ([82aed37](https://github.com/lth-fed/frontend/commit/82aed37e9743f5effd3dacf04060d1099d6a0cdb))
* **release:** correct release-please's version baseline and tag format ([4ae31c7](https://github.com/lth-fed/frontend/commit/4ae31c72e64a73ec4efa2be6f708256c75660e1d))


### Documentation

* bring README up to date with current project state ([ad68fca](https://github.com/lth-fed/frontend/commit/ad68fca9916217e7d92003141a79382f2a72aff8))


### Continuous Integration

* lint, type-check, and build on every PR and push to main ([ed31d52](https://github.com/lth-fed/frontend/commit/ed31d524a2baa4aeb6821736353c54cfbd891c4b))
* **release:** automate version bumps and changelogs with release-please ([db9df26](https://github.com/lth-fed/frontend/commit/db9df260487dac5ae55fa715f72771a628604be8))
* skip the CLA check for github-actions[bot] PRs ([7e78fb3](https://github.com/lth-fed/frontend/commit/7e78fb3ffc95ea03a6c11276453f6fd31089a721))


### Styles

* fix formatting and ignore generated/vendored files from prettier ([d7fc245](https://github.com/lth-fed/frontend/commit/d7fc245ae821dee7bac6ef680bb98bf836bc9440))


### Miscellaneous

* enforce Conventional Commits via husky + commitlint ([5fd0c9a](https://github.com/lth-fed/frontend/commit/5fd0c9a6b063dbaa8c3dcb8887bfa204db4ad9d1))
* install conventional-commit-message skill ([0f8421e](https://github.com/lth-fed/frontend/commit/0f8421ebb6d426bd4c60a8fb00b8621cf9a8e988))
