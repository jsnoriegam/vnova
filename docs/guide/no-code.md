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
