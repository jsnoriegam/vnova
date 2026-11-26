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
- `showGallery` — Show gallery button
- `showInventory` — Show inventory button
- `showCredits` — Show credits button

The built-in HUD also renders **Auto** and **Skip** toggles. Their state comes
from the injected runtime context, so they work with `VNovaRuntime` without
extra props.

### Emits

- `back` — Back button clicked
- `open-save` — Open save requested
- `open-load` — Open load requested
- `open-backlog` — Open backlog requested
- `open-gallery` — Open gallery requested
- `open-inventory` — Open inventory requested
- `open-credits` — Open credits requested
- `open-settings` — Open settings requested
- `restart` — Restart requested
- `exit-menu` — Exit menu requested

## VNovaSettingsModal

Settings modal component.

```vue
<VNovaSettingsModal />
```

## VNovaGalleryModal

Meta-progress browser for CGs, endings, achievements and chapter select.
Render it inside the `VNovaRuntime` slot to enable the **Gallery** button in
`VNovaHud` and `VNovaTitleScreen`.

```vue
<VNovaGalleryModal />
```

### Props

- `open` — Whether the modal is open (managed by the runtime)
- `title` — Optional title override
- `progressKey` — Progress namespace (defaults to the runtime's `progressKey`)
- `gallery` — Definitions from `config.gallery`

### Emits

- `close` — Modal closed
- `select-chapter` — A chapter was chosen (only used without a runtime context)

## VNovaInventoryModal

Inventory browser. Render it inside the `VNovaRuntime` slot to enable the
**Inventory** button in `VNovaHud`.

```vue
<VNovaInventoryModal />
```

### Props

- `open` — Whether the modal is open (managed by the runtime)
- `title` — Optional title override (defaults to `inventory.title`)

Items, quantities, types and the **Use**/**Drop** actions come from the active
engine inventory and the catalog passed to `VNovaRuntime`.

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
- `loaded` — Load completed (`slot` number or `'auto'`)
- `deleted` — Save deleted

The modal shows a dedicated autosave card above the manual slots when one exists.

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
