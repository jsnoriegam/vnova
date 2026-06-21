# Getting Started

## Installation

```bash
yarn add vnova-engine
```

## Vite Configuration

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

## Quick Start (No-Code)

This workflow is designed for authors — no custom logic required.

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

**Important notes:**
- VNovaRuntime includes an audio player by default
- If you don't pass hooks, bgm/sfx work with the internal player
- Authors only need to edit story/config files for a functional VN

## Suggested Project Structure

```
src/
  story/
    script.js        # Your visual novel script
    assets.js        # Asset registry (scenes, music, images, etc.)
    characters.js    # Character definitions
    config.js        # Runtime configuration
```

## Next Steps

- [No-Code Workflow](/guide/no-code) — Learn the recommended authoring workflow
- [Script DSL](/guide/script-dsl) — Explore all available script step types
- [Visual Effects](/guide/visual-effects) — Add animations and effects to your VN
- [Live Demo](https://jsnoriegam.github.io/vnova/demo/) — See vnova-engine in action
