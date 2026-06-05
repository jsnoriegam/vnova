# Guía para Autores — vnova

## 🎯 Filosofía: No-Code First

vnova está diseñado para que los autores puedan crear y publicar novelas visuales **sin escribir lógica de programación**. El camino principal es **declarativo**: editar script, assets, characters y config.

> ⚠️ **Regla central**: Si un autor necesita agregar funciones JS para un caso común, el diseño aún no está terminado. La solución correcta es mover esa complejidad al core y exponerla como config declarativa.

---

## 📚 Niveles de Uso

### 1. Nivel Autor (sin código)

**Tu trabajo**: Edita archivos declarativos en `story/`

| Archivo | Qué contiene |
|---------|-------------|
| `story/script.js` | Secuencia de pasos (escenas, diálogos, personajes, música) |
| `story/assets.js` | Registro de assets (fondos, música, efectos) |
| `story/characters.js` | Personajes (nombre, color, sprites por expresión) |
| `story/config.js` | Configuración del motor (velocidad, volumen, tamaño de texto) |

**Tu flujo de trabajo**:

```bash
# 1. Define tus personajes
# 2. Registra tus assets
# 3. Escribe tu historia paso a paso
# 4. Configura el motor
# 5. ¡Listo! No necesitas tocar App ni runtime interno.
```

### 2. Nivel Integrador (bajo código)

**Tu trabajo**: Personaliza temas visuales y composiciones

- Cambia variables CSS en `vnova.css` para adaptar el tema
- Ajusta opciones del runtime por config
- Reemplaza componentes oficiales con tus propios

### 3. Nivel Avanzado (con código)

**Tu trabajo**: Extiende el motor cuando sea necesario

- Reemplaza handlers (`onAudio`, `onNotify`, `onVideo`)
- Extiende comportamiento con hooks
- **Nota**: Esta capa es opcional, nunca requisito para escenarios comunes.

---

## 📝 Estructura del Script

El script es un array de **pasos** (steps). Cada paso es un objeto con un `type` y sus propiedades.

### Tipos de Pasos

#### 🖼️ Escena (`scene`)
```javascript
{
  type: 'scene',
  id: 'intro',
  src: '/src/assets/scenes/intro.jpg',
  color: '#000000',
  transition: 'fade',  // 'fade' | 'dissolve' | 'cut' | 'slide-left' | 'slide-right'
  stopMusic: false    // Si true, detiene BGM antes del cambio
}
```

#### 🖼️ Imagen (`image`)
```javascript
{
  type: 'image',
  id: 'banner',
  src: '/src/assets/images/banner.png',
  transition: 'fade',
  fit: 'both'  // 'width' | 'height' | 'both'
}
```

Para ocultar la capa de imagen, usa `hide: true`:

```javascript
{
  type: 'image',
  hide: true,
  transition: 'fade'
}
```

#### 👤 Mostrar Personaje (`show`)
```javascript
{
  type: 'show',
  character: 'kenji',
  position: 'center',  // 'left' | 'center' | 'right' | 'left-far' | 'right-far'
  expression: 'happy',
  sprite: '/src/assets/characters/kenji_happy.png'
}
```

#### 👤 Ocultar Personaje (`hide`)
```javascript
{
  type: 'hide',
  character: 'kenji'  // Omit para limpiar todo el stage
}
```

#### 💬 Diálogo (`say`)
```javascript
{
  type: 'say',
  character: 'kenji',
  text: '¡Hola! ¿Cómo estás?',
  expression: 'happy',
  voice: '/src/assets/voices/kenji.mp3',
  advance: true,      // Auto-avanza después de escribir
  continue: 1000      // Continúa después de 1000ms
}
```

#### 💭 Pensamiento (`think`)
```javascript
{
  type: 'think',
  character: 'kenji',
  text: 'Necesito ser más cuidadoso...',
  expression: 'sad'
}
```

#### 📖 Narración (`narrate`)
```javascript
{
  type: 'narrate',
  text: 'Era un día soleado en la ciudad.',
  advance: true
}
```

#### 🎮 Elección (`choice`)
```javascript
{
  type: 'choice',
  prompt: '¿Qué quieres hacer?',
  options: [
    { label: 'Ir al parque', jump: 'park' },
    { label: 'Ir a casa', jump: 'home' },
    { label: 'Ir al trabajo', jump: 'work' }
  ]
}
```

#### 🗺️ Modal personalizado (`modal`) sin hackear runtime

Puedes registrar un componente por `id` (o `ui`) desde config y el runtime lo renderiza automaticamente.

```javascript
// story/config.js
export default {
  ui: {
    modals: {
      'city-map-route': MapChoiceModal,
    },
  },
}
```

```javascript
// script.js
{
  type: 'modal',
  id: 'city-map-route',
  title: 'Tactical Infiltration Map',
  prompt: 'Select your insertion route.',
  options: [
    { label: 'Canals', jump: 'route-steady', pin: { x: 22, y: 70 } },
    { label: 'Core', jump: 'route-risky', pin: { x: 68, y: 38 } },
  ],
}
```

Tu componente recibe `open`, `step`, `options`, `state` y `actions` por props.
No necesitas `inject` ni una key interna del runtime.

#### 🎵 Música (`bgm`)
```javascript
{
  type: 'bgm',
  id: 'intro',
  src: '/src/assets/bgm/intro.mp3',
  volume: 0.8,
  loop: true
}
```

#### 🔊 Efecto de sonido (`sfx`)
```javascript
{
  type: 'sfx',
  id: 'door',
  src: '/src/assets/sfx/door.mp3',
  volume: 1.0
}
```

