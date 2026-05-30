# vnova-engine

Framework de novela visual para Vue 3, script-first y Vite-native.

## Regla de Producto: No-Code First

El objetivo de vnova es que una persona con conocimientos minimos o nulos de programacion pueda publicar una novela funcional editando solo configuracion y contenido.

- Ruta principal: editar story/script.js, story/assets.js, story/characters.js y config.
- Ruta avanzada: agregar hooks o componentes custom solo cuando realmente se necesite.

Guia completa: docs/no-code-first.md

---

## Que incluye hoy

- Motor de script con labels, branching, variables y quests.
- Componentes listos para usar: VNovaRuntime, VNovaStage, VNovaTitleScreen, VNovaHud, VNovaSettingsModal, VNovaSaveModal, VNovaBacklogModal.
- Composables: useVNova, useVNovaAudio, useVNovaSaves.
- Plugin de Vite para validacion de scripts en build.
- Tipos TypeScript completos en src/vnova.d.ts.

---

## Instalacion

```bash
yarn add vnova-engine
```

## Configuracion de Vite

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

## Quick Start No-Code (recomendado)

Este flujo esta pensado para autores: sin escribir logica custom.

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

Notas importantes:
- VNovaRuntime ya incluye reproductor de audio por defecto.
- Si no pasas hooks, bgm/sfx funcionan con el player interno.
- El autor solo necesita editar archivos de story/config para una VN funcional.

---

## Estructura sugerida de story

```text
src/story/
  script.js
  assets.js
  characters.js
  config.js
```

### assets.js (declarativo)

```js
export default {
  scenes: {
    intro: '/assets/scenes/intro.jpg',
  },
  music: {
    main: '/assets/music/main.ogg',
  },
  sounds: {
    click: '/assets/sfx/click.ogg',
  },
  images: {
    overlay: '/assets/images/overlay.png',
  },
  videos: {
    loop: '/assets/video/loop.mp4',
  },
}
```

### characters.js (declarativo)

```js
export default {
  hana: {
    name: 'Hana',
    color: '#e879b0',
    avatar: 'H',
    defaultSprite: '/assets/chars/hana/default.png',
    sprites: {
      neutral: '/assets/chars/hana/neutral.png',
      happy: '/assets/chars/hana/happy.png',
    },
  },
}
```

---

## DSL soportado (script steps)

Tipos de paso soportados actualmente:

- label
- scene
- image
- show
- hide
- say
- think
- narrate
- choice
- jump
- bgm
- sfx
- video
- notify
- wait
- call
- end

Mini ejemplo:

```js
export default [
  { type: 'label', id: 'start' },
  { type: 'scene', id: 'intro', transition: 'fade' },
  { type: 'bgm', id: 'main', volume: 0.6, loop: true },
  { type: 'say', character: 'hana', text: 'Comenzamos.' },
  {
    type: 'choice',
    prompt: 'Que hacemos?',
    options: [
      { label: 'Seguir', jump: 'route-a', set: { mood: 'calm' } },
      { label: 'Salir', jump: 'end' },
    ],
  },
  { type: 'label', id: 'route-a' },
  { type: 'narrate', text: 'La historia continua.' },
  { type: 'end' },
]
```

---

## Audio y video

Comportamiento por defecto con VNovaRuntime:

- bgm y sfx se reproducen con el player interno (useVNovaAudio integrado).
- video y notify se enrutan por callbacks de runtime.

Override opcional:

```js
const config = {
  onAudio: (event) => {
    // Reemplaza el player interno
  },
  onVideo: (event) => {},
  onNotify: (event) => {},
  audioPlayer: false, // opcional: desactiva player interno si no usas onAudio
}
```

---

## APIs publicas

Exportado desde src/index.js:

- createEngine
- expandNestedLabels
- createVNovaApp
- useVNovaStore
- createQuestEngine
- QS
- validateScript
- useVNova
- useVNovaAudio
- useVNovaSaves
- VNovaRuntime
- VNovaStage
- VNovaTitleScreen
- VNovaHud
- VNovaSettingsModal
- VNovaSaveModal
- VNovaBacklogModal

---

## useVNova (modo integrador)

Para UIs custom, useVNova expone estado y acciones del motor.

Retorno principal:

- state, store
- stageArray, speakerName, speakerColor
- displayedText, textComplete
- bgLayers, bgLayerStyle, imageTransitioning, imageStyle
- interact, choose, back, jump, restart, start, exitMenu
- save, load, clearSave
- getVar, setVar, getSetting, setSetting
- listQuests, getQuest, evaluateQuests, setQuestStatus
- skipTypewriter, resumeTypewriter
- engine

---

## VNovaStage slots

Slots disponibles:

- overlay: can-back, has-save, history, back, save, load, open-save, open-load, close-save, restart, exit-menu
- sprite: char, pos
- end

---

## Validacion de script

```js
import { validateScript } from 'vnova-engine'

const warnings = validateScript(script, characters)
```

- Lanza Error en errores estructurales criticos.
- Devuelve arreglo de warnings para problemas no bloqueantes.

---

## Comandos de este repo

```bash
yarn dev
yarn build:lib
```

- dev usa docs-example como root de Vite.
- build:lib genera dist/vnova.es.js y dist/vnova.umd.js.
