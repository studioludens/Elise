---
name: writing-elise-component
description: Use when creating, editing, or extracting a React component in the Elise repo (anything under web/apps/web/src/components/, or moving inline JSX out of App.tsx into a reusable piece)
---

# Writing an Elise component

## Overview

Elise's web app is React 18 + Vite + strict TypeScript. Components follow a rigid file-and-naming convention so the codebase reads predictably. Default to CSS Modules with a `.root` wrapper class; design values come from `src/styles/tokens.css`, never inline literals. Inline `style={{ ... }}` is reserved for genuinely dynamic values that can't be expressed as a class toggle.

## File layout

Every component lives in its own folder under `web/apps/web/src/components/{Name}/`:

```
web/apps/web/src/components/SliderField/
  SliderField.tsx
  SliderField.module.css
```

- One folder per component. No `index.ts` re-exports.
- The folder, file, and component name all match in PascalCase.

## Exports

**Default export.** The component function is declared and then default-exported at the bottom of the file. Named exports are reserved for the props type alias.

```tsx
import type { ChangeEvent } from "react";
import styles from "./SliderField.module.css";

export type SliderFieldProps = {
    label: string;
    value: number;
    onChange: (next: number) => void;
};

function SliderField({ label, value, onChange }: SliderFieldProps): JSX.Element {
    return <div className={styles.root}>...</div>;
}

export default SliderField;
```

- Function declaration, not arrow function.
- Return type explicitly annotated as `: JSX.Element`.
- Importers use the default form: `import SliderField from "./components/SliderField/SliderField.js";`

## Props type

The props alias is **always** `{Name}Props`. Never the generic `Props`.

- Always `type`, never `interface` (project-wide rule).
- Optional callbacks use `(arg: T) => void`, not `React.EventHandler<...>` — the inline form reads better at the call site.
- Don't mark fields as `readonly` unless the prop is genuinely a const array from a memoized parent (see `events: readonly DrawEvent[]` on the preview components).

## Imports

**Workspace packages** use the bare package name, no extension:

```tsx
import type { DrawEvent } from "@elise/engine";
import { eventsToSegments } from "@elise/gpu";
```

**Sibling/parent runtime imports** are extensionless. The monorepo uses `"moduleResolution": "Bundler"` (see `web/tsconfig.base.json`), so Vite and TypeScript both resolve `./Foo` to `Foo.ts` / `Foo.tsx` without help. **Don't write `.js` on a relative import** — that style was a NodeNext-era leftover and has been purged.

```tsx
import { computeBounds, fitView } from "../../canvas2d";
import { useWebGpu } from "../../useWebGpu";
```

**CSS Module imports** use a relative path with the `.module.css` extension; the import is named `styles`:

```tsx
import styles from "./SliderField.module.css";
```

**Type-only imports** from `.d.ts` files don't take an extension. Keep `import type` separate from value imports where convenient.

## CSS Modules

- The wrapper class is **always** `.root`. Subclasses are descriptive (`.label`, `.row`, `.muted`, `.error`).
- Use **native CSS nesting** (`& selector { ... }`). Don't write flat `.parent .child`.
- **Never** write `:global(tag)`. CSS Modules doesn't scope bare tag selectors anyway — `& p` and `& :global(p)` compile identically. The wrapper is just noise.
- To style nested elements (rendered markdown, child tags), use parent-class descendant selectors: `.root & input { ... }`.

```css
.root {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.label {
    font-size: var(--text-sm);
    font-weight: 600;
}

.row {
    display: flex;
    gap: var(--spacing-2);
    align-items: center;

    & input[type="number"] {
        width: 72px;
    }
}
```

Vite scopes CSS Module class names automatically (production output looks like `_SliderField_abc12_root`).

## Design tokens

**All design constants live in `web/apps/web/src/styles/tokens.css`.** That file is imported once in `main.tsx`. Components reference tokens through `var(...)`; never hardcode rem/px/hex values that match a token.

Current tokens:

- **Colors (named by role, never by hue):** `--color-bg`, `--color-surface`, `--color-surface-muted`, `--color-preview-bg`, `--color-text`, `--color-text-muted`, `--color-text-dim`, `--color-border`, `--color-border-strong`, `--color-input-border`, `--color-overlay`, `--color-overlay-strong`, `--color-overlay-text`, `--color-error-bg`, `--color-error-text`.
- **Spacing (4px scale):** `--spacing-1` (4px) … `--spacing-6` (24px). Inline `0.25rem * n` values are forbidden when a token exists.
- **Text sizes:** `--text-xs` (11px), `--text-sm` (12px), `--text-base` (13px), `--text-md` (14px), `--text-lg` (18px).
- **Fonts:** `--font-sans`, `--font-mono`.
- **Radius:** `--radius-sm` (4px).
- **Line height:** `--leading-tight` (1.4).

