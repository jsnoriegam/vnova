import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { useVNovaEngine } from '../src/composables/useVNovaEngine.js'
import { beginVoice, endVoice, stopVoiceState } from '../src/core/voiceBus.js'
import { useVNovaReadTracker } from '../src/core/readTracker.js'

const mountedApps = []
let keyCounter = 0
const nextReadKey = () => `auto-skip-${keyCounter++}`

function mountEngine(script, options = {}) {
  let vn
  const app = createApp({
    setup() {
      vn = useVNovaEngine(script, {
        typewriterEnabled: false,
        keyboardEnabled: false,
        readKey: nextReadKey(),
        ...options,
      })
      return () => null
    },
  })
  app.mount(document.createElement('div'))
  mountedApps.push(app)
  return vn
}

afterEach(() => {
  while (mountedApps.length > 0) mountedApps.pop().unmount()
  vi.useRealTimers()
  stopVoiceState()
})

describe('auto mode', () => {
  it('advances dialogue after the auto delay', async () => {
    vi.useFakeTimers()
    const vn = mountEngine([
      { type: 'say', text: 'uno' },
      { type: 'say', text: `dos ${'x'.repeat(300)}` },
    ], { autoDelay: 10 })

    expect(vn.current.value.text).toBe('uno')
    vn.toggleAuto()
    await nextTick()

    await vi.advanceTimersByTimeAsync(200)
    expect(vn.current.value.text.startsWith('dos')).toBe(true)
  })

  it('waits for voice playback before advancing', async () => {
    vi.useFakeTimers()
    const vn = mountEngine([
      { type: 'say', text: 'uno' },
      { type: 'say', text: `dos ${'x'.repeat(300)}` },
    ], { autoDelay: 10 })

    const token = beginVoice('https://cdn.test/voice.ogg')
    vn.toggleAuto()
    await nextTick()

    await vi.advanceTimersByTimeAsync(300)
    expect(vn.current.value.text).toBe('uno')

    endVoice(token)
    await nextTick()
    await vi.advanceTimersByTimeAsync(300)
    expect(vn.current.value.text.startsWith('dos')).toBe(true)
  })

  it('can be disabled again with toggleAuto()', async () => {
    vi.useFakeTimers()
    const vn = mountEngine([
      { type: 'say', text: 'uno' },
      { type: 'say', text: `dos ${'x'.repeat(300)}` },
    ], { autoDelay: 10 })

    vn.toggleAuto()
    expect(vn.autoMode.value).toBe(true)
    vn.toggleAuto()
    expect(vn.autoMode.value).toBe(false)

    await nextTick()
    await vi.advanceTimersByTimeAsync(300)
    expect(vn.current.value.text).toBe('uno')
  })
})

describe('skip mode', () => {
  it('skips read lines and stops on the first unread one', async () => {
    vi.useFakeTimers()
    const readKey = nextReadKey()
    const script = [
      { type: 'say', text: 'uno' },
      { type: 'say', text: 'dos' },
      { type: 'say', text: 'tres' },
    ]
    const tracker = useVNovaReadTracker(readKey)
    tracker.markRead(script[0])
    tracker.markRead(script[1])

    const vn = mountEngine(script, { readKey })
    expect(vn.currentLineRead.value).toBe(true)

    vn.toggleSkip()
    await nextTick()
    await vi.advanceTimersByTimeAsync(21)
    await nextTick()
    expect(vn.current.value.text).toBe('dos')

    await vi.advanceTimersByTimeAsync(21)
    await nextTick()
    expect(vn.current.value.text).toBe('tres')
    expect(vn.currentLineRead.value).toBe(false)
    expect(vn.skipMode.value).toBe(false)
  })

  it('does not advance on an unread first line', async () => {
    vi.useFakeTimers()
    const vn = mountEngine([
      { type: 'say', text: 'nueva' },
      { type: 'say', text: 'después' },
    ])

    expect(vn.currentLineRead.value).toBe(false)
    vn.toggleSkip()
    await nextTick()
    await vi.advanceTimersByTimeAsync(200)

    expect(vn.current.value.text).toBe('nueva')
    expect(vn.skipMode.value).toBe(false)
  })

  it('is cancelled by a manual interaction', async () => {
    const vn = mountEngine([
      { type: 'say', text: 'uno' },
      { type: 'say', text: 'dos' },
    ], { typewriterEnabled: true })

    vn.toggleSkip()
    expect(vn.skipMode.value).toBe(true)
    vn.interact()
    expect(vn.skipMode.value).toBe(false)
  })
})

describe('read state API', () => {
  it('reports and clears read state through the composable', () => {
    const vn = mountEngine([
      { type: 'say', text: 'una línea' },
    ])

    expect(vn.isLineRead({ type: 'say', text: 'una línea' })).toBe(true)
    expect(vn.readCount.value).toBeGreaterThan(0)

    vn.clearReadState()
    expect(vn.isLineRead({ type: 'say', text: 'una línea' })).toBe(false)
  })
})
