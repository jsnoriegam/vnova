<script setup>
/**
 * docs-example/src/App.vue
 *
 * Lean integration example.
 * UI-heavy pieces are imported from core components.
 */
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import {
  VNovaStage,
  VNovaTitleScreen,
  VNovaHud,
  VNovaSettingsModal,
  VNovaBacklogModal,
  validateScript,
} from 'vnova-engine'
import script from './story/script.js'
import { characters } from './story/characters.js'

// Dev-time validation
const warnings = validateScript(script, characters)
if (warnings.length) console.warn('[vnova] warnings:\n' + warnings.join('\n'))

const store = useStore()
const stageRef = ref(null)
const stageMountKey = ref(0)

// UI State
const showTitleScreen = ref(true)
const showSettings = ref(false)
const showBacklog = ref(false)
const hasSave = ref(!!localStorage.getItem('my-vn-save'))

// Vuex state bindings
const bgmVolume = computed({
  get: () => store.state.vnova.settings.bgmVolume,
  set: (val) => store.commit('vnova/SET_SETTING', { key: 'bgmVolume', value: val })
})

const sfxVolume = computed({
  get: () => store.state.vnova.settings.sfxVolume,
  set: (val) => store.commit('vnova/SET_SETTING', { key: 'sfxVolume', value: val })
})

const typewriterSpeed = computed({
  get: () => store.state.vnova.settings.typewriterSpeed,
  set: (val) => store.commit('vnova/SET_SETTING', { key: 'typewriterSpeed', value: val })
})

const textSize = computed({
  get: () => store.state.vnova.settings.textSize ?? 'medium',
  set: (val) => store.commit('vnova/SET_SETTING', { key: 'textSize', value: val })
})

const history = computed(() => store.state.vnova.history)
const canBack = computed(() => store.getters['vnova/canBack'])

// Audio playing indicators (for visual feedback)
const currentAudioLog = ref('None')

function onEnd() {
  console.log('Story ended. Final vars:', store.state.vnova.vars)
}

function onChoice(option) {
  console.log('Player chose:', option.label)
}

function handleAudio({ type, track, volume }) {
  const masterVolume = type === 'bgm' ? bgmVolume.value : sfxVolume.value
  currentAudioLog.value = `${type.toUpperCase()}: "${track}" @ ${(volume * 100).toFixed(0)}% (Master: ${(masterVolume * 100).toFixed(0)}%)`
  console.log(`[audio] ${type} → ${track} @ ${volume.toFixed(2)}`)
}

function startNewGame() {
  localStorage.removeItem('my-vn-save')
  hasSave.value = false
  stageMountKey.value += 1
  showTitleScreen.value = false
}

function loadGame() {
  if (!hasSave.value) return
  stageMountKey.value += 1
  showTitleScreen.value = false
}

function triggerSave() {
  stageRef.value?.save()
  hasSave.value = true
}

function triggerLoad() {
  if (!hasSave.value) return
  stageMountKey.value += 1
}

function triggerBack() {
  stageRef.value?.back?.()
}

function exitToMenu() {
  showTitleScreen.value = true
}
</script>

<template>
  <div class="vn-app-container">

    <div class="ambient-bg"></div>

    <VNovaTitleScreen
      :visible="showTitleScreen"
      :has-save="hasSave"
      title="VNOVA ENGINE"
      subtitle="Vuex-powered visual novel framework"
      meta="v0.1.0 - Vue 3 & Vuex 4"
      @new-game="startNewGame"
      @load-game="loadGame"
      @open-settings="showSettings = true"
    />

    <transition name="fade">
      <div v-if="!showTitleScreen" class="vn-stage-wrapper">
        <VNovaStage
          :key="stageMountKey"
          ref="stageRef"
          :script="script"
          :characters="characters"
          :options="{
            typewriterSpeed: typewriterSpeed,
            typewriterEnabled: true,
            keyboardEnabled: true,
            saveKey: 'my-vn-save',
            onAudio: handleAudio,
            store: store,
          }"
          @end="onEnd"
          @choice="onChoice"
        >
          <template #overlay>
            <VNovaHud
              :can-back="canBack"
              :has-save="hasSave"
              :audio-log="currentAudioLog"
              @back="triggerBack"
              @save="triggerSave"
              @load="triggerLoad"
              @open-backlog="showBacklog = true"
              @open-settings="showSettings = true"
              @exit-menu="exitToMenu"
            />
          </template>
        </VNovaStage>
      </div>
    </transition>

    <VNovaSettingsModal
      :open="showSettings"
      :bgm-volume="bgmVolume"
      :sfx-volume="sfxVolume"
      :typewriter-speed="typewriterSpeed"
      :text-size="textSize"
      @close="showSettings = false"
      @update:bgm-volume="bgmVolume = $event"
      @update:sfx-volume="sfxVolume = $event"
      @update:typewriter-speed="typewriterSpeed = $event"
      @update:text-size="textSize = $event"
    />

    <VNovaBacklogModal
      :open="showBacklog"
      :history="history"
      :characters="characters"
      @close="showBacklog = false"
    />

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Outfit:wght@300;400;600&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  height: 100%;
  background: #060408;
  font-family: 'Outfit', sans-serif;
  color: #f3eff5;
  overflow: hidden;
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
::-webkit-scrollbar-thumb {
  background: rgba(147, 51, 234, 0.3);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 51, 234, 0.6);
}
</style>

<style scoped>
.vn-app-container {
  width: 100%;
  height: 100dvh;
  position: relative;
}

.ambient-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at center, #1b102b 0%, #060408 100%);
  opacity: 0.8;
}

/* ── STAGE WRAPPER ── */
.vn-stage-wrapper {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  background: #000;
}

.vn-stage-wrapper :deep(.vnova-stage) {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border-radius: 0;
  box-shadow: none;
  border: 0;
}

/* ── TRANSITIONS ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
