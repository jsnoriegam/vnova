import { describe, expect, it } from 'vitest'
import { createEngine } from '../src/core/engine.js'

function snapshotOf(engine) {
  const store = engine.store
  return {
    cursor: store.cursor,
    current: store.current,
    stage: store.stage,
    background: store.background,
    image: store.image,
    video: store.video,
    bgm: store.bgm,
    particles: store.particles,
    vars: store.vars,
    quests: store.quests,
    awaitingChoice: store.awaitingChoice,
    ended: store.ended,
    history: store.history,
    backStack: store.backStack,
    settings: store.settings,
    lastLabel: store.lastLabel,
    anchor: engine.getSaveAnchor(),
  }
}

const baseScript = [
  { type: 'label', id: 'intro' },
  { type: 'say', text: 'uno' },
  { type: 'say', text: 'dos' },
  { type: 'label', id: 'route-a' },
  { type: 'say', text: 'tres' },
]

describe('save anchors', () => {
  it('tracks the current authored label', () => {
    const engine = createEngine(baseScript)

    expect(engine.getCurrentLabel()).toBe('intro')
    engine.advance()
    engine.advance()
    expect(engine.getCurrentLabel()).toBe('route-a')
    expect(engine.store.lastLabel).toBe('route-a')
  })

  it('builds an anchor from the nearest label and the offset', () => {
    const engine = createEngine(baseScript)

    engine.advance()
    expect(engine.getSaveAnchor()).toEqual({ label: 'intro', offset: 2, cursor: 2 })

    engine.advance()
    expect(engine.getSaveAnchor()).toEqual({ label: 'route-a', offset: 1, cursor: 4 })
  })

  it('resolves an anchor in the current script', () => {
    const engine = createEngine(baseScript)

    expect(engine.resolveSaveAnchor({ label: 'route-a', offset: 1 })).toBe(4)
    expect(engine.resolveSaveAnchor({ label: 'missing', cursor: 2 })).toBe(2)
    expect(engine.resolveSaveAnchor({ label: 'missing' })).toBeNull()
    expect(engine.resolveSaveAnchor(null)).toBeNull()
  })

  it('re-anchors a save after lines are inserted before the label', () => {
    // Save on "dos" in the original script.
    const original = createEngine(baseScript)
    original.advance()
    const saved = snapshotOf(original)
    expect(saved.current.text).toBe('dos')

    // The updated script adds a prologue before the anchored label.
    const updatedScript = [
      { type: 'label', id: 'prologue' },
      { type: 'say', text: 'nueva intro' },
      { type: 'label', id: 'intro' },
      { type: 'say', text: 'uno' },
      { type: 'say', text: 'dos' },
      { type: 'label', id: 'route-a' },
      { type: 'say', text: 'tres' },
    ]
    const updated = createEngine(updatedScript)
    const resolved = updated.resolveSaveSnapshot(saved)

    expect(resolved.cursor).toBe(4)
    expect(resolved.current.text).toBe('dos')
  })

  it('re-anchors a save after the whole label moves', () => {
    const original = createEngine(baseScript)
    original.advance()
    original.advance()
    const saved = snapshotOf(original)
    expect(saved.current.text).toBe('tres')

    const updatedScript = [
      { type: 'label', id: 'prologue' },
      { type: 'say', text: 'nueva intro' },
      { type: 'label', id: 'intro' },
      { type: 'say', text: 'uno' },
      { type: 'say', text: 'dos' },
      { type: 'label', id: 'route-a' },
      { type: 'say', text: 'tres' },
    ]
    const updated = createEngine(updatedScript)
    const resolved = updated.resolveSaveSnapshot(saved)

    expect(resolved.cursor).toBe(6)
    expect(resolved.current.text).toBe('tres')
    expect(resolved.lastLabel).toBe('route-a')
  })

  it('falls back to the raw cursor for legacy saves without an anchor', () => {
    const engine = createEngine(baseScript)
    const legacy = {
      cursor: 2,
      current: { type: 'say', text: 'dos' },
      vars: {},
      settings: {},
    }

    const resolved = engine.resolveSaveSnapshot(legacy)
    expect(resolved.cursor).toBe(2)
    expect(resolved.current.text).toBe('dos')
  })

  it('ignores compiler-generated labels in anchors', () => {
    const engine = createEngine([
      { type: 'label', id: 'intro' },
      { type: 'if', condition: true, then: [{ type: 'say', text: 'a' }] },
      { type: 'say', text: 'b' },
    ])

    engine.advance()
    expect(engine.store.current.text).toBe('b')
    expect(engine.getCurrentLabel()).toBe('intro')
    expect(engine.getSaveAnchor()).toMatchObject({ label: 'intro' })
  })

  it('restores the label on back()', () => {
    const engine = createEngine(baseScript)

    engine.advance()
    engine.advance()
    expect(engine.store.lastLabel).toBe('route-a')

    engine.back()
    expect(engine.store.lastLabel).toBe('intro')
  })
})
