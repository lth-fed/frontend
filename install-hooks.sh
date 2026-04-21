#!/bin/bash

cd "$(dirname "$0")"

if [[ ! -d ${1:-"../hooks"} ]]; then
    echo "You need to have the hooks repo downloaded at '../hooks' or specify it's location as a parameter."
    exit 1
fi

bash "${1:-"$PWD/../hooks"}/install-hooks.sh" "${1:-"$PWD/../hooks"}"
