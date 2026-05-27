# VN Project Context (vnova)

Last update: 2026-05-24

## Goal
Create a visual novel engine for Vue 3, similar in spirit to Monogatari, with a script-first API and Vite integration.

## Repository Overview
- Package name: `vnova-engine`
- Main entry: `src/index.js`
- Demo app root: `docs-example/` (configured via `vite.config.js` root)
- Core modules:
  - `src/core/engine.js`: state machine and step execution
  - `src/core/store.js`: Vuex module (`vnovaModule`)
  - `src/core/validator.js`: dev-time script validator
  - `src/composables/useVNova.js`: composition wrapper over engine
  - `src/components/VNovaStage.vue`: ready-to-use stage component
  - `vite-plugin/index.js`: Vite plugin for aliasing + script validation

## Public API
Exported from `src/index.js`:
- `createEngine`
- `validateScript`
- `useVNova`
- `VNovaStage`
- `VNovaTitleScreen`
- `VNovaHud`
- `VNovaSettingsModal`
- `VNovaBacklogModal`
- `createQuestEngine`
- `QS`
- `vnovaModule`

## Runtime Architecture
1. Script array is loaded and label index is built.
2. Engine initializes Vuex state (`vnova` module).
3. `_applyStep` processes each script step.
4. Renderable steps (`say`, `narrate`, `choice`, `wait`) update current state.
5. Control steps (`label`, `jump`, `call`, `bgm`, `sfx`, `scene`, `show`, `hide`) mutate state and move cursor.
6. UI layer (`VNovaStage` or custom UI via `useVNova`) reacts to store/computed values.

## Script DSL (Supported step types)
- `label`
- `scene`
- `show`
- `hide`
- `say`
- `narrate`
- `choice`
- `jump`
- `bgm`
- `sfx`
- `wait`
- `call`

Validation rules are implemented in `src/core/validator.js`.

## Quest Engine
- Core module: `src/core/quests.js`
- Status enum: `QS` (`inactive`, `active`, `completed`, `failed`)
- Quest shape supports:
  - `id`, `title`, `description`, `category`, `initialStatus`
  - `doneIf(context)`, `failIf(context)`
  - `reward(context)`, `penalty(context)`
- Integrated into `createEngine(..., { quests })` and evaluated after tracked moves.
- Runtime quest state is stored in `state.quests`.
- Quest helpers exposed via engine/composable/stage:
  - `listQuests`, `getQuest`, `setQuestStatus`, `evaluateQuests`
- Context contract for predicates/hooks:
  - `context.flags` and `context.vars` alias `state.vars`
  - direct variable access also works (`context.charisma`)

## UI Integration Pattern
- `VNovaStage` handles:
  - background rendering
  - sprite stage
  - dialogue panel + nameplate
  - choice buttons
  - end state
  - overlay slot for HUD
- `useVNova` adds:
  - typewriter effect
  - keyboard interaction (Space/Enter/ArrowRight)
  - optional localStorage save/load
  - computed helpers for templates
- Additional reusable UI components now live in `src/components/` to keep consumer apps thin.

## Build/Run Commands
From `package.json`:
- `npm run dev` -> starts Vite with `vite.config.js` (root set to `docs-example`)
- `npm run build:lib` -> expects `vite.lib.config.js`

## Important Findings / Risks
1. `npm run build:lib` is currently broken because `vite.lib.config.js` is missing.
2. Package export `./style.css` points to `src/style.css`, but that file is missing.
3. `vite-plugin/index.js` uses `__filename` in ESM context; this may fail when resolving `vnova-engine/vite-plugin` (no `__filename` defined in ESM).
4. `useVNova` save restore path has an unused `savedSpeed` variable and replay logic may not fully restore non-var runtime state.

## Conventions Observed
- Codebase language: JS + Vue SFC (`script setup`).
- Engine design: flat script array + label jumps.
- Vuex is treated as first-class for engine state.
- Validator throws on structural errors, returns warnings for soft issues.
- `docs-example/src/App.vue` should stay lightweight and delegate heavy UI blocks to core components.

## Recommended Next Tasks
1. Add `vite.lib.config.js` for proper library build and publish flow.
2. Add `src/style.css` or remove the export.
3. Fix ESM plugin path resolution (`__filename` issue).
4. Add tests for engine transitions, jump behavior, choice branching, and save/load replay.
5. Define versioning/release checklist for npm package publication.
