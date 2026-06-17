/**
 * vnova-engine — composables/useVNovaAudio.js
 *
 * Optional audio composable. Pass its `onAudio` handler to useVNova / VNovaStage
 * and it will manage BGM + SFX playback via the Web Audio API with no external
 * dependencies.
 *
 * Features:
 *   - BGM: seamless crossfade between tracks, fade-out on stop
 *   - SFX: pooled <audio> instances so rapid-fire sounds overlap correctly
 *   - Reactive master volume (bgmVolume / sfxVolume) wired to a Pinia store
 *   - Graceful fallback when Web Audio API is unavailable
 *
 * Usage:
 *   const audio = useVNovaAudio({ bgmVolume: 0.6, sfxVolume: 0.8 })
 *
 *   // inside your template / setup:
 *   <VNovaStage :script="script" :options="{ onAudio: audio.onAudio }" />
 *
 *   // control volume at runtime:
 *   audio.setBgmVolume(0.4)
 *   audio.setSfxVolume(1.0)
 *   audio.stopBgm()
 *   audio.stopAll()
 */

import { ref, watch, onUnmounted } from 'vue'

const FADE_DURATION = 800   // ms — BGM crossfade duration
const SFX_POOL_SIZE = 4     // max simultaneous instances per SFX track

// ─── helpers ──────────────────────────────────────────────────────────────────

