<div align="center">

[English](./README.md) · **Español**

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
- **Guardado firmado**: slots en `localStorage`, autoguardado, export/import a archivo,
  guardar/cargar a disco. Las partidas se anclan a etiquetas del guion, así que
  sobreviven a cambios anteriores al punto guardado (por ejemplo, un nuevo prólogo).
- **Modo Auto, salto de texto leído y voces**, con progreso de lectura persistente
  y un canal de voz que baja el volumen del BGM.
- **Meta-progreso y galería**: desbloquea CGs, finales, logros y capítulos entre
  partidas con un modal de galería y chapter select incluidos.
- **Sistema de inventario**: items tipados, consumibles apilables, especiales
  únicos, items multi-tipo, condiciones, efectos y modal de inventario incluido.
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
  autosave: true,                      // guarda al entrar en cada etiqueta
  autosaveDelay: 600,                  // debounce en ms
  autoDelay: 1200,                     // retardo base del modo Auto
  readKey: 'mi-novela-v1',             // espacio de progreso de lectura
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
`think` · `narrate` · `choice` · `input` · `select` · `modal` · `jump` · `set` ·
`if` · `once` · `random` · `bgm` · `sfx` · `video` · `particles` · `notify` ·
`wait` · `call` · `end`

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

### Lógica declarativa

Las ramas y los cambios de estado ya no requieren JavaScript:

```js
// Asignar, incrementar o borrar variables (rutas con puntos)
{ type: 'set', vars: { 'flags.conocioAHana': true }, inc: { 'stats.valor': 1 } }
{ type: 'set', unset: ['temporal.eleccion'] }

// Bloques condicionales
{
  type: 'if',
  condition: { var: 'stats.valor', gte: 3 },
  then: [{ type: 'say', text: 'Das un paso al frente.' }],
  else: [{ type: 'say', text: 'Dudas.' }],
}

// Salto condicional
{ type: 'jump', target: 'ruta-valiente', if: { var: 'flags.conocioAHana', eq: true } }

// Ejecutar un bloque solo la primera vez en esta partida
{ type: 'once', id: 'pista-inicial', steps: [{ type: 'notify', text: 'Consejo: pulsa Espacio' }] }

// Rama aleatoria con pesos
{
  type: 'random',
  options: [
    { weight: 3, steps: [{ type: 'say', text: 'Un día tranquilo.' }] },
    { weight: 1, steps: [{ type: 'say', text: 'Estalla una tormenta.' }] },
  ],
}
```

Las condiciones aceptan `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`,
`contains`, `matches`, `exists`, `truthy` y `falsy`, además de `all`, `any` y
`not`. Los mapas abreviados como `{ 'flags.conocioAHana': true }` se combinan
con AND. Los mismos objetos funcionan en las opciones de `choice`:

```js
{
  type: 'choice',
  options: [
    { label: 'Abrir la puerta', condition: { var: 'llaves.puerta', eq: true } },
    { label: 'Forzarla', disabled: { var: 'stats.fuerza', lt: 5 }, disabledText: 'Demasiado débil' },
  ],
}
```

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

### Voces

Registra las voces en `assets.voices` y referéncialas desde el diálogo:

```js
// story/assets.js
export default {
  voices: {
    'hana-01': '/assets/voices/hana-01.ogg',
    'kenji-01': '/assets/voices/kenji-01.ogg',
  },
}

// story/script.js
{ type: 'say', character: 'hana', text: 'Tenemos una oportunidad.', voice: 'hana-01' }
{ type: 'say', character: 'kenji', text: 'Copiado.', voice: '/assets/voices/kenji-01.ogg', voiceVolume: 0.9 }
```

- `voice` acepta una clave de `assets.voices` o una URL directa.
- El player interno corta la voz anterior, baja el BGM mientras habla y muestra un deslizador de **Volumen de Voces** en Ajustes.
- El modo Auto espera a que termine la voz antes de avanzar.
- `think` y `narrate` también aceptan `voice` y `voiceVolume`.

### Modo Auto y Saltar

- Pulsa **A** para activar/desactivar Auto, **S** para Saltar, o mantén **Ctrl** para saltar mientras esté pulsado. **Esc** detiene ambos.
- Los mismos controles aparecen como botones **Auto** y **Saltar** en `VNovaHud`.
- Auto avanza cuando terminan el typewriter (y la voz, si existe). El retardo crece con la longitud del texto y parte de `autoDelay` (por defecto `1200` ms).
- Saltar solo avanza por líneas ya leídas. Se detiene en texto nuevo, elecciones, inputs y modales.
- El progreso de lectura se guarda aparte de los slots y se comparte entre partidas. Usa `readKey` para separarlo (por defecto usa `saveKey`).
- `useVNovaReadTracker()` expone `isRead()`, `markRead()`, `reset()` y `readCount` para UIs propias.

