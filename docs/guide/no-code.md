# No-Code Workflow

vnova-engine is designed so that someone with minimal or no programming knowledge can publish a functional visual novel by editing only configuration and content files.

- **Primary path**: Edit `story/script.js`, `story/assets.js`, `story/characters.js`, and config
- **Advanced path**: Add custom hooks or components only when truly needed

## Story Files

### script.js

Your visual novel script uses a simple declarative DSL:

```js
export default [
  { type: 'label', id: 'start' },
  { type: 'scene', id: 'intro', transition: 'fade' },
  { type: 'bgm', id: 'main', volume: 0.6, loop: true },
  { type: 'show', character: 'hana', position: 'center' },
  { type: 'say', character: 'hana', text: 'Welcome to the story.' },
  {
    type: 'choice',
    prompt: 'What do you want to do?',
    options: [
      { label: 'Continue', jump: 'route-a' },
      { label: 'End', jump: 'end' },
    ],
  },
  { type: 'label', id: 'route-a' },
  { type: 'narrate', text: 'The story continues...' },
  { type: 'end' },
]
```

See [Script DSL](/guide/script-dsl) for all available step types.

### assets.js

Define all your assets in one place:

```js
export default {
  scenes: {
    intro: '/assets/scenes/intro.jpg',
    classroom: '/assets/scenes/classroom.jpg',
  },
  music: {
    main: '/assets/music/main.ogg',
    sad: '/assets/music/sad.ogg',
  },
  sounds: {
    click: '/assets/sfx/click.ogg',
    door: '/assets/sfx/door.ogg',
  },
  images: {
    overlay: '/assets/images/overlay.png',
  },
  videos: {
    intro: '/assets/video/intro.mp4',
  },
}
```

### characters.js

Define your characters with sprites and expressions:

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
      sad: '/assets/chars/hana/sad.png',
    },
  },
  kenji: {
    name: 'Kenji',
    color: '#60a5fa',
    avatar: 'K',
    defaultSprite: '/assets/chars/kenji/default.png',
    sprites: {
      neutral: '/assets/chars/kenji/neutral.png',
      angry: '/assets/chars/kenji/angry.png',
    },
  },
}
```

## Audio and Video

### Default Behavior with VNovaRuntime

- `bgm` and `sfx` play with the internal player (integrated useVNovaAudio)
- `video` and `notify` are routed through runtime callbacks

### Optional Override

```js
const config = {
  onAudio: (event) => {
    // Replace the internal player
  },
  onVideo: (event) => {},
  onNotify: (event) => {},
  onEffect: (event) => {
    // Custom effect implementation
    // event: { name, target, duration, config }
  },
  audioPlayer: false, // optional: disable internal player if not using onAudio
}
```

## Variables and State

Use `useUserStorage` to read and modify author variables stored in `state.vars`. It accepts simple keys or dot-notation paths:

```js
const { storage } = useVNova(script)

storage.set('player.name', 'Ada')
storage.inc('stats.courage')
storage.toggle('flags.metGuide')

const playerName = storage.ref('player.name', '')
```

You can also import it directly:

```js
import { useUserStorage } from 'vnova-engine'

const storage = useUserStorage()
```

## Engine Control in Callbacks

Use `useEngine` for engine control in callbacks:

```js
import { useEngine } from 'vnova-engine'

const engine = useEngine()
engine.run('label-id')
engine.setVar('tone', 'hopeful')
```

## Themes

vnova-engine includes a built-in theme system that controls colors, typography, and layout. Five themes are available by default: **Default**, **Dark**, **Light**, **Ocean**, and **Forest**.

### Using Built-in Themes

Themes are selectable from the Settings modal at runtime. The player's choice is persisted automatically via the save system.

### Adding Custom Themes

Add a `themes` array to your config to register custom themes:

```js
// story/config.js
export const defaultConfig = {
  // ... other config
  themes: [
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'Neon lights and dark streets',
      variables: {
        // Colors
        '--vnova-color-primary': '#ff00ff',
        '--vnova-color-secondary': '#00ffff',
        '--vnova-color-surface': 'rgba(10, 0, 20, 0.95)',
        // Typography
        '--vnova-font-body': "'Courier New', monospace",
        '--vnova-font-ui': "'Courier New', monospace",
        '--vnova-font-title': "'Courier New', monospace",
        // Layout
        '--vnova-dialog-bg': 'rgba(10, 0, 20, 0.85)',
        '--vnova-choice-radius': '0px',
        '--vnova-modal-radius': '0px',
        '--vnova-modal-shadow': '0 0 30px rgba(255, 0, 255, 0.5)',
      }
    }
  ]
}
```

### Theme Variables Reference

Themes can override any `--vnova-*` CSS custom property. The main categories are:

**Colors**
- `--vnova-color-primary` — Primary accent color
- `--vnova-color-secondary` — Secondary accent color
- `--vnova-color-text` — Main text color
- `--vnova-color-muted` — Muted/secondary text
- `--vnova-color-dim` — Dimmed text
- `--vnova-color-surface` — Surface/background color
- `--vnova-color-danger` — Danger/error color
- `--vnova-color-accent` — Additional accent

**Typography**
- `--vnova-font-body` — Body/dialog font
- `--vnova-font-ui` — UI elements font (buttons, HUD)
- `--vnova-font-title` — Title/heading font

**Layout — Dialog**
- `--vnova-dialog-height` — Dialog box height
- `--vnova-dialog-padding` — Dialog padding
- `--vnova-dialog-bg` — Dialog background
- `--vnova-dialog-border` — Dialog border
- `--vnova-text-size` — Text size
- `--vnova-text-line-height` — Line height
- `--vnova-text-color` — Text color
- `--vnova-think-color` — Thought text color
- `--vnova-nameplate-size` — Character name size
- `--vnova-nameplate-color` — Character name color

**Layout — Choices**
- `--vnova-choices-bg` — Choices container background
- `--vnova-choice-size` — Choice text size
- `--vnova-choice-color` — Choice text color
- `--vnova-choice-bg` — Choice button background
- `--vnova-choice-border` — Choice button border
- `--vnova-choice-bg-hover` — Choice hover background
- `--vnova-choice-radius` — Choice button border radius

**Layout — Modals**
- `--vnova-modal-bg` — Modal background
- `--vnova-modal-border` — Modal border
- `--vnova-modal-radius` — Modal border radius
- `--vnova-modal-shadow` — Modal box shadow
- `--vnova-modal-max-width` — Modal max width
- `--vnova-modal-max-height` — Modal max height

**Layout — Stage**
- `--vnova-stage-bg` — Stage background color
- `--vnova-bg-duration` — Background transition duration
- `--vnova-sprite-bottom` — Sprite bottom position

**Layout — HUD**
- `--vnova-hud-bg` — HUD strip background
- `--vnova-hud-border` — HUD strip border
- `--vnova-hud-text` — HUD text color

### Programmatic Theme Control

You can also control themes programmatically using the `useTheme` composable:

```js
import { useTheme } from 'vnova-engine'

const { applyTheme, currentThemeId, availableThemes } = useTheme()

// Apply a theme
applyTheme('dark')

// Read current theme
console.log(currentThemeId.value) // 'dark'

// List all themes
console.log(availableThemes.value)
```
