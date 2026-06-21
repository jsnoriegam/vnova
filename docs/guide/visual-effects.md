# Visual Effects

vnova-engine includes a visual effects system powered by animejs. Effects are triggered with the `effect` step.

## Background and Image Transitions

Background and image transitions use animejs internally:

```js
{ type: 'scene', id: 'intro', transition: 'fade' }
{ type: 'image', id: 'overlay', transition: 'dissolve' }
```

**Available transitions:**
- `cut` — Instant change
- `fade` — Fade with easing
- `dissolve` — Linear fade
- `slide-left` — Slide from right
- `slide-right` — Slide from left

## Sprite Animations

Sprites are automatically animated with animejs:
- **Enter**: Fade in + slide up when showing a character
- **Leave**: Fade out + slide down when hiding a character
- **Dim**: Sprites that aren't speaking are automatically darkened

## Effects API

```js
{
  type: 'effect',
  name: 'shake',              // Effect name
  target: 'stage',            // Element to animate (default: 'stage')
  duration: 500,              // Duration in ms (default: 500)
  wait: true,                 // Blocks advancement if true
  config: { ... }             // Effect-specific parameters
}
```

## Available Targets

| Target | Description |
|--------|-------------|
| `'stage'` | The entire stage container |
| `'bg'` | Active background layer |
| `'image'` | Active image layer |
| `'<character-id>'` | Specific sprite (e.g., `'hana'`) |

## Available Effects

### shake — Vibration

```js
{ type: 'effect', name: 'shake', duration: 600, config: { intensity: 10, direction: 'horizontal' }, wait: true }
```

**Config parameters:**
- `intensity` (px, default: 8) — Vibration amplitude
- `direction` (`'horizontal'` | `'vertical'` | `'both'`, default: `'horizontal'`)

### flash — Color Flash

```js
{ type: 'effect', name: 'flash', duration: 400, config: { color: 'rgba(255, 255, 255, 0.9)' }, wait: true }
```

**Config parameters:**
- `color` (CSS color, default: `'rgba(255, 255, 255, 0.8)'`)

### zoom — Zoom In/Out

```js
{ type: 'effect', name: 'zoom', duration: 1000, config: { scale: 1.2, zoomDirection: 'in' }, wait: true }
```

**Config parameters:**
- `scale` (factor, default: 1.2)
- `zoomDirection` (`'in'` | `'out'`, default: `'in'`)

### pulse — Opacity Pulse

```js
{ type: 'effect', name: 'pulse', duration: 800, config: { cycles: 3, opacity: 0.4 } }
```

**Config parameters:**
- `cycles` (number, default: 2)
- `opacity` (minimum, default: 0.5)

## Usage Examples

```js
// Intense shake that blocks advancement
{ type: 'effect', name: 'shake', target: 'stage', duration: 600, config: { intensity: 10 }, wait: true }

// Shake on background (non-blocking)
{ type: 'effect', name: 'shake', target: 'bg', duration: 400, config: { intensity: 5, direction: 'vertical' } }

// Shake on specific sprite
{ type: 'effect', name: 'shake', target: 'kenji', duration: 300, config: { intensity: 4 } }

// Quick white flash
{ type: 'effect', name: 'flash', duration: 400, config: { color: 'rgba(255,255,255,0.9)' }, wait: true }

// Smooth zoom in
{ type: 'effect', name: 'zoom', duration: 1000, config: { scale: 1.1, zoomDirection: 'in' }, wait: true }

// Pulse with 3 cycles
{ type: 'effect', name: 'pulse', duration: 800, config: { cycles: 3, opacity: 0.4 } }
```

## Custom onEffect Callback

You can implement custom effects by passing `onEffect` in the configuration:

```js
const config = {
  onEffect: ({ name, target, duration, config }) => {
    // Your custom implementation
    console.log(`Effect: ${name} on ${target}`)
  },
}
```
