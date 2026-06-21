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
- stop
- effect
- say
- think
- narrate
- choice
- input
- select
- modal
- jump
- bgm
- sfx
- video
- particles
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

### Otros steps útiles

#### stop — Detener media

```js
{ type: 'stop', bgm: true }           // Detener música
{ type: 'stop', video: true }         // Detener video
{ type: 'stop', particles: true }     // Detener partículas
```

#### hide — Ocultar capas visuales

```js
{ type: 'hide', character: 'hana' }   // Ocultar personaje específico
{ type: 'hide', character: true }     // Ocultar todos los personajes
{ type: 'hide', image: true }         // Ocultar capa de imagen
{ type: 'hide', video: true }         // Ocultar video
{ type: 'hide', particles: true }     // Ocultar partículas
{ type: 'hide', image: true, transition: 'fade' }  // Con transición
```

#### input — Capturar texto

```js
{
  type: 'input',
  store: 'player.name',
  prompt: '¿Cómo te llamas?',
  placeholder: 'Tu nombre',
  default: 'Jugador',
}
```

#### select — Selección de opciones

```js
{
  type: 'select',
  store: 'player.difficulty',
  prompt: 'Selecciona dificultad:',
  options: [
    { label: 'Fácil', value: 'easy' },
    { label: 'Normal', value: 'normal' },
    { label: 'Difícil', value: 'hard' },
  ],
}
```

#### particles — Efectos de partículas

```js
{ type: 'particles', id: 'stars' }
{ type: 'particles', id: 'snow', config: { /* custom config */ } }
{ type: 'hide', particles: true }     // Detener partículas
```

---

## Efectos visuales (animejs)

vnova incluye un sistema de efectos visuales basado en animejs. Los efectos se disparan con el step `effect`.

### Transiciones de background e imagen

Las transiciones de background e imagen también usan animejs internamente:

```js
{ type: 'scene', id: 'intro', transition: 'fade' }
{ type: 'image', id: 'overlay', transition: 'dissolve' }
```

Transiciones disponibles:
- `cut` — Cambio instantáneo
- `fade` — Fade con easing
- `dissolve` — Fade linear
- `slide-left` — Slide desde la derecha
- `slide-right` — Slide desde la izquierda

### Animaciones de sprites

Los sprites se animan automáticamente con animejs:
- **Enter**: Fade in + slide up al mostrar un personaje
- **Leave**: Fade out + slide down al ocultar un personaje
- **Dim**: Los sprites que no están hablando se oscurecen automáticamente

### API de efectos

```js
{
  type: 'effect',
  name: 'shake',              // nombre del efecto
  target: 'stage',            // elemento a animar (default: 'stage')
  duration: 500,              // duración en ms (default: 500)
  wait: true,                 // bloquea avance si es true
  config: { ... }             // parámetros específicos del efecto
}
```

### Targets disponibles

| Target | Descripción |
|--------|-------------|
| `'stage'` | Todo el contenedor del stage |
| `'bg'` | Capa de background activa |
| `'image'` | Capa de imagen activa |
| `'<character-id>'` | Sprite específico (ej: `'hana'`) |

### Efectos disponibles

#### shake — Vibración

```js
{ type: 'effect', name: 'shake', duration: 600, config: { intensity: 10, direction: 'horizontal' }, wait: true }
```

Parámetros de `config`:
- `intensity` (px, default: 8) — Amplitud de la vibración
- `direction` (`'horizontal'` | `'vertical'` | `'both'`, default: `'horizontal'`)

#### flash — Flash de color

```js
{ type: 'effect', name: 'flash', duration: 400, config: { color: 'rgba(255, 255, 255, 0.9)' }, wait: true }
```

Parámetros de `config`:
- `color` (CSS color, default: `'rgba(255, 255, 255, 0.8)'`)

#### zoom — Zoom in/out

```js
{ type: 'effect', name: 'zoom', duration: 1000, config: { scale: 1.2, zoomDirection: 'in' }, wait: true }
```

Parámetros de `config`:
- `scale` (factor, default: 1.2)
- `zoomDirection` (`'in'` | `'out'`, default: `'in'`)

#### pulse — Pulsación de opacidad

```js
{ type: 'effect', name: 'pulse', duration: 800, config: { cycles: 3, opacity: 0.4 } }
```

Parámetros de `config`:
- `cycles` (número, default: 2)
- `opacity` (mínimo, default: 0.5)

### Ejemplos de uso

```js
// Shake intenso que bloquea el avance
{ type: 'effect', name: 'shake', target: 'stage', duration: 600, config: { intensity: 10 }, wait: true }

// Shake en background (no bloquea)
{ type: 'effect', name: 'shake', target: 'bg', duration: 400, config: { intensity: 5, direction: 'vertical' } }

// Shake en sprite específico
{ type: 'effect', name: 'shake', target: 'kenji', duration: 300, config: { intensity: 4 } }

// Flash blanco rápido
{ type: 'effect', name: 'flash', duration: 400, config: { color: 'rgba(255,255,255,0.9)' }, wait: true }

// Zoom in suave
{ type: 'effect', name: 'zoom', duration: 1000, config: { scale: 1.1, zoomDirection: 'in' }, wait: true }

// Pulse con 3 ciclos
{ type: 'effect', name: 'pulse', duration: 800, config: { cycles: 3, opacity: 0.4 } }
```

### Callback custom onEffect

Puedes implementar efectos custom pasando `onEffect` en la configuración:

```js
const config = {
  onEffect: ({ name, target, duration, config }) => {
    // Tu implementación custom
    console.log(`Effect: ${name} on ${target}`)
  },
}
```

---

## Audio y video

Comportamiento por defecto con VNovaRuntime:

- bgm y sfx se reproducen con el player interno (useVNovaAudio integrado).
- video, notify y effect se enrutan por callbacks de runtime.

Override opcional:

```js
const config = {
  onAudio: (event) => {
    // Reemplaza el player interno
  },
  onVideo: (event) => {},
  onNotify: (event) => {},
  onEffect: (event) => {
    // Reemplaza la implementación interna de efectos
    // event: { name, target, duration, config }
  },
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
- useUserStorage
- useEngine
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
- userStorage, storage
- stageArray, speakerName, speakerColor
- displayedText, textComplete
- bgLayers, bgLayerStyle, registerBgElement
- imageLayers, imageLayerStyle, registerImageElement
- registerSpriteElement, registerEffectTarget
- interact, choose, back, jump, restart, start, exitMenu
- save, load, clearSave
- getVar, setVar, getSetting, setSetting
- listQuests, getQuest, evaluateQuests, setQuestStatus
- skipTypewriter, resumeTypewriter
- engine

---

## useUserStorage

Helper para leer y modificar las variables de autor guardadas en `state.vars`.
Acepta claves simples o paths con puntos:

```js
const { storage } = useVNova(script)

storage.set('player.name', 'Ada')
storage.inc('stats.courage')
storage.toggle('flags.metGuide')

const playerName = storage.ref('player.name', '')
```

Tambien puede importarse directo:

```js
import { useUserStorage } from 'vnova-engine'

const storage = useUserStorage()
```

Helper equivalente para control de motor en callbacks:

```js
import { useEngine } from 'vnova-engine'

const engine = useEngine()
engine.run('label-id')
engine.setVar('tone', 'hopeful')
```

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

---

## Soporte

Si este proyecto te resulta útil, puedes apoyar su desarrollo invitándome a un café:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/jsnoriegam)

## Licencia

Este proyecto está bajo la Licencia Apache 2.0. Para más información, consulta el archivo [LICENSE](LICENSE).
