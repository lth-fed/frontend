#!/usr/bin/env bash
set -euo pipefail

# Extracts the "### App Store Notes" section from a release body (Markdown,
# on stdin) — a short, human-written summary the maintainer adds to the
# release before promoting it, which is what actually ships to the App
# Store / Play Store. Prints nothing if the section is absent or empty.
#
# There is deliberately no fallback to the auto-generated changelog here:
# that changelog includes every commit type (chore, ci, refactor, ...) and
# reads like a technical log, not App Store copy. The caller (release.yml)
# treats empty output as a hard failure rather than shipping it anyway.
#
# Usage: curate-release-notes.sh < release-body.md

awk '
	/^### App Store Notes$/ { capture=1; next }
	capture && /^### /      { capture=0 }
	capture && NF           { print }
'
