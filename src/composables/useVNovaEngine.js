/**
 * vnova-engine — composables/useVNovaEngine.js
 *
 * Composable principal para el autor. Envuelve createEngine() y expone
 * solo lo que un autor de novela visual necesita tocar:
 *
 *   - Control de avance: interact(), choose(), back(), jump(), restart()
 *   - Estado de escena: current, stage, background, image
 *   - Diálogo: displayedText, textComplete, speakerName, speakerColor
 *   - Layers de fondo con crossfade: bgLayers, bgLayerStyle
 *   - Teclado y click automáticos (configurable)
 *
 * Uso mínimo:
 *   const vn = useVNovaEngine(script)
 *   vn.interact()            // avanzar / skip typewriter
 *   vn.choose(option)        // elegir opción
 *   vn.current               // paso actual
 *   vn.displayedText         // texto con efecto typewriter
 *
 * Uso con opciones:
 *   const vn = useVNovaEngine(script, {
 *     characters,
 *     assets,
 *     typewriterSpeed: 20,
 *     onAudio: audio.onAudio,
 *   })
 */

import { ref, computed, watch, onMounted, onUnmounted, unref } from 'vue'
import { createEngine } from '../core/engine.js'

const noop = () => {}
const BG_DURATION_MS = 400

const SPACEBAR_FAST_FORWARD_MODES = new Set(['fullspeed', 'throttled', 'off'])

function normalizeSpacebarFastForwardMode(value) {
  if (value === true || value === 'true' || value === 'on' || value === 'fullspeed') return 'fullspeed'
  if (value === false || value === 'false' || value === 'off') return 'off'
  if (value === 'throttled') return 'throttled'
  return 'fullspeed'
}

