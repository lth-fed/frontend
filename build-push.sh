#!/bin/env bash

read -p "Version: " version

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
podman compose build
podman compose push fed-frontend fed-auth-frontend fed-public
