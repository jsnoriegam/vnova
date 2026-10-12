<div align="center">

**English** · [Español](./README.es.md)

# vnova-engine

### Build visual novels in Vue 3 without fighting the engine

**Script-first · Vite-native · No-Code-First**

Write your story as a list of steps and let vnova handle the rest:
typewriter dialogue, sprites, music, choices, saves, backlog, settings, themes
and i18n. All of it, ready to use.

[![npm version](https://img.shields.io/npm/v/vnova-engine.svg?style=flat-square)](https://www.npmjs.com/package/vnova-engine)
[![license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](./LICENSE)
[![demo](https://img.shields.io/badge/demo-live-brightgreen.svg?style=flat-square)](https://jsnoriegam.github.io/vnova/demo/)

**[▶ Try the live demo](https://jsnoriegam.github.io/vnova/demo/)** ·
**[📚 Documentation](https://jsnoriegam.github.io/vnova/)** ·
**[📦 npm](https://www.npmjs.com/package/vnova-engine)**

If vnova is useful to you, buy me a coffee — it helps the project keep growing:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/jsnoriegam)

</div>

---

## Why vnova?

- **No-Code-First, for real.** Someone with no programming background can ship a
  working novel by editing only `script.js`, `assets.js`, `characters.js` and
  `config.js`. Custom logic is the exception, not the requirement.
- **Script-first.** Your story is a flat list of steps (`say`, `choice`, `scene`,
  `bgm`…) that is easy to read, version, review and translate.
- **Batteries included.** Menus, HUD, save slots + import/export, backlog,
  settings, credits, themes, multi-language, preloader and visual effects, out of
  the box.
- **Vue 3 + Pinia + Vite.** No weird layers: it fits the stack you already use.
- **Extensible when you need it.** Hooks, components, themes and custom effects
  without touching the engine.

Don't feel like installing anything? Check out the
**[live demo](https://jsnoriegam.github.io/vnova/demo/)**.

---

## What's included

- **Script engine** with labels, jumps, branching, variables and quests.
- **Ready-made components**: `VNovaRuntime`, `VNovaStage`, `VNovaTitleScreen`,
  `VNovaLoadingScreen`, `VNovaHud`, `VNovaTopHud`, `VNovaSettingsModal`,
  `VNovaSaveModal`, `VNovaBacklogModal`, `VNovaCreditsScreen`, `VNovaBaseModal`.
- **Composables**: `useVNovaEngine`, `useUserStorage`, `useEngine`,
  `useQuestEngine`, `useVNovaAudio`, `useVNovaSaves`, `useTheme`.
- **Signed saves**: `localStorage` slots, file export/import, save/load to disk.
- **Themes**: 5 built-in themes (`default`, `dark`, `light`, `ocean`, `forest`)
  plus custom themes via CSS variables.
- **Multi-language**: per-language scripts and translatable UI strings with
  tree-shakeable locale packs.
- **Preloader** with a loading screen and progress.
- **Vite plugin** that validates your scripts at build time.
- **Complete TypeScript types** in `src/vnova.d.ts`.

---

## Installation

```bash
yarn add vnova-engine
```

## Vite configuration

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vnovaPlugin from 'vnova-engine/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    vnovaPlugin({
      validateOnBuild: true,
      warnOnly: false,
    }),
  ],
})
```

---

## Quick Start (recommended)

A workflow designed for authors: no custom logic required.

```vue
<script setup>
import {
  VNovaRuntime,
  VNovaTitleScreen,
  VNovaStage,
  VNovaHud,
  VNovaBacklogModal,
  VNovaSettingsModal,
  VNovaSaveModal,
} from 'vnova-engine'

import script from './story/script.js'
import assets from './story/assets.js'
import characters from './story/characters.js'
import config from './story/config.js'
</script>

<template>
  <!-- The order of these components matters: they render in declaration order. -->
  <VNovaRuntime :script="script" :assets="assets" :characters="characters" :config="config">
    <VNovaTitleScreen />
    <VNovaStage />
    <VNovaHud />
    <VNovaBacklogModal />
    <VNovaSettingsModal />
    <VNovaSaveModal />
  </VNovaRuntime>
</template>
```

Notes:
- `VNovaRuntime` ships a built-in audio player by default.
- If you don't pass hooks, `bgm`/`sfx` work with the internal player.
- For a working VN, the author only edits the `story/` files and `config`.

---

## Suggested `story` structure

```text
src/story/
  script.js
  assets.js
  characters.js
  config.js
```

### `assets.js` (declarative)

```js
export default {
  scenes: { intro: '/assets/scenes/intro.jpg' },
  music:  { main: '/assets/music/main.ogg' },
  sounds: { click: '/assets/sfx/click.ogg' },
  images: { overlay: '/assets/images/overlay.png' },
  videos: { loop: '/assets/video/loop.mp4' },
}
```

### `characters.js` (declarative)

```js
export default {
  hana: {
    name: 'Hana',
    color: '#e879b0',
    avatar: 'H',
    defaultSprite: '/assets/chars/hana/default.png',
    sprites: {
      neutral: '/assets/chars/hana/neutral.png',
      happy:   '/assets/chars/hana/happy.png',
    },
  },
}
```

### `config.js` (declarative)

```js
import esLocale from 'vnova-engine/i18n/es.js'

export default {
  title: 'My Novel',
  subtitle: 'An interactive story',
  saveKey: 'my-novel-v1',
  slotCount: 8,
  startLabel: 'start',
  defaultLanguage: 'en',
  preload: true,                       // preload assets and show the loading screen
  guiTranslations: { es: esLocale },   // UI strings per language
  stage: {
    typewriterEnabled: true,
    sessionKey: 'my-novel-session',    // resume the session on reload
  },
  themes: [
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      variables: { '--vnova-color-primary': '#ff00ff' },
    },
  ],
}
```

---

## Supported DSL (script steps)

Supported step types:

`label` · `scene` · `image` · `show` · `hide` · `stop` · `effect` · `say` ·
`think` · `narrate` · `choice` · `input` · `select` · `modal` · `jump` · `bgm` ·
`sfx` · `video` · `particles` · `notify` · `wait` · `call` · `end`

Mini example:

```js
export default [
  { type: 'label', id: 'start' },
  { type: 'scene', id: 'intro', transition: 'fade' },
  { type: 'bgm', id: 'main', volume: 0.6, loop: true },
  { type: 'say', character: 'hana', text: 'Here we go.' },
  {
    type: 'choice',
    prompt: 'What do we do?',
    options: [
      { label: 'Continue', jump: 'route-a', set: { mood: 'calm' } },
      { label: 'Leave', jump: 'end' },
    ],
  },
  { type: 'label', id: 'route-a' },
  { type: 'narrate', text: 'The story goes on.' },
  { type: 'end' },
]
```

**Interpolation** works inside text: `'Hello {{ player.name }}'`.

### Other useful steps

#### `stop` — Stop media

```js
{ type: 'stop', bgm: true }           // Stop music
{ type: 'stop', video: true }         // Stop video
{ type: 'stop', particles: true }     // Stop particles
```

#### `hide` — Hide visual layers

```js
{ type: 'hide', character: 'hana' }   // Hide a specific character
{ type: 'hide', character: true }     // Hide all characters
{ type: 'hide', image: true }         // Hide the image layer
{ type: 'hide', video: true }         // Hide video
{ type: 'hide', particles: true }     // Hide particles
{ type: 'hide', image: true, transition: 'fade' }
```

#### `input` — Capture text

```js
{
  type: 'input',
  store: 'player.name',
  prompt: 'What is your name?',
  placeholder: 'Your name',
  default: 'Player',
}
```

#### `select` — Pick an option

```js
{
  type: 'select',
  store: 'player.difficulty',
  prompt: 'Choose a difficulty:',
  options: [
    { label: 'Easy',   value: 'easy' },
    { label: 'Normal', value: 'normal' },
    { label: 'Hard',   value: 'hard' },
  ],
}
```

#### `particles` — Particle effects

```js
{ type: 'particles', id: 'stars' }
{ type: 'particles', id: 'snow', config: { /* custom config */ } }
{ type: 'hide', particles: true }
```

---

## Visual effects (animejs)

Effects are triggered with the `effect` step and use animejs internally.

### Background and image transitions

```js
{ type: 'scene', id: 'intro', transition: 'fade' }
{ type: 'image', id: 'overlay', transition: 'dissolve' }
```

Available transitions: `cut`, `fade`, `dissolve`, `slide-left`, `slide-right`.

### Sprite animations

- **Enter**: fade in + slide up when a character appears.
- **Leave**: fade out + slide down when a character is hidden.
- **Dim**: sprites that are not speaking dim automatically.
- **Stack**: several sprites in the same position fan out
  (tunable with the `--vnova-stack-offset` CSS variable).

### Effects API

```js
{
  type: 'effect',
  name: 'shake',     // effect name
  target: 'stage',   // element to animate (default: 'stage')
  duration: 500,     // duration in ms (default: 500)
  wait: true,        // block advancing until it finishes when true
  config: { ... },   // effect-specific parameters
}
```

**Targets**: `'stage'` (container), `'bg'` (background), `'image'` (image layer),
`'<character-id>'` (a specific sprite, e.g. `'hana'`).

#### `shake` — Shake

```js
{ type: 'effect', name: 'shake', duration: 600, config: { intensity: 10, direction: 'horizontal' }, wait: true }
```

- `intensity` (px, default 8) · `direction` (`'horizontal'` | `'vertical'` | `'both'`)

#### `flash` — Color flash

```js
{ type: 'effect', name: 'flash', duration: 400, config: { color: 'rgba(255,255,255,0.9)' }, wait: true }
```

- `color` (CSS color, default `'rgba(255, 255, 255, 0.8)'`)

#### `zoom` — Zoom in/out

```js
{ type: 'effect', name: 'zoom', duration: 1000, config: { scale: 1.2, direction: 'in' }, wait: true }
```

- `scale` (default 1.2) · `direction` (`'in'` | `'out'`)

#### `pulse` — Opacity pulse

```js
{ type: 'effect', name: 'pulse', duration: 800, config: { cycles: 3, opacity: 0.4 } }
```

- `cycles` (default 2) · `opacity` (minimum, default 0.5)

### Custom `onEffect` callback

```js
const config = {
  onEffect: ({ name, target, duration, config }) => {
    console.log(`Effect: ${name} on ${target}`)
  },
}
```

---

## Audio and video

Default behavior with `VNovaRuntime`:

- `bgm` and `sfx` play through the internal player (integrated `useVNovaAudio`).
- `video`, `notify` and `effect` are routed through runtime callbacks.

Optional override:

```js
const config = {
  onAudio:  (event) => { /* replace the internal player */ },
  onVideo:  (event) => {},
  onNotify: (event) => {},
  onEffect: (event) => {},
  audioPlayer: false, // disable the internal player if you use onAudio
}
```

---

## Multi-language (i18n)

Pass the script as an object keyed by language and translate the UI with locale
packs:

```js
import esLocale from 'vnova-engine/i18n/es.js'

const config = {
  defaultLanguage: 'en',
  guiTranslations: { es: esLocale },
}
```

```vue
<VNovaRuntime :script="{ en: scriptEn, es: scriptEs }" :config="config">
  ...
</VNovaRuntime>
```

Players can switch language from Settings. `validateMultiLanguageScript` checks
that every translation has the same structure.

---

## Themes

5 built-in themes: `default`, `dark`, `light`, `ocean`, `forest`. Apply one and
add your own with CSS variables:

```js
import { useTheme } from 'vnova-engine'

const theme = useTheme()
theme.applyTheme('dark')
theme.registerCustomThemes([
  { id: 'cyberpunk', name: 'Cyberpunk', variables: { '--vnova-color-primary': '#ff00ff' } },
])
```

---

## Public APIs

Exported from `src/index.js`:

- **Core**: `createEngine`, `expandNestedLabels`, `createVNovaApp`, `useVNovaStore`,
  `createQuestEngine`, `QS`, `PARTICLE_PRESETS`
- **Validation**: `validateScript`, `validateMultiLanguageScript`
- **Composables**: `useVNovaEngine`, `useUserStorage`, `useEngine`,
  `useQuestEngine`, `useVNovaAudio`, `useVNovaSaves`, `useTheme`
- **Themes**: `registerTheme`, `getTheme`, `getAllThemes`, `hasTheme`,
  `unregisterTheme`, `registerThemes`, `builtInThemes`, `defaultTheme`,
  `darkTheme`, `lightTheme`, `oceanTheme`, `forestTheme`
- **Runtime UI**: `registerRuntimeModal`, `registerRuntimeModals`
- **Components**: `VNovaRuntime`, `VNOVA_RUNTIME_CONTEXT_KEY`, `VNovaStage`,
  `VNovaTitleScreen`, `VNovaLoadingScreen`, `VNovaCreditsScreen`, `VNovaHud`,
  `VNovaTopHud`, `VNovaSettingsModal`, `VNovaBacklogModal`, `VNovaSaveModal`,
  `VNovaBaseModal`

---

## `useVNovaEngine` (integrator mode)

For custom UIs, `useVNovaEngine` exposes engine state and actions.

Main return values:

- `state`, `store`
- `storage` (author variables)
- `stage`, `speakerName`, `speakerColor`
- `displayedText`, `textComplete`
- `bgLayers`, `bgLayerStyle`, `registerBgElement`
- `imageLayers`, `imageLayerStyle`, `registerImageElement`
- `registerSpriteElement`, `registerEffectTarget`
- `interact`, `choose`, `back`, `jump`, `restart`, `start`, `exitMenu`
- `submitInput`, `submitSelect`, `closeModal`
- `getVar`, `setVar`, `getSetting`, `setSetting`
- `skipTypewriter`, `resumeTypewriter`
- `engine`

---

## `useUserStorage`

Read and modify author variables stored in `state.vars`. Accepts simple keys or
dot-notation paths:

```js
import { useUserStorage } from 'vnova-engine'

const storage = useUserStorage()
storage.set('player.name', 'Ada')
storage.inc('stats.courage')
storage.toggle('flags.metGuide')

const playerName = storage.ref('player.name', '')
```

Equivalent helper to control the engine from callbacks:

```js
import { useEngine } from 'vnova-engine'

const engine = useEngine()
engine.jump('label-id')
engine.setVar('tone', 'hopeful')
engine.next()            // advance
```

---

## `VNovaStage` slots

- **overlay**: `can-back`, `has-save`, `history`, `back`, `save`, `load`,
  `open-save`, `open-load`, `close-save`, `restart`, `exit-menu`
- **sprite**: `char`, `pos`
- **end**

---

## Script validation

```js
import { validateScript } from 'vnova-engine'

const warnings = validateScript(script, characters)
```

- Throws `Error` on critical structural issues.
- Returns an array of warnings for non-blocking problems.

---

## Repo commands

```bash
yarn dev          # dev server (root: docs-example/)
yarn build:lib    # outputs dist/vnova.es.js and dist/vnova.umd.js
yarn build:demo   # builds the demo
yarn docs:dev     # documentation with VitePress
```

- `dev` uses `docs-example/` as the Vite root.
- `build:lib` outputs the ES and UMD bundles.

---

## Docs and support

- **Live demo**: https://jsnoriegam.github.io/vnova/demo/
- **Documentation**: https://jsnoriegam.github.io/vnova/
- **No-Code-First guide**: `docs/guide/no-code.md`
- **Issues**: https://github.com/jsnoriegam/vnova/issues

If the project is useful to you, you can support it by buying me a coffee:
**[buymeacoffee.com/jsnoriegam](https://buymeacoffee.com/jsnoriegam)** ☕

## License

This project is licensed under the Apache License 2.0. For more information, see
the [LICENSE](LICENSE) file.
