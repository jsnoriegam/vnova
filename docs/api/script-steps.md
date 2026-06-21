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
| `jump` | Unconditional jump |
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
  | BgmStep   | SfxStep   | VideoStep | ParticlesStep | StopStep | EffectStep | WaitStep | NotifyStep
  | EndStep   | CallStep
```

## Common Properties

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