#### ⏱️ Esperar (`wait`)
```javascript
{
  type: 'wait',
  ms: 2000  // Espera 2 segundos
}
```

#### ⚙️ Callback (`call`)
```javascript
import { useEngine, useUserStorage } from 'vnova-engine'

{
  type: 'call',
  fn: () => {
    const engine = useEngine()
    const storage = useUserStorage()

    const trust = Number(engine.getVar('trust') ?? 0)
    storage.set('flags.highTrust', trust >= 2)
    engine.run('next-label')
  }
}
```

No necesitas declarar parámetros en `fn`.

#### 🏁 Fin (`end`)
```javascript
{
  type: 'end'
}
```

#### 🏷️ Etiqueta (`label`)
```javascript
{
  type: 'label',
  id: 'park',
  steps: [
    { type: 'scene', src: '/src/assets/scenes/park.jpg' },
    { type: 'say', character: 'kenji', text: '¡Qué hermoso día!' }
  ]
}
```

---

## 🎨 Registro de Personajes

```javascript
export const characters = {
  kenji: {
    name: 'Kenji',
    color: '#a855f7',
    avatar: '👨',
    defaultSprite: '/src/assets/characters/kenji_default.png',
    sprites: {
      happy: '/src/assets/characters/kenji_happy.png',
      sad: '/src/assets/characters/kenji_sad.png',
      angry: '/src/assets/characters/kenji_angry.png'
    }
  },
  hana: {
    name: 'Hana',
    color: '#6366f1',
    avatar: '👩',
    defaultSprite: '/src/assets/characters/hana_default.png',
    sprites: {
      smile: '/src/assets/characters/hana_smile.png',
      blush: '/src/assets/characters/hana_blush.png'
    }
  }
};
```

---

## 📦 Registro de Assets

```javascript
export const assets = {
  scenes: {
    intro: '/src/assets/scenes/intro.jpg',
    park: '/src/assets/scenes/park.jpg',
    home: '/src/assets/scenes/home.jpg'
  },
  music: {
    intro: '/src/assets/bgm/intro.mp3',
    park: '/src/assets/bgm/park.mp3',
    home: '/src/assets/bgm/home.mp3'
  },
  sounds: {
    door: '/src/assets/sfx/door.mp3',
    wind: '/src/assets/sfx/wind.mp3'
  },
  images: {
    banner: '/src/assets/images/banner.png'
  }
};
```

---

## ⚙️ Configuración del Motor

```javascript
export const config = {
  typewriterSpeed: 30,      // Velocidad de escritura (ms por carácter)
  bgmVolume: 0.5,           // Volumen de música
  sfxVolume: 0.5,           // Volumen de efectos
  textSize: 'medium'        // 'small' | 'medium' | 'large'
};
```

---

## 🚀 Flujo de Trabajo Recomendado

### Paso 1: Configura tus personajes
```javascript
// story/characters.js
export const characters = {
  // Define tus personajes aquí
};
```

### Paso 2: Registra tus assets
```javascript
// story/assets.js
export const assets = {
  // Define tus assets aquí
};
```

### Paso 3: Escribe tu historia
```javascript
// story/script.js
export const script = [
  { type: 'scene', src: '/src/assets/scenes/intro.jpg' },
  { type: 'bgm', id: 'intro' },
  { type: 'show', character: 'kenji', position: 'center' },
  { type: 'say', character: 'kenji', text: '¡Hola!' },
  { type: 'hide', character: 'kenji' },
  { type: 'end' }
];
```

### Paso 4: Configura el motor
```javascript
// story/config.js
export const config = {
  typewriterSpeed: 30,
  bgmVolume: 0.5,
  sfxVolume: 0.5,
  textSize: 'medium'
};
```

### Paso 5: ¡Listo!

---

## 📖 Validación

Antes de publicar, valida tu script:

```javascript
import { validateScript } from 'vnova-engine';

const warnings = validateScript(script, characters);
if (warnings.length > 0) {
  console.warn('⚠️ Advertencias:', warnings);
}
```

---

## 🎯 Definición de Hecho (DoD)

Una feature se considera terminada solo si cumple todo:

- ✅ Se puede activar con config/script, sin funciones custom
- ✅ Tiene valor por defecto razonable
- ✅ Mantiene compatibilidad con overrides avanzados
- ✅ Incluye ejemplo mínimo en `docs-example`
- ✅ README documenta primero la forma no-code

---

## 📋 Checklist para PR

- [ ] El flujo básico funciona sin editar App ni crear hooks
- [ ] No obliga a escribir funciones JS para un caso común
- [ ] El default es útil para un autor no técnico
- [ ] Existe escape hatch para integradores avanzados
- [ ] README y demo reflejan primero la ruta no-code

---

## 🔍 Heurística de Decisión

Antes de implementar una feature, responde:

1. **"¿Un autor puede usar esto solo tocando config y contenido?"**
2. **"¿Si no, qué parte se puede absorber en core?"**
3. **"¿El override sigue siendo opcional y no obligatorio?"**

Si alguna respuesta es "no", la feature vuelve a diseño.

---

## 📚 Recursos Adicionales

- [API Reference](./api-reference.md)
- [Componentes](./components.md)
- [Estilos](./styles.md)

---

## 🤝 Contribuyendo

Si encuentras un caso común que requiere código JS, ¡abre un issue! El objetivo es absorber esa complejidad en el core y exponerla como config declarativa.

---

**¡Feliz creación de novelas visuales!** 🎮✨
