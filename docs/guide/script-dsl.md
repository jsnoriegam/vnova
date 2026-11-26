# Script DSL

A script is a flat array of steps. The engine compiles blocks (`if`, `once`,
`random`, nested `label.steps`) into a flat runtime script, so `back()`, saves
and jumps keep working exactly the same.

## Core steps

- `label` — named anchor
- `scene`, `image`, `show`, `hide`, `stop`, `effect`
- `say`, `think`, `narrate`
- `choice`, `input`, `select`, `modal`
- `jump`, `set`, `if`, `once`, `random`
- `bgm`, `sfx`, `video`, `particles`, `notify`
- `wait`, `call`, `end`

## Declarative logic

### `set`

```js
{ type: 'set', vars: { 'flags.metHana': true } }
{ type: 'set', inc: { 'stats.courage': 1, visits: 1 } }
{ type: 'set', unset: ['temporary.choice'] }
```

Dot paths create intermediate objects when needed. `inc` only applies to
numeric values (non-numeric values start from `0`). `set` is tracked by
`back()`, so rewinding restores the previous values.

### `if`

```js
{
  type: 'if',
  condition: { var: 'stats.courage', gte: 3 },
  then: [{ type: 'say', text: 'You step forward.' }],
  else: [{ type: 'say', text: 'You hesitate.' }],
}
```

`then` can also be written as `steps`. `else` is optional. Blocks can be nested
and may contain labels, jumps and any other step.

### `jump` with a condition

```js
{ type: 'jump', target: 'brave-route', if: { var: 'flags.metHana', eq: true } }
```

`condition` and `when` are aliases of `if`. When the condition is false the
engine simply continues with the next step.

### `once`

```js
{ type: 'once', id: 'first-hint', steps: [
  { type: 'notify', text: 'Tip: press Space to advance' },
] }
```

The block runs the first time the save reaches it. The flag is stored in
`vars` under the reserved `__vnova_once` key.

### `random`

```js
{
  type: 'random',
  options: [
    { weight: 3, steps: [{ type: 'say', text: 'A calm day.' }] },
    { weight: 1, steps: [{ type: 'say', text: 'A storm breaks.' }] },
  ],
}
```

Weights are relative and default to `1`. Options with a weight of `0` or less
are ignored.

## Conditions

Conditions can be booleans, functions or declarative objects:

```js
condition: true
condition: (ctx) => ctx.flags.metHana && ctx.stats.courage > 2
condition: { var: 'flags.metHana', eq: true }
```

Available operators:

| Operator | Meaning |
|---|---|
| `eq` / `neq` (`ne`) | Equality / inequality |
| `gt`, `gte`, `lt`, `lte` | Numeric comparisons |
| `in`, `notIn` (`nin`) | Value is / isn't in an array |
| `contains` | Array/string contains a value |
| `matches` | String matches a regular expression |
| `exists` | Variable is defined (`false` checks the opposite) |
| `truthy` / `falsy` | Boolean coercion |

Combinators:

```js
{ all: [condA, condB] }
{ any: [condA, condB] }
{ not: condA }
```

Shorthand maps are combined with AND:

```js
condition: { 'flags.metHana': true, 'stats.courage': 3 }
```

The same condition objects are accepted by `choice` options:

```js
{
  type: 'choice',
  options: [
    { label: 'Open', condition: { var: 'keys.door', eq: true } },
    { label: 'Force', disabled: { var: 'stats.strength', lt: 5 } },
  ],
}
```

## Variables and interpolation

Text fields support interpolation with double braces:

```js
{ type: 'say', text: 'Hello, {{ player.name }}!' }
```

### `item`

```js
{ type: 'item', id: 'potion', qty: 3 }                  // give (default)
{ type: 'item', action: 'take', id: 'potion', qty: 1 }
{ type: 'item', action: 'use', id: 'potion' }
{ type: 'item', action: 'set', id: 'potion', qty: 0 }
{ type: 'item', action: 'clear', id: 'potion' }
{ type: 'item', action: 'clear' }                       // clear all
```

Short forms `{ give }`, `{ take }`, `{ use }` and `{ clear }` are also accepted.
Inventory conditions:

```js
condition: { hasItem: 'potion' }
condition: { item: 'potion', gte: 2 }
condition: { hasType: 'cursed' }
condition: { typeCount: 'weapon', gte: 2 }
```

Only the primary type contributes behavior defaults; secondary types are
membership and filters. See the README inventory section for the catalog format.

### `unlock`

```js
{ type: 'unlock', cg: 'cg-01' }
{ type: 'unlock', cgs: ['cg-02', 'cg-03'], achievement: 'explorer' }
{ type: 'unlock', ending: 'true-end' }
{ type: 'unlock', chapter: 'chapter-2' }
{ type: 'unlock', kind: 'achievement', id: 'speedrun' }
{ type: 'unlock', targets: [{ kind: 'cg', id: 'cg-04' }] }
```

Unlocks are idempotent and persist outside save slots. `VNovaRuntime` stores them
through `useVNovaProgress()`; `VNovaGalleryModal` renders them from
`config.gallery`.

## Voices

`say`, `think` and `narrate` accept `voice` (an `assets.voices` key or a direct
URL) and `voiceVolume`:

```js
{ type: 'say', character: 'hana', text: 'Hello.', voice: 'hana-01' }
{ type: 'say', character: 'hana', text: 'Quiet...', voice: 'hana-02', voiceVolume: 0.7 }
```

The engine emits a `voice` audio event when the line becomes current and stops
it when leaving the line. Auto mode waits for the voice to finish.

## Validation

`validateScript()` and the Vite plugin understand nested blocks. Labels,
jumps and choice options inside `if`/`once`/`random` are validated too, and
duplicate labels produce a warning.
