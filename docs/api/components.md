# Components

## VNovaRuntime

Main runtime component that orchestrates the entire visual novel experience.

```vue
<VNovaRuntime
  :script="script"
  :characters="characters"
  :assets="assets"
  :config="config"
>
  <VNovaTitleScreen />
  <VNovaStage />
  <VNovaHud />
</VNovaRuntime>
```

### Props

- `script` — Script array (required)
- `characters` — Character registry
- `assets` — Asset registry
- `credits` — Credits registry
- `particles` — Particle presets
- `config` — Runtime configuration
- `modals` — Custom modal components

### Slots

- `default` — Child components (title screen, stage, hud, etc.)

## VNovaStage

Main stage component. Renders background, sprites, dialogue, and choices.

```vue
<VNovaStage
  :script="script"
  :characters="characters"
  :config="config"
/>
```

### Props

- `script` — Script array (required)
- `characters` — Character registry
- `config` — Stage configuration

### Emits

- `end` — When the script ends
- `choice` — When a choice is made
- `advance` — On manual advance
- `back` — On back navigation

### Slots

- `overlay({ canBack, hasSave, history, back, save, load, openSave, openLoad, closeSave, restart, exitMenu })` — Overlay UI
- `sprite({ char, pos })` — Custom sprite rendering
- `end` — End screen content

### Exposed (via ref)

- `interact()`, `choose()`, `back()`, `jump()`, `restart()`, `exitMenu()`
- `save()`, `load()`, `clearSave()`, `openSave()`, `openLoad()`, `closeSave()`
- `canBack`, `hasSave`, `history`
- `quests`, `storage`
- `getVar()`, `setVar()`, `getSetting()`, `setSetting()`
- `state`

## VNovaTitleScreen

Title screen component.

```vue
<VNovaTitleScreen />
```

## VNovaHud

Heads-up display component.

```vue
<VNovaHud
  :can-back="canBack"
  :audio-log="audioLog"
  :visible="true"
  :show-backlog="true"
  :show-credits="true"
/>
```

### Props

- `canBack` — Whether back is available
- `audioLog` — Audio log text
- `visible` — Whether HUD is visible
- `showBacklog` — Show backlog button
- `showCredits` — Show credits button

### Emits

- `back` — Back button clicked
- `open-save` — Open save requested
- `open-load` — Open load requested
- `open-backlog` — Open backlog requested
- `open-credits` — Open credits requested
- `open-settings` — Open settings requested
- `restart` — Restart requested
- `exit-menu` — Exit menu requested

## VNovaSettingsModal

Settings modal component.

```vue
<VNovaSettingsModal />
```

## VNovaSaveModal

Save/load modal component.

```vue
<VNovaSaveModal
  save-key="my-vn-save"
  :slot-count="8"
  :stage-ref="stageRef"
  :store="store"
  mode="save"
  :open="true"
/>
```

### Props

- `saveKey` — localStorage key for saves
- `slotCount` — Number of save slots
- `stageRef` — Reference to stage element
- `store` — Pinia store
- `mode` — `'save'` or `'load'`
- `open` — Whether modal is open

### Emits

- `close` — Modal closed
- `saved` — Save completed
- `loaded` — Load completed
- `deleted` — Save deleted

## VNovaBacklogModal

Backlog/history modal component.

```vue
<VNovaBacklogModal :history="history" />
```

### Props

- `history` — Step history array

## VNovaCreditsScreen

Credits screen component.

```vue
<VNovaCreditsScreen
  :open="true"
  title="Credits"
  :credits="credits"
/>
```

### Props

- `open` — Whether screen is open
- `title` — Credits title
- `credits` — Credits registry

## VNovaTopHud

Top HUD component for minimal UI.

```vue
<VNovaTopHud
  :opacity="0.8"
  :floating="true"
  custom-class="my-hud"
/>
```

### Props

- `opacity` — HUD opacity
- `floating` — Whether HUD floats
- `customClass` — Custom CSS class
