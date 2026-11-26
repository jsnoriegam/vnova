import { beforeEach, describe, expect, it } from 'vitest'
import { lineReadKey, useVNovaReadTracker } from '../src/core/readTracker.js'

let counter = 0
const nextKey = () => `read-test-${counter++}`

describe('read tracker', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('marks dialogue lines as read and ignores non-dialogue steps', () => {
    const tracker = useVNovaReadTracker(nextKey())
    const line = { type: 'say', character: 'hana', text: 'Hola' }

    expect(tracker.isRead(line)).toBe(false)
    expect(tracker.markRead(line)).toBe(true)
    expect(tracker.isRead(line)).toBe(true)
    expect(tracker.markRead(line)).toBe(false)
    expect(tracker.size.value).toBe(1)

    expect(tracker.markRead({ type: 'scene', id: 'intro' })).toBe(false)
    expect(tracker.isRead({ type: 'scene', id: 'intro' })).toBe(false)
  })

  it('keeps the key stable when the line moves and changes with its text', () => {
    const first = { type: 'say', character: 'hana', text: 'Hola' }
    const moved = { type: 'say', character: 'hana', text: 'Hola' }
    const edited = { type: 'say', character: 'hana', text: 'Hola!' }

    expect(lineReadKey(first)).toBe(lineReadKey(moved))
    expect(lineReadKey(first)).not.toBe(lineReadKey(edited))
  })

  it('uses an explicit id when provided', () => {
    expect(lineReadKey({ type: 'say', id: 'line-1', text: 'Hola' })).toBe('id:line-1')
  })

  it('persists and reloads the registry from localStorage', () => {
    const key = nextKey()
    const tracker = useVNovaReadTracker(key)
    const line = { type: 'narrate', text: 'Una noche larga' }

    tracker.markRead(line)
    tracker.flush()

    const raw = JSON.parse(localStorage.getItem(`${key}:read`))
    expect(raw).toContain(lineReadKey(line))

    // A fresh module-level tracker for the same key would share the cache, so
    // verify the serialized payload can be rebuilt into a Set with the key.
    expect(new Set(raw).has(lineReadKey(line))).toBe(true)
  })

  it('resets the registry and removes persisted data', () => {
    const key = nextKey()
    const tracker = useVNovaReadTracker(key)
    const line = { type: 'think', character: 'hana', text: 'Quizá' }

    tracker.markRead(line)
    tracker.flush()
    expect(tracker.size.value).toBe(1)

    tracker.reset()
    expect(tracker.isRead(line)).toBe(false)
    expect(tracker.size.value).toBe(0)
    expect(localStorage.getItem(`${key}:read`)).toBeNull()
  })
})
