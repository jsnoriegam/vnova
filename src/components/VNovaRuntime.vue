<script>
import {
  Comment,
  Fragment,
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  provide,
  ref,
  useSlots,
  watch,
} from 'vue'

import VNovaBacklogModal from './VNovaBacklogModal.vue'
import VNovaHud from './VNovaHud.vue'
import VNovaSaveModal from './VNovaSaveModal.vue'
import VNovaSettingsModal from './VNovaSettingsModal.vue'
import VNovaStage from './VNovaStage.vue'
import VNovaTitleScreen from './VNovaTitleScreen.vue'
import { showNotify } from '../utils/notify.js'

export const VNOVA_RUNTIME_CONTEXT_KEY = 'vnova-runtime'

const BUILTIN_NAMES = {
  stage: ['VNovaStage'],
  title: ['VNovaTitleScreen'],
  hud: ['VNovaHud'],
  settings: ['VNovaSettingsModal'],
  save: ['VNovaSaveModal'],
  backlog: ['VNovaBacklogModal'],
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

export default defineComponent({
  name: 'VNovaRuntime',
  props: {
    script: { type: Array, required: true },
    characters: { type: Object, default: () => ({}) },
    assets: { type: Object, default: () => ({}) },
    config: { type: Object, default: () => ({}) },
    componentResolvers: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const slots = useSlots()

    const builtInStageRef = ref(null)
    const customStageApi = ref(null)

    const titleOpen = ref(true)
    const settingsOpen = ref(false)
    const backlogOpen = ref(false)
    const saveOpen = ref(false)
    const saveMode = ref('save')
    const audioLog = ref('')
    const hasBacklogRenderer = ref(false)
    const hasSettingsRenderer = ref(false)
    const hasSaveRenderer = ref(false)
    const pendingStageActions = []

    const activeStage = computed(() => customStageApi.value || builtInStageRef.value)
    const stageState = computed(() => maybeUnref(activeStage.value?.state) ?? null)
    const canBack = computed(() => Boolean(maybeUnref(activeStage.value?.canBack) ?? false))
    const hasSave = computed(() => Boolean(maybeUnref(activeStage.value?.hasSave) ?? false))
    const history = computed(() => {
      const value = maybeUnref(activeStage.value?.history)
      return Array.isArray(value) ? value : []
    })

    const saveKey = computed(() => props.config?.saveKey || 'vnova')
    const slotCount = computed(() => Number(props.config?.slotCount ?? 8))

    const bgmVolume = computed(() => Number(stageState.value?.settings?.bgmVolume ?? 0.5))
    const sfxVolume = computed(() => Number(stageState.value?.settings?.sfxVolume ?? 0.5))
    const typewriterSpeed = computed(() => Number(stageState.value?.settings?.typewriterSpeed ?? 30))
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

    function handleLoadGame() {
      queueStageAction(() => {
        const loaded = callStage('load')
        if (loaded) {
          closeAllModals()
          titleOpen.value = false
          return
        }
        handleOpenLoad()
      })
    }

    function handleBack() {
      callStage('back')
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
      if (forward) forward(event)
    }

    function handleNotify(event = {}) {
      showNotify(event)
      const forward = asFunction(props.config?.onNotify)
      if (forward) forward(event)
    }

    function notifyMissingComponent(componentName) {
      handleNotify({
        status: 'error',
        title: 'Missing Runtime Component',
        text: `${componentName} is required in VNovaRuntime slot for this action.`,
      })
    }

    const stageOptions = computed(() => ({
      assets: props.assets,
      saveKey: saveKey.value,
      slotCount: slotCount.value,
      deferStart: titleOpen.value,
      ...(props.config?.stage || {}),
      onAudio: handleAudio,
      onVideo: asFunction(props.config?.onVideo) || (() => {}),
      onNotify: handleNotify,
    }))

    const runtimeContext = {
      state: stageState,
      canBack,
      hasSave,
      history,
      audioLog,
      ui: {
        titleOpen,
        settingsOpen,
        backlogOpen,
        saveOpen,
        saveMode,
      },
      actions: {
        newGame: handleNewGame,
        loadGame: handleLoadGame,
        back: handleBack,
        restart: handleRestart,
        exitMenu: handleExitMenu,
        openSave: handleOpenSave,
        openLoad: handleOpenLoad,
        openBacklog: handleOpenBacklog,
        openSettings: handleOpenSettings,
        closeAllModals,
        setSetting: handleSetSetting,
      },
      registerStageApi(api) {
        customStageApi.value = api
      },
    }

    provide(VNOVA_RUNTIME_CONTEXT_KEY, runtimeContext)

    function builtInDefinitionFor(vnode) {
      if (matchesComponent(vnode, VNovaStage, BUILTIN_NAMES.stage)) {
        return {
          props: {
            script: props.script,
            characters: props.characters,
            options: stageOptions.value,
            ref: builtInStageRef,
          },
        }
      }

      if (matchesComponent(vnode, VNovaTitleScreen, BUILTIN_NAMES.title)) {
        return {
          props: {
            visible: titleOpen.value,
            hasSave: hasSave.value,
            title: props.config?.title,
            subtitle: props.config?.subtitle,
            meta: props.config?.meta,
          },
          listeners: {
            onNewGame: handleNewGame,
            onLoadGame: handleLoadGame,
            onOpenSettings: handleOpenSettings,
          },
        }
      }

      if (matchesComponent(vnode, VNovaHud, BUILTIN_NAMES.hud)) {
        return {
          props: {
            canBack: canBack.value,
            audioLog: audioLog.value,
            visible: !titleOpen.value,
            showBacklog: hasBacklogRenderer.value,
          },
          listeners: {
            onBack: handleBack,
            onOpenSave: handleOpenSave,
            onOpenLoad: handleOpenLoad,
            onOpenBacklog: handleOpenBacklog,
            onOpenSettings: handleOpenSettings,
            onRestart: handleRestart,
            onExitMenu: handleExitMenu,
          },
        }
      }

      if (matchesComponent(vnode, VNovaSettingsModal, BUILTIN_NAMES.settings)) {
        return {
          props: {
            open: settingsOpen.value,
            bgmVolume: bgmVolume.value,
            sfxVolume: sfxVolume.value,
            typewriterSpeed: typewriterSpeed.value,
            textSize: textSize.value,
          },
          listeners: {
            onClose: () => {
              settingsOpen.value = false
              callStage('resumeTypewriter')
            },
            'onUpdate:bgmVolume': (value) => handleSetSetting('bgmVolume', value),
            'onUpdate:sfxVolume': (value) => handleSetSetting('sfxVolume', value),
            'onUpdate:typewriterSpeed': (value) => handleSetSetting('typewriterSpeed', value),
            'onUpdate:textSize': (value) => handleSetSetting('textSize', value),
          },
        }
      }

      if (matchesComponent(vnode, VNovaSaveModal, BUILTIN_NAMES.save)) {
        return {
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
        }
      }

      if (matchesComponent(vnode, VNovaBacklogModal, BUILTIN_NAMES.backlog)) {
        return {
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
        onLoadGame: handleLoadGame,
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

    function resolveVNode(vnode) {
      if (!isVNode(vnode) || vnode.type === Comment) return vnode

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

    return () => {
      const nodes = slots.default ? slots.default() : []
      hasBacklogRenderer.value = nodes.some((node) => containsComponent(node, VNovaBacklogModal, BUILTIN_NAMES.backlog))
      hasSettingsRenderer.value = nodes.some((node) => containsComponent(node, VNovaSettingsModal, BUILTIN_NAMES.settings))
      hasSaveRenderer.value = nodes.some((node) => containsComponent(node, VNovaSaveModal, BUILTIN_NAMES.save))
      return h(
        'div',
        { class: 'vnova-runtime' },
        nodes.map(resolveVNode)
      )
    }
  },
})
</script>

<style scoped>
.vnova-runtime {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
