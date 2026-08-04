# FED Frontend

## Local development

Install dependencies and run the main frontend:

```sh
pnpm install
pnpm dev
```

Run the auth frontend from its directory with `pnpm --dir auth dev`.

## Build and push production images

Run `./build-push.sh`.

## Deploy pushed images

The deployment host only needs `compose.yaml` and an untracked `.env`:

```dotenv
CONTAINER_REGISTRY=registry.esek.se/esek
CONTAINER_TAG=0.0.1-alpha.1

TRAEFIK_NETWORK=traefik
TRAEFIK_ENTRYPOINT=websecure
TRAEFIK_CERT_RESOLVER=letsencrypt
PUBLIC_DOMAIN=teknologappen.se
FRONTEND_DOMAIN=app.teknologappen.se
AUTH_DOMAIN=auth.teknologappen.se
```

It also needs:

- DNS records for both domains pointing to the host.
- A running Traefik instance with its Docker provider connected to the Podman API socket.
- A `websecure` entrypoint and an ACME certificate resolver named `letsencrypt` (or matching values
  in `.env`).
- The external network shared by Traefik and this stack:

```sh
podman network exists traefik || podman network create traefik
```

Pull and start the pushed images without rebuilding:

```sh
podman compose pull
podman compose up -d --no-build
```

Traefik serves the main frontend at `app.teknologappen.se` and the auth frontend at
`auth.teknologappen.se`.