Truly off-scale one-offs (e.g., a hand-tuned input width of 72px) may be inline in the `.module.css`, but think twice — most "off-scale" values are just a missing token.

If you need a new token, add it to `tokens.css` rather than defining ad-hoc CSS variables inside a component.

## Inline `style` — when allowed

Inline `style={{ ... }}` is permitted **only** for values that genuinely change at render time and cannot be expressed as a class toggle. The current legitimate use is the cursor on the drag-able preview canvases:

```tsx
<canvas style={{ cursor: draggingRef.current ? "grabbing" : "grab" }} />
```

A boolean state (`active`, `error`, `loading`) is **not** a justification — that's a class toggle:

```tsx
<div className={`${styles.root} ${error ? styles.errorState : ""}`}>
```

If you're reaching for `style={{ ... }}` for anything static (color, spacing, font size, layout), stop and put it in the `.module.css`.

## Test IDs

When a component renders something a test will need to find, add a stable `data-testid`. Kebab-case, scoped to the feature (`stats-hud`, `rule-count`, `lsystem-canvas`). Don't add testids speculatively — only when a test actually queries them.

Prefer accessible queries (`getByLabelText`, `getByRole`) in tests and reach for `getByTestId` only when the element has no accessible identity.

## When to extract a new component

`App.tsx` is the composition root. If a chunk of its JSX:
- repeats a layout/control pattern with different data, or
- has its own non-trivial local state, or
- accumulates more than ~30 lines of inline JSX with no other consumers,

…extract it into a new file under `src/components/`. Even small one-off components (`AxiomInput`, `SliderField`) earn their own folder when they exist to keep `App.tsx` declarative.

Don't extract just to reduce `App.tsx`'s line count if the new component would only be a pass-through with no encapsulated logic or layout.

## Formatting

Code style (single quotes, 4-space indent, trailing commas, 100-char width) is enforced by Prettier — config in `web/.prettierrc.json`. Don't hand-format; run `npm run format` from `web/` after edits and `npm run format:check` to verify. The skill specifies *structure* (folders, exports, naming, tokens); Prettier owns *style*.

## Tests

Component tests live under `web/apps/web/tests/`, not next to the component:

```
web/apps/web/tests/
  app.test.tsx
  statsHud.test.tsx
  useShortcuts.test.tsx
```

- `@testing-library/react` + `vitest`. `tests/setup.ts` wires in `@testing-library/jest-dom`.
- Test imports use the default form too: `import StatsHud from "../src/components/StatsHud/StatsHud.js";`.

## Quick reference

| Concern | Convention |
|---|---|
| Folder | `web/apps/web/src/components/{Name}/` |
| Files | `{Name}.tsx`, `{Name}.module.css` |
| Function | `function {Name}() {}; export default {Name};` |
| Props type | `export type {Name}Props = { ... }` (never `Props`) |
| Type alias keyword | `type`, never `interface` |
| Return type | Explicit `: JSX.Element` |
| Wrapper class | `.root` |
| CSS nesting | Native (`& selector`) |
| `:global(tag)` | Forbidden — use bare tag in nested selector |
| Design values | Tokens from `tokens.css`, not hardcoded |
| Inline `style` | Only for genuinely dynamic, non-toggleable values |
| Workspace imports | Bare package name (`@elise/engine`, `@elise/gpu`) |
| Sibling imports | Relative path, no extension (`./foo`, not `./foo.js`) |
| CSS Module import | `import styles from "./Name.module.css";` |
| Test IDs | `data-testid="kebab-case"`, added only when a test needs it |
| Tests | `web/apps/web/tests/{name}.test.tsx`, default-import the component |

## Common mistakes

| Mistake | Fix |
|---|---|
| `export function Foo` as the public API | Use `function Foo`; `export default Foo` at the bottom |
| `type Props = { ... }` in a component | Rename to `{ComponentName}Props` |
| `interface FooProps` | Use `type FooProps` |
| `.js` extension on a relative import | Drop it: `'../../canvas2d'` (Bundler resolution finds the `.ts`) |
| Adding a flat `Foo.tsx` to `components/` | Move it into `components/Foo/Foo.tsx` with a `.module.css` |
| Inline `style={{ color: "#666" }}` | Add a class in `.module.css` using `var(--color-text-muted)` |
| `style={{ active ? "..." : "..." }}` for boolean states | Use a class toggle: `className={\`${styles.root} ${active ? styles.active : ""}\`}` |
| Hardcoded `gap: 8` in CSS | Use `var(--spacing-2)` |
| Hue-named token like `--gold` | Rename by role: `--color-accent`, `--color-surface` |
| `:global(p) { ... }` | `.root & p { ... }` |
| `data-testid` on every element | Only when a test queries it |