function createAudioContext() {
  try {
    const Ctor = window.AudioContext ?? window.webkitAudioContext
    return Ctor ? new Ctor() : null
  } catch {
    return null
  }
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Linearly ramp a GainNode to a target value over `durationMs`.
 * Returns a promise that resolves when the ramp is complete.
 */
function rampGain(gainNode, targetValue, durationMs, ctx) {
  const durationSec = durationMs / 1000
  const now = ctx.currentTime
  gainNode.gain.cancelScheduledValues(now)
  gainNode.gain.setValueAtTime(gainNode.gain.value, now)
  gainNode.gain.linearRampToValueAtTime(targetValue, now + durationSec)
  return new Promise((resolve) => setTimeout(resolve, durationMs))
}

// ─── composable ───────────────────────────────────────────────────────────────

export function useVNovaAudio(initialOptions = {}) {
  const {
    bgmVolume: initBgmVolume = 0.6,
    sfxVolume: initSfxVolume = 0.8,
    fadeDuration = FADE_DURATION,
  } = initialOptions

  // ── reactive volume state ────────────────────────────────────────────────
  const bgmVolume = ref(clamp(initBgmVolume))
  const sfxVolume = ref(clamp(initSfxVolume))

  // ── Web Audio context (lazy-initialized on first interaction) ────────────
  let _ctx = null

  function _getCtx() {
    if (_ctx) return _ctx
    _ctx = createAudioContext()
    return _ctx
  }

  function _resumeCtx() {
    // Browsers suspend AudioContext until a user gesture
    const ctx = _getCtx()
    if (ctx && ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  // ── BGM state ────────────────────────────────────────────────────────────
  //
  // We keep two BGM slots (current / next) to enable crossfade.
  // Each slot: { el: HTMLAudioElement, gainNode: GainNode, src: string }

  let _bgmCurrent = null   // { el, gainNode, src }
  let _bgmNext    = null
  let _bgmMaster  = null   // master GainNode for BGM (volume control)

  function _ensureBgmMaster(ctx) {
    if (_bgmMaster) return _bgmMaster
    _bgmMaster = ctx.createGain()
    _bgmMaster.gain.value = bgmVolume.value
    _bgmMaster.connect(ctx.destination)
    return _bgmMaster
  }

  async function _createBgmSlot(ctx, src, volume, loop) {
    const el = new Audio()
    el.src  = src
    el.loop = loop ?? true
    el.crossOrigin = 'anonymous'

    const sourceNode = ctx.createMediaElementSource(el)
    const gainNode   = ctx.createGain()
    gainNode.gain.value = 0   // start silent — we fade in
    sourceNode.connect(gainNode)
    gainNode.connect(_ensureBgmMaster(ctx))

    try { await el.play() } catch (e) {
      if (import.meta.env?.DEV) console.warn('[vnova] BGM autoplay blocked:', e.message)
    }

    return { el, gainNode, src, sourceNode }
  }

  async function _playBgm(src, volume, loop) {
    const ctx = _resumeCtx()
    if (!ctx) return _playBgmFallback(src, volume, loop)

    // Same track already playing — just adjust volume
    if (_bgmCurrent?.src === src) {
      rampGain(_bgmCurrent.gainNode, volume, fadeDuration / 2, ctx)
      return
    }

    // Fade out current track while new one fades in (crossfade)
    const outgoing = _bgmCurrent
    _bgmCurrent = null

    const incoming = await _createBgmSlot(ctx, src, volume, loop)
    _bgmCurrent = incoming

    // Fade in incoming
    rampGain(incoming.gainNode, volume, fadeDuration, ctx)

    // Fade out and teardown outgoing
    if (outgoing) {
      await rampGain(outgoing.gainNode, 0, fadeDuration, ctx)
      outgoing.el.pause()
      outgoing.el.src = ''
      try { outgoing.sourceNode.disconnect() } catch {}
      try { outgoing.gainNode.disconnect() }   catch {}
    }
  }

  async function _stopBgm(immediate = false) {
    if (!_bgmCurrent) return
    const slot = _bgmCurrent
    _bgmCurrent = null
    const ctx = _getCtx()
    if (ctx && !immediate) {
      await rampGain(slot.gainNode, 0, fadeDuration, ctx)
    }
    slot.el.pause()
    slot.el.src = ''
    try { slot.sourceNode.disconnect() } catch {}
    try { slot.gainNode.disconnect() }   catch {}
  }

  // Fallback for environments without Web Audio API (e.g. older browsers)
  let _fallbackBgm = null
  function _playBgmFallback(src, volume, loop) {
    if (_fallbackBgm) { _fallbackBgm.pause(); _fallbackBgm = null }
    const el = new Audio(src)
    el.loop   = loop ?? true
    el.volume = clamp(volume)
    el.play().catch(() => {})
    _fallbackBgm = el
  }
  function _stopBgmFallback() {
    if (_fallbackBgm) { _fallbackBgm.pause(); _fallbackBgm = null }
  }

  // ── BGM master volume ────────────────────────────────────────────────────
  watch(bgmVolume, (v) => {
    const ctx = _getCtx()
    if (ctx && _bgmMaster) {
      _bgmMaster.gain.value = clamp(v)
    } else if (_fallbackBgm) {
      _fallbackBgm.volume = clamp(v)
    }
  })

  // ── SFX state ────────────────────────────────────────────────────────────
  //
  // Each SFX track gets a pool of Audio elements so overlapping plays work.
  // We also route through Web Audio to apply the SFX master gain.

  const _sfxPools = new Map()   // src → Audio[]
  let   _sfxMaster = null       // GainNode

  function _ensureSfxMaster(ctx) {
    if (_sfxMaster) return _sfxMaster
    _sfxMaster = ctx.createGain()
    _sfxMaster.gain.value = sfxVolume.value
    _sfxMaster.connect(ctx.destination)
    return _sfxMaster
  }

  function _playSfx(src, volume) {
    const ctx = _resumeCtx()

    if (ctx) {
      _ensureSfxMaster(ctx)
      // Get or build pool
      if (!_sfxPools.has(src)) _sfxPools.set(src, [])
      const pool = _sfxPools.get(src)

      // Find an idle element or create a new one (up to pool size)
      let el = pool.find(e => e.paused || e.ended)
      if (!el && pool.length < SFX_POOL_SIZE) {
        el = new Audio()
        el.crossOrigin = 'anonymous'
        const sourceNode = ctx.createMediaElementSource(el)
        // Individual gain for per-play volume
        const gainNode = ctx.createGain()
        gainNode.connect(_sfxMaster)
        sourceNode.connect(gainNode)
        el._gainNode = gainNode
        pool.push(el)
      }
      if (!el) el = pool[0]   // all busy — reuse oldest

      el.src = src
      if (el._gainNode) el._gainNode.gain.value = clamp(volume)
      el.currentTime = 0
      el.play().catch(() => {})
    } else {
      // Fallback: plain Audio
      const el = new Audio(src)
      el.volume = clamp(volume)
      el.play().catch(() => {})
    }
  }

  // ── SFX master volume ────────────────────────────────────────────────────
  watch(sfxVolume, (v) => {
    const ctx = _getCtx()
    if (ctx && _sfxMaster) _sfxMaster.gain.value = clamp(v)
  })

  // ── cleanup ──────────────────────────────────────────────────────────────
  function stopAll() {
    _stopBgm(true)
    _stopBgmFallback()
    _sfxPools.forEach((pool) => pool.forEach(el => { el.pause(); el.currentTime = 0 }))
    _sfxPools.clear()
  }

  onUnmounted(stopAll)

  // ── onAudio handler (passed to useVNova / VNovaStage) ────────────────────
  function onAudio({ type, track, volume = 1, loop = true }) {
    if (type === 'bgm') {
      if (!track) { _stopBgm(); _stopBgmFallback(); return }
      _playBgm(track, clamp(volume * bgmVolume.value), loop)
    }
    if (type === 'sfx') {
      if (!track) return
      _playSfx(track, clamp(volume * sfxVolume.value))
    }
  }

  // ── public API ────────────────────────────────────────────────────────────
  return {
    onAudio,
    bgmVolume,
    sfxVolume,
    setBgmVolume: (v) => { bgmVolume.value = clamp(v) },
    setSfxVolume: (v) => { sfxVolume.value = clamp(v) },
    stopBgm:  () => _stopBgm(),
    stopAll,
  }
}
