import { describe, expect, it, vi } from 'vitest'
import { createEngine } from '../src/core/engine.js'

const characters = { hana: { name: 'Hana' } }

describe('voice playback events', () => {
  it('emits a voice event for an asset-registered voice', () => {
    const onAudio = vi.fn()
    createEngine([
      { type: 'say', character: 'hana', text: 'Hola', voice: 'hello' },
    ], {
      characters,
      assets: { voices: { hello: '/audio/hello.ogg' } },
      onAudio,
    })

    expect(onAudio).toHaveBeenCalledWith(expect.objectContaining({
      type: 'voice',
      track: '/audio/hello.ogg',
      character: 'hana',
      loop: false,
    }))
  })

  it('emits a voice event for a direct URL and applies voice volume', () => {
    const onAudio = vi.fn()
    const engine = createEngine([
      { type: 'say', text: 'Hola', voice: 'https://cdn.test/voice.ogg', voiceVolume: 0.5 },
    ], { onAudio })

    expect(onAudio).toHaveBeenCalledWith(expect.objectContaining({
      type: 'voice',
      track: 'https://cdn.test/voice.ogg',
      volume: 0.4,
    }))

    engine.setSetting('voiceVolume', 0.4)
    engine.restart()
    expect(onAudio).toHaveBeenLastCalledWith(expect.objectContaining({
      type: 'voice',
      track: 'https://cdn.test/voice.ogg',
      volume: 0.2,
    }))
  })

  it('stops the previous voice when the next line has no voice', () => {
    const onAudio = vi.fn()
    const engine = createEngine([
      { type: 'say', text: 'uno', voice: 'https://cdn.test/a.ogg' },
      { type: 'say', text: 'dos' },
    ], { onAudio })

    onAudio.mockClear()
    engine.advance()

    expect(onAudio).toHaveBeenCalledWith(expect.objectContaining({
      type: 'voice',
      track: null,
      volume: 0,
    }))
  })

  it('stops voice when leaving dialogue for another step type', () => {
    const onAudio = vi.fn()
    const engine = createEngine([
      { type: 'say', text: 'uno', voice: 'https://cdn.test/a.ogg' },
      { type: 'scene', color: '#000' },
    ], { onAudio })

    onAudio.mockClear()
    engine.advance()

    expect(onAudio).toHaveBeenCalledWith(expect.objectContaining({
      type: 'voice',
      track: null,
    }))
  })

  it('ignores unknown voice ids instead of building a bogus URL', () => {
    const onAudio = vi.fn()
    createEngine([
      { type: 'say', text: 'uno', voice: 'missing-voice-id' },
    ], { onAudio })

    expect(onAudio).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'voice' }))
  })
})
