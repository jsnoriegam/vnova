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
 *   jump       — unconditional jump to a label
 *   bgm        — play background music, or stop with `{ stop: true }` (stub)
 *   sfx        — play a sound effect (stub)
 *   video      — play / stop a video track (host app controlled)
 *   notify     — push a UI notification event (host app controlled)
 *   wait       — pause for N milliseconds before auto-advancing
 *   end        — stop the current session and return control to the initial menu
 *   call       — invoke a user-defined function (side effects, flags, etc.)
 *   label      — named anchor; not rendered, used as jump target
 *                Can include a nested `steps: []` array for authoring.
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

const noop = () => {}

const TRACKED_STATE_KEYS = [
  'cursor', 'current', 'stage', 'background', 'image',
  'bgm', 'vars', 'quests', 'awaitingChoice', 'ended', 'history',
]

function cloneDeep(value) {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

function normalizeImageFit(value) {
  if (value === undefined || value === null) return 'both'
  if (value === 'x' || value === 'width')   return 'width'
  if (value === 'y' || value === 'height')  return 'height'
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

// ─── engine factory ───────────────────────────────────────────────────────────

export function createEngine(script, options = {}) {
  const {
    characters       = {},
    assets           = {},
    particles        = {},
    quests           = [],
    onAudio          = noop,
    onParticles      = noop,
    onVideo          = noop,
    onNotify         = noop,
    onEnd            = noop,
    autoAdvanceDelay = 0,
    deferStart       = false,
    // Accept an externally-provided Pinia instance, or create a fresh one.
    pinia            = null,
  } = options

  if (!Array.isArray(script) || script.length === 0)
    throw new Error('[vnova] script must be a non-empty array')

  const runtimeScript = expandNestedLabels(script)
  const labelIndex    = buildIndex(runtimeScript)
  const particleRegistry = { ...PARTICLE_PRESETS, ...(particles ?? {}) }
  let _bgmBaseVolume  = 1

  // ── Pinia setup ────────────────────────────────────────────────────────────
  const _pinia = pinia ?? getActivePinia() ?? createPinia()
  const store  = useVNovaStore(_pinia)

  store.resetEngine()
  store.setCharacters(characters)

  // ── asset resolver ────────────────────────────────────────────────────────
  function resolveAsset(group, key, fallback = null) {
    if (!key) return fallback
    const resolved = (assets?.[group] ?? {})[key] ?? fallback
    return normalizeAssetUrl(resolved)
  }

  // ── quest engine ───────────────────────────────────────────────────────────
  const questEngine = createQuestEngine(quests, {
    getContext: () => createQuestContext(store),
    getState:   () => store.quests,
    setState:   (next) => store.setQuests(next),
  })
  questEngine.reset()

  // ── computed conveniences ─────────────────────────────────────────────────
  const stageArray  = computed(() => store.stageArray)
  const speakerName = computed(() => store.speakerName)
  const speakerColor= computed(() => store.speakerColor)

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
    const diff  = buildStateDiff(before, after)
    if (diff.length > 0) store.pushBackDiff(diff)
  }

  function _effectiveVolume(type, baseVolume = 1) {
    const safeBase   = Number.isFinite(Number(baseVolume)) ? Number(baseVolume) : 1
    const masterKey  = type === 'bgm' ? 'bgmVolume' : 'sfxVolume'
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
    onVideo({ action: 'stop', track: null, volume: 0, loop: false, muted: false })
  }

  function _stopParticles() {
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

  function _applyStep(step) {
    if (!step) { _finishSession('script-end'); return }

    if (step.type === 'label') { _moveTo(store.cursor + 1); return }
    if (step.type === 'jump')  { _jumpTo(step.target); return }
    if (step.type === 'call')  { (step.fn ?? noop)(store); _moveTo(store.cursor + 1); return }

    if (step.type === 'bgm') {
      if (step.stop === true) {
        _stopBgm()
        _moveTo(store.cursor + 1)
        return
      }

      const trackId = step.track ?? step.id ?? null
      const track   = normalizeAssetUrl(step.src ?? resolveAsset('music', trackId, trackId))
      _bgmBaseVolume = Number.isFinite(Number(step.volume ?? 1)) ? Number(step.volume ?? 1) : 1
      store.setBgm(track)
      onAudio({ type: 'bgm', track, volume: _effectiveVolume('bgm', _bgmBaseVolume), loop: step.loop ?? true })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'sfx') {
      const trackId = step.track ?? step.id ?? null
      const track   = normalizeAssetUrl(step.src ?? resolveAsset('sounds', trackId, trackId))
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

      onParticles({ action: 'play', id: particleId, config: cloneDeep(config) })
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

      const trackId = step.track ?? step.id ?? null
      const track = normalizeAssetUrl(step.src ?? resolveAsset('videos', trackId, trackId))
      if (!track) {
        _stopVideo()
        _moveTo(store.cursor + 1)
        return
      }

      onVideo({
        action: 'play',
        track,
        volume: step.volume ?? 1,
        loop: step.loop ?? false,
        muted: step.muted ?? false,
      })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'notify') {
      onNotify({
        status: step.status ?? 'info',
        title: step.title ?? '',
        text: step.text ?? '',
      })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'scene') {
      const sceneId  = step.id ?? step.scene ?? null
      const sceneSrc = normalizeAssetUrl(step.src ?? resolveAsset('scenes', sceneId, null))
      // Only stop BGM when explicitly requested — music continues across scenes by default
      if (step.stopMusic) _stopBgm()
      _clearSceneLayers()
      store.setBackground({
        src:        sceneSrc,
        color:      step.color      ?? null,
        transition: step.transition ?? 'fade',
      })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'end') { _finishSession('end-step'); return }

    if (step.type === 'image') {
      const hasId  = step.id  !== undefined && step.id  !== null
      const hasSrc = step.src !== undefined && step.src !== null
      if (hasId && hasSrc)
        throw new Error('[vnova] image step must provide either "id" or "src", but not both')
      const imageId  = hasId ? step.id : null
      const imageSrc = hasSrc
        ? normalizeAssetUrl(step.src)
        : (imageId ? resolveAsset('images', imageId, imageId) : null)
      store.setImage({ src: imageSrc, transition: step.transition ?? 'fade', fit: normalizeImageFit(step.fit) })
      _moveTo(store.cursor + 1)
      return
    }

    if (step.type === 'show') {
      const characterDef   = characters[step.character] ?? {}
      const variant        = step.variant ?? step.expression ?? 'default'
      const spriteFromReg  = normalizeAssetUrl(characterDef.sprites?.[variant] ?? characterDef.defaultSprite ?? null)
      store.showCharacter({
        character: step.character,
        data: {
          id:         step.character,
          position:   step.position   ?? 'center',
          expression: variant,
          sprite:     normalizeAssetUrl(step.sprite ?? spriteFromReg),
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

    if (step.type === 'choice') {
      store.setCurrent(step)
      store.setAwaitingChoice(true)
      store.pushHistory(step)
      return
    }

    if (step.type === 'say' || step.type === 'think' || step.type === 'narrate') {
      store.setCurrent(step)
      store.pushHistory(step)
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
    _runTrackedMove(() => {
      store.setAwaitingChoice(false)
      store.pushHistory({ type: '_choice_made', label: option.label })

      if (option.set) {
        for (const [key, value] of Object.entries(option.set))
          store.setVar({ key, value })
      }

      if (option.inc) {
        for (const [key, deltaRaw] of Object.entries(option.inc)) {
          const delta = Number(deltaRaw)
          if (!Number.isFinite(delta)) continue
          const base = Number.isFinite(Number(store.vars?.[key] ?? 0))
            ? Number(store.vars[key] ?? 0) : 0
          store.setVar({ key, value: base + delta })
        }
      }

      if (option.jump) { _jumpTo(option.jump); return }
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

  function getVar(key)          { return store.vars[key] }
  function setVar(key, value)   { store.setVar({ key, value }) }
  function getSetting(key)      { return store.settings?.[key] }
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

  return {
    // Expose the raw Pinia store so useVNova and advanced users can subscribe
    store,
    // Keep `state` as an alias so call steps and legacy code still work
    get state() { return store },

    stageArray,
    speakerName,
    speakerColor,
    quests:        computed(() => store.quests),
    listQuests:    questEngine.list,
    getQuest:      questEngine.get,
    evaluateQuests:questEngine.evaluate,
    setQuestStatus:questEngine.setStatus,
    advance,
    choose,
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
}
