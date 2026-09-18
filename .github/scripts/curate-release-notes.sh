#!/usr/bin/env bash
set -euo pipefail

# Reads a release-please-generated changelog (Markdown, on stdin) and
# writes only its "Features" and "Bug Fixes" bullets, reformatted as plain
# text for App Store / Play Store release notes: the trailing commit-link
# reference and any Markdown emphasis are stripped, since neither store
# renders Markdown.
#
# Usage: curate-release-notes.sh < full-changelog.md

awk '
	/^### Features$/  { section=1; next }
	/^### Bug Fixes$/ { section=1; next }
	/^### /           { section=0; next }
	section && /^\* /  { print }
' | sed -E \
	-e 's/^\* //' \
	-e 's/ \(\[[0-9a-f]+\]\([^)]*\)\)[[:space:]]*$//' \
	-e 's/\*\*([^*]+)\*\*/\1/g' \
	-e 's/`([^`]+)`/\1/g' \
	-e 's/^/- /'
