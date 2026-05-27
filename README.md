# vnova-engine

Framework de novela visual para Vue 3, orientado al código. Define tu historia como un array de objetos JavaScript e integra el motor directamente en tu proyecto Vite.

---

## Instalación

```bash
# en tu proyecto Vite + Vue 3
npm install vnova-engine
```

### vite.config.js

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vnovaPlugin from 'vnova-engine/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    vnovaPlugin({
      validateOnBuild: true, // valida scripts en `vite build`
      warnOnly: false,       // true = errores de validación no rompen el build
    }),
  ],
})
```

---

## Uso básico

```vue
<script setup>
import { VNovaStage } from 'vnova-engine'
import script from './story/script.js'
import { characters } from './story/characters.js'
</script>

<template>
  <div style="width:100vw;height:100vh">
    <VNovaStage :script="script" :characters="characters" />
  </div>
</template>
```

---

## El Script

El script es un **array plano de objetos**. El motor lo recorre en orden; los pasos de control (`jump`, `choice`) pueden redirigir el cursor.

### Tipos de paso

#### `label` — ancla de salto
```js
{ type: 'label', id: 'mi-escena' }
```
No se renderiza. Marca una posición a la que se puede saltar.

---

#### `scene` — cambiar fondo
```js
{
  type: 'scene',
  id: 'campus_day',                  // recomendado: id en assets.scenes
  src: '/backgrounds/ciudad.webp',   // opcional: URL directa (override)
  color: '#1a1a2e',                  // alternativa: color sólido CSS
  transition: 'fade',                // 'fade' | 'dissolve' | 'cut' | 'slide-left' | 'slide-right'
}
```

`scene` resuelve `id` contra `options.assets.scenes[id]`. Si envías `src`, tiene prioridad.

---

#### `show` — mostrar personaje en escena
```js
{
  type: 'show',
  character: 'hana',          // id del personaje en el registry
  position: 'left',           // 'left' | 'center' | 'right' | 'left-far' | 'right-far'
  expression: 'happy',        // nombre de expresión (opcional)
  sprite: '/sprites/hana_happy.webp', // sobreescribe el sprite del registry (opcional)
}
```

---

#### `hide` — ocultar personaje
```js
{ type: 'hide', character: 'hana' }  // omite character para limpiar toda la escena
```

---

#### `say` — diálogo de un personaje
```js
{
  type: 'say',
  character: 'hana',
  text: 'No puedo dormir.',
  expression: 'sad',          // actualiza la expresión mostrada (opcional)
  voice: '/audio/hana_01.ogg' // archivo de voz (stub — ver onAudio)
}
```

---

#### `narrate` — narración sin atribución
```js
{ type: 'narrate', text: 'La ciudad nunca duerme del todo.' }
```

---

#### `choice` — bifurcación interactiva
```js
{
  type: 'choice',
  prompt: '¿Qué decides?',        // texto sobre las opciones (opcional)
  options: [
    { label: 'Hablar con Kenji', jump: 'ruta-a' },
    {
      label: 'Quedarte sola',
      jump: 'ruta-b',
      set: { chose_alone: true, route: 'alone' },
      inc: { affinityKenji: -1, stress: 2 },
    },
    { label: 'Continuar',        /* sin jump = avanza al siguiente paso */ },
  ],
}
```

Cada opción puede tener:
- `jump` — id de label al que saltar
- `set` — objeto de variables a escribir en `state.vars` al elegir
- `inc` — objeto de incrementos numéricos sobre `state.vars` (admite valores positivos y negativos)

`set` y `inc` aceptan múltiples variables en una sola opción.

---

#### `jump` — salto incondicional
```js
{ type: 'jump', target: 'epilogo' }
```

---

#### `bgm` — música de fondo
```js
{ type: 'bgm', id: 'calm', volume: 0.7, loop: true }
{ type: 'bgm', track: 'calm', volume: 0.7, loop: true } // alias legacy
{ type: 'bgm', src: '/audio/music/calm.ogg', volume: 0.7, loop: true } // URL directa
{ type: 'bgm', id: null } // detener música
```
`bgm` resuelve primero `src`, luego `id`/`track` contra `options.assets.music`.
El motor llama a `options.onAudio({ type: 'bgm', track, volume, loop })`.  
Conecta tu librería de audio (Howler.js, Tone.js…) en ese callback.

---

#### `sfx` — efecto de sonido
```js
{ type: 'sfx', id: 'door_slam', volume: 1.0 }
{ type: 'sfx', track: 'door_slam', volume: 1.0 } // alias legacy
{ type: 'sfx', src: '/audio/sfx/door_slam.ogg', volume: 1.0 } // URL directa
```

`sfx` resuelve primero `src`, luego `id`/`track` contra `options.assets.sounds`.

---

#### `wait` — pausa automática
```js
{ type: 'wait', ms: 1500 }
```
El motor avanza solo tras `ms` milisegundos. No requiere clic del usuario.

---

#### `call` — efecto lateral en JavaScript
```js
{
  type: 'call',
  fn: (state) => {
    state.vars.visited_rooftop = true
    if (state.vars.chose_alone) console.log('tomó la ruta solitaria')
  },
}
```
`fn` recibe el estado reactivo completo. Es sincrónica.

---

## Motor de quests

Puedes registrar quests al crear el motor/composable con `options.quests`.

Estados disponibles:

```js
import { QS } from 'vnova-engine'
```

Definicion de quest (estilo recomendado):

```js
const quests = [
  {
    id: 'buy_phone',
    title: 'Get a Phone',
    description: 'The emergency card Hayes gave her has a $200 limit. She needs a prepaid phone to receive coded notifications.',
    category: 'main',
    initialStatus: QS.ACTIVE,
    failIf: null,
    doneIf: (store) => store.flags.boughtPhone === true,
    reward: (store) => { store.charisma = (store.charisma ?? 0) + 1 },
    penalty: (store) => { store.charisma = (store.charisma ?? 0) - 1 },
  },
]
```

Integracion:

```js
const vn = useVNova(script, {
  characters,
  quests,
})

