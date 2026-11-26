# Script Steps

Complete reference for all script step types in vnova-engine.

## Step Types Overview

| Type | Description |
|------|-------------|
| `label` | Named anchor for jumps |
| `scene` | Change background/location |
| `image` | Show/clear full-screen image layer |
| `show` | Add character sprite to stage |
| `hide` | Remove visual layers |
| `stop` | Stop media playback |
| `effect` | Play visual effects |
| `say` | Character dialogue |
| `think` | Inner monologue |
| `narrate` | Unattributed narration |
| `choice` | Branch with options |
| `input` | Capture text input |
| `select` | Select from options |
| `modal` | Custom modal component |
| `jump` | Unconditional (or conditional) jump |
| `set` | Assign / increment / delete variables |
| `if` | Conditional `then` / `else` block |
| `once` | Block executed once per save |
| `random` | Weighted random branch |
| `unlock` | Record CG / ending / achievement / chapter progress |
| `item` | Give / take / use / set / clear inventory items |
| `bgm` | Play background music |
| `sfx` | Play sound effect |
| `video` | Play video track |
| `particles` | Play particle effects |
| `notify` | UI notification |
| `wait` | Pause before auto-advance |
| `call` | Invoke custom function |
| `end` | End session |

## TypeScript Types

All step types are defined in `src/vnova.d.ts`:

```typescript
export type ScriptStep =
  | LabelStep | SceneStep | ImageStep
  | ShowStep  | HideStep
  | SayStep   | ThinkStep | NarrateStep
  | ChoiceStep | ModalStep | InputStep | SelectStep | JumpStep
  | SetStep    | IfStep    | OnceStep   | RandomStep
  | BgmStep   | SfxStep   | VideoStep | ParticlesStep | StopStep | EffectStep | WaitStep | NotifyStep
  | UnlockStep
  | ItemStep
  | EndStep   | CallStep
```

## Common Properties

### Declarative conditions

`if`, conditional `jump`, `choice.condition` and `choice.disabled` accept
booleans, functions or condition objects:

```js
{ var: 'stats.courage', gte: 3 }
{ all: [{ var: 'flags.metHana', eq: true }, { var: 'stats.courage', gt: 1 }] }
{ 'flags.metHana': true }   // shorthand AND map
```

See [Script DSL — Conditions](/guide/script-dsl#conditions) for the full
operator list.

### Meta-progress unlocks

```js
{ type: 'unlock', cg: 'cg-01' }
{ type: 'unlock', cgs: ['cg-02', 'cg-03'], achievement: 'explorer' }
{ type: 'unlock', ending: 'true-end' }
{ type: 'unlock', chapter: 'chapter-2' }
{ type: 'unlock', kind: 'achievement', id: 'speedrun' }
{ type: 'unlock', targets: [{ kind: 'cg', id: 'cg-04' }] }
```

The engine emits `onUnlock({ kind, id })` for each target. `VNovaRuntime`
persists them through `useVNovaProgress()` under `progressKey`.

### Inventory items

```js
{ type: 'item', id: 'potion', qty: 3 }                  // give
{ type: 'item', action: 'take', id: 'potion', qty: 1 }
{ type: 'item', action: 'use', id: 'potion' }
{ type: 'item', action: 'set', id: 'potion', qty: 0 }
{ type: 'item', action: 'clear' }
```

Usable items apply their declarative `use` effects (`set`, `inc`, `unset`,
`notify`, `unlock`, `sfx`). `onItemUse` is emitted after the action.

### Voice lines

Dialogue steps accept an optional voice:

```js
{ type: 'say', character: 'hana', text: 'Hello.', voice: 'hana-01' }
{ type: 'think', character: 'hana', text: '...', voice: 'hana-02' }
{ type: 'narrate', text: '...', voice: '/assets/voices/narrator-01.ogg' }
```

`voice` can be a key from `assets.voices` or a direct URL. `voiceVolume`
multiplies the line volume before the global voice setting is applied.

### Text Interpolation

All text fields support variable interpolation:

```js
{ type: 'say', character: 'hana', text: 'Hello, {{player.name}}!' }
```

### Rich Text

Text fields support BBCode-style formatting:

```js
{ type: 'narrate', text: '[b]Bold[/b] [i]italic[/i] [color=#e06c75]colored[/color]' }
```

## Detailed Reference

See [Script DSL](/guide/script-dsl) for detailed usage examples of each step type.
