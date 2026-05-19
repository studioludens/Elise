# elise-web

TypeScript + WebGPU port of [Elise](../README), the ActionScript L-system explorer.

## Layout

- `packages/engine` — pure-TS L-system engine (rules, tokens, CPU reference rewriter/interpreter, SVG export). No DOM, runnable in Node.
- `packages/gpu` — WebGPU pipeline (compute-shader rewriter, turtle interpreter, instanced-quad line renderer).
- `apps/web` — React + Vite app, the user-facing Elise UI with a Canvas2D / WebGPU renderer toggle.

## Requirements

- Node 22+
- npm 10+
- A WebGPU-capable browser (Chromium-based, or Safari 26+) to exercise the WebGPU path.

## Scripts

```
npm install
npm test         # all unit tests (engine + gpu + web)
npm run typecheck
npm run dev      # vite dev server for the web app
npm run build    # build all workspaces; web app lands in apps/web/dist
```

## Deploying

### GitHub Pages (zero-CLI)

A workflow at `.github/workflows/deploy-pages.yml` builds and publishes the
web app to GitHub Pages on every push to `master`. To enable:

1. Repo **Settings → Pages → Source**: set to **GitHub Actions**.
2. Push to `master` (or run the workflow from the Actions tab).

The workflow passes `VITE_BASE=/<repo-name>/` so asset paths resolve under
`https://<owner>.github.io/<repo>/`.

### Cloudflare Pages

The built artifact under `apps/web/dist` is fully static. Easiest paths:

**Git-integrated**: connect the repo in the Cloudflare Pages dashboard.
- Build command: `cd web && npm ci && npm run build`
- Build output directory: `web/apps/web/dist`
- Node version: `22`

**CLI (Wrangler)**: from a checkout with the build already done:
```
cd web && npm ci && npm run build
npx wrangler@latest pages deploy apps/web/dist --project-name elise
```
A starter `wrangler.toml` is included at `apps/web/wrangler.toml`.

## Status

- ✅ Milestone 1: monorepo scaffold (npm workspaces)
- ✅ Milestone 2: engine (rewriter, turtle, interpreter, SVG, 5 presets)
- ✅ Milestone 4: React UI shell + Canvas2D preview, zoom/pan, SVG export
- ✅ Milestone 5: WebGPU device + instanced-quad line renderer
- ✅ Milestone 6: GPU rewriter (expand-count → scan → expand-write, ping-pong)
- ✅ Milestone 7: GPU interpreter (Option B — CPU bracket walk + GPU expand)
- ✅ Milestone 8: WebGPU pipeline wired into the React app behind a renderer toggle
- ✅ Milestone 9: `.lsys` save/load (XML format mirroring the AS3 schema)
- ⏭ Milestone 10: polish — presets gallery, autosave, error UI tuning
