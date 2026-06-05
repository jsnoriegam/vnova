import { computed } from 'vue'
import { createPinia, getActivePinia } from 'pinia'
import { useVNovaStore } from './store.js'
import { createQuestEngine } from './quests.js'
import { PARTICLE_PRESETS } from './particles.js'

/**
 * vnova-engine — core/engine.js
 *
 * The central state machine. Consumes a flat script array and exposes
 * reactive state that the Vue layer subscribes to.
 *
 * Script step types:
 *   scene      — change background / location
 *   image      — show or clear a full-screen image layer
 *   show       — add a character sprite to the stage
 *   hide       — remove a character sprite from the stage
 *   say        — dialogue line attributed to a character or narrator
 *   think      — inner monologue line, rendered like dialogue but stylable
 *   narrate    — unattributed narration (no nameplate)
 *   choice     — branch: presents options, each with a label + jump target
 *   input      — capture a text value and store it in vars (supports dotted paths)
 *   select     — choose one option and store its value in vars (supports dotted paths)
 *   jump       — unconditional jump to a label
 *   bgm        — play background music, or stop with `{ stop: true }` (stub)
 *   sfx        — play a sound effect (stub)
 *   video      — play / stop a video track (host app controlled)
 *   notify     — push a UI notification event (host app controlled)
 *   modal      — render a custom modal component by id (optional options behave like choice)
 *   wait       — pause for N milliseconds before auto-advancing
 *   end        — stop the current session and return control to the initial menu
 *   call       — invoke a user-defined function (side effects, flags, etc.)
 *   label      — named anchor; not rendered, used as jump target
 *                Can include a nested `steps: []` array for authoring.
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

const noop = () => { }

let activeEngineHandle = null

export function getActiveEngineHandle() {
  return activeEngineHandle
}

function setActiveEngineHandle(handle) {
  activeEngineHandle = handle ?? null
}

const TRACKED_STATE_KEYS = [
  'cursor', 'current', 'stage', 'background', 'image', 'video',
  'bgm', 'particles', 'vars', 'quests', 'awaitingChoice', 'ended', 'history',
]

function cloneDeep(value) {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

function normalizeImageFit(value) {
  if (value === undefined || value === null) return 'both'
  if (value === 'x' || value === 'width') return 'width'
  if (value === 'y' || value === 'height') return 'height'
  return 'both'
}

function isAbsoluteAssetUrl(value) {
  return (
    value.startsWith('/')
    || value.startsWith('http://')
    || value.startsWith('https://')
    || value.startsWith('data:')
    || value.startsWith('blob:')
    || value.startsWith('file:')
  )
}

function normalizeAssetUrl(value) {
  if (typeof value !== 'string') return value
  const raw = value.trim()
  if (!raw || isAbsoluteAssetUrl(raw)) return raw

  // Vite-friendly fallback: treat relative author paths as files under /src.
  if (raw.startsWith('./') || raw.startsWith('../')) {
    const stripped = raw.replace(/^(?:\.\.\/|\.\/)+/, '')
    return `/src/${stripped}`
  }

  return raw
}

function snapshotTrackedState(store) {
  return TRACKED_STATE_KEYS.reduce((acc, key) => {
    acc[key] = cloneDeep(store[key])
    return acc
  }, {})
}

function buildStateDiff(before, after) {
  const diff = []
  for (const key of TRACKED_STATE_KEYS) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff.push({ key, before: cloneDeep(before[key]), after: cloneDeep(after[key]) })
    }
  }
  return diff
}

function buildIndex(script) {
  const map = new Map()
  script.forEach((step, i) => {
    if (step.type === 'label') map.set(step.id, i)
  })
  return map
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function splitPath(path) {
  if (typeof path !== 'string') return []
  return path.split('.').map((part) => part.trim()).filter(Boolean)
}

const INTERPOLATION_PATTERN = /\{\{\s*([\w$.]+)\s*\}\}/g

export function expandNestedLabels(script) {
  const expanded = []
  for (const step of script) {
    if (step?.type === 'label' && Array.isArray(step.steps)) {
      expanded.push({ type: 'label', id: step.id })
      for (const nestedStep of step.steps) expanded.push(nestedStep)
      continue
    }
    expanded.push(step)
  }
  return expanded
}

function createQuestContext(store) {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'flags' || prop === 'vars') return store.vars
      if (prop === 'vnova' || prop === 'store') return store
      if (prop === 'quests') return store.quests
      return store.vars?.[prop]
    },
    set(_target, prop, value) {
      if (['flags', 'vars', 'vnova', 'store', 'quests'].includes(prop)) return false
      store.setVar({ key: prop, value })
      return true
    },
  })
}

function evaluateChoiceCondition(option, store) {
  if (typeof option?.condition !== 'function') {
    if (typeof option?.condition === 'boolean') return option.condition
    return true
  }
  try {
    return Boolean(option.condition(createQuestContext(store)))
  } catch (error) {
    console.warn('[vnova] choice option condition failed:', error)
    return false
  }
}

function evaluateChoiceDisabled(option, store) {
  if (typeof option?.disabled !== 'function') {
    if (typeof option?.disabled === 'boolean') return option.disabled
    return false
  }
  try {
    return Boolean(option.disabled(createQuestContext(store)))
  } catch (error) {
    console.warn('[vnova] choice option disabled failed:', error)
    return false
  }
}

function stripChoiceRuntimeFields(option) {
  if (!isPlainObject(option)) return option
  const { condition, disabled, ...serializableOption } = option
  return serializableOption
}

function mergeWithDefaults(currentValue, defaults) {
  if (!isPlainObject(defaults)) {
    return currentValue === undefined ? cloneDeep(defaults) : currentValue
  }

  const base = isPlainObject(currentValue) ? { ...currentValue } : {}
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (base[key] === undefined) {
      base[key] = cloneDeep(defaultValue)
      continue
    }
    base[key] = mergeWithDefaults(base[key], defaultValue)
  }
  return base
}

function applyInitialStateSchema(store, schema) {
  if (!isPlainObject(schema)) return
  const mergedVars = mergeWithDefaults(store.vars, schema)
  store.setVars(mergedVars)
}

// ─── engine factory ───────────────────────────────────────────────────────────

export function createEngine(script, options = {}) {
  const {
    characters = {},
    assets = {},
    credits = [],
    particles = {},
    quests = [],
    onAudio = noop,
    onParticles = noop,
    onVideo = noop,
    onNotify = noop,
    onEnd = noop,
    autoAdvanceDelay = 0,
    initialState = null,
    deferStart = false,
    // Accept an externally-provided Pinia instance, or create a fresh one.
    pinia = null,
  } = options

  if (!Array.isArray(script) || script.length === 0)
    throw new Error('[vnova] script must be a non-empty array')

  const runtimeScript = expandNestedLabels(script)
  const labelIndex = buildIndex(runtimeScript)
  const particleRegistry = { ...PARTICLE_PRESETS, ...(particles ?? {}) }
  let _bgmBaseVolume = 1

  // ── Pinia setup ────────────────────────────────────────────────────────────
  const _pinia = pinia ?? getActivePinia() ?? createPinia()
  const store = useVNovaStore(_pinia)

  store.resetEngine()
  applyInitialStateSchema(store, initialState)
  store.setCharacters(characters)
  store.setCredits(credits)

  // ── asset resolver ────────────────────────────────────────────────────────
  function resolveAsset(group, key, fallback = null) {
    if (!key) return fallback
    const resolved = (assets?.[group] ?? {})[key] ?? fallback
    return normalizeAssetUrl(resolved)
  }

  // ── quest engine ───────────────────────────────────────────────────────────
  const questEngine = createQuestEngine(quests, {
    getContext: () => createQuestContext(store),
    getState: () => store.quests,
    setState: (next) => store.setQuests(next),
  })
  questEngine.reset()

  // ── computed conveniences ─────────────────────────────────────────────────
  const stageArray = computed(() => store.stageArray)
  const speakerName = computed(() => store.speakerName)
  const speakerColor = computed(() => store.speakerColor)

  // ── internal helpers ──────────────────────────────────────────────────────
  let _autoTimer = null

  function _clearAuto() {
    if (_autoTimer !== null) { clearTimeout(_autoTimer); _autoTimer = null }
  }

  function _scheduleAuto(ms) {
    _clearAuto()
    _autoTimer = setTimeout(() => advance(), ms)
  }

  function _runTrackedMove(fn) {
    const before = snapshotTrackedState(store)
    fn()
    questEngine.evaluate()
    const after = snapshotTrackedState(store)
    const diff = buildStateDiff(before, after)
    if (diff.length > 0) store.pushBackDiff(diff)
  }

  function _readVarByPath(path) {
    const parts = splitPath(path)
    if (parts.length === 0) return undefined

    let cursor = store.vars
    for (const part of parts) {
      if (!isPlainObject(cursor) || !(part in cursor)) return undefined
      cursor = cursor[part]
    }
    return cursor
  }

  function _setVarByPath(path, value) {
    const parts = splitPath(path)
    if (parts.length === 0) return

    if (parts.length === 1) {
      store.setVar({ key: parts[0], value })
      return
    }

    const root = isPlainObject(store.vars) ? cloneDeep(store.vars) : {}
    let cursor = root
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!isPlainObject(cursor[part])) cursor[part] = {}
      cursor = cursor[part]
    }
    cursor[parts[parts.length - 1]] = value
    store.setVars(root)
  }

  function _applyVarSet(map) {
    if (!isPlainObject(map)) return
    for (const [key, value] of Object.entries(map)) _setVarByPath(key, value)
  }

  function _applyVarInc(map) {
    if (!isPlainObject(map)) return
    for (const [key, deltaRaw] of Object.entries(map)) {
      const delta = Number(deltaRaw)
      if (!Number.isFinite(delta)) continue
      const currentValue = _readVarByPath(key)
      const base = Number.isFinite(Number(currentValue ?? 0)) ? Number(currentValue ?? 0) : 0
      _setVarByPath(key, base + delta)
    }
  }

  function _interpolateString(text) {
    if (typeof text !== 'string') return text
    return text.replace(INTERPOLATION_PATTERN, (_full, path) => {
      const value = _readVarByPath(path)
      if (value === null || value === undefined) return ''
      return String(value)
    })
  }

  function _interpolateDeep(value) {
    if (typeof value === 'string') return _interpolateString(value)
    if (Array.isArray(value)) return value.map((item) => _interpolateDeep(item))
    if (isPlainObject(value)) {
      const next = {}
      for (const [key, entry] of Object.entries(value)) next[key] = _interpolateDeep(entry)
      return next
    }
    return value
  }

  function _effectiveVolume(type, baseVolume = 1) {
    const safeBase = Number.isFinite(Number(baseVolume)) ? Number(baseVolume) : 1
    const masterKey = type === 'bgm' ? 'bgmVolume' : 'sfxVolume'
    const safeMaster = Number.isFinite(Number(store.settings?.[masterKey] ?? 1))
      ? Number(store.settings[masterKey])
      : 1
    return safeBase * safeMaster
  }

  function _clearSceneLayers() {
    store.hideCharacter(null)
    store.setImage({ src: null, transition: 'cut', fit: 'both' })
  }

  function _stopBgm() {
    _bgmBaseVolume = 1
    store.setBgm(null)
    onAudio({ type: 'bgm', track: null, volume: 0, loop: false })
  }

  function _stopVideo() {
    store.setVideo(null)
    onVideo({ action: 'stop', track: null, volume: 0, loop: false, muted: false })
  }

  function _stopParticles() {
    store.setParticles(null)
    onParticles({ action: 'stop', id: null, config: null })
  }

  function _finishSession(reason = 'end') {
    _clearAuto()
    _stopBgm()
    _stopParticles()
    _stopVideo()
    _clearSceneLayers()
    store.setCurrent(null)
    store.setAwaitingChoice(false)
    store.setEnded(true)
    onEnd({ reason, toTitle: true })
  }

  const engineContext = Object.freeze({
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
    // Keep direct state/store aliases for advanced call handlers.
    state: store,
    store,
  })

  function _applyStep(step) {
    if (!step) { _finishSession('script-end'); return }

    if (step.type === 'label') { _moveTo(store.cursor + 1); return }
    if (step.type === 'jump') { _jumpTo(step.target); return }
    if (step.type === 'call') {
      const startCursor = store.cursor
      const callContext = {
        jump: (target) => _jumpTo(target),
        moveTo: (index) => _moveTo(index),
        engine: engineContext,
        quest: {
          activate: (id) => questEngine.activate(id),
          complete: (id) => questEngine.complete(id),
          fail: (id) => questEngine.fail(id),
          deactivate: (id) => questEngine.deactivate(id),
          setStatus: (id, status) => questEngine.setStatus(id, status),
        },
      }

      const outcome = (step.fn ?? noop)(store, callContext)

      if (store.cursor !== startCursor) return
      if (typeof outcome === 'string') { _jumpTo(outcome); return }

      if (isPlainObject(outcome)) {
        if (typeof outcome.jump === 'string' && outcome.jump.length > 0) {
          _jumpTo(outcome.jump)
          return
        }

        if (Number.isInteger(outcome.moveTo)) {
          _moveTo(outcome.moveTo)
          return
        }

        if (outcome.stay === true) {
          return
        }
      }

      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'bgm') {
      if (step.stop === true) {
        _stopBgm()
        _moveTo(store.cursor + 1)
        return
      }

      const trackId = step.id ?? null
      const track = normalizeAssetUrl(step.src ?? resolveAsset('music', trackId, trackId))
      _bgmBaseVolume = Number.isFinite(Number(step.volume ?? 1)) ? Number(step.volume ?? 1) : 1
      store.setBgm(track)
      onAudio({ type: 'bgm', track, volume: _effectiveVolume('bgm', _bgmBaseVolume), loop: step.loop ?? true })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'sfx') {
      const trackId = step.id ?? null
      const track = normalizeAssetUrl(step.src ?? resolveAsset('sounds', trackId, trackId))
      onAudio({ type: 'sfx', track, volume: _effectiveVolume('sfx', step.volume ?? 1) })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'particles') {
      const shouldStop = step.stop === true || step.id === null
      if (shouldStop) {
        _stopParticles()
        _moveTo(store.cursor + 1)
        return
      }

      const particleId = step.id ?? null
      const config = step.config ?? (particleId ? particleRegistry[particleId] ?? null : null)
      if (!config) {
        _stopParticles()
        _moveTo(store.cursor + 1)
        return
      }

      const particleEvent = { action: 'play', id: particleId, config: cloneDeep(config) }
      store.setParticles(particleEvent)
      onParticles(particleEvent)
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'video') {
      const shouldStop = step.stop === true
      if (shouldStop) {
        _stopVideo()
        _moveTo(store.cursor + 1)
        return
      }

      const trackId = step.id ?? null
      const track = normalizeAssetUrl(step.src ?? resolveAsset('videos', trackId, trackId))
      if (!track) {
        _stopVideo()
        _moveTo(store.cursor + 1)
        return
      }

      const controls = step.controls === 'displayable' || step.controls === true
      const videoEvent = {
        action: 'play',
        track,
        volume: step.volume ?? 1,
        loop: step.loop ?? false,
        muted: step.muted ?? false,
        controls,
      }
      store.setVideo(videoEvent)
      onVideo(videoEvent)
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'notify') {
      const resolvedNotify = _interpolateDeep(step)
      onNotify({
        status: resolvedNotify.status ?? 'info',
        title: resolvedNotify.title ?? '',
        text: resolvedNotify.text ?? '',
      })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'scene') {
      const sceneId = step.id ?? null
      const sceneSrc = normalizeAssetUrl(step.src ?? resolveAsset('scenes', sceneId, null))
      // Only stop BGM when explicitly requested — music continues across scenes by default
      if (step.stopMusic) _stopBgm()
      _clearSceneLayers()
      store.setBackground({
        src: sceneSrc,
        color: step.color ?? null,
        transition: step.transition ?? 'fade',
      })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'end') { _finishSession('end-step'); return }

    if (step.type === 'image') {
      if (step.hide === true) {
        store.setImage({ src: null, transition: step.transition ?? 'fade', fit: normalizeImageFit(step.fit) })
        _moveTo(store.cursor + 1)
        return
      }

      const hasId = step.id !== undefined && step.id !== null
      const hasSrc = step.src !== undefined && step.src !== null
      if (hasId && hasSrc)
        throw new Error('[vnova] image step must provide either "id" or "src", but not both')
      const imageId = hasId ? step.id : null
      const imageSrc = hasSrc
        ? normalizeAssetUrl(step.src)
        : (imageId ? resolveAsset('images', imageId, imageId) : null)
      store.setImage({ src: imageSrc, transition: step.transition ?? 'fade', fit: normalizeImageFit(step.fit) })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'show') {
      const characterDef = characters[step.character] ?? {}
      const variant = step.variant ?? step.expression ?? 'default'
      const spriteFromReg = normalizeAssetUrl(characterDef.sprites?.[variant] ?? characterDef.defaultSprite ?? null)
      store.showCharacter({
        character: step.character,
        data: {
          id: step.character,
          position: step.position ?? 'center',
          expression: variant,
          sprite: normalizeAssetUrl(step.sprite ?? spriteFromReg),
        },
      })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'hide') {
      store.hideCharacter(step.character ?? null)
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'wait') {
      store.setCurrent(step)
      _scheduleAuto(step.ms ?? 1000)
      return
    }

    if (step.type === 'input') {
      const resolvedInput = _interpolateDeep(step)
      store.setCurrent(resolvedInput)
      store.setAwaitingChoice(true)
      store.pushHistory(resolvedInput)
      return
    }

    if (step.type === 'select') {
      const resolvedSelect = _interpolateDeep(step)
      store.setCurrent(resolvedSelect)
      store.setAwaitingChoice(true)
      store.pushHistory(resolvedSelect)
      return
    }

    if (step.type === 'modal') {
      const resolvedModal = _interpolateDeep(step)
      store.setCurrent(resolvedModal)
      store.pushHistory(resolvedModal)

      const hasOptions = Array.isArray(resolvedModal.options) && resolvedModal.options.length > 0
      store.setAwaitingChoice(hasOptions)
      return
    }

    if (step.type === 'choice') {
      const visibleOptions = (step.options ?? [])
        .filter((option) => evaluateChoiceCondition(option, store))
        .map((option) => {
          const serializableOption = stripChoiceRuntimeFields(option)
          if (!isPlainObject(serializableOption)) return serializableOption
          return {
            ...serializableOption,
            disabled: evaluateChoiceDisabled(option, store),
          }
        })
      if (visibleOptions.length === 0) {
        _moveTo(store.cursor + 1)
        return
      }

      const resolvedChoice = _interpolateDeep({ ...step, options: visibleOptions })
      store.setCurrent(resolvedChoice)
      store.setAwaitingChoice(true)
      store.pushHistory(resolvedChoice)
      return
    }

    if (step.type === 'say' || step.type === 'think' || step.type === 'narrate') {
      const resolvedLine = _interpolateDeep(step)
      store.setCurrent(resolvedLine)
      store.pushHistory(resolvedLine)
      if (autoAdvanceDelay > 0) _scheduleAuto(autoAdvanceDelay)
      return
    }

    if (import.meta.env?.DEV) console.warn('[vnova] unknown step type:', step.type, step)
    _moveTo(store.cursor + 1)
  }

  function _moveTo(index) {
    if (index >= runtimeScript.length) { _finishSession('script-end'); return }
    store.setCursor(index)
    _applyStep(runtimeScript[index])
  }

  function _jumpTo(target) {
    if (!labelIndex.has(target))
      throw new Error(`[vnova] jump target not found: "${target}"`)
    _moveTo(labelIndex.get(target))
  }

  // ── public API ─────────────────────────────────────────────────────────────

  function advance() {
    if (store.ended || store.awaitingChoice) return
    _clearAuto()
    _runTrackedMove(() => _moveTo(store.cursor + 1))
  }

  function choose(option) {
    if (!store.awaitingChoice) return
    if (option?.disabled === true) return
    _runTrackedMove(() => {
      store.setAwaitingChoice(false)
      store.pushHistory({ type: '_choice_made', label: option.label })

      _applyVarSet(option.set)
      _applyVarInc(option.inc)

      if (option.jump) { _jumpTo(option.jump); return }
      _moveTo(store.cursor + 1)
    })
  }

  function submitInput(value) {
    const step = store.current
    if (!store.awaitingChoice || step?.type !== 'input') return false

    const raw = value ?? step.default ?? ''
    const normalizedValue = typeof raw === 'string' ? raw : String(raw ?? '')
    const isRequired = step.required !== false
    if (isRequired && normalizedValue.trim() === '') return false

    _runTrackedMove(() => {
      store.setAwaitingChoice(false)
      if (typeof step.store === 'string' && step.store.length > 0) {
        _setVarByPath(step.store, normalizedValue)
      }

      _applyVarSet(step.set)
      _applyVarInc(step.inc)

      if (step.jump) { _jumpTo(step.jump); return }
      _moveTo(store.cursor + 1)
    })

    return true
  }

  function submitSelect(option) {
    const step = store.current
    if (!store.awaitingChoice || step?.type !== 'select') return false

    const options = Array.isArray(step.options) ? step.options : []
    const selected = isPlainObject(option)
      ? option
      : options.find((candidate) => {
        if (!isPlainObject(candidate)) return candidate === option
        return candidate.value === option || candidate.label === option
      })

    if (!selected) return false

    const selectedValue = selected.value ?? selected.label ?? option

    _runTrackedMove(() => {
      store.setAwaitingChoice(false)
      if (typeof step.store === 'string' && step.store.length > 0) {
        _setVarByPath(step.store, selectedValue)
      }

      _applyVarSet(step.set)
      _applyVarInc(step.inc)
      _applyVarSet(selected.set)
      _applyVarInc(selected.inc)

      if (selected.jump) { _jumpTo(selected.jump); return }
      if (step.jump) { _jumpTo(step.jump); return }
      _moveTo(store.cursor + 1)
    })

    return true
  }

  function closeModal() {
    if (store.current?.type !== 'modal') return
    _runTrackedMove(() => {
      store.setAwaitingChoice(false)
      _moveTo(store.cursor + 1)
    })
  }

  function jump(target) {
    _runTrackedMove(() => _jumpTo(target))
  }

  function back() {
    _clearAuto()
    if (store.backStack.length === 0) return false
    const latestDiff = store.backStack[store.backStack.length - 1]
    store.applyBackDiff(latestDiff)
    store.popBackDiff()
    return true
  }

  function restart() {
    _clearAuto()
    _stopBgm()
    _stopParticles()
    _stopVideo()
    store.resetEngine()
    applyInitialStateSchema(store, initialState)
    store.setCharacters(characters)
    questEngine.reset()
    _applyStep(runtimeScript[0])
  }

  function start() {
    if (store.current || store.awaitingChoice || store.ended) return
    _applyStep(runtimeScript[store.cursor] ?? runtimeScript[0])
  }

  function exitMenu() {
    _finishSession('exit-menu')
  }

  function getVar(key) { return store.vars[key] }
  function setVar(key, value) { store.setVar({ key, value }) }
  function getSetting(key) { return store.settings?.[key] }
  function setSetting(key, value) {
    store.setSetting({ key, value })

    // Re-apply active BGM volume immediately so runtime sliders affect current track.
    if (key === 'bgmVolume' && store.bgm) {
      onAudio({
        type: 'bgm',
        track: store.bgm,
        volume: _effectiveVolume('bgm', _bgmBaseVolume),
        loop: true,
      })
    }
  }

  // boot
  if (!deferStart) _applyStep(runtimeScript[0])

  const engineHandle = {
    // Expose the raw Pinia store so useVNova and advanced users can subscribe
    store,
    // Keep `state` as an alias so call steps and legacy code still work
    get state() { return store },

    stageArray,
    speakerName,
    speakerColor,
    quests: computed(() => store.quests),
    listQuests: questEngine.list,
    getQuest: questEngine.get,
    evaluateQuests: questEngine.evaluate,
    setQuestStatus: questEngine.setStatus,
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
    // expose pinia instance for apps that want to install it themselves
    pinia: _pinia,
  }

  setActiveEngineHandle(engineHandle)
  return engineHandle
}
