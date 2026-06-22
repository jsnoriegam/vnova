import { computed } from 'vue'
import { createPinia, getActivePinia } from 'pinia'
import { useVNovaStore } from './store.js'
import { createQuestEngine } from './quests.js'
import { PARTICLE_PRESETS } from './particles.js'
import { cloneDeep } from '../utils/clone.js'
import { isPlainObject } from '../utils/predicates.js'
import { normalizeAssetUrl } from '../utils/normalize.js'

/**
 * vnova-engine — core/engine.js
 *
 * The central state machine. Consumes a flat script array and exposes
 * reactive state that the Vue layer subscribes to.
 *
 * Script step types:
 *   scene      — change background / location
 *   image      — show a full-screen image layer
 *   show       — add a character sprite to the stage
 *   hide       — remove visual layers (character, image, video, particles)
 *   stop       — stop media playback (bgm, video, particles)
 *   effect     — play a visual effect (shake, flash, etc.) with optional wait
 *   say        — dialogue line attributed to a character or narrator
 *   think      — inner monologue line, rendered like dialogue but stylable
 *   narrate    — unattributed narration (no nameplate)
 *   choice     — branch: presents options, each with a label + jump target
 *   input      — capture a text value and store it in vars (supports dotted paths)
 *   select     — choose one option and store its value in vars (supports dotted paths)
 *   jump       — unconditional jump to a label
 *   bgm        — play background music
 *   sfx        — play a sound effect (stub)
 *   video      — play a video track (host app controlled)
 *   particles  — play particle effects
 *   notify     — push a UI notification event (host app controlled)
 *   modal      — render a custom modal component by id (optional options behave like choice)
 *   wait       — pause for N milliseconds before auto-advancing
 *   end        — stop the current session and return control to the initial menu
 *   call       — invoke a user-defined function (side effects, flags, etc.)
 *   label      — named anchor; not rendered, used as jump target
 *                Can include a nested `steps: []` array for authoring.
 *
 * Deprecated patterns (emit console warnings in DEV):
 *   { type: 'bgm', stop: true }        → use { type: 'stop', bgm: true }
 *   { type: 'video', stop: true }      → use { type: 'hide', video: true } or { type: 'stop', video: true }
 *   { type: 'particles', stop: true }  → use { type: 'hide', particles: true } or { type: 'stop', particles: true }
 *   { type: 'image', hide: true }      → use { type: 'hide', image: true }
 *   { type: 'hide' } (no target)       → use { type: 'hide', character: true }
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

const noop = () => { }

let activeEngineHandle = null

function warnDeprecated(message) {
  if (import.meta.env.DEV) {
    console.warn(`[vnova] DEPRECATED: ${message}`)
  }
}

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

function normalizeImageFit(value) {
  if (value === undefined || value === null) return 'both'
  if (value === 'x' || value === 'width') return 'width'
  if (value === 'y' || value === 'height') return 'height'
  return 'both'
}


function snapshotTrackedState(store) {
  const snapshot = {}
  for (const key of TRACKED_STATE_KEYS) {
    const val = store[key]
    snapshot[key] = val !== null && typeof val === 'object' ? cloneDeep(val) : val
  }
  return snapshot
}

function buildStateDiff(before, after) {
  const diff = []
  for (const key of TRACKED_STATE_KEYS) {
    const a = before[key]
    const b = after[key]
    if (a === b) continue
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diff.push({ key, before: cloneDeep(a), after: cloneDeep(b) })
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
    onEffect = noop,
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
    return resolved
  }

  // ── quest engine ───────────────────────────────────────────────────────────
  const questEngine = createQuestEngine(quests, {
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

    switch (step.type) {
      case 'label':
        _moveTo(store.cursor + 1)
        return

      case 'jump':
        _jumpTo(step.target)
        return

      case 'call': {
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
          if (outcome.stay === true) return
        }

        _moveTo(store.cursor + 1)
        return
      }

      case 'bgm': {
        if (step.stop === true) {
          warnDeprecated('{ type: \'bgm\', stop: true } — use { type: \'stop\', bgm: true } instead')
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

      case 'sfx': {
        const trackId = step.id ?? null
        const track = normalizeAssetUrl(step.src ?? resolveAsset('sounds', trackId, trackId))
        onAudio({ type: 'sfx', track, volume: _effectiveVolume('sfx', step.volume ?? 1) })
        _moveTo(store.cursor + 1)
        return
      }

      case 'particles': {
        const shouldStop = step.stop === true || step.id === null
        if (shouldStop) {
          if (step.stop === true) {
            warnDeprecated('{ type: \'particles\', stop: true } — use { type: \'hide\', particles: true } or { type: \'stop\', particles: true } instead')
          }
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

      case 'video': {
        if (step.stop === true) {
          warnDeprecated('{ type: \'video\', stop: true } — use { type: \'hide\', video: true } or { type: \'stop\', video: true } instead')
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

      case 'notify': {
        const resolvedNotify = _interpolateDeep(step)
        onNotify({
          status: resolvedNotify.status ?? 'info',
          title: resolvedNotify.title ?? '',
          text: resolvedNotify.text ?? '',
        })
        _moveTo(store.cursor + 1)
        return
      }

      case 'scene': {
        const sceneId = step.id ?? null
        const sceneSrc = normalizeAssetUrl(step.src ?? resolveAsset('scenes', sceneId, null))
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

      case 'end':
        _finishSession('end-step')
        return

      case 'image': {
        if (step.hide === true) {
          warnDeprecated('{ type: \'image\', hide: true } — use { type: \'hide\', image: true } instead')
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

      case 'show': {
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

      case 'hide': {
        const hasCharacter = step.character !== undefined
        const hasImage = step.image !== undefined
        const hasVideo = step.video !== undefined
        const hasParticles = step.particles !== undefined

        if (!hasCharacter && !hasImage && !hasVideo && !hasParticles) {
          warnDeprecated('{ type: \'hide\' } without target — use { type: \'hide\', character: true } to hide all characters')
          store.hideCharacter(null)
          _moveTo(store.cursor + 1)
          return
        }

        if (hasCharacter) {
          store.hideCharacter(step.character === true ? null : step.character)
          _moveTo(store.cursor + 1)
          return
        }

        if (hasImage) {
          const transition = step.transition ?? 'fade'
          store.setImage({ src: null, transition, fit: normalizeImageFit(step.fit) })
          _moveTo(store.cursor + 1)
          return
        }

        if (hasVideo) {
          _stopVideo()
          _moveTo(store.cursor + 1)
          return
        }

        if (hasParticles) {
          _stopParticles()
          _moveTo(store.cursor + 1)
          return
        }
        return
      }

      case 'stop': {
        if (step.bgm === true) {
          _stopBgm()
          _moveTo(store.cursor + 1)
          return
        }
        if (step.video === true) {
          _stopVideo()
          _moveTo(store.cursor + 1)
          return
        }
        if (step.particles === true) {
          _stopParticles()
          _moveTo(store.cursor + 1)
          return
        }
        _moveTo(store.cursor + 1)
        return
      }

      case 'effect': {
        const effectName = step.name ?? null
        if (!effectName) {
          _moveTo(store.cursor + 1)
          return
        }

        const duration = step.duration ?? 500
        const config = step.config ?? {}

        onEffect({
          name: effectName,
          target: step.target ?? 'stage',
          duration,
          config,
        })

        if (step.wait === true) {
          _scheduleAuto(duration)
        } else {
          _moveTo(store.cursor + 1)
        }
        return
      }

      case 'wait':
        store.setCurrent(step)
        _scheduleAuto(step.ms ?? 1000)
        return

      case 'input': {
        const resolvedInput = _interpolateDeep(step)
        store.setCurrent(resolvedInput)
        store.setAwaitingChoice(true)
        store.pushHistory(resolvedInput)
        return
      }

      case 'select': {
        const resolvedSelect = _interpolateDeep(step)
        store.setCurrent(resolvedSelect)
        store.setAwaitingChoice(true)
        store.pushHistory(resolvedSelect)
        return
      }

      case 'modal': {
        const resolvedModal = _interpolateDeep(step)
        store.setCurrent(resolvedModal)
        store.pushHistory(resolvedModal)
        const hasOptions = Array.isArray(resolvedModal.options) && resolvedModal.options.length > 0
        store.setAwaitingChoice(hasOptions)
        return
      }

      case 'choice': {
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

      case 'say':
      case 'think':
      case 'narrate': {
        const resolvedLine = _interpolateDeep(step)
        store.setCurrent(resolvedLine)
        store.pushHistory(resolvedLine)
        if (autoAdvanceDelay > 0) _scheduleAuto(autoAdvanceDelay)
        return
      }

      default:
        if (import.meta.env.DEV) console.warn('[vnova] unknown step type:', step.type, step)
        _moveTo(store.cursor + 1)
    }
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

  function updateScript(newScript) {
    if (!Array.isArray(newScript) || newScript.length === 0) return
    runtimeScript.splice(0, runtimeScript.length, ...expandNestedLabels(newScript))
    labelIndex.clear()
    const newIndex = buildIndex(runtimeScript)
    for (const [key, val] of newIndex.entries()) {
      labelIndex.set(key, val)
    }
    // Refresh current step in store if game is active
    if (store.cursor >= 0 && store.cursor < runtimeScript.length && !store.ended && store.current) {
      const rawStep = runtimeScript[store.cursor]
      const resolvedStep = _interpolateDeep(rawStep)
      store.setCurrent(resolvedStep)
    }
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
    questDefinitions: questEngine.definitions,
    listQuests: questEngine.list,
    getQuest: questEngine.get,
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
    updateScript,
    // expose pinia instance for apps that want to install it themselves
    pinia: _pinia,
  }

  setActiveEngineHandle(engineHandle)
  return engineHandle
}
