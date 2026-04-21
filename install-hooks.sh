#!/bin/sh

cd "$(dirname "$0")" || exit 1

if [ ! -d "${1:-"../hooks"}" ]; then
    echo "You need to have the hooks repo downloaded at '../hooks' or specify it's location as a parameter."
    exit 1
fi

"${1:-"$PWD/../hooks"}/install-hooks.sh" "${1:-"$PWD/../hooks"}"
