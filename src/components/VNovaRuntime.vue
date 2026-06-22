<script>
import {
  Comment,
  Fragment,
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  useSlots,
  watch,
} from 'vue'

import VNovaBacklogModal from './VNovaBacklogModal.vue'
import VNovaBaseModal from './VNovaBaseModal.vue'
import VNovaCreditsScreen from './VNovaCreditsScreen.vue'
import VNovaHud from './VNovaHud.vue'
import VNovaSaveModal from './VNovaSaveModal.vue'
import VNovaSettingsModal from './VNovaSettingsModal.vue'
import VNovaStage from './VNovaStage.vue'
import VNovaTitleScreen from './VNovaTitleScreen.vue'
import VNovaLoadingScreen from './VNovaLoadingScreen.vue'
import { useVNovaAudio } from '../composables/useVNovaAudio.js'
import { cloneDeep } from '../utils/clone.js'
import { isPlainObject } from '../utils/predicates.js'
import { normalizeAssetUrl } from '../utils/normalize.js'
import { expandNestedLabels } from '../core/engine.js'
import '../utils/particles.js'
import { showNotify } from '../utils/notify.js'

export const VNOVA_RUNTIME_CONTEXT_KEY = 'vnova-runtime'

const BUILTIN_NAMES = {
  stage: ['VNovaStage'],
  title: ['VNovaTitleScreen'],
  hud: ['VNovaHud'],
  settings: ['VNovaSettingsModal'],
  save: ['VNovaSaveModal'],
  backlog: ['VNovaBacklogModal'],
  credits: ['VNovaCreditsScreen'],
  modal: ['VNovaBaseModal'],
}

function componentNameOf(vnode) {
  const type = vnode?.type
  if (!type) return null
  if (typeof type === 'string') return type
  return type.name || type.__name || null
}

function matchesComponent(vnode, componentRef, names = []) {
  if (!vnode || !vnode.type) return false
  if (vnode.type === componentRef) return true
  const name = componentNameOf(vnode)
  return Boolean(name && names.includes(name))
}

// ── Declarative modal support ─────────────────────────────────────────────────
// Handles { type: 'modal', id: 'some-component' } syntax
function isDeclarativeModal(vnode) {
  if (!isVNode(vnode) || vnode.type === Comment) return false
  if (vnode.type === Fragment && Array.isArray(vnode.children)) {
    return vnode.children.some((child) => isDeclarativeModal(child))
  }
  return vnode.type === 'modal' && typeof vnode.props?.id === 'string'
}

function resolveDeclarativeModal(vnode) {
  const modalProps = vnode.props || {}
  const modalId = modalProps.id || 'vnova-modal'
  const isOpen = modalProps.open !== undefined ? Boolean(modalProps.open) : true

  return h(VNovaBaseModal, {
    ...modalProps,
    id: modalId,
    title: modalProps.title || 'Modal',
    open: isOpen,
    onClose: (...args) => {
      console.log(`[vnova] Declarative modal closed: ${modalId}`)
      if (typeof modalProps.onClose === 'function') modalProps.onClose(...args)
    },
  }, vnode.children || null)
}

function toArray(handler) {
  if (!handler) return []
  return Array.isArray(handler) ? handler : [handler]
}

function chainListeners(runtimeHandler, userHandler) {
  const runtimeFns = toArray(runtimeHandler)
  const userFns = toArray(userHandler)
  if (runtimeFns.length === 0 && userFns.length === 0) return undefined

  return (...args) => {
    runtimeFns.forEach((fn) => typeof fn === 'function' && fn(...args))
    userFns.forEach((fn) => typeof fn === 'function' && fn(...args))
  }
}

function buildVNodePatch(vnode, definition) {
  const patch = {}
  const currentProps = vnode.props || {}

  if (definition.props) {
    for (const [key, value] of Object.entries(definition.props)) {
      if (value !== undefined) patch[key] = value
    }
  }

  if (definition.listeners) {
    for (const [listenerKey, runtimeHandler] of Object.entries(definition.listeners)) {
      const userHandler = currentProps[listenerKey]
      const chained = chainListeners(runtimeHandler, userHandler)
      if (chained) patch[listenerKey] = chained
    }
  }

  return patch
}

