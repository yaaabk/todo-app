# todo-app

An application scaffolded by [YAAABK](https://github.com) from the
`svelte-bun` template: a SvelteKit single-page app served by a Bun + Hono API.

- Project id: `5bcc1992-11e9-4fc3-ba74-398b865cecda`
- Kubernetes namespace: `yaaabk-5bcc1992`
- API port: `3000`

## Layout

| Path      | What it is                                            |
| --------- | ----------------------------------------------------- |
| `web/`    | SvelteKit + Tailwind single-page app                  |
| `server/` | Bun + Hono API that also serves `web/build`           |
| `deploy/` | Kubernetes manifests applied by the YAAABK deploy Job |

## Developing locally

```sh
bun install
bun run dev   # API on :3000, web dev server on :5173
```

`/api` requests from the dev server proxy to the API, so the page works against
the live API during development.

## Checks

Run the same checks YAAABK runs:

```sh
bun run check   # lint, typecheck, tests, build and smoke
bun run test    # API tests and component tests
bun run smoke   # start the API, check /health, /api/hello and /, stop it
bun run build   # just the production build, when you need it
```

Agents work without a browser: do not start one, install Playwright or
Chromium, or take screenshots. See `AGENTS.md` for the repository map, the full
command list and the Agent constraints.

`bun.lock` is committed, so CI and the YAAABK agent install with
`bun install --frozen-lockfile`.

## Deploying

After your pull request passes CI and review and is merged, YAAABK automatically
spawns a deploy Job in `yaaabk-5bcc1992` that applies `deploy/` with server-side
apply, waits for the rollout, and verifies the `/health` endpoint.
