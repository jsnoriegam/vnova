import { beforeEach, describe, expect, it } from 'vitest'
import { normalizeProgressKind, useVNovaProgress } from '../src/core/progress.js'

let counter = 0
const nextKey = () => `progress-test-${counter++}`

describe('meta-progress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('unlocks and checks entries across aliases', () => {
    const progress = useVNovaProgress(nextKey())

    expect(progress.has('cg', 'cg-01')).toBe(false)
    expect(progress.unlock('cg', 'cg-01')).toBe(true)
    expect(progress.unlock('cgs', 'cg-01')).toBe(false)
    expect(progress.has('cgs', 'cg-01')).toBe(true)
    expect(progress.has('cg', 'cg-02')).toBe(false)

    expect(progress.unlock('ending', 'true-end')).toBe(true)
    expect(progress.unlock('achievement', 'first-step')).toBe(true)
    expect(progress.unlock('chapter', 'chapter-2')).toBe(true)

    expect(progress.state.value).toEqual({
      cgs: ['cg-01'],
      endings: ['true-end'],
      achievements: ['first-step'],
      chapters: ['chapter-2'],
    })
    expect(progress.counts.value).toEqual({
      cg: 1, ending: 1, achievement: 1, chapter: 1,
    })
  })

  it('unlocks several entries in one call', () => {
    const progress = useVNovaProgress(nextKey())

    expect(progress.unlockMany([
      { kind: 'cg', id: 'a' },
      { kind: 'cg', id: 'b' },
      { kind: 'ending', id: 'end' },
      { kind: 'cg', id: 'a' },
      { kind: 'unknown', id: 'nope' },
    ])).toBe(3)

    expect(progress.state.value.cgs).toEqual(['a', 'b'])
    expect(progress.state.value.endings).toEqual(['end'])
  })

  it('resets a single kind or everything', () => {
    const progress = useVNovaProgress(nextKey())
    progress.unlockMany([
      { kind: 'cg', id: 'a' },
      { kind: 'ending', id: 'end' },
    ])

    progress.reset('cg')
    expect(progress.state.value.cgs).toEqual([])
    expect(progress.state.value.endings).toEqual(['end'])

    progress.reset()
    expect(progress.state.value).toEqual({
      cgs: [], endings: [], achievements: [], chapters: [],
    })
  })

  it('persists entries to localStorage', () => {
    const key = nextKey()
    const progress = useVNovaProgress(key)
    progress.unlock('cg', 'a')
    progress.unlock('ending', 'end')
    progress.flush()

    const raw = JSON.parse(localStorage.getItem(`${key}:progress`))
    expect(raw.cgs).toContain('a')
    expect(raw.endings).toContain('end')
  })

  it('ignores invalid kinds and ids', () => {
    const progress = useVNovaProgress(nextKey())
    expect(progress.unlock('unknown', 'x')).toBe(false)
    expect(progress.unlock('cg', '')).toBe(false)
    expect(progress.has('nope', 'x')).toBe(false)
  })

  it('normalizes public kind aliases', () => {
    expect(normalizeProgressKind('cg')).toBe('cgs')
    expect(normalizeProgressKind('endings')).toBe('endings')
    expect(normalizeProgressKind('achievement')).toBe('achievements')
    expect(normalizeProgressKind('chapter')).toBe('chapters')
    expect(normalizeProgressKind('unknown')).toBeNull()
  })
})
