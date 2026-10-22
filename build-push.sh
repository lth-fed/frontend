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

# The Docker Hub images are what the local development stacks run (see the
# frontend compose file in the backend repo), where Minilith lives on
# `localhost:8000` and fed-auth on `localhost:8001`. Rebuild the web apps in dev
# mode so the bundles resolve those URLs — exactly what `pnpm dev` serves —
# instead of the production hosts. The production images pushed above are
# untouched. `docker.io` is the registry endpoint used for repositories hosted
# at hub.docker.com.
NODE_ENV=development pnpm build
NODE_ENV=development pnpm --dir auth build

export CONTAINER_REGISTRY=docker.io/esekmacapar
podman login docker.io
podman compose -f ./compose.prod.yaml build
for service in fed-frontend fed-auth-frontend fed-public; do
    podman push "docker.io/esekmacapar/${service}:${CONTAINER_TAG}"
    podman tag \
        "docker.io/esekmacapar/${service}:${CONTAINER_TAG}" \
        "docker.io/esekmacapar/${service}:latest"
    podman push "docker.io/esekmacapar/${service}:latest"
done
