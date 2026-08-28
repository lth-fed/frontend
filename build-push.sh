#!/bin/env bash

if [ $(git status --porcelain | wc -l) -ne "0" ]; then
    echo Please commit you changes before building.
    exit 1
fi

read -p "Version: " version

git tag $version
git push --tags

pnpm install --frozen-lockfile
pnpm build
pnpm --dir lib install --frozen-lockfile
pnpm --dir lib run package
pnpm --dir auth install --frozen-lockfile
pnpm --dir auth build
pnpm --dir public-website install --frozen-lockfile
pnpm --dir public-website build


export CONTAINER_REGISTRY=registry.esek.se/esek
export CONTAINER_TAG=${version:-production}

podman login registry.esek.se
podman compose -f ./compose.prod.yaml build
podman compose -f ./compose.prod.yaml push fed-frontend fed-auth-frontend fed-public