function asFunction(value) {
  return typeof value === 'function' ? value : null
}

function maybeUnref(value) {
  if (value && typeof value === 'object' && 'value' in value) return value.value
  return value
}

function cloneJson(value) {
  return cloneDeep(value)
}

function isRenderableComponent(value) {
  return typeof value === 'function' || isPlainObject(value)
}

function destroyParticlesByContainer(containerId) {
  if (typeof window === 'undefined') return

  const domList = window.pJSDom
  if (!Array.isArray(domList)) return

  const index = domList.findIndex((entry) => {
    const hostId = entry?.pJS?.canvas?.el?.parentNode?.id
    return hostId === containerId
  })
  if (index < 0) return

  const target = domList[index]
  try { target?.pJS?.fn?.vendors?.destroypJS?.() } catch { }
}

export default defineComponent({
  name: 'VNovaRuntime',
  props: {
    script: { type: [Array, Object], required: true },
    characters: { type: Object, default: () => ({}) },
    assets: { type: Object, default: () => ({}) },
    credits: { type: Array, default: () => [] },
    particles: { type: Object, default: () => ({}) },
    config: { type: Object, default: () => ({}) },
    modals: { type: Object, default: () => ({}) },
    componentResolvers: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const slots = useSlots()
    const builtInAudio = useVNovaAudio({ bgmVolume: 1, sfxVolume: 1 })
    const particlesContainerId = `vnova-particles-${Math.random().toString(36).slice(2, 10)}`

    const builtInStageRef = ref(null)
    const customStageApi = ref(null)

    // Preloader states
    const preloadEnabled = computed(() => props.config?.preload !== false && props.config?.preloadAssets !== false)
    const loadingOpen = ref(preloadEnabled.value)
    const preloadProgress = ref(0)
    const currentLoadingAsset = ref('')

    // Language resolution states
    const availableLanguages = computed(() => isPlainObject(props.script) ? Object.keys(props.script) : [])
    const selectedLanguage = ref(props.config?.defaultLanguage || '')

    const titleOpen = ref(true)
    const settingsOpen = ref(false)
    const backlogOpen = ref(false)
    const creditsOpen = ref(false)
    const saveOpen = ref(false)
    const saveMode = ref('save')
    const audioLog = ref('')
    const hasBacklogRenderer = ref(false)
    const hasCreditsRenderer = ref(false)
    const hasSettingsRenderer = ref(false)
    const hasSaveRenderer = ref(false)
    const hasDeclarativeModal = ref(false)
    const pendingStageActions = []

    const activeStage = computed(() => customStageApi.value || builtInStageRef.value)
    const stageState = computed(() => maybeUnref(activeStage.value?.state) ?? null)

    const currentLanguage = computed({
      get() {
        const list = availableLanguages.value
        if (list.length === 0) return null
        const stored = stageState.value?.settings?.language
        if (stored && list.includes(stored)) return stored
        if (selectedLanguage.value && list.includes(selectedLanguage.value)) return selectedLanguage.value
        return list[0] || 'en'
      },
      set(val) {
        selectedLanguage.value = val
        handleSetSetting('language', val)
      }
    })

    const resolvedScript = computed(() => {
      if (isPlainObject(props.script)) {
        return props.script[currentLanguage.value] || []
      }
      return props.script
    })

    const canBack = computed(() => Boolean(maybeUnref(activeStage.value?.canBack) ?? false))
    const hasSave = computed(() => Boolean(maybeUnref(activeStage.value?.hasSave) ?? false))
    const history = computed(() => {
      const value = maybeUnref(activeStage.value?.history)
      return Array.isArray(value) ? value : []
    })

    const saveKey = computed(() => props.config?.saveKey || 'vnova')
    const slotCount = computed(() => Number(props.config?.slotCount ?? 8))
    const uiModalRegistry = computed(() => {
      const fromConfig = isPlainObject(props.config?.ui?.modals) ? props.config.ui.modals : {}
      const fromProps = isPlainObject(props.modals) ? props.modals : {}
      return { ...fromConfig, ...fromProps }
    })
    const runtimeModalsEnabled = computed(() => {
      if (props.config?.ui?.autoModal === true) return true
      return Object.keys(uiModalRegistry.value).length > 0
    })

    const bgmVolume = computed(() => Number(stageState.value?.settings?.bgmVolume ?? 0.5))
    const sfxVolume = computed(() => Number(stageState.value?.settings?.sfxVolume ?? 0.5))
    const typewriterSpeed = computed(() => Number(stageState.value?.settings?.typewriterSpeed ?? 30))
    const spacebarFastForward = computed(() => stageState.value?.settings?.spacebarFastForward ?? 'fullspeed')
    const textSize = computed(() => stageState.value?.settings?.textSize ?? 'medium')

    function queueStageAction(action) {
      if (activeStage.value) {
        action()
        return
      }
      pendingStageActions.push(action)
    }

    watch(
      activeStage,
      (stageApi) => {
        if (!stageApi || pendingStageActions.length === 0) return
        const queue = pendingStageActions.splice(0, pendingStageActions.length)
        queue.forEach((action) => action())
      },
      { immediate: true }
    )

    function callStage(methodName, ...args) {
      const fn = activeStage.value?.[methodName]
      if (typeof fn !== 'function') return undefined
      return fn(...args)
    }

    function closeAllModals(options = {}) {
      const { resumeTypewriter = true } = options
      settingsOpen.value = false
      backlogOpen.value = false
      creditsOpen.value = false
      saveOpen.value = false
      callStage('closeSave')
      if (resumeTypewriter) callStage('resumeTypewriter')
    }

    function startFromConfigLabel() {
      const target = props.config?.startLabel
      const firstStep = Array.isArray(props.script) ? props.script[0] : null
      const startsAtTarget = firstStep?.type === 'label' && firstStep.id === target
      if (typeof target === 'string' && target.length > 0) {
        if (startsAtTarget) return
        callStage('jump', target)
      }
    }

    function handleNewGame() {
      closeAllModals({ resumeTypewriter: false })
      titleOpen.value = false
      queueStageAction(() => {
        callStage('restart')
        startFromConfigLabel()
        requestAnimationFrame(() => {
          callStage('resumeTypewriter')
        })
      })
    }

    function handleBack() {
      callStage('back')
    }

    function handleChoose(option) {
      callStage('choose', option)
    }

    function handleAdvance() {
      callStage('interact')
    }

    function handleCloseModal() {
      callStage('closeModal')
    }

    function handleSubmitInput(value) {
      return callStage('submitInput', value)
    }

    function handleSubmitSelect(option) {
      return callStage('submitSelect', option)
    }

    function handleOpenSave() {
      if (!hasSaveRenderer.value) {
        notifyMissingComponent('VNovaSaveModal')
        return
      }
      saveMode.value = 'save'
      saveOpen.value = true
      callStage('openSave')
    }

    function handleOpenLoad() {
      if (!hasSaveRenderer.value) {
        notifyMissingComponent('VNovaSaveModal')
        return
      }
      saveMode.value = 'load'
      saveOpen.value = true
      callStage('openLoad')
    }

    function handleOpenBacklog() {
      if (!hasBacklogRenderer.value) {
        if (import.meta.env?.DEV) {
          console.warn('[vnova] open-backlog requested but no VNovaBacklogModal is rendered in VNovaRuntime slot.')
        }
        return
      }
      backlogOpen.value = true
    }

    function handleOpenCredits() {
      if (!hasCreditsRenderer.value) {
        notifyMissingComponent('VNovaCreditsScreen')
        return
      }
      creditsOpen.value = true
    }

    function handleOpenSettings() {
      if (!hasSettingsRenderer.value) {
        notifyMissingComponent('VNovaSettingsModal')
        return
      }
      settingsOpen.value = true
    }

    function handleRestart() {
      closeAllModals({ resumeTypewriter: false })
      titleOpen.value = false
      queueStageAction(() => {
        callStage('restart')
        requestAnimationFrame(() => {
          callStage('resumeTypewriter')
        })
      })
    }

    function handleExitMenu() {
      closeAllModals()
      callStage('exitMenu')
      titleOpen.value = true
    }

    function handleCloseAnyModal() {
      closeAllModals()
    }

    function handleSetSetting(key, value) {
      callStage('setSetting', key, value)
    }

    function handleAudio(event) {
      if (event?.type === 'bgm') {
        const track = event.track || 'none'
        audioLog.value = `BGM: ${track}`
      }
      if (event?.type === 'sfx') {
        const track = event.track || 'none'
        audioLog.value = `SFX: ${track}`
      }

      const forward = asFunction(props.config?.onAudio)
      if (forward) {
        forward(event)
        return
      }

      // Built-in player is the default; users can replace it with config.onAudio.
      if (props.config?.audioPlayer !== false) builtInAudio.onAudio(event)
    }

    function handleNotify(event = {}) {
      showNotify(event)
      const forward = asFunction(props.config?.onNotify)
      if (forward) forward(event)
    }

    function stopBuiltInParticles() {
      destroyParticlesByContainer(particlesContainerId)
    }

    async function playBuiltInParticles(preset) {
      if (!preset || typeof window === 'undefined') {
        stopBuiltInParticles()
        return
      }

      stopBuiltInParticles()
      await nextTick()
      if (typeof window.particlesJS !== 'function') return
      window.particlesJS(particlesContainerId, cloneJson(preset))
    }

    watch(
      () => stageState.value?.particles,
      (particles, previousParticles) => {
        if (!particles) {
          if (previousParticles) handleParticles({ action: 'stop', id: null, config: null })
          return
        }
        handleParticles(particles)
      },
      { immediate: true, deep: true }
    )

    function handleParticles(event = {}) {
      const forward = asFunction(props.config?.onParticles)
      if (forward) {
        forward(event)
        return
      }

      if (event.action === 'stop') {
        stopBuiltInParticles()
        return
      }

      playBuiltInParticles(event.config)
    }

    function notifyMissingComponent(componentName) {
      handleNotify({
        status: 'error',
        title: 'Missing Runtime Component',
        text: `${componentName} is required in VNovaRuntime slot for this action.`,
      })
    }

    const stageOptions = computed(() => {
      const opts = {
        assets: props.assets,
        credits: props.credits,
        particles: props.particles,
        saveKey: saveKey.value,
        slotCount: slotCount.value,
        deferStart: titleOpen.value,
        ...(props.config?.stage || {}),
        onAudio: handleAudio,
        onParticles: handleParticles,
        onVideo: asFunction(props.config?.onVideo) || (() => { }),
        onNotify: handleNotify,
      }
      return opts
    })

    const runtimeContext = {
      state: stageState,
      canBack,
      hasSave,
      history,
      audioLog,
      hasDeclarativeModal,
      ui: {
        titleOpen,
        settingsOpen,
        backlogOpen,
        creditsOpen,
        saveOpen,
        saveMode,
      },
      actions: {
        newGame: handleNewGame,
        back: handleBack,
        choose: handleChoose,
        submitInput: handleSubmitInput,
        submitSelect: handleSubmitSelect,
        advance: handleAdvance,
        closeModal: handleCloseModal,
        restart: handleRestart,
        exitMenu: handleExitMenu,
        openSave: handleOpenSave,
        openLoad: handleOpenLoad,
        openBacklog: handleOpenBacklog,
        openCredits: handleOpenCredits,
        openSettings: handleOpenSettings,
        closeAllModals,
        setSetting: handleSetSetting,
      },
      registerStageApi(api) {
        customStageApi.value = api
      },
    }

    function getAssetType(url) {
      const cleanUrl = url.split('?')[0].toLowerCase()
      if (cleanUrl.endsWith('.mp3') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.wav') || cleanUrl.endsWith('.m4a') || cleanUrl.endsWith('.flac')) {
        return 'audio'
      }
      if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogv')) {
        return 'video'
      }
      return 'image'
    }

    function preloadImage(url) {
      return new Promise((resolve) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
      })
    }

    function preloadAudio(url) {
      return new Promise((resolve) => {
        const audio = new Audio()
        audio.src = url
        audio.preload = 'auto'
        let resolved = false
        const done = () => {
          if (resolved) return
          resolved = true
          cleanup()
          resolve(true)
        }
        const fail = () => {
          if (resolved) return
          resolved = true
          cleanup()
          resolve(false)
        }
        const cleanup = () => {
          audio.removeEventListener('canplaythrough', done)
          audio.removeEventListener('error', fail)
        }
        audio.addEventListener('canplaythrough', done)
        audio.addEventListener('error', fail)
        audio.load()
        setTimeout(done, 2000)
      })
    }

    function preloadVideo(url) {
      return new Promise((resolve) => {
        const video = document.createElement('video')
        video.src = url
        video.preload = 'auto'
        let resolved = false
        const done = () => {
          if (resolved) return
          resolved = true
          cleanup()
          resolve(true)
        }
        const fail = () => {
          if (resolved) return
          resolved = true
          cleanup()
          resolve(false)
        }
        const cleanup = () => {
          video.removeEventListener('canplaythrough', done)
          video.removeEventListener('error', fail)
        }
        video.addEventListener('canplaythrough', done)
        video.addEventListener('error', fail)
        video.load()
        setTimeout(done, 2000)
      })
    }

    function collectAssets(script, characters, assets) {
      const urls = new Set()
      
      if (assets && typeof assets === 'object') {
        for (const group of Object.values(assets)) {
          if (group && typeof group === 'object') {
            for (const url of Object.values(group)) {
              if (typeof url === 'string' && url.trim() && !url.includes('{{')) {
                urls.add(url.trim())
              }
            }
          }
        }
      }

      if (characters && typeof characters === 'object') {
        for (const char of Object.values(characters)) {
          if (!char || typeof char !== 'object') continue
          if (typeof char.defaultSprite === 'string' && char.defaultSprite.trim() && !char.defaultSprite.includes('{{')) {
            urls.add(char.defaultSprite.trim())
          }
          const sprites = char.sprites || char.expressions
          if (sprites && typeof sprites === 'object') {
            for (const url of Object.values(sprites)) {
              if (typeof url === 'string' && url.trim() && !url.includes('{{')) {
                urls.add(url.trim())
              }
            }
          }
        }
      }

      const scriptsToScan = []
      if (Array.isArray(script)) {
        scriptsToScan.push(script)
      } else if (script && typeof script === 'object') {
        for (const langScript of Object.values(script)) {
          if (Array.isArray(langScript)) {
            scriptsToScan.push(langScript)
          }
        }
      }

      for (const s of scriptsToScan) {
        const flat = expandNestedLabels(s)
        for (const step of flat) {
          if (!step) continue
          if (step.type === 'scene' && typeof step.src === 'string' && step.src.trim() && !step.src.includes('{{')) {
            urls.add(step.src.trim())
          }
          if (step.type === 'image' && typeof step.src === 'string' && step.src.trim() && !step.src.includes('{{')) {
            urls.add(step.src.trim())
          }
          if (step.type === 'show' && typeof step.sprite === 'string' && step.sprite.trim() && !step.sprite.includes('{{')) {
            urls.add(step.sprite.trim())
          }
          if (step.type === 'bgm' && typeof step.src === 'string' && step.src.trim() && !step.src.includes('{{')) {
            urls.add(step.src.trim())
          }
          if (step.type === 'sfx' && typeof step.src === 'string' && step.src.trim() && !step.src.includes('{{')) {
            urls.add(step.src.trim())
          }
          if (step.type === 'video' && typeof step.src === 'string' && step.src.trim() && !step.src.includes('{{')) {
            urls.add(step.src.trim())
          }
        }
      }

      return Array.from(urls)
    }

    async function runPreloader() {
      if (!preloadEnabled.value) {
        titleOpen.value = true
        return
      }

      const urls = collectAssets(props.script, props.characters, props.assets)
      if (urls.length === 0) {
        preloadProgress.value = 1
        loadingOpen.value = false
        titleOpen.value = true
        return
      }

      let loadedCount = 0
      const totalCount = urls.length

      const updateProgress = (url) => {
        loadedCount++
        preloadProgress.value = loadedCount / totalCount
        currentLoadingAsset.value = url
      }

      const batchSize = 5
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize)
        await Promise.all(batch.map(async (url) => {
          const type = getAssetType(url)
          const normalized = normalizeAssetUrl(url)
          try {
            if (type === 'audio') {
              await preloadAudio(normalized)
            } else if (type === 'video') {
              await preloadVideo(normalized)
            } else {
              await preloadImage(normalized)
            }
          } catch (e) {
            console.warn('[vnova] Preload failed for:', url, e)
          } finally {
            updateProgress(url)
          }
        }))
      }

      setTimeout(() => {
        loadingOpen.value = false
        titleOpen.value = true
      }, 300)
    }

    onMounted(() => {
      runPreloader()
    })

    provide(VNOVA_RUNTIME_CONTEXT_KEY, runtimeContext)

    onUnmounted(() => {
      stopBuiltInParticles()
      builtInAudio.stopAll()
    })

    const BUILTIN_DEFITIONS = [
      {
        ref: VNovaStage,
        names: BUILTIN_NAMES.stage,
        build: () => ({
          props: {
            script: resolvedScript.value,
            characters: props.characters,
            config: stageOptions.value,
            ref: builtInStageRef,
          },
        }),
      },
      {
        ref: VNovaTitleScreen,
        names: BUILTIN_NAMES.title,
        build: () => ({
          props: {
            visible: titleOpen.value && !loadingOpen.value,
            hasSave: hasSave.value,
            hasCredits: hasCreditsRenderer.value,
            title: props.config?.title,
            subtitle: props.config?.subtitle,
            meta: props.config?.meta,
            background: props.config?.titleBackground || props.config?.titleScreenBackground,
          },
          listeners: {
            onNewGame: handleNewGame,
            onOpenLoad: handleOpenLoad,
            onOpenSettings: handleOpenSettings,
            onOpenCredits: handleOpenCredits,
          },
        }),
      },
      {
        ref: VNovaHud,
        names: BUILTIN_NAMES.hud,
        build: () => ({
          props: {
            canBack: canBack.value,
            audioLog: audioLog.value,
            visible: !titleOpen.value && !loadingOpen.value,
            showBacklog: hasBacklogRenderer.value,
            showCredits: hasCreditsRenderer.value,
          },
          listeners: {
            onBack: handleBack,
            onOpenSave: handleOpenSave,
            onOpenLoad: handleOpenLoad,
            onOpenBacklog: handleOpenBacklog,
            onOpenCredits: handleOpenCredits,
            onOpenSettings: handleOpenSettings,
            onRestart: handleRestart,
            onExitMenu: handleExitMenu,
          },
        }),
      },
      {
        ref: VNovaSettingsModal,
        names: BUILTIN_NAMES.settings,
        build: () => ({
          props: {
            open: settingsOpen.value,
            bgmVolume: bgmVolume.value,
            sfxVolume: sfxVolume.value,
            typewriterSpeed: typewriterSpeed.value,
            spacebarFastForward: spacebarFastForward.value,
            textSize: textSize.value,
            languages: availableLanguages.value,
            language: currentLanguage.value,
          },
          listeners: {
            onClose: () => {
              settingsOpen.value = false
              callStage('resumeTypewriter')
            },
            'onUpdate:bgmVolume': (value) => handleSetSetting('bgmVolume', value),
            'onUpdate:sfxVolume': (value) => handleSetSetting('sfxVolume', value),
            'onUpdate:typewriterSpeed': (value) => handleSetSetting('typewriterSpeed', value),
            'onUpdate:spacebarFastForward': (value) => handleSetSetting('spacebarFastForward', value),
            'onUpdate:textSize': (value) => handleSetSetting('textSize', value),
            'onUpdate:language': (value) => {
              currentLanguage.value = value
            },
          },
        }),
      },
      {
        ref: VNovaSaveModal,
        names: BUILTIN_NAMES.save,
        build: () => ({
          props: {
            open: saveOpen.value,
            mode: saveMode.value,
            slotCount: slotCount.value,
            saveKey: saveKey.value,
            store: stageState.value,
          },
          listeners: {
            onClose: () => {
              saveOpen.value = false
              callStage('closeSave')
              callStage('resumeTypewriter')
            },
            onSaved: () => {
              saveOpen.value = false
              callStage('closeSave')
              callStage('resumeTypewriter')
            },
            onLoaded: () => {
              saveOpen.value = false
              titleOpen.value = false
              callStage('closeSave')
              callStage('resumeTypewriter')
            },
          },
        }),
      },
      {
        ref: VNovaBacklogModal,
        names: BUILTIN_NAMES.backlog,
        build: () => ({
          props: {
            open: backlogOpen.value,
            history: history.value,
            characters: props.characters,
          },
          listeners: {
            onClose: () => {
              backlogOpen.value = false
              callStage('resumeTypewriter')
            },
          },
        }),
      },
      {
        ref: VNovaCreditsScreen,
        names: BUILTIN_NAMES.credits,
        build: () => ({
          props: {
            open: creditsOpen.value,
            credits: props.credits,
            title: props.config?.creditsTitle || 'Credits',
          },
          listeners: {
            onClose: () => {
              creditsOpen.value = false
              callStage('resumeTypewriter')
            },
          },
        }),
      },
    ]

    function builtInDefinitionFor(vnode) {
      for (const entry of BUILTIN_DEFITIONS) {
        if (matchesComponent(vnode, entry.ref, entry.names)) {
          return entry.build()
        }
      }
      return null
    }

    function customDefinitionFor(vnode) {
      const componentName = componentNameOf(vnode)
      if (!componentName) return null

      const resolver = props.componentResolvers?.[componentName]
      if (typeof resolver === 'function') {
        return resolver({
          componentName,
          vnode,
          runtime: runtimeContext,
          stage: activeStage.value,
          config: props.config,
        })
      }

      return null
    }

    function genericDefinition() {
      const listeners = {
        onNewGame: handleNewGame,
        onOpenSettings: handleOpenSettings,
        onOpenSave: handleOpenSave,
        onOpenLoad: handleOpenLoad,
        onOpenBacklog: handleOpenBacklog,
        onBack: handleBack,
        onRestart: handleRestart,
        onExitMenu: handleExitMenu,
        onClose: handleCloseAnyModal,
      }
      return { listeners }
    }

    function getActiveModalStep() {
      const state = stageState.value
      const step = state?.current
      if (!state?.awaitingChoice || !step || step.type !== 'modal') return null
      return step
    }

    function resolveModalComponent(step) {
      if (!step) return null
      const uiKey = typeof step.ui === 'string' && step.ui.trim().length > 0
        ? step.ui.trim()
        : step.id

      const component = uiModalRegistry.value?.[uiKey] ?? uiModalRegistry.value?.[step.id]
      return isRenderableComponent(component) ? component : null
    }

    function modalComponentProps(step) {
      return {
        id: step.id,
        open: true,
        title: step.title || 'Modal',
        prompt: step.prompt || '',
        options: Array.isArray(step.options) ? step.options : [],
        step,
        state: stageState.value,
        actions: runtimeContext.actions,
        runtime: runtimeContext,
        onChoose: handleChoose,
        onClose: handleCloseModal,
      }
    }

    function renderDefaultRuntimeModal(step) {
      const options = Array.isArray(step.options) ? step.options : []
      return h(
        VNovaBaseModal,
        {
          id: step.id || 'vnova-modal',
          open: true,
          title: step.title || 'Modal',
          size: step.size || 'large',
          showHeader: step.showHeader ?? false,
          closeOnBackdrop: step.closeOnBackdrop ?? false
        },
        {
          default: () => [
            step.prompt ? h('p', { class: 'vnova-runtime-modal__prompt' }, step.prompt) : null,
            ...options.map((option, index) => h(
              'button',
              {
                key: option?.label || `modal-option-${index}`,
                class: 'vnova-runtime-modal__option',
                type: 'button',
                disabled: option?.disabled === true,
                onClick: () => handleChoose(option),
              },
              option?.label || `Option ${index + 1}`
            )),
          ],
        }
      )
    }

    function renderActiveRuntimeModal() {
      if (!runtimeModalsEnabled.value) return null
      if (hasDeclarativeModal.value) return null

      const step = getActiveModalStep()
      if (!step) return null

      const customModal = resolveModalComponent(step)
      if (customModal) return h(customModal, modalComponentProps(step))
      return renderDefaultRuntimeModal(step)
    }

    function resolveVNode(vnode) {
      if (!isVNode(vnode) || vnode.type === Comment) return vnode

      // ── Declarative modal support ────────────────────────────────────────────
      if (isDeclarativeModal(vnode)) {
        return resolveDeclarativeModal(vnode)
      }

      if (vnode.type === Fragment && Array.isArray(vnode.children)) {
        const children = vnode.children.map(resolveVNode)
        return h(Fragment, vnode.props || null, children)
      }

      const definition = customDefinitionFor(vnode)
        || builtInDefinitionFor(vnode)
        || genericDefinition()

      const patch = buildVNodePatch(vnode, definition || {})
      if (Object.keys(patch).length === 0) return vnode
      return cloneVNode(vnode, patch)
    }

    function containsComponent(vnode, componentRef, names) {
      if (!isVNode(vnode) || vnode.type === Comment) return false
      if (matchesComponent(vnode, componentRef, names)) return true
      if (vnode.type === Fragment && Array.isArray(vnode.children)) {
        return vnode.children.some((child) => containsComponent(child, componentRef, names))
      }
      return false
    }

    // ── Declarative modal detection ────────────────────────────────────────────
    function containsDeclarativeModal(nodes) {
      return nodes.some((node) => isDeclarativeModal(node))
    }

    return () => {
      const nodes = slots.default ? slots.default() : []
      hasBacklogRenderer.value = nodes.some((node) => containsComponent(node, VNovaBacklogModal, BUILTIN_NAMES.backlog))
      hasCreditsRenderer.value = nodes.some((node) => containsComponent(node, VNovaCreditsScreen, BUILTIN_NAMES.credits))
      hasSettingsRenderer.value = nodes.some((node) => containsComponent(node, VNovaSettingsModal, BUILTIN_NAMES.settings))
      hasSaveRenderer.value = nodes.some((node) => containsComponent(node, VNovaSaveModal, BUILTIN_NAMES.save))
      hasDeclarativeModal.value = containsDeclarativeModal(nodes)
      return h(
        'div',
        { class: 'vnova-runtime' },
        [
          h('div', { id: particlesContainerId, class: 'vnova-runtime-particles', 'aria-hidden': 'true' }),
          loadingOpen.value ? h(VNovaLoadingScreen, {
            progress: preloadProgress.value,
            currentAsset: currentLoadingAsset.value,
          }) : null,
          ...nodes.map(resolveVNode),
          renderActiveRuntimeModal(),
        ]
      )
    }
  },
})
</script>