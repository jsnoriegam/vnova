# Composables

## useVNovaEngine

Main composable for authors. Wraps `createEngine()` and exposes everything a visual novel author needs.

```js
import { useVNovaEngine } from 'vnova-engine'

const vn = useVNovaEngine(script, options)
```

### Return Values

**State:**
- `store`, `state` — Raw Pinia store (reactive)
- `current` — Current step
- `awaitingChoice` — Whether waiting for player input
- `ended` — Whether the session has ended
- `stageArray` — Active character sprites
- `background` — Current background state
- `image` — Current image layer state
- `history` — Step history
- `canBack` — Whether back navigation is available
- `speakerName` — Current speaker's name
- `speakerColor` — Current speaker's color

**Dialogue:**
- `displayedText` — Text with typewriter effect
- `textComplete` — Whether typewriter has finished
- `skipTypewriter()` — Skip typewriter animation
- `resumeTypewriter()` — Resume typewriter animation

**Layers:**
- `bgLayers` — Background layer refs
- `bgLayerStyle` — Style function for bg layers
- `registerBgElement` — Register bg DOM element
- `imageLayers` — Image layer refs
- `imageLayerStyle` — Style function for image layers
- `registerImageElement` — Register image DOM element
- `registerSpriteElement` — Register sprite DOM element
- `registerEffectTarget` — Register effect target

**Actions:**
- `interact()` — Advance/skip typewriter
- `choose(option)` — Make a choice
- `submitInput(value)` — Submit text input
- `submitSelect(option)` — Submit selection
- `closeModal()` — Close modal
- `back()` — Go back
- `jump(target)` — Jump to label
- `start()` — Start engine
- `restart()` — Restart engine
- `exitMenu()` — Exit menu

**Variables:**
- `getVar(key)` — Get variable
- `setVar(key, value)` — Set variable
- `getSetting(key)` — Get setting
- `setSetting(key, value)` — Set setting

**Internal:**
- `engine` — Underlying engine handle

## useUserStorage

Helper for reading and modifying author variables stored in `state.vars`.

```js
import { useUserStorage } from 'vnova-engine'

const storage = useUserStorage()

storage.set('player.name', 'Ada')
storage.inc('stats.courage')
storage.toggle('flags.metGuide')

const playerName = storage.ref('player.name', '')
```

### Methods

- `get(path, fallback?)` — Read variable by key or dotted path
- `has(path)` — Check if variable exists
- `set(path, value)` — Write variable
- `update(path, updater, fallback?)` — Update with function
- `inc(path, amount?)` — Increment number
- `toggle(path)` — Toggle boolean
- `remove(path)` — Remove variable
- `clear()` — Clear all variables
- `ref(path, fallback?)` — Writable computed ref

## useEngine

Helper for engine control in callbacks.

```js
import { useEngine } from 'vnova-engine'

const engine = useEngine()
engine.run('label-id')
engine.setVar('tone', 'hopeful')
```

## useVNovaAudio

Audio management composable.

```js
import { useVNovaAudio } from 'vnova-engine'

const audio = useVNovaAudio({
  bgmVolume: 0.5,
  sfxVolume: 0.5,
  fadeDuration: 800,
})
```

### Return Values

- `onAudio` — Pass to `useVNova` as `options.onAudio`
- `bgmVolume` — BGM volume ref
- `sfxVolume` — SFX volume ref
- `setBgmVolume(v)` — Set BGM volume
- `setSfxVolume(v)` — Set SFX volume
- `stopBgm()` — Stop BGM
- `stopAll()` — Stop all audio

## useVNovaSaves

Save/load system composable.

```js
import { useVNovaSaves } from 'vnova-engine'

const saves = useVNovaSaves({
  saveKey: 'my-vn-save',
  slotCount: 8,
  store,
})
```

### Return Values

- `slots` — Save slot metadata
- `hasSave` — Whether any save exists
- `saving` — Whether currently saving
- `lastFileError` — Last file operation error
- `saveSlot(slot)` — Save to slot
- `loadSlot(slot)` — Load from slot
- `deleteSlot(slot)` — Delete slot
- `clearAll()` — Clear all saves
- `exportSaves()` — Export saves to file
- `importSaves()` — Import saves from file
- `saveToDisk()` — Save to disk
- `loadFromDisk()` — Load from disk
- `refresh()` — Refresh slot metadata

## useQuestEngine

Quest management composable.

```js
import { useQuestEngine } from 'vnova-engine'

const quests = useQuestEngine()

quests.activate('main-quest')
quests.complete('main-quest')
```

### Return Values

- `QS` — Quest status constants
- `all` — All quests
- `active` — Active quests
- `completed` — Completed quests
- `failed` — Failed quests
- `status(id)` — Get quest status
- `is(id, status)` — Check quest status
- `activate(id)` — Activate quest
- `complete(id)` — Complete quest
- `fail(id)` — Fail quest
- `deactivate(id)` — Deactivate quest
- `list()` — List all quests
- `evaluate(id?)` — Evaluate quest conditions