// helpers disponibles
vn.quests.value
vn.listQuests()
vn.getQuest('buy_phone')
vn.setQuestStatus('buy_phone', QS.COMPLETED)
vn.evaluateQuests()
```

Notas:
- `doneIf` y `failIf` se evalúan despues de cada movimiento del jugador.
- `store.flags` y `store.vars` apuntan a `state.vars` del motor.
- Tambien puedes leer/escribir variables con acceso directo, por ejemplo `store.charisma`.

---

## Registry de personajes

```js
// story/characters.js
export const characters = {
  hana: {
    name:          'Hana',
    color:         '#e879b0',   // color del nameplate
    avatar:        '👩',        // emoji fallback si no hay sprite
    defaultSprite: '/sprites/hana.webp',
    expressions: {
      neutral: '/sprites/hana_neutral.webp',
      happy:   '/sprites/hana_happy.webp',
    },
  },
}
```

---

## Registry de assets

```js
// story/assets.js
export default {
  scenes: {
    campus_day: '/assets/scenes/campus_day.jpg',
    campus_night: '/assets/scenes/campus_night.jpg',
  },
  music: {
    day: '/assets/music/day.ogg',
    tension: '/assets/music/tension.ogg',
  },
  sounds: {
    gunshot: '/assets/sounds/gunshot.ogg',
    heartbeat: '/assets/sounds/heartbeat.ogg',
  },
}
```

Uso:

```js
const vn = useVNova(script, {
  characters,
  assets,
})
```

---

## Composable `useVNova`

Para control total desde tu propio componente, sin usar `VNovaStage`:

```js
import { useVNova } from 'vnova-engine'

const {
  state,           // estado reactivo completo
  stageArray,      // computed: personajes en escena como array
  speakerName,     // computed: nombre del hablante actual
  speakerColor,    // computed: color del hablante actual
  displayedText,   // computed: texto con typewriter aplicado
  textComplete,    // ref<boolean>: el typewriter terminó
  backgroundStyle, // computed: objeto de estilo para el fondo
  bgTransitioning, // ref<boolean>: durante la transición de fondo

  interact,        // clic principal: salta typewriter → avanza
  choose(option),  // resolver una elección
  jump(labelId),   // salto programático
  restart(),
  save(),          // guarda en localStorage (requiere saveKey en options)
  load(),          // restaura desde localStorage (si existe)
  clearSave(),
  getVar(key),
  setVar(key, val),
} = useVNova(script, {
  characters,
  assets,
  typewriterSpeed:   30,    // ms por carácter
  typewriterEnabled: true,
  keyboardEnabled:   true,  // Space / Enter / ArrowRight = interact
  saveKey:           'mi-vn',
  autoAdvanceDelay:  0,     // ms; 0 = solo manual
  onAudio: ({ type, track, volume, loop }) => { /* … */ },
  onEnd:   () => { /* … */ },
})
```

---

## Slots de `VNovaStage`

### `#overlay`
Contenedor absoluto sobre toda la escena. Los clics no se propagan al stage.  
Recibe props por defecto del core para evitar boilerplate en la app:

