# FED Frontend

## Local development

Install dependencies and run the main frontend:

```sh
pnpm install
pnpm dev
```

Run the auth frontend from its directory with `pnpm --dir auth dev`.

## Build and push production images

The two images contain their static files; the deployment host does not need
Node.js, pnpm, source code, or bind-mounted build directories.

Build the static applications first:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --dir auth install --frozen-lockfile
pnpm --dir auth build
```

Then build and push both Nginx images (you HAVE TO have built it just before,
it doesn't do it automatically):

```sh
export CONTAINER_REGISTRY=registry.esek.se/esek
export CONTAINER_TAG=0.0.1-alpha.1

podman login registry.esek.se
podman compose build
podman compose push fed-frontend fed-auth-frontend
```

No production `.env` file or secrets are needed for either build. Production
URLs are part of the frontend configuration: the main API is
`https://api.teknologappen.se`, auth UI is `https://auth.teknologappen.se`,
and auth API is `https://api.auth.teknologappen.se`.

## Deploy pushed images

The deployment host only needs `compose.yaml` and an untracked `.env`:

```dotenv
CONTAINER_REGISTRY=registry.esek.se/esek
CONTAINER_TAG=0.0.1-alpha.1

TRAEFIK_NETWORK=traefik
TRAEFIK_ENTRYPOINT=websecure
TRAEFIK_CERT_RESOLVER=letsencrypt
FRONTEND_DOMAIN=teknologappen.se
AUTH_DOMAIN=auth.teknologappen.se
```

It also needs:

- DNS records for both domains pointing to the host.
- A running Traefik instance with its Docker provider connected to the Podman
  API socket.
- A `websecure` entrypoint and an ACME certificate resolver named
  `letsencrypt` (or matching values in `.env`).
- The external network shared by Traefik and this stack:

```sh
podman network exists traefik || podman network create traefik
```

Pull and start the pushed images without rebuilding:

```sh
podman compose pull
podman compose up -d --no-build
```

Traefik serves the main frontend at `teknologappen.se` and the auth frontend at
`auth.teknologappen.se`. The separately deployed backend serves the auth API at
`api.auth.teknologappen.se`.
