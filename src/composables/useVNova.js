/**
 * vnova-engine — composables/useVNova.js
 *
 * Vue 3 composable that wraps createEngine() and adds:
 *   - keyboard / click / touch handling
 *   - typewriter effect for dialogue text
 *   - transition state for background changes
 *   - auto-save / restore via localStorage
 */

import { ref, computed, watch, onMounted, onUnmounted, unref } from 'vue'
import { createEngine } from '../core/engine.js'

export function useVNova(script, options = {}) {
  const {
    characters        = {},
    assets            = {},
    typewriterSpeed   = 30,
    typewriterEnabled = true,
    keyboardEnabled   = true,
    saveKey           = null,
    onAudio           = () => {},
    onEnd             = () => {},
    pinia             = null,
  } = options

  // ── engine ──────────────────────────────────────────────────────────────────
  const engine = createEngine(script, { characters, assets, onAudio, onEnd, pinia })
  const {
    store,
    stageArray, speakerName, speakerColor,
    quests, listQuests, getQuest, evaluateQuests, setQuestStatus,
    advance, choose, back, jump, restart, exitMenu,
    getVar, setVar, getSetting, setSetting,
  } = engine

  // `state` is the Pinia store itself — keep the alias for call steps and templates
  const state = store

  // ── typewriter ───────────────────────────────────────────────────────────────
  //
  // Uses recursive setTimeout instead of setInterval to avoid drift:
  // each tick schedules the next one relative to `performance.now()`, so
  // cumulative error stays bounded regardless of text length.
  //
  // Speed is read on every tick, so changing settings.typewriterSpeed
  // mid-sentence takes effect immediately on the next character.
  const displayedText      = ref('')
  const textComplete       = ref(false)
  let   _twTimer           = null
  let   _autoContinueTimer = null
  let   _suspendCurrentAuto = false

  function _clearTw() {
    if (_twTimer !== null) { clearTimeout(_twTimer); _twTimer = null }
  }

  function _clearAutoContinue() {
    if (_autoContinueTimer !== null) { clearTimeout(_autoContinueTimer); _autoContinueTimer = null }
  }

  // Read speed reactively on every tick — no computed needed
  function _currentSpeed() {
    const s = store.settings.typewriterSpeed ?? typewriterSpeed
    return Math.max(1, Number.isFinite(s) ? s : typewriterSpeed)
  }

  function _runTypewriter(fullText) {
    _clearTw()
    _clearAutoContinue()
    if (!typewriterEnabled || !fullText) {
      displayedText.value = fullText ?? ''
      textComplete.value  = true
      return
    }
    // Spread to correctly iterate Unicode codepoints (emoji, CJK, etc.)
    const chars = [...fullText]
    displayedText.value = ''
    textComplete.value  = false
    let i = 0

    function tick() {
      displayedText.value += chars[i]
      i++
      if (i >= chars.length) {
        _twTimer = null
        textComplete.value = true
        return
      }
      // Schedule next character — reads speed reactively on every tick
      _twTimer = setTimeout(tick, _currentSpeed())
    }

    _twTimer = setTimeout(tick, _currentSpeed())
  }

  function skipTypewriter() {
    const step = store.current
    if (step?.type === 'say' || step?.type === 'think' || step?.type === 'narrate') {
      _clearTw()
      displayedText.value = step.text ?? ''
      textComplete.value  = true
    }
  }

  function _getCurrentAutoContinueDelay(step) {
    if (!step) return null
    const raw = step.advance ?? step.continue
    if (raw === true)  return 0
    if (!raw)          return null
    const numeric = Number(raw)
    return Number.isFinite(numeric) ? Math.max(0, numeric) : null
  }

  watch(
    () => store.current,
    (step) => {
      _clearAutoContinue()
      if (!step) return
      if (step.type === 'say' || step.type === 'think' || step.type === 'narrate') {
        _runTypewriter(step.text ?? '')
      }
      if (_suspendCurrentAuto) _suspendCurrentAuto = false
    },
    { immediate: true }
  )

  watch(
    [() => store.current, () => store.cursor, () => textComplete.value],
    ([step, cursor, isComplete]) => {
      _clearAutoContinue()
      if (_suspendCurrentAuto || !isComplete || !step) return
      if (step.type !== 'say' && step.type !== 'think' && step.type !== 'narrate') return
      const delay = _getCurrentAutoContinueDelay(step)
      if (delay === null) return
      _autoContinueTimer = setTimeout(() => {
        _autoContinueTimer = null
        if (_suspendCurrentAuto) return
        if (store.ended || store.awaitingChoice) return
        if (store.cursor !== cursor || store.current !== step) return
        advance()
      }, delay)
    }
  )

  // ── dual-layer background crossfade ──────────────────────────────────────────
  //
  // Two layers (A and B) are stacked. The "active" layer always shows the
  // current background. When a non-cut transition fires we:
  //   1. Copy the current background into the outgoing layer (behind).
  //   2. Flip the active layer to the new background (on top, starts transparent).
  //   3. Animate opacity/transform so the new layer fades/slides in.
  //   4. After the transition duration, clean up the outgoing layer.
  //
  // `cut` skips all of this — just swap instantly.
  const BG_DURATION_MS = 400

  const bgLayers = ref([
    { key: 'a', src: null, color: null, transition: 'cut', active: true,  visible: false, entering: false },
    { key: 'b', src: null, color: null, transition: 'cut', active: false, visible: false, entering: false },
  ])

  let _bgTransitionTimer = null

  function _activeBgLayer()   { return bgLayers.value.find(l => l.active)  }
  function _inactiveBgLayer() { return bgLayers.value.find(l => !l.active) }

  watch(
    () => store.background,
    (bg) => {
      if (!bg) return

      if (bg.transition === 'cut') {
        // Instant swap — update active layer, hide inactive
        const active = _activeBgLayer()
        active.src        = bg.src
        active.color      = bg.color
        active.transition = 'cut'
        active.visible    = !!(bg.src || bg.color)
        active.entering   = false
        const inactive = _inactiveBgLayer()
        inactive.visible  = false
        inactive.entering = false
        return
      }

      // Non-cut: prepare crossfade
      if (_bgTransitionTimer !== null) {
        clearTimeout(_bgTransitionTimer)
        _bgTransitionTimer = null
        // Settle any in-progress transition before starting a new one
        const prev = _inactiveBgLayer()
        prev.visible  = false
        prev.entering = false
      }

      const outgoing = _activeBgLayer()
      const incoming = _inactiveBgLayer()

      // Incoming layer gets the new background and starts off-screen/transparent
      incoming.src        = bg.src
      incoming.color      = bg.color
      incoming.transition = bg.transition
      incoming.visible    = true
      incoming.entering   = true   // triggers CSS: opacity 0 / translated

      // Flip which layer is "active" (on top) — Vue reacts, CSS transition fires
      outgoing.active = false
      incoming.active = true

      // After one frame, remove the `entering` flag so CSS transition plays
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          incoming.entering = false
        })
      })

      // After the transition completes, hide the outgoing layer
      _bgTransitionTimer = setTimeout(() => {
        outgoing.visible  = false
        outgoing.entering = false
        _bgTransitionTimer = null
      }, BG_DURATION_MS)
    },
    { immediate: true }
  )

  function bgLayerStyle(layer) {
    if (layer.src)   return { backgroundImage: `url(${layer.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    if (layer.color) return { background: layer.color }
    return {}
  }

  // ── image layer transition (same dual-layer pattern, simpler) ─────────────
  const imageTransitioning = ref(false)

  watch(() => store.image, () => {
    if (store.image.transition === 'cut') return
    imageTransitioning.value = true
    setTimeout(() => { imageTransitioning.value = false }, BG_DURATION_MS)
  })

  // ── interaction ──────────────────────────────────────────────────────────────
  function interact() {
    if (store.ended || store.awaitingChoice) return
    if (!textComplete.value) { skipTypewriter(); return }
    advance()
  }

  function backWithGuards() {
    _clearTw()
    _clearAutoContinue()
    _suspendCurrentAuto = true
    return back()
  }

  function restartWithGuards() {
    _clearTw()
    _clearAutoContinue()
    _suspendCurrentAuto = true
    restart()
  }

  function handleKeydown(e) {
    if (!unref(keyboardEnabled)) return
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault(); interact()
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault(); backWithGuards()
    }
  }

  onMounted(() => {
    if (keyboardEnabled) window.addEventListener('keydown', handleKeydown)
    if (saveKey) _loadSave()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    _clearTw()
    _clearAutoContinue()
  })

  // ── save / restore ───────────────────────────────────────────────────────────
  function save() {
    if (!saveKey) return
    const payload = {
      version: 2,
      snapshot: {
        cursor:         store.cursor,
        current:        store.current,
        stage:          store.stage,
        background:     store.background,
        image:          store.image,
        bgm:            store.bgm,
        vars:           store.vars,
        quests:         store.quests,
        awaitingChoice: store.awaitingChoice,
        ended:          store.ended,
        history:        store.history,
        backStack:      store.backStack,
        settings:       store.settings,
      },
    }
    localStorage.setItem(saveKey, JSON.stringify(payload))
    return true
  }

  function _loadSave() {
    if (!saveKey) return false
    try {
      const raw = localStorage.getItem(saveKey)
      if (!raw) return false
      const payload = JSON.parse(raw)

      // v2 snapshot
      if (payload?.snapshot && typeof payload.snapshot === 'object') {
        store.loadSnapshot(payload.snapshot)
        return true
      }

      // legacy: cursor-only format (doesn't re-fire call steps)
      if (typeof payload?.cursor === 'number') {
        engine.restart()
        const cursor = Math.max(0, payload.cursor)
        for (let i = 0; i < cursor; i++) {
          if (!store.awaitingChoice && !store.ended) engine.advance()
        }
        if (payload.vars) store.setVars(payload.vars)
        return true
      }

      return false
    } catch (e) {
      console.warn('[vnova] failed to restore save:', e)
      return false
    }
  }

  function load() {
    _clearTw()
    _clearAutoContinue()
    _suspendCurrentAuto = true
    return _loadSave()
  }

  function clearSave() {
    if (saveKey) localStorage.removeItem(saveKey)
  }

  // ── computed helpers for templates ──────────────────────────────────────────
  const imageStyle = computed(() => {
    const image = store.image
    if (!image?.src) return {}
    let backgroundSize = 'contain'
    if (image.fit === 'width')  backgroundSize = '100% auto'
    if (image.fit === 'height') backgroundSize = 'auto 100%'
    return {
      backgroundImage:    `url(${image.src})`,
      backgroundSize,
      backgroundRepeat:   'no-repeat',
      backgroundPosition: 'center',
    }
  })

  return {
    state,
    store,
    stageArray,
    speakerName,
    speakerColor,
    quests,
    displayedText: computed(() => displayedText.value),
    textComplete,
    bgLayers,
    bgLayerStyle,
    imageTransitioning,
    imageStyle,
    interact,
    choose,
    back: backWithGuards,
    jump,
    restart: restartWithGuards,
    exitMenu,
    save,
    load,
    clearSave,
    listQuests,
    getQuest,
    evaluateQuests,
    setQuestStatus,
    getVar,
    setVar,
    getSetting,
    setSetting,
    skipTypewriter,
    engine,
  }
}