- `canBack`
- `hasSave`
- `history`
- `back()`
- `save()`
- `load()`

```vue
<VNovaStage ...>
  <template #overlay="ui">
    <VNovaHud
      :can-back="ui.canBack"
      :has-save="ui.hasSave"
      @back="ui.back"
      @save="ui.save"
      @load="ui.load"
    />
  </template>
</VNovaStage>
```

Si no necesitas comportamiento custom, no hace falta escribir `computed` ni handlers manuales para back/save/load.

### `#sprite({ char, pos })`
Reemplaza el sprite por defecto (emoji fallback). `char` tiene `{ id, position, expression, sprite }`.

```vue
<VNovaStage ...>
  <template #sprite="{ char }">
    <img :src="`/sprites/${char.id}_${char.expression}.webp`" />
  </template>
</VNovaStage>
```

### `#end`
Reemplaza la pantalla de fin por defecto.

---

## CSS Custom Properties

Todos los valores visuales son sobreescribibles con CSS variables en el elemento padre de `VNovaStage`:

| Variable                    | Default                    | Descripción              |
|-----------------------------|----------------------------|--------------------------|
| `--vnova-font-body`         | `'Georgia', serif`         | Fuente general           |
| `--vnova-stage-bg`          | `#000`                     | Color de fondo del stage |
| `--vnova-bg-duration`       | `400ms`                    | Duración de transiciones |
| `--vnova-dialog-bg`         | `rgba(0,0,0,0.82)`         | Fondo del cuadro         |
| `--vnova-dialog-border`     | `rgba(255,255,255,.12)`    | Borde superior del cuadro|
| `--vnova-dialog-height`     | `30%`                      | Altura mínima del cuadro |
| `--vnova-dialog-padding`    | `1.25rem 1.75rem 1.5rem`   | Padding del cuadro       |
| `--vnova-text-size`         | `1rem`                     | Tamaño del texto         |
| `--vnova-text-line-height`  | `1.75`                     | Interlineado             |
| `--vnova-text-color`        | `#f0eaf8`                  | Color del texto          |
| `--vnova-nameplate-color`   | `#fff`                     | Color del nameplate      |
| `--vnova-nameplate-size`    | `0.8rem`                   | Tamaño del nameplate     |
| `--vnova-sprite-bottom`     | `140px`                    | Offset vertical sprites  |
| `--vnova-choice-bg`         | `rgba(255,255,255,.08)`    | Fondo botones de elección|
| `--vnova-choice-bg-hover`   | `rgba(255,255,255,.18)`    | Fondo hover elección     |
| `--vnova-choice-border`     | `rgba(255,255,255,.2)`     | Borde botones elección   |
| `--vnova-choice-color`      | `#f0eaf8`                  | Texto botones elección   |
| `--vnova-choice-radius`     | `6px`                      | Border radius elección   |
| `--vnova-choices-bg`        | `rgba(0,0,0,.65)`          | Overlay de elecciones    |

---

## Validador

```js
import { validateScript } from 'vnova-engine'

const warnings = validateScript(script, characters)
// lanza Error en errores críticos
// devuelve string[] de advertencias
```

Úsalo en tests unitarios o en CI:

```js
// vitest / jest
import { describe, it, expect } from 'vitest'
import { validateScript } from 'vnova-engine'
import script from '../src/story/script.js'
import { characters } from '../src/story/characters.js'

describe('script', () => {
  it('should pass validation', () => {
    expect(() => validateScript(script, characters)).not.toThrow()
  })
})
```

---

## Estructura del proyecto

```
vnova-engine/
├── src/
│   ├── core/
│   │   ├── engine.js        ← máquina de estados (sin deps Vue)
│   │   └── validator.js     ← validador de scripts
│   ├── composables/
│   │   └── useVNova.js      ← integración Vue 3 (typewriter, teclado, save)
│   ├── components/
│   │   └── VNovaStage.vue   ← componente drop-in
│   └── index.js             ← exports públicos
├── vite-plugin/
│   └── index.js             ← plugin Vite (alias, validación en build)
└── docs-example/
    └── src/
        ├── App.vue
        ├── main.js
        └── story/
            ├── script.js
            └── characters.js
```
