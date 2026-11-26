import { describe, expect, it, vi } from 'vitest'
import { createEngine } from '../src/core/engine.js'

describe('unlock step', () => {
  it('emits one event per target field', () => {
    const onUnlock = vi.fn()
    createEngine([
      {
        type: 'unlock',
        cg: 'cg-01',
        ending: 'true-end',
        achievement: 'first-step',
        chapter: 'chapter-2',
      },
    ], { onUnlock })

    expect(onUnlock.mock.calls.map(([target]) => target)).toEqual([
      { kind: 'cg', id: 'cg-01' },
      { kind: 'ending', id: 'true-end' },
      { kind: 'achievement', id: 'first-step' },
      { kind: 'chapter', id: 'chapter-2' },
    ])
  })

  it('supports arrays, generic kind/id and targets', () => {
    const onUnlock = vi.fn()
    createEngine([
      {
        type: 'unlock',
        cgs: ['cg-01', 'cg-02'],
        kind: 'ending',
        id: 'secret-end',
        targets: [
          { kind: 'achievement', id: 'a1' },
          { kind: 'cg', id: 'cg-01' },
        ],
      },
    ], { onUnlock })

    expect(onUnlock.mock.calls.map(([target]) => target)).toEqual([
      { kind: 'cg', id: 'cg-01' },
      { kind: 'cg', id: 'cg-02' },
      { kind: 'ending', id: 'secret-end' },
      { kind: 'achievement', id: 'a1' },
    ])
  })

  it('continues the script after unlocking', () => {
    const onUnlock = vi.fn()
    const engine = createEngine([
      { type: 'unlock', achievement: 'intro' },
      { type: 'say', text: 'after' },
    ], { onUnlock })

    expect(engine.store.current.text).toBe('after')
    expect(onUnlock).toHaveBeenCalledWith({ kind: 'achievement', id: 'intro' })
  })

  it('exposes unlock() on the engine handle', () => {
    const onUnlock = vi.fn()
    const engine = createEngine([
      { type: 'say', text: 'line' },
    ], { onUnlock })

    expect(engine.unlock('cg', 'manual')).toBe(true)
    expect(engine.unlock('cg', '')).toBe(false)
    expect(onUnlock).toHaveBeenCalledWith({ kind: 'cg', id: 'manual' })
  })
})
