# Next Major API Plan (Draft)

Date: 2026-06-05
Scope: Planning only. No runtime changes in this document.

## Goal

Prepare a cleaner, more explicit scripting API for the next major release by:

1. Unifying hide semantics across character, image, and video.
2. Replacing `bgm` + `stop: true` with a dedicated `stop` step type.

This is intentionally breaking and should ship only in a major version.

## Current Pain Points

- `hide` currently maps mainly to character hiding, while image/video use different semantics.
- `bgm` using `stop: true` mixes two actions (play vs stop) in one step shape.
- Author intent is less explicit than it could be.

## Proposal A: Unified `hide` (property-based)

### New shape

```js
{ type: 'hide', character: 'sofia' }            // hide one character
{ type: 'hide', character: true }               // hide all characters
{ type: 'hide', image: 'banner' }               // clear image by id/key (optional)
{ type: 'hide', image: true }                   // clear active image layer
{ type: 'hide', video: 'shower_a' }             // stop/clear video by id/key (optional)
{ type: 'hide', video: true }                   // stop/clear active video
{ type: 'hide', particles: true }               // stop/clear active particles
```

### Notes

- Exactly one of `character`, `image`, `video`, `particles` must be present.
- Accepted values:
  - `character`: `string | true`
  - `image`: `string | true`
  - `video`: `string | true`
  - `particles`: `string | true`
- `true` means "active/all" depending on layer semantics.
- If more than one field is present in the same step, validator throws.

### Why this helps

- One mental model for visual layer removal.
- Less special-case knowledge for authors.
- Better tooling validation and editor hints.

## Proposal B: Dedicated `stop` type (property-based)

### New shape

```js
{ type: 'stop', bgm: true }
```

### Future-ready extension (optional for same major)

```js
{ type: 'stop', video: true }
{ type: 'stop', particles: true }
```

### Notes

- Exactly one of `bgm`, `video`, `particles` must be present.
- Initial major scope can stay `bgm`-only if we want a narrower rollout.
- If more than one field is present in the same step, validator throws.

### Why this helps

- Action is explicit: `stop` means stop.
- Removes overloaded `bgm` behavior (`play` and `stop` in one type).
- Cleaner validator and docs.

## Breaking Changes (Next Major)

- `hide` without one of `character|image|video|particles` is invalid.
- `hide` with more than one of `character|image|video|particles` is invalid.
- `bgm` with `stop: true` is invalid.

## Migration Rules

### Rule 1: Character hide

From:

```js
{ type: 'hide', character: 'sofia' }
```

To:

```js
{ type: 'hide', character: 'sofia' }
```

### Rule 2: Hide all characters

From:

```js
{ type: 'hide' }
```

To:

```js
{ type: 'hide', character: true }
```

### Rule 2b: Hide image layer

From:

```js
{ type: 'image', hide: true }
```

To:

```js
{ type: 'hide', image: true }
```

### Rule 2c: Hide video layer

From:

```js
{ type: 'video', stop: true }
```

To:

```js
{ type: 'hide', video: true }
```

### Rule 2d: Hide particles layer

From:

```js
{ type: 'particles', stop: true }
```

To:

```js
{ type: 'hide', particles: true }
```

### Rule 3: Stop BGM

From:

```js
{ type: 'bgm', stop: true }
```

To:

```js
{ type: 'stop', bgm: true }
```

## Validator and DX Plan

- Add strict validation for `hide` allowed fields.
- Add strict validation for `stop` allowed fields.
- Add clear migration error messages with exact replacement examples.
- Add autofix suggestions in docs and migration guide.

## Runtime/Store Impact (Expected)

- `hide` executor branches by present property.
- `stop` executor branches by present property.
- No behavior change expected for equivalent migrated scripts.

## Testing Plan

1. Unit tests for parser/validator for new and invalid shapes.
2. Engine step tests:
   - hide character by id
   - hide all characters
   - hide image
   - hide video
   - stop bgm
3. Regression tests for common scene flow (dialogue, saves, back stack).
4. Migration fixture tests (old -> new expected behavior parity).

## Rollout Strategy

1. Publish RFC (this document) and collect feedback.
2. Implement in a major branch.
3. Provide migration guide and optional codemod script.
4. Release next major with updated docs first, examples second, runtime third.

## Open Questions

1. Should `stop` include `sfx` or stay `bgm`-only in v1 of the major?
2. Should `hide image: true` support transition options, or be immediate only?
3. Should `hide video: true` preserve playback position for resume flows?

## Definition of Done (for major)

- New API implemented and documented.
- Legacy forms removed (no backward compatibility required by major policy).
- Migration guide published with before/after examples.
- Test suite updated and green.

## Future Roadmap (Post-Major): Multilanguage Support

Scope note: This section is for later versions, not required for the next major described above.

### Goal

Allow authors to ship one story with multiple locales (for example `en`, `es`, `ja`) without making each step huge/unreadable.

### Initial Proposal

1. Accept locale-keyed script bundles at runtime:

```js
<VNovaRuntime :script="{ en: scriptEn, es: scriptEs }" />
```

2. Optional: accept locale-keyed character registries too:

```js
<VNovaRuntime :characters="{ en: charactersEn, es: charactersEs }" />
```

3. Keep plain single-locale inputs as default for backwards authoring ergonomics:

```js
<VNovaRuntime :script="scriptEn" :characters="charactersEn" />
```

### Runtime Resolution Rules

- Runtime selects a single active locale at boot (or explicit switch event).
- Locale lookup order for bundles:
  1. Exact locale (for example `es-MX`)
  2. Base locale (for example `es`)
  3. Configured fallback locale (default `en`)
  4. First available locale key
- The resolved locale bundle becomes the effective script/characters used by the engine.

### Why This Model

- Avoids per-step `text: { en, es, ... }` objects that become hard to maintain.
- Translators can work per language file.
- Diff quality improves because each locale evolves in its own file.

### Structural Parity Validator (Required)

A dedicated build-time validator must verify parity across locale scripts before runtime starts.

Required checks:

1. Same step count across locales.
2. Same step type at each index.
3. Same label set and stable label positions.
4. Same jump/call/modal target references.
5. Same choice option count and jump targets per choice step.

Failure policy:

- Parity errors fail build in strict mode.
- Optional warning-only mode for migration phases.

### Saves Strategy (Key Concern)

Canonical save data should stay locale-agnostic where possible.

Store in save metadata:

- `localeAtSave`
- `scriptSignature` (hash/fingerprint of structural parity model)

Load behavior:

1. If active locale differs but parity signature matches: load safely.
2. If signature mismatches: block load with a clear message (or offer risky force-load in dev mode only).
3. Never couple saves to translated text content; couple to structure.

### Authoring and Assets

- Locale-aware bundles can be added later for:
  - UI labels (save/load/settings)
  - Character display names
  - Voice/subtitle/media manifests
- Keep the same script engine semantics, only swap input bundle by locale.

### Rollout Phases

1. Phase 1: Locale-keyed `script` support + parity validator.
2. Phase 2: Locale-keyed `characters` and UI string catalogs.
3. Phase 3: Locale-keyed media manifests (voice/subtitles/assets).

### Open Questions (Future)

1. Should locale switching be allowed mid-session, or only at title screen?
2. Should script parity enforce identical cursor indexes, or support label-based remap mode?
3. Should we ship an official parity checker CLI for CI pipelines?