### Meta-progreso y galería

Desbloquea extras de forma declarativa:

```js
{ type: 'unlock', cg: 'cg-01' }
{ type: 'unlock', ending: 'true-end', achievement: 'first-choice' }
{ type: 'unlock', chapter: 'chapter-2' }
{ type: 'unlock', targets: [{ kind: 'achievement', id: 'speedrun' }] }
```

Define lo que muestra la galería en `config.gallery`:

```js
gallery: {
  cgs:   [{ id: 'cg-01', title: 'Azotea', src: '/assets/cg/rooftop.jpg' }],
  endings: [{ id: 'true-end', title: 'Final Verdadero', description: '...' }],
  achievements: [{ id: 'first-choice', title: 'Primer Paso', description: '...' }],
  chapters: [{ id: 'chapter-2', title: 'Capítulo 2', label: 'chapter-2' }],
}
```

- El progreso se guarda aparte de los slots y se comparte entre partidas.
- `progressKey` lo separa por historia (por defecto usa `readKey`/`saveKey`).
- Añade `<VNovaGalleryModal />` al slot de `VNovaRuntime` para activar el botón
  **Galería** en el HUD y en la pantalla de título.
- Los capítulos desbloqueados saltan a su `label`; es un chapter select simple.
- `useVNovaProgress(key)` expone `has()`, `unlock()`, `unlockMany()`, `reset()`
  y `state`/`counts` reactivos para UIs propias.

### Inventario

Define tipos e items en `story/items.js`:

```js
export const itemTypes = {
  consumable: { stackable: true, consumable: true, maxStack: 99, usable: true, icon: '🧪' },
  special:    { stackable: false, consumable: false, maxStack: 1, icon: '⭐' },
  weapon:     { extends: 'special', icon: '⚔️', slot: 'hand' },
  cursed:     { icon: '☠️' },
}

export const items = {
  potion: {
    type: 'consumable',
    name: 'Poción',
    use: { inc: { hp: 10 }, notify: { text: '+10 HP' } },
  },
  cursedSword: {
    type: ['weapon', 'cursed'],
    name: 'Espada maldita',
    tags: ['melee', 'quest'],
  },
}
```

Pásalos al runtime:

```vue
<VNovaRuntime :items="items" :item-types="itemTypes" ...>
  ...
  <VNovaInventoryModal />
</VNovaRuntime>
```

Steps:

```js
{ type: 'item', id: 'potion', qty: 3 }
{ type: 'item', action: 'take', id: 'potion', qty: 1 }
{ type: 'item', action: 'use', id: 'potion' }
{ type: 'item', action: 'set', id: 'potion', qty: 0 }
{ type: 'item', action: 'clear' }
```

Condiciones:

```js
condition: { hasItem: 'potion' }
condition: { item: 'potion', gte: 2 }
condition: { hasType: 'cursed' }
condition: { typeCount: 'weapon', gte: 2 }
```

Reglas:

- `type` acepta un string o `[primario, ...secundarios]`.
- Solo el **tipo primario** aporta defaults de comportamiento; los secundarios
  son pertenencia/filtros.
- Los campos del item siempre ganan a los del tipo.
- `tags` son etiquetas libres sin comportamiento.
- Los consumibles bajan cantidad al usarse; los especiales son únicos por defecto.
- El inventario se guarda con la partida y `back()` lo restaura.
- `useVNovaInventory()` expone `count`, `has`, `add`, `remove`, `use`, `entries`,
  `byType`, etc.

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

## Assets y créditos del demo

La historia del showcase usa:

- **Sprites de personajes:** [Free Anime VN Character Sampler — Cy2026](https://cy2026.itch.io/free-anime-vn-sampler)
- **Fondos escolares:** [Backgrounds for Visual Novel by Pixel Marten](https://pixel-marten.itch.io/backgrounds-for-visual-novel-by-pixel-marten-school)
- **Música:** “The Grid” — Savfk.

La misma atribución aparece en la pantalla de Créditos del juego
(`docs-example/src/story/credits.js`).

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
