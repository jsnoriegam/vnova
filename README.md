<div align="center">

# vnova-engine

### Crea novelas visuales en Vue 3 sin pelearte con el motor

**Script-first · Vite-native · No-Code First**

Escribe tu historia como una lista de pasos y deja que vnova haga el resto:
diálogo con efecto máquina de escribir, sprites, música, elecciones, guardado,
backlog, ajustes, temas e i18n. Todo, listo para usar.

[![npm version](https://img.shields.io/npm/v/vnova-engine.svg?style=flat-square)](https://www.npmjs.com/package/vnova-engine)
[![license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](./LICENSE)
[![demo](https://img.shields.io/badge/demo-en%20vivo-brightgreen.svg?style=flat-square)](https://jsnoriegam.github.io/vnova/demo/)

**[▶ Probar la demo](https://jsnoriegam.github.io/vnova/demo/)** ·
**[📚 Documentación](https://jsnoriegam.github.io/vnova/)** ·
**[📦 npm](https://www.npmjs.com/package/vnova-engine)**

Si vnova te resulta útil, invítame a un café — ayuda a que el proyecto siga creciendo:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/jsnoriegam)

</div>

---

## ¿Por qué vnova?

- **No-Code First de verdad.** Una persona sin programar puede publicar una novela
  funcional editando solo `script.js`, `assets.js`, `characters.js` y `config.js`.
  La lógica custom es la excepción, no el requisito.
- **Tu historia es script-first.** Una lista plana de pasos (`say`, `choice`, `scene`,
  `bgm`…) fácil de leer, versionar, revisar y traducir.
- **Batería incluida.** Menús, HUD, guardado con slots + import/export, backlog,
  ajustes, créditos, temas, multi-idioma, preloader y efectos visuales, de serie.
- **Vue 3 + Pinia + Vite.** Sin capas raras: encaja en el stack que ya usas.
- **Extensible cuando lo necesites.** Hooks, componentes, temas y efectos custom
  sin tocar el motor.

¿Sin instalar nada? Mira la **[demo en vivo](https://jsnoriegam.github.io/vnova/demo/)**.

---

## Qué incluye

- **Motor de script** con labels, saltos, branching, variables y quests.
- **Componentes listos**: `VNovaRuntime`, `VNovaStage`, `VNovaTitleScreen`,
  `VNovaLoadingScreen`, `VNovaHud`, `VNovaTopHud`, `VNovaSettingsModal`,
  `VNovaSaveModal`, `VNovaBacklogModal`, `VNovaCreditsScreen`, `VNovaBaseModal`.
- **Composables**: `useVNovaEngine`, `useUserStorage`, `useEngine`,
  `useQuestEngine`, `useVNovaAudio`, `useVNovaSaves`, `useTheme`.
- **Guardado firmado**: slots en `localStorage`, export/import a archivo,
  guardar/cargar a disco.
- **Temas**: 5 temas incluidos (`default`, `dark`, `light`, `ocean`, `forest`)
  y temas custom con variables CSS.
- **Multi-idioma**: guion por idioma y textos de UI traducibles con paquetes de
  locale tree-shakeables.
- **Preloader** con pantalla de carga y progreso.
- **Plugin de Vite** que valida tus scripts al construir.
- **Tipos TypeScript** completos en `src/vnova.d.ts`.

---

## Instalación

```bash
yarn add vnova-engine
```

## Configuración de Vite

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

## Quick Start (recomendado)

Flujo pensado para autores: sin escribir lógica custom.

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
  <!-- El orden de los componentes importa: se renderizan en orden de declaración. -->
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

Notas:
- `VNovaRuntime` ya incluye reproductor de audio por defecto.
- Si no pasas hooks, `bgm`/`sfx` funcionan con el player interno.
- Para una VN funcional, el autor solo edita los archivos de `story/` y `config`.

---

## Estructura sugerida de `story`

```text
src/story/
  script.js
  assets.js
  characters.js
  config.js
```

### `assets.js` (declarativo)

```js
export default {
  scenes: { intro: '/assets/scenes/intro.jpg' },
  music:  { main: '/assets/music/main.ogg' },
  sounds: { click: '/assets/sfx/click.ogg' },
  images: { overlay: '/assets/images/overlay.png' },
  videos: { loop: '/assets/video/loop.mp4' },
}
```

### `characters.js` (declarativo)

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

### `config.js` (declarativo)

```js
import esLocale from 'vnova-engine/i18n/es.js'

export default {
  title: 'Mi Novela',
  subtitle: 'Una historia interactiva',
  saveKey: 'mi-novela-v1',
  slotCount: 8,
  startLabel: 'start',
  defaultLanguage: 'es',
  preload: true,                       // precarga assets y muestra la pantalla de carga
  guiTranslations: { es: esLocale },   // textos de UI por idioma
  stage: {
    typewriterEnabled: true,
    sessionKey: 'mi-novela-session',   // reanuda la sesión al recargar
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

## DSL soportado (script steps)

Tipos de paso soportados:

`label` · `scene` · `image` · `show` · `hide` · `stop` · `effect` · `say` ·
`think` · `narrate` · `choice` · `input` · `select` · `modal` · `jump` · `bgm` ·
`sfx` · `video` · `particles` · `notify` · `wait` · `call` · `end`

Mini ejemplo:

```js
export default [
  { type: 'label', id: 'start' },
  { type: 'scene', id: 'intro', transition: 'fade' },
  { type: 'bgm', id: 'main', volume: 0.6, loop: true },
  { type: 'say', character: 'hana', text: 'Comenzamos.' },
  {
    type: 'choice',
    prompt: '¿Qué hacemos?',
    options: [
      { label: 'Seguir', jump: 'route-a', set: { mood: 'calm' } },
      { label: 'Salir', jump: 'end' },
    ],
  },
  { type: 'label', id: 'route-a' },
  { type: 'narrate', text: 'La historia continúa.' },
  { type: 'end' },
]
```

La **interpolación** funciona en los textos: `'Hola {{ player.name }}'`.

### Otros steps útiles

#### `stop` — Detener media

```js
{ type: 'stop', bgm: true }           // Detener música
{ type: 'stop', video: true }         // Detener video
{ type: 'stop', particles: true }     // Detener partículas
```

#### `hide` — Ocultar capas visuales

```js
{ type: 'hide', character: 'hana' }   // Ocultar personaje específico
{ type: 'hide', character: true }     // Ocultar todos los personajes
{ type: 'hide', image: true }         // Ocultar capa de imagen
{ type: 'hide', video: true }         // Ocultar video
{ type: 'hide', particles: true }     // Ocultar partículas
{ type: 'hide', image: true, transition: 'fade' }
```

#### `input` — Capturar texto

```js
{
  type: 'input',
  store: 'player.name',
  prompt: '¿Cómo te llamas?',
  placeholder: 'Tu nombre',
  default: 'Jugador',
}
```

#### `select` — Selección de opciones

```js
{
  type: 'select',
  store: 'player.difficulty',
  prompt: 'Selecciona dificultad:',
  options: [
    { label: 'Fácil',  value: 'easy' },
    { label: 'Normal', value: 'normal' },
    { label: 'Difícil', value: 'hard' },
  ],
}
```

#### `particles` — Efectos de partículas

```js
{ type: 'particles', id: 'stars' }
{ type: 'particles', id: 'snow', config: { /* config custom */ } }
{ type: 'hide', particles: true }
```

---

## Efectos visuales (animejs)

Los efectos se disparan con el step `effect` y usan animejs internamente.

### Transiciones de background e imagen

```js
{ type: 'scene', id: 'intro', transition: 'fade' }
{ type: 'image', id: 'overlay', transition: 'dissolve' }
```

Transiciones disponibles: `cut`, `fade`, `dissolve`, `slide-left`, `slide-right`.

### Animaciones de sprites

- **Enter**: fade in + slide up al mostrar un personaje.
- **Leave**: fade out + slide down al ocultar un personaje.
- **Dim**: los sprites que no hablan se atenúan automáticamente.
- **Stack**: varios sprites en la misma posición se reparten en abanico
  (ajustable con la variable CSS `--vnova-stack-offset`).

### API de efectos

```js
{
  type: 'effect',
  name: 'shake',     // nombre del efecto
  target: 'stage',   // elemento a animar (default: 'stage')
  duration: 500,     // duración en ms (default: 500)
  wait: true,        // bloquea el avance hasta terminar si es true
  config: { ... },   // parámetros específicos del efecto
}
```

**Targets**: `'stage'` (contenedor), `'bg'` (fondo), `'image'` (capa de imagen),
`'<character-id>'` (sprite concreto, p. ej. `'hana'`).

#### `shake` — Vibración

```js
{ type: 'effect', name: 'shake', duration: 600, config: { intensity: 10, direction: 'horizontal' }, wait: true }
```

- `intensity` (px, default 8) · `direction` (`'horizontal'` | `'vertical'` | `'both'`)

#### `flash` — Flash de color

```js
{ type: 'effect', name: 'flash', duration: 400, config: { color: 'rgba(255,255,255,0.9)' }, wait: true }
```

- `color` (CSS color, default `'rgba(255, 255, 255, 0.8)'`)

#### `zoom` — Zoom in/out

```js
{ type: 'effect', name: 'zoom', duration: 1000, config: { scale: 1.2, direction: 'in' }, wait: true }
```

- `scale` (default 1.2) · `direction` (`'in'` | `'out'`)

#### `pulse` — Pulsación de opacidad

```js
{ type: 'effect', name: 'pulse', duration: 800, config: { cycles: 3, opacity: 0.4 } }
```

- `cycles` (default 2) · `opacity` (mínimo, default 0.5)

### Callback custom `onEffect`

```js
const config = {
  onEffect: ({ name, target, duration, config }) => {
    console.log(`Effect: ${name} on ${target}`)
  },
}
```

---

## Audio y video

Comportamiento por defecto con `VNovaRuntime`:

- `bgm` y `sfx` se reproducen con el player interno (`useVNovaAudio` integrado).
- `video`, `notify` y `effect` se enrutan por callbacks del runtime.

Override opcional:

```js
const config = {
  onAudio:  (event) => { /* reemplaza el player interno */ },
  onVideo:  (event) => {},
  onNotify: (event) => {},
  onEffect: (event) => {},
  audioPlayer: false, // desactiva el player interno si usas onAudio
}
```

---

## Multi-idioma (i18n)

Pasa el guion como un objeto por idioma y traduce la UI con paquetes de locale:

```js
import esLocale from 'vnova-engine/i18n/es.js'

const config = {
  defaultLanguage: 'es',
  guiTranslations: { es: esLocale },
}
```

```vue
<VNovaRuntime :script="{ en: scriptEn, es: scriptEs }" :config="config">
  ...
</VNovaRuntime>
```

El usuario puede cambiar de idioma desde Ajustes. `validateMultiLanguageScript`
comprueba que todas las traducciones tengan la misma estructura.

---

## Temas

5 temas incluidos: `default`, `dark`, `light`, `ocean`, `forest`. Aplica uno y
añade los tuyos con variables CSS:

```js
import { useTheme } from 'vnova-engine'

const theme = useTheme()
theme.applyTheme('dark')
theme.registerCustomThemes([
  { id: 'cyberpunk', name: 'Cyberpunk', variables: { '--vnova-color-primary': '#ff00ff' } },
])
```

---

## APIs públicas

Exportado desde `src/index.js`:

- **Core**: `createEngine`, `expandNestedLabels`, `createVNovaApp`, `useVNovaStore`,
  `createQuestEngine`, `QS`, `PARTICLE_PRESETS`
- **Validación**: `validateScript`, `validateMultiLanguageScript`
- **Composables**: `useVNovaEngine`, `useUserStorage`, `useEngine`,
  `useQuestEngine`, `useVNovaAudio`, `useVNovaSaves`, `useTheme`
- **Temas**: `registerTheme`, `getTheme`, `getAllThemes`, `hasTheme`,
  `unregisterTheme`, `registerThemes`, `builtInThemes`, `defaultTheme`,
  `darkTheme`, `lightTheme`, `oceanTheme`, `forestTheme`
- **Runtime UI**: `registerRuntimeModal`, `registerRuntimeModals`
- **Componentes**: `VNovaRuntime`, `VNOVA_RUNTIME_CONTEXT_KEY`, `VNovaStage`,
  `VNovaTitleScreen`, `VNovaLoadingScreen`, `VNovaCreditsScreen`, `VNovaHud`,
  `VNovaTopHud`, `VNovaSettingsModal`, `VNovaBacklogModal`, `VNovaSaveModal`,
  `VNovaBaseModal`

---

## `useVNovaEngine` (modo integrador)

Para UIs custom, `useVNovaEngine` expone estado y acciones del motor.

Retorno principal:

- `state`, `store`
- `storage` (variables de autor)
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

Lee y modifica las variables de autor guardadas en `state.vars`. Acepta claves
simples o paths con puntos:

```js
import { useUserStorage } from 'vnova-engine'

const storage = useUserStorage()
storage.set('player.name', 'Ada')
storage.inc('stats.courage')
storage.toggle('flags.metGuide')

const playerName = storage.ref('player.name', '')
```

Helper equivalente para controlar el motor desde callbacks:

```js
import { useEngine } from 'vnova-engine'

const engine = useEngine()
engine.jump('label-id')
engine.setVar('tone', 'hopeful')
engine.next()            // avanzar
```

---

## Slots de `VNovaStage`

- **overlay**: `can-back`, `has-save`, `history`, `back`, `save`, `load`,
  `open-save`, `open-load`, `close-save`, `restart`, `exit-menu`
- **sprite**: `char`, `pos`
- **end**

---

## Validación de script

```js
import { validateScript } from 'vnova-engine'

const warnings = validateScript(script, characters)
```

- Lanza `Error` en errores estructurales críticos.
- Devuelve un arreglo de warnings para problemas no bloqueantes.

---

## Comandos de este repo

```bash
yarn dev          # servidor de desarrollo (root: docs-example/)
yarn build:lib    # genera dist/vnova.es.js y dist/vnova.umd.js
yarn build:demo   # construye la demo
yarn docs:dev     # documentación con VitePress
```

- `dev` usa `docs-example/` como root de Vite.
- `build:lib` genera los bundles ES y UMD.

---

## Documentación y soporte

- **Demo en vivo**: https://jsnoriegam.github.io/vnova/demo/
- **Documentación**: https://jsnoriegam.github.io/vnova/
- **Guía No-Code First**: `docs/guide/no-code.md`
- **Issues**: https://github.com/jsnoriegam/vnova/issues

Si el proyecto te resulta útil, puedes apoyarlo invitándome a un café:
**[buymeacoffee.com/jsnoriegam](https://buymeacoffee.com/jsnoriegam)** ☕

## Licencia

Este proyecto está bajo la Licencia Apache 2.0. Para más información, consulta el
archivo [LICENSE](LICENSE).