export function useVNovaEngine(script, options = {}) {
  const {
    characters       = {},
    assets           = {},
    credits          = [],
    particles        = {},
    quests           = [],
    initialState     = {},
    typewriterSpeed  = 30,
    typewriterEnabled = true,
    keyboardEnabled  = true,
    spacebarFastForward = 'fullspeed',
    autoAdvanceDelay = 0,
    onAudio          = noop,
    onParticles      = noop,
    onVideo          = noop,
    onNotify         = noop,
    onEnd            = noop,
    pinia            = null,
  } = options

  // ── Engine ────────────────────────────────────────────────────────────────
  const engine = createEngine(script, {
    characters,
    assets,
    credits,
    particles,
    quests,
    initialState,
    autoAdvanceDelay,
    onAudio,
    onParticles,
    onVideo,
    onNotify,
    onEnd,
    pinia,
  })

  const {
    store,
    stageArray,
    speakerName,
    speakerColor,
    advance,
    choose,
    submitInput,
    submitSelect,
    closeModal,
    back,
    jump,
    restart,
    start,
    exitMenu,
    getVar,
    setVar,
    getSetting,
    setSetting,
  } = engine

  // ── Typewriter ────────────────────────────────────────────────────────────
  const displayedText = ref('')
  const textComplete  = ref(false)
  let _twTimer            = null
  let _twRunId            = 0
  let _autoContinueTimer  = null
  let _suspendNextAuto    = false

  function _clearTw() {
    _twRunId += 1
    if (_twTimer !== null) {
      clearTimeout(_twTimer)
      _twTimer = null
    }
  }
  function _clearAutoContinue() { if (_autoContinueTimer !== null) { clearTimeout(_autoContinueTimer); _autoContinueTimer = null } }

  function _speed() {
    const s = store.settings.typewriterSpeed ?? typewriterSpeed
    return Math.max(1, Number.isFinite(s) ? s : typewriterSpeed)
  }

  function _runTypewriter(fullText, startIndex = 0, initialText = '') {
    _clearTw()
    _clearAutoContinue()
    const runId = _twRunId
    if (!typewriterEnabled || !fullText) {
      displayedText.value = fullText ?? ''
      textComplete.value  = true
      return
    }
    const chars = [...fullText]
    const safe  = Math.max(0, Math.min(Number(startIndex) || 0, chars.length))
    displayedText.value = safe > 0 ? (initialText ?? '') : ''

    if (safe >= chars.length) {
      displayedText.value = fullText
      textComplete.value  = true
      return
    }

    textComplete.value = false
    let i = safe
    function tick() {
      if (runId !== _twRunId) return
      displayedText.value += chars[i++]
      if (i >= chars.length) { _twTimer = null; textComplete.value = true; return }
      _twTimer = setTimeout(tick, _speed())
    }
    _twTimer = setTimeout(tick, _speed())
  }

  function skipTypewriter() {
    const step = store.current
    if (step?.type === 'say' || step?.type === 'think' || step?.type === 'narrate') {
      _clearTw()
      displayedText.value = step.text ?? ''
      textComplete.value  = true
    }
  }

  function resumeTypewriter() {
    const step = store.current
    if (_twTimer !== null || textComplete.value) return
    if (step?.type !== 'say' && step?.type !== 'think' && step?.type !== 'narrate') return
    const fullText = step.text ?? ''
    if (!typewriterEnabled || !fullText) { displayedText.value = fullText; textComplete.value = true; return }
    const rendered = [...(displayedText.value ?? '')].length
    _runTypewriter(fullText, rendered, displayedText.value ?? '')
  }

  function _autoContinueDelay(step) {
    if (!step) return null
    const raw = step.advance ?? step.continue
    if (raw === true) return 0
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(0, n) : null
  }

  watch(() => store.current, (step) => {
    _clearAutoContinue()
    if (!step) {
      displayedText.value = ''
      textComplete.value = true
      return
    }
    if (step.type === 'say' || step.type === 'think' || step.type === 'narrate') {
      _runTypewriter(step.text ?? '')
    } else {
      // Non-dialogue steps should never block interact() waiting for typewriter.
      _clearTw()
      displayedText.value = ''
      textComplete.value = true
    }
    if (_suspendNextAuto) _suspendNextAuto = false
  }, { immediate: true })

  watch([() => store.current, () => store.cursor, () => textComplete.value], ([step, cursor, done]) => {
    _clearAutoContinue()
    if (_suspendNextAuto || !done || !step) return
    if (step.type !== 'say' && step.type !== 'think' && step.type !== 'narrate') return
    const delay = _autoContinueDelay(step)
    if (delay === null) return
    _autoContinueTimer = setTimeout(() => {
      _autoContinueTimer = null
      if (_suspendNextAuto || store.ended || store.awaitingChoice) return
      if (store.cursor !== cursor || store.current !== step) return
      advance()
    }, delay)
  })

  // ── Layers de fondo con crossfade ─────────────────────────────────────────
  const bgLayers = ref([
    { key: 'a', src: null, color: null, transition: 'cut', active: true,  visible: false, entering: false },
    { key: 'b', src: null, color: null, transition: 'cut', active: false, visible: false, entering: false },
  ])
  let _bgTimer = null

  const _active   = () => bgLayers.value.find(l => l.active)
  const _inactive = () => bgLayers.value.find(l => !l.active)

  watch(() => store.background, (bg) => {
    if (!bg) return
    if (bg.transition === 'cut') {
      const a = _active()
      a.src = bg.src; a.color = bg.color; a.transition = 'cut'
      a.visible = !!(bg.src || bg.color); a.entering = false
      const b = _inactive()
      b.visible = false; b.entering = false
      return
    }
    if (_bgTimer !== null) {
      clearTimeout(_bgTimer); _bgTimer = null
      const prev = _inactive(); prev.visible = false; prev.entering = false
    }
    const out = _active()
    const inn = _inactive()
    inn.src = bg.src; inn.color = bg.color; inn.transition = bg.transition
    inn.visible = true; inn.entering = true
    out.active = false; inn.active = true
    requestAnimationFrame(() => requestAnimationFrame(() => { inn.entering = false }))
    _bgTimer = setTimeout(() => { out.visible = false; out.entering = false; _bgTimer = null }, BG_DURATION_MS)
  }, { immediate: true })

  function bgLayerStyle(layer) {
    if (layer.src)   return { backgroundImage: `url(${layer.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    if (layer.color) return { background: layer.color }
    return {}
  }

  // ── Layer de imagen ───────────────────────────────────────────────────────
  const imageTransitioning = ref(false)
  watch(() => store.image, () => {
    if (store.image?.transition === 'cut') return
    imageTransitioning.value = true
    setTimeout(() => { imageTransitioning.value = false }, BG_DURATION_MS)
  })

  const imageStyle = computed(() => {
    const image = store.image
    if (!image?.src) return {}
    let backgroundSize = 'contain'
    if (image.fit === 'width')  backgroundSize = '100% auto'
    if (image.fit === 'height') backgroundSize = 'auto 100%'
    return { backgroundImage: `url(${image.src})`, backgroundSize, backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
  })

  // ── Interacción ───────────────────────────────────────────────────────────
  function interact() {
    const step = store.current
    if (store.ended || store.awaitingChoice) return
    const isDialogueStep =
      step?.type === 'say' ||
      step?.type === 'think' ||
      step?.type === 'narrate'
    if (isDialogueStep && !textComplete.value) { skipTypewriter(); return }
    advance()
  }

  function backWithGuards() {
    _clearTw(); _clearAutoContinue(); _suspendNextAuto = true
    return back()
  }

  function restartWithGuards() {
    _clearTw(); _clearAutoContinue(); _suspendNextAuto = true
    restart()
  }

  // ── Teclado ───────────────────────────────────────────────────────────────
  function handleKeydown(e) {
    if (!unref(keyboardEnabled)) return
    if (e.key === ' ') {
      e.preventDefault()
      const mode = normalizeSpacebarFastForwardMode(getSetting('spacebarFastForward') ?? spacebarFastForward)
      if (mode === 'off') return
      if (mode === 'throttled' && e.repeat) return
      interact()
      return
    }
    if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); interact(); return }
    if (e.key === 'ArrowLeft') { e.preventDefault(); backWithGuards() }
  }

  onMounted  (() => { if (keyboardEnabled) window.addEventListener('keydown', handleKeydown) })
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    _clearTw(); _clearAutoContinue()
  })

  // ── API pública ───────────────────────────────────────────────────────────
  return {
    // Estado del store (reactivo)
    store,
    current:       computed(() => store.current),
    awaitingChoice: computed(() => store.awaitingChoice),
    ended:         computed(() => store.ended),
    stage:         stageArray,
    background:    computed(() => store.background),
    image:         computed(() => store.image),
    history:       computed(() => store.history),
    canBack:       computed(() => store.backStack.length > 0),
    speakerName,
    speakerColor,

    // Diálogo
    displayedText: computed(() => displayedText.value),
    textComplete,
    skipTypewriter,
    resumeTypewriter,

    // Fondo e imagen
    bgLayers,
    bgLayerStyle,
    imageStyle,
    imageTransitioning,

    // Acciones del autor
    interact,
    choose,
    submitInput,
    submitSelect,
    closeModal,
    back:    backWithGuards,
    jump,
    restart: restartWithGuards,
    start,
    exitMenu,

    // Variables de historia
    getVar,
    setVar,
    getSetting,
    setSetting,

    // Motor interno (para casos avanzados)
    engine,
  }
}
