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

import { ref, computed, watch, onMounted, onUnmounted, unref, nextTick } from 'vue'
import { createEngine } from '../core/engine.js'
import { plainText, sliceRichText } from '../utils/richText.js'
import { normalizeSpacebarFastForward } from '../utils/normalize.js'
import { useVNovaReadTracker } from '../core/readTracker.js'
import { useVNovaProgress } from '../core/progress.js'
import { voicePlaying } from '../core/voiceBus.js'
import {
  createCrossfadeTransition,
  createSpriteEnter,
  createSpriteLeave,
  createSpriteDim,
  createShakeEffect,
  createFlashEffect,
  createZoomEffect,
  createPulseEffect,
  stopAnimation,
} from '../utils/animations.js'

const noop = () => {}
const BG_DURATION_MS = 400

export function useVNovaEngine(script, options = {}) {
  const {
    characters       = {},
    assets           = {},
    credits          = [],
    particles        = {},
    quests           = [],
    items            = {},
    itemTypes        = {},
    initialState     = {},
    typewriterSpeed  = 30,
    typewriterEnabled = true,
    keyboardEnabled  = true,
    spacebarFastForward = 'fullspeed',
    autoAdvanceDelay = 0,
    autoDelay         = 1200,
    deferStart       = false,
    onAudio          = noop,
    onParticles      = noop,
    onVideo          = noop,
    onNotify         = noop,
    onEffect         = null,
    onEnd            = noop,
    pinia            = null,
    sessionKey       = null,
    saveKey          = 'vnova',
    readKey          = null,
    progressKey      = null,
    onUnlock         = null,
    onItemUse        = null,
  } = options

  // ── Effect targets registry ─────────────────────────────────────────────
  const _effectTargets = new Map()

  function registerEffectTarget(target, element) {
    if (element) {
      _effectTargets.set(target, element)
    } else {
      _effectTargets.delete(target)
    }
  }

  function applyEffect(effect) {
    const { name, target = 'stage', duration, config = {} } = effect
    const element = _effectTargets.get(target)
    if (!element) return

    const effectOptions = { duration, ...config }

    switch (name) {
      case 'shake':
        return createShakeEffect(element, effectOptions)
      case 'flash':
        return createFlashEffect(element, effectOptions)
      case 'zoom':
        return createZoomEffect(element, effectOptions)
      case 'pulse':
        return createPulseEffect(element, effectOptions)
      default:
        if (import.meta.env.DEV) {
          console.warn(`[vnova] unknown effect: ${name}`)
        }
    }
  }

  const handleEffect = onEffect || applyEffect

  // ── Meta-progress ─────────────────────────────────────────────────────────
  const progress = useVNovaProgress(progressKey ?? readKey ?? saveKey)

  function handleUnlock(event) {
    if (event?.kind && event?.id) progress.unlock(event.kind, event.id)
    if (typeof onUnlock === 'function') onUnlock(event)
  }

  // ── Engine ────────────────────────────────────────────────────────────────
  const engine = createEngine(script, {
    characters,
    assets,
    credits,
    particles,
    quests,
    items,
    itemTypes,
    initialState,
    autoAdvanceDelay,
    deferStart: deferStart || !!sessionKey, // Defer if sessionKey to allow restoration
    onAudio,
    onParticles,
    onVideo,
    onNotify,
    onEffect: handleEffect,
    onUnlock: handleUnlock,
    onItemUse,
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

  // ── Session persistence ───────────────────────────────────────────────────
  let _sessionSaveTimer = null

  function _saveSession() {
    if (!sessionKey || typeof sessionStorage === 'undefined') return
    if (store.ended) {
      _clearSession()
      return
    }
    try {
      const { characters, credits, ...snapshot } = store.$state
      snapshot.anchor = engine.getSaveAnchor(store.cursor)
      sessionStorage.setItem(sessionKey, JSON.stringify(snapshot))
    } catch (e) {
      // sessionStorage might be full or disabled
    }
  }

  function _debouncedSaveSession() {
    if (!sessionKey) return
    if (_sessionSaveTimer !== null) clearTimeout(_sessionSaveTimer)
    _sessionSaveTimer = setTimeout(_saveSession, 100)
  }

  function _clearSession() {
    if (!sessionKey || typeof sessionStorage === 'undefined') return
    try {
      sessionStorage.removeItem(sessionKey)
    } catch (e) {
      // ignore
    }
  }

  function _restoreSession() {
    if (!sessionKey || typeof sessionStorage === 'undefined') return false
    try {
      const raw = sessionStorage.getItem(sessionKey)
      if (!raw) return false
      const snapshot = JSON.parse(raw)
      if (!snapshot || typeof snapshot !== 'object' || typeof snapshot.cursor !== 'number') return false
      const prepared = engine.resolveSaveSnapshot(snapshot)
      store.loadSnapshot(prepared)
      engine.syncRuntimeState()
      return true
    } catch (e) {
      return false
    }
  }

  let restoredFromSession = _restoreSession()

  if (sessionKey) {
    store.$subscribe(() => {
      _debouncedSaveSession()
    }, { detached: true })
  }

  // Start engine if not restored and not originally deferred
  if (!restoredFromSession && !deferStart) {
    start()
  }

  // Wrap restart/exitMenu to clear session
  const originalRestart = restart
  const originalExitMenu = exitMenu

  function restartWithSessionClear() {
    _clearSession()
    restoredFromSession = false
    return originalRestart()
  }

  function exitMenuWithSessionClear() {
    _clearSession()
    return originalExitMenu()
  }

  // ── Typewriter ────────────────────────────────────────────────────────────
  const displayedText = ref('')
  const textComplete  = ref(false)
  let _twTimer            = null
  let _twRunId            = 0
  let _autoContinueTimer  = null
  let _skipTimer          = null
  let _suspendNextAuto    = restoredFromSession

  // ── Auto / skip / read tracking ───────────────────────────────────────────
  const readTracker = useVNovaReadTracker(readKey ?? saveKey)
  const autoMode = ref(false)
  const skipMode = ref(false)
  const skipHeld = ref(false)
  const currentLineRead = ref(false)
  const skipActive = computed(() => skipMode.value || skipHeld.value)

  function _isDialogueStep(step) {
    return step?.type === 'say' || step?.type === 'think' || step?.type === 'narrate'
  }

  function _clearSkipTimer() {
    if (_skipTimer !== null) {
      clearTimeout(_skipTimer)
      _skipTimer = null
    }
  }

  function setAutoMode(enabled) {
    autoMode.value = Boolean(enabled)
  }

  function toggleAuto() {
    autoMode.value = !autoMode.value
    return autoMode.value
  }

  function setSkipMode(enabled) {
    skipMode.value = Boolean(enabled)
  }

  function toggleSkip() {
    skipMode.value = !skipMode.value
    return skipMode.value
  }

  function stopAutoAndSkip() {
    autoMode.value = false
    skipMode.value = false
    skipHeld.value = false
    _clearSkipTimer()
  }

  function isLineRead(step) {
    return readTracker.isRead(step)
  }

  function clearReadState() {
    readTracker.reset()
    currentLineRead.value = false
  }

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

  function _runTypewriter(fullText, startIndex = 0) {
    _clearTw()
    const runId = _twRunId
    if (!typewriterEnabled || !fullText) {
      displayedText.value = fullText ?? ''
      textComplete.value  = true
      return
    }
    const total = [...plainText(fullText)].length
    const safe  = Math.max(0, Math.min(Number(startIndex) || 0, total))
    displayedText.value = safe > 0 ? sliceRichText(fullText, safe) : ''

    if (safe >= total) {
      displayedText.value = fullText
      textComplete.value  = true
      return
    }

    textComplete.value = false
    let i = safe
    function tick() {
      if (runId !== _twRunId) return
      i++
      displayedText.value = sliceRichText(fullText, i)
      if (i >= total) { _twTimer = null; textComplete.value = true; return }
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
    const rendered = [...plainText(displayedText.value ?? '')].length
    _runTypewriter(fullText, rendered)
  }

  function _autoContinueDelay(step) {
    if (!step) return null
    const raw = step.advance ?? step.continue
    if (raw === true) return 0
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(0, n) : null
  }

  function _autoDelayFor(step) {
    const explicit = _autoContinueDelay(step)
    if (explicit !== null) return explicit
    if (!autoMode.value) return null

    const base = Number(autoDelay)
    const safeBase = Number.isFinite(base) ? Math.max(0, base) : 1200
    const length = [...plainText(step?.text ?? '')].length
    return safeBase + Math.min(4000, length * 25)
  }

  watch(() => store.current, (step) => {
    if (!step) {
      displayedText.value = ''
      textComplete.value = true
      currentLineRead.value = false
      return
    }
    if (_isDialogueStep(step)) {
      currentLineRead.value = readTracker.isRead(step)
      readTracker.markRead(step)
      if (restoredFromSession) {
        displayedText.value = step.text ?? ''
        textComplete.value = true
      } else {
        _runTypewriter(step.text ?? '')
      }
    } else {
      currentLineRead.value = false
      // Non-dialogue steps should never block interact() waiting for typewriter.
      _clearTw()
      displayedText.value = ''
      textComplete.value = true
    }
    if (_suspendNextAuto) _suspendNextAuto = false
    if (restoredFromSession) restoredFromSession = false
  }, { immediate: true })

  watch(
    [() => store.current, () => store.cursor, () => textComplete.value, () => voicePlaying.value, autoMode, skipActive],
    ([step, cursor, done, voiceBusy, , skip]) => {
      _clearAutoContinue()
      if (_suspendNextAuto || !done || !step || skip) return
      if (!_isDialogueStep(step)) return
      if (voiceBusy) return

      const delay = _autoDelayFor(step)
      if (delay === null) return
      _autoContinueTimer = setTimeout(() => {
        _autoContinueTimer = null
        if (_suspendNextAuto || store.ended || store.awaitingChoice) return
        if (!textComplete.value || voicePlaying.value) return
        if (store.cursor !== cursor || store.current !== step) return
        advance()
      }, delay)
    }
  )

  watch(
    [() => store.current, () => store.cursor, () => textComplete.value, skipActive, currentLineRead],
    ([step, cursor, done, skip]) => {
      _clearSkipTimer()
      if (!skip || !step || store.ended || store.awaitingChoice) return

      if (!_isDialogueStep(step)) {
        skipMode.value = false
        return
      }

      if (!done) {
        skipTypewriter()
        return
      }

      _skipTimer = setTimeout(() => {
        _skipTimer = null
        if (!skipActive.value || store.ended || store.awaitingChoice) return
        if (store.cursor !== cursor || store.current !== step) return

        // Evaluated after Vue flushes watchers, so this reflects the line that
        // is actually on screen (not the previous one).
        if (!currentLineRead.value) {
          skipMode.value = false
          return
        }
        advance()
      }, 20)
    }
  )

  watch(currentLineRead, (read) => {
    if (!read && skipMode.value) skipMode.value = false
  })

  watch(() => store.ended, (ended) => {
    if (ended) {
      _clearSkipTimer()
      _clearAutoContinue()
      autoMode.value = false
      skipMode.value = false
      skipHeld.value = false
    }
  })

  // ── Layers de fondo con crossfade (animejs) ───────────────────────────────
  const bgLayers = ref([
    { key: 'a', src: null, color: null, transition: 'cut', active: true,  visible: false },
    { key: 'b', src: null, color: null, transition: 'cut', active: false, visible: false },
  ])
  const _bgElements = new Map()
  let _bgAnimation = null

  const _active   = () => bgLayers.value.find(l => l.active)
  const _inactive = () => bgLayers.value.find(l => !l.active)

  function registerBgElement(key, element) {
    if (element) {
      _bgElements.set(key, element)
    } else {
      _bgElements.delete(key)
    }
  }

  watch(() => store.background, async (bg) => {
    if (!bg) return

    stopAnimation(_bgAnimation)
    _bgAnimation = null

    if (bg.transition === 'cut') {
      const a = _active()
      a.src = bg.src; a.color = bg.color; a.transition = 'cut'
      a.visible = !!(bg.src || bg.color)
      const b = _inactive()
      b.visible = false
      return
    }

    const out = _active()
    const inn = _inactive()
    inn.src = bg.src; inn.color = bg.color; inn.transition = bg.transition
    inn.visible = true
    out.active = false; inn.active = true

    await nextTick()

    const innEl = _bgElements.get(inn.key)
    const outEl = _bgElements.get(out.key)
    if (innEl) {
      _bgAnimation = createCrossfadeTransition(innEl, outEl, bg.transition, () => {
        out.visible = false
        _bgAnimation = null
      })
    } else {
      out.visible = false
    }
  }, { immediate: true })

  function bgLayerStyle(layer) {
    if (layer.src)   return { backgroundImage: `url(${layer.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    if (layer.color) return { background: layer.color }
    return {}
  }

  // ── Layer de imagen con crossfade (animejs) ───────────────────────────────
  const imageLayers = ref([
    { key: 'a', src: null, transition: 'cut', fit: 'both', active: true, visible: false },
    { key: 'b', src: null, transition: 'cut', fit: 'both', active: false, visible: false },
  ])
  const _imageElements = new Map()
  let _imageAnimation = null

  const _imageActive = () => imageLayers.value.find(l => l.active)
  const _imageInactive = () => imageLayers.value.find(l => !l.active)

  function registerImageElement(key, element) {
    if (element) {
      _imageElements.set(key, element)
    } else {
      _imageElements.delete(key)
    }
  }

  watch(() => store.image, async (img) => {
    if (!img) return

    stopAnimation(_imageAnimation)
    _imageAnimation = null

    if (img.transition === 'cut') {
      const a = _imageActive()
      a.src = img.src; a.transition = 'cut'; a.fit = img.fit ?? 'both'
      a.visible = !!img.src
      const b = _imageInactive()
      b.visible = false
      return
    }

    const out = _imageActive()
    const inn = _imageInactive()
    inn.src = img.src; inn.transition = img.transition; inn.fit = img.fit ?? 'both'
    inn.visible = true
    out.active = false; inn.active = true

    await nextTick()

    const innEl = _imageElements.get(inn.key)
    const outEl = _imageElements.get(out.key)
    if (innEl) {
      _imageAnimation = createCrossfadeTransition(innEl, outEl, img.transition, () => {
        out.visible = false
        _imageAnimation = null
      })
    } else {
      out.visible = false
    }
  }, { immediate: true })

  function imageLayerStyle(layer) {
    if (!layer?.src) return {}
    let backgroundSize = 'contain'
    if (layer.fit === 'width')  backgroundSize = '100% auto'
    if (layer.fit === 'height') backgroundSize = 'auto 100%'
    return { backgroundImage: `url(${layer.src})`, backgroundSize, backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
  }

  // ── Sprites con animejs ───────────────────────────────────────────────────
  const _spriteElements = new Map()
  const _spriteAnimations = new Map()
  const _spriteDimAnimations = new Map()
  const _previousSpriteIds = new Set()

  function registerSpriteElement(id, element) {
    if (element) {
      _spriteElements.set(id, element)
    } else {
      _spriteElements.delete(id)
    }
  }

  watch(stageArray, (newStage) => {
    const currentIds = new Set(newStage.map(c => c.id))

    for (const id of currentIds) {
      if (!_previousSpriteIds.has(id)) {
        const el = _spriteElements.get(id)
        if (el) {
          stopAnimation(_spriteAnimations.get(id))
          const anim = createSpriteEnter(el)
          if (anim) _spriteAnimations.set(id, anim)
        }
      }
    }

    for (const id of _previousSpriteIds) {
      if (!currentIds.has(id)) {
        const el = _spriteElements.get(id)
        if (el) {
          stopAnimation(_spriteAnimations.get(id))
          const anim = createSpriteLeave(el, () => {
            _spriteAnimations.delete(id)
          })
          if (anim) _spriteAnimations.set(id, anim)
        }
      }
    }

    _previousSpriteIds.clear()
    for (const id of currentIds) {
      _previousSpriteIds.add(id)
    }
  }, { immediate: true })

  watch(speakerName, (speaker) => {
    for (const [id, el] of _spriteElements) {
      const isDimmed = speaker && characters[id]?.name !== speaker
      stopAnimation(_spriteDimAnimations.get(id))
      const anim = createSpriteDim(el, isDimmed)
      if (anim) _spriteDimAnimations.set(id, anim)
    }
  })

  // ── Interacción ───────────────────────────────────────────────────────────
  function interact() {
    const step = store.current
    if (store.ended || store.awaitingChoice) return
    if (autoMode.value || skipMode.value) stopAutoAndSkip()
    const isDialogueStep =
      step?.type === 'say' ||
      step?.type === 'think' ||
      step?.type === 'narrate'
    if (isDialogueStep && !textComplete.value) { skipTypewriter(); return }
    advance()
  }

  function backWithGuards() {
    _clearTw(); _clearAutoContinue(); _clearSkipTimer(); stopAutoAndSkip(); _suspendNextAuto = true
    return back()
  }

  function restartWithGuards() {
    _clearTw(); _clearAutoContinue(); _clearSkipTimer(); stopAutoAndSkip(); _suspendNextAuto = true
    return restartWithSessionClear()
  }

  function chooseWithGuards(option) {
    stopAutoAndSkip()
    return choose(option)
  }

  function submitInputWithGuards(value) {
    stopAutoAndSkip()
    return submitInput(value)
  }

  function submitSelectWithGuards(option) {
    stopAutoAndSkip()
    return submitSelect(option)
  }

  function closeModalWithGuards() {
    stopAutoAndSkip()
    return closeModal()
  }

  // ── Teclado ───────────────────────────────────────────────────────────────
  function _isEditableTarget(target) {
    if (!target || typeof target !== 'object') return false
    const tag = String(target.tagName ?? '').toUpperCase()
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true
  }

  function handleKeydown(e) {
    if (!unref(keyboardEnabled)) return
    if (_isEditableTarget(e.target)) return

    if (e.key === 'Control') {
      if (!skipHeld.value) skipHeld.value = true
      return
    }
    if (e.key === 'Escape') {
      if (autoMode.value || skipMode.value || skipHeld.value) {
        e.preventDefault()
        stopAutoAndSkip()
      }
      return
    }
    if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      toggleAuto()
      return
    }
    if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      toggleSkip()
      return
    }
    if (e.key === ' ') {
      e.preventDefault()
      const mode = normalizeSpacebarFastForward(getSetting('spacebarFastForward') ?? spacebarFastForward)
      if (mode === 'off') return
      if (mode === 'throttled' && e.repeat) return
      interact()
      return
    }
    if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); interact(); return }
    if (e.key === 'ArrowLeft') { e.preventDefault(); backWithGuards() }
  }

  function handleKeyup(e) {
    if (e.key === 'Control') skipHeld.value = false
  }

  function handleWindowBlur() {
    skipHeld.value = false
  }

  onMounted(() => {
    if (keyboardEnabled) {
      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('keyup', handleKeyup)
      window.addEventListener('blur', handleWindowBlur)
    }
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
    window.removeEventListener('blur', handleWindowBlur)
    _clearTw(); _clearAutoContinue(); _clearSkipTimer()
    if (_sessionSaveTimer !== null) clearTimeout(_sessionSaveTimer)
    stopAnimation(_bgAnimation)
    stopAnimation(_imageAnimation)
    for (const anim of _spriteAnimations.values()) stopAnimation(anim)
    for (const anim of _spriteDimAnimations.values()) stopAnimation(anim)
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

    // Auto, skip y progreso de lectura
    autoMode,
    skipMode,
    skipHeld,
    skipActive,
    currentLineRead,
    toggleAuto,
    toggleSkip,
    setAutoMode,
    setSkipMode,
    isLineRead,
    clearReadState,
    readCount: readTracker.size,

    // Fondo e imagen
    bgLayers,
    bgLayerStyle,
    registerBgElement,
    imageLayers,
    imageLayerStyle,
    registerImageElement,
    registerSpriteElement,
    registerEffectTarget,

    // Acciones del autor
    interact,
    choose:  chooseWithGuards,
    submitInput: submitInputWithGuards,
    submitSelect: submitSelectWithGuards,
    closeModal: closeModalWithGuards,
    back:    backWithGuards,
    jump,
    restart: restartWithGuards,
    start,
    exitMenu: exitMenuWithSessionClear,

    // Variables de historia
    getVar,
    setVar,
    getSetting,
    setSetting,

    // Meta-progreso (CGs, finales, logros, capítulos)
    progress,

    // Inventario
    inventory: engine.inventory,

    // Motor interno (para casos avanzados)
    engine,
  }
}
