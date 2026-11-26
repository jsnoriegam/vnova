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

**Auto / skip / read progress:**
- `autoMode` — Auto-advance enabled
- `skipMode` — Skip toggled on
- `skipHeld` — Ctrl is currently held
- `skipActive` — Either skip mode or hold is active
- `currentLineRead` — Whether the current line was read before this display
- `toggleAuto()`, `toggleSkip()`, `setAutoMode(v)`, `setSkipMode(v)`
- `isLineRead(step)` — Check any dialogue step
- `clearReadState()` — Reset the persisted read registry
- `readCount` — Number of lines registered as read

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

**Meta-progress:**
- `progress` — `useVNovaProgress()` handle with `has()`, `unlock()`, `state`, `counts`

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
  voiceVolume: 0.8,
  fadeDuration: 800,
})
```

### Return Values

- `onAudio` — Pass to `useVNova` as `options.onAudio`
- `bgmVolume` — BGM volume ref
- `sfxVolume` — SFX volume ref
- `voiceVolume` — Voice volume ref
- `setBgmVolume(v)` — Set BGM volume
- `setSfxVolume(v)` — Set SFX volume
- `setVoiceVolume(v)` — Set voice volume
- `stopBgm()` — Stop BGM
- `stopVoice()` — Stop the current voice line
- `stopAll()` — Stop all audio

Voice events (`{ type: 'voice', track, volume, character }`) are handled by the
built-in player: previous lines are stopped, BGM is ducked while speaking, and
auto mode waits for playback to finish.

## useVNovaReadTracker

Shared, persistent registry of dialogue lines the player has already read.
Used internally by skip mode and exposed for custom UIs.

```js
import { useVNovaReadTracker } from 'vnova-engine'

const tracker = useVNovaReadTracker('my-novel-v1') // defaults to 'vnova'

tracker.isRead(step)
tracker.markRead(step)
tracker.size.value      // number of read lines
tracker.reset()         // clear persisted progress
```

Lines are keyed by `step.id` when present, otherwise by a hash of
`type + character + text`. Moving a line keeps its read status; editing its text
marks it unread again. `lineReadKey(step)` returns the raw key and
`resetAllReadTrackers()` clears every tracker in the session.

## useVNovaProgress

Persistent meta-progress shared across playthroughs (CGs, endings, achievements
and chapters). Used by `VNovaGalleryModal` and the `unlock` step.

```js
import { useVNovaProgress } from 'vnova-engine'

const progress = useVNovaProgress('my-novel-v1')

progress.unlock('cg', 'cg-01')
progress.unlock('ending', 'true-end')
progress.has('achievement', 'first-choice')
progress.state.value   // { cgs, endings, achievements, chapters }
progress.counts.value  // { cg, ending, achievement, chapter }
progress.reset()       // clear all meta-progress
```

- `kind` accepts `cg`/`cgs`, `ending`/`endings`, `achievement`/`achievements`
  and `chapter`/`chapters`.
- `unlockMany([{ kind, id }, ...])` records several entries at once.
- `reset(kind?)` clears one category or everything.
- Stored in `localStorage` under `<key>:progress`, separate from save slots.

## useVNovaInventory

Reactive view over the active engine inventory.

```js
import { useVNovaInventory } from 'vnova-engine'

const inventory = useVNovaInventory()

inventory.count('potion')       // quantity
inventory.has('potion', 2)
inventory.add('potion', 3)
inventory.remove('potion', 1)
inventory.use('potion')
inventory.entries.value         // [{ id, qty, types, primaryType, ... }]
inventory.byType('weapon')
inventory.hasType('cursed')
inventory.typeCount('consumable')
inventory.clear('potion')
inventory.clearAll()
```

Requires an active engine (rendered `VNovaStage`/`VNovaRuntime`). Mutations are
tracked so `back()` restores the inventory.

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
- `autoSlot` — Autosave metadata (or `null`)
- `hasSave` — Whether any manual or autosave exists
- `hasAuto` — Whether an autosave exists
- `saving` — Whether currently saving manually
- `autosaving` — Whether an autosave is being written
- `lastFileError` — Last file operation error
- `saveSlot(slot)` — Save to slot
- `saveAuto()` — Write the autosave slot
- `loadSlot(slot)` — Load from slot
- `loadAuto()` — Load the autosave slot
- `deleteSlot(slot)` — Delete slot
- `deleteAuto()` — Delete the autosave
- `clearAll()` — Clear all saves (including autosave)
- `exportSaves()` — Export saves to file
- `importSaves()` — Import saves from file
- `saveToDisk()` — Save to disk
- `loadFromDisk()` — Load from disk
- `refresh()` — Refresh slot metadata

Saved snapshots include an `anchor: { label, offset }`, so loading a save
re-resolves its position against the current script. Older saves that only
contain `cursor` keep working through the fallback.

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
