# AGENTS.md

## Commands

```bash
yarn dev          # start Vite dev server (root is docs-example/, NOT src/)
yarn build:lib    # build dist/vnova.es.js + dist/vnova.umd.js via vite.lib.config.js
yarn test         # run the Vitest suite once
yarn test:watch   # re-run tests on change
```

Tests live in `tests/` and use Vitest + jsdom (`vitest.config.js`).

## Architecture

- **Library, not an app.** `package.json` `main` points to `./src/index.js` (source, not built). Consumers import `vnova-engine` directly.
- **Vue 3 + Pinia 3 + Vite 6** (peer deps). Source is plain JS; types live in `src/vnova.d.ts` only.
- **Engine core:** `src/core/engine.js` (state machine consuming a flat script array), `src/core/store.js` (Pinia store).
- **Script compilation:** `src/core/compiler.js` flattens nested labels and `if`/`once`/`random` blocks into jumps; `src/core/conditions.js` evaluates declarative conditions.
- **Read/voice state:** `src/core/readTracker.js` persists read lines for skip mode; `src/core/voiceBus.js` shares voice playback state with auto mode.
- **Meta-progress:** `src/core/progress.js` persists CGs/endings/achievements/chapters; `src/core/unlocks.js` normalizes the `unlock` step.
- **Components:** `src/components/*.vue` — order in template matters (render order = declaration order).
- **Composables:** `src/composables/` — author-facing hooks (`useVNovaEngine`, `useUserStorage`, `useEngine`, `useQuestEngine`, `useVNovaAudio`, `useVNovaSaves`).
- **Vite plugin:** `vite-plugin/index.js` — injects `vnova-engine` alias, validates scripts at dev/build time.
- **Demo/playground:** `docs-example/` — the dev root. Its `story/` dir is the reference for the no-code author flow.

## Product constraint: No-Code First

Features must work declaratively (script/config/assets/characters files) without writing JS. See `docs/guide/no-code.md`. If adding a feature that requires a custom callback for a common case, the design is incomplete — push complexity into core instead.

## Key gotchas

- `yarn dev` serves `docs-example/`, not a top-level `index.html`.
- The library ships source (`src/`), not the `dist/` output. `dist/` is only for external consumers who need UMD/ES bundles.
- `docs/next-major-api-plan.md` is a planning draft — do not treat it as current API.
- Script step types are defined in `src/core/engine.js` header comment. Add new step types there and update `src/core/compiler.js`, `src/core/validator.js` and `src/vnova.d.ts` in sync.
