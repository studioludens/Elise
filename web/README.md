# elise-web

TypeScript + WebGPU port of [Elise](../README), the ActionScript L-system explorer.

## Layout

- `packages/engine` — pure-TS L-system engine (rules, tokens, CPU reference rewriter/interpreter, SVG export). No DOM, runnable in Node.
- `packages/gpu` — WebGPU pipeline (compute-shader rewriter, turtle interpreter, instanced-quad line renderer).
- `apps/web` — React + Vite app, the user-facing Elise UI.

## Requirements

- Node 22+
- pnpm 10+
- A WebGPU-capable browser (Chromium-based, or Safari 26+)

## Scripts

```
pnpm install
pnpm test         # engine unit tests
pnpm typecheck    # all packages
pnpm dev          # run the web app
pnpm build        # build all packages
```

## Status

Milestone 1: scaffold (this commit).
