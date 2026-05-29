<script setup>
/**
 * VNovaStage.vue
 *
 * Drop-in stage component. Renders background, sprites, dialogue box,
 * nameplate, and choices. Designed to be the *only* thing you put in
 * a full-screen container — layout is your responsibility.
 *
 * Props:
 *   script      {object[]}  required — story script
 *   characters  {object}    optional — character registry
 *   options     {object}    optional — passed to useVNova()
 *
 * Emits:
 *   end                     — when the script finishes
 *   choice (option)         — when a player makes a choice
 *   advance                 — on every manual advance
 *   back                    — on backtracking command
 *
 * Slots:
 *   #overlay({ canBack, hasSave, history, back, save, load, restart, openSave, openLoad, closeSave, exitMenu })
 *   #sprite({ char, pos })
 *
 * Exposed (use ref on the component):
 *   interact, choose, back, jump, restart, save, load, clearSave,
 *   openSave, openLoad, closeSave, saveOpen, saveMode, exitMenu,
 *   canBack, hasSave, history,
 *   listQuests, getQuest, evaluateQuests, setQuestStatus,
 *   getVar, setVar, state
 */

import { computed, ref } from 'vue'
import { useVNova } from '../composables/useVNova.js'
import { useVNovaSaves } from '../composables/useVNovaSaves.js'

const props = defineProps({
  script:     { type: Array,  required: true },
  characters: { type: Object, default: () => ({}) },
  options:    { type: Object, default: () => ({}) },
})

const emit = defineEmits(['end', 'choice', 'advance', 'back'])

const keyboardEnabled = computed(() => props.options?.keyboardEnabled ?? true)

const vn = useVNova(props.script, {
  characters: props.characters,
  ...props.options,
  keyboardEnabled,
  onEnd:  (payload) => emit('end', payload),
  onAudio: (evt) => props.options?.onAudio?.(evt),
  onVideo: (evt) => props.options?.onVideo?.(evt),
})

const {
  state, stageArray, speakerName, speakerColor,
  displayedText, textComplete, bgLayers, bgLayerStyle, imageTransitioning,
  imageStyle, interact, choose, back, jump,
  restart, exitMenu, save, load, clearSave,
  resumeTypewriter,
  listQuests, getQuest, evaluateQuests, setQuestStatus,
  getVar, setVar, getSetting, setSetting,
} = vn

const canBack = computed(() => Array.isArray(state.backStack) && state.backStack.length > 0)
const history = computed(() => (Array.isArray(state.history) ? state.history : []))
const saveSlots = useVNovaSaves({
  saveKey: props.options?.saveKey,
  slotCount: props.options?.slotCount ?? 8,
  store: state,
})

const hasSave = saveSlots.hasSave
const saveOpen = ref(false)
const saveMode = ref('save')

const dialogueTextSize = computed(() => {
  const size = state.settings?.textSize ?? 'medium'
  if (size === 'large') return '1.5rem'
  if (size === 'medium') return '1.15rem'
  return '1rem'
})

function handleSave() {
  return save()
}

function handleLoad() {
  return load()
}

function handleClearSave() {
  clearSave()
}

function openSave() {
  saveMode.value = 'save'
  saveOpen.value = true
}

function openLoad() {
  saveMode.value = 'load'
  saveOpen.value = true
}

function closeSave() {
  saveOpen.value = false
}

function handleChoose(option) {
  emit('choice', option)
  choose(option)
}

function handleInteract() {
  emit('advance')
  interact()
}

function handleBack() {
  emit('back')
  return back()
}

function handleExitMenu() {
  exitMenu()
}

defineExpose({
  interact,
  choose,
  back: handleBack,
  jump,
  restart,
  save: handleSave,
  load: handleLoad,
  clearSave: handleClearSave,
  openSave,
  openLoad,
  closeSave,
  saveOpen,
  saveMode,
  exitMenu: handleExitMenu,
  canBack,
  hasSave,
  history,
  listQuests,
  getQuest,
  evaluateQuests,
  setQuestStatus,
  getVar,
  setVar,
  getSetting,
  setSetting,
  resumeTypewriter,
  state,
})
</script>

<template>
  <div
    class="vnova-stage"
    :style="{ '--vnova-text-size': dialogueTextSize }"
    @click="handleInteract"
    @touchend.prevent="handleInteract"
  >
    <template v-for="layer in bgLayers" :key="layer.key">
      <div
        v-if="layer.visible"
        class="vnova-bg"
        :class="[
          `vnova-bg--${layer.transition}`,
          { 'vnova-bg--active': layer.active },
          { 'vnova-bg--entering': layer.entering },
        ]"
        :style="bgLayerStyle(layer)"
      />
    </template>

    <div
      class="vnova-image"
      :class="{ 'vnova-image--transitioning': imageTransitioning }"
      :style="imageStyle"
      aria-hidden="true"
    />

    <div class="vnova-sprites" aria-hidden="true">
      <transition-group name="vnova-sprite">
        <div
          v-for="char in stageArray"
          :key="char.id"
          :class="[
            'vnova-sprite',
            `vnova-sprite--${char.position}`,
            { 'vnova-sprite--dim': speakerName && characters[char.id]?.name !== speakerName },
          ]"
        >
          <slot name="sprite" :char="char" :pos="char.position">
            <img
              v-if="char.sprite"
              class="vnova-sprite__img"
              :src="char.sprite"
              :alt="characters[char.id]?.name ?? char.id"
            >
            <span v-else class="vnova-sprite__fallback">
              {{ characters[char.id]?.avatar ?? '👤' }}
            </span>
          </slot>
        </div>
      </transition-group>
    </div>

    <template v-if="!state.awaitingChoice && !state.ended">
      <div
        class="vnova-dialog"
        role="log"
        aria-live="polite"
        aria-label="Dialogue"
      >
        <div
          v-if="speakerName"
          class="vnova-nameplate"
          :style="speakerColor ? { color: speakerColor, borderColor: speakerColor } : {}"
        >
          {{ speakerName }}
        </div>

        <p class="vnova-text" :class="{ 'vnova-text--think': state.current?.type === 'think' }">{{ displayedText }}</p>

        <span
          v-if="textComplete"
          class="vnova-hint"
          aria-hidden="true"
        >▼</span>
      </div>
    </template>

    <div
      v-if="state.awaitingChoice && state.current"
      class="vnova-choices"
      role="group"
      aria-label="Choose an option"
    >
      <p v-if="state.current.prompt" class="vnova-choices__prompt">
        {{ state.current.prompt }}
      </p>
      <button
        v-for="option in state.current.options"
        :key="option.label"
        class="vnova-choice-btn"
        @click.stop="handleChoose(option)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="state.ended" class="vnova-end">
      <slot name="end">
        <span class="vnova-end__text">— End —</span>
      </slot>
    </div>

    <div class="vnova-overlay" @click.stop>
      <slot
        name="overlay"
        :can-back="canBack"
        :has-save="hasSave"
        :history="history"
        :back="handleBack"
        :save="handleSave"
        :load="handleLoad"
        :open-save="openSave"
        :open-load="openLoad"
        :close-save="closeSave"
        :restart="restart"
        :exit-menu="handleExitMenu"
      />
    </div>
  </div>
</template>

<style scoped>
.vnova-stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  font-family: var(--vnova-font-body, 'Georgia', serif);
  background: var(--vnova-stage-bg, #000);
}

.vnova-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.vnova-bg--active { z-index: 1; }
.vnova-bg--fade { transition: opacity var(--vnova-bg-duration, 400ms) ease; }
.vnova-bg--fade.vnova-bg--entering { opacity: 0; }
.vnova-bg--dissolve { transition: opacity var(--vnova-bg-duration, 400ms) linear; }
.vnova-bg--dissolve.vnova-bg--entering { opacity: 0; }
.vnova-bg--slide-left { transition: opacity var(--vnova-bg-duration, 400ms) ease, transform var(--vnova-bg-duration, 400ms) ease; }
.vnova-bg--slide-left.vnova-bg--entering { opacity: 0; transform: translateX(6%); }
.vnova-bg--slide-right { transition: opacity var(--vnova-bg-duration, 400ms) ease, transform var(--vnova-bg-duration, 400ms) ease; }
.vnova-bg--slide-right.vnova-bg--entering { opacity: 0; transform: translateX(-6%); }
.vnova-bg--cut { transition: none; }

.vnova-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: opacity var(--vnova-bg-duration, 400ms) ease;
  opacity: 1;
  pointer-events: none;
  z-index: 2;
}

.vnova-image--transitioning { opacity: 1; }

.vnova-sprites {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  pointer-events: none;
  z-index: 1;
}

.vnova-sprite {
  position: absolute;
  bottom: var(--vnova-sprite-bottom, 0px);
  transition: filter 250ms ease, transform 250ms ease;
}

.vnova-sprite--left     { left: 5%; }
.vnova-sprite--left-far { left: 0; }
.vnova-sprite--center   { left: 50%; transform: translateX(-50%); }
.vnova-sprite--right    { right: 5%; }
.vnova-sprite--right-far{ right: 0; }

.vnova-sprite--dim { filter: brightness(0.45); }

.vnova-sprite__fallback {
  font-size: clamp(60px, 10vw, 120px);
  line-height: 1;
  display: block;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,.6));
}

.vnova-sprite__img {
  display: block;
  max-height: min(78dvh, 760px);
  max-width: min(36vw, 520px);
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,.6));
}

.vnova-sprite-enter-active,
.vnova-sprite-leave-active { transition: opacity 300ms ease, transform 300ms ease; }
.vnova-sprite-enter-from   { opacity: 0; transform: translateY(20px); }
.vnova-sprite-leave-to     { opacity: 0; transform: translateY(20px); }

.vnova-dialog {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  min-height: var(--vnova-dialog-height, 18%);
  padding: var(--vnova-dialog-padding, 0.8rem 1.2rem 0.95rem);
  background: var(--vnova-dialog-bg, rgba(0, 0, 0, 0.56));
  border-top: 1px solid var(--vnova-dialog-border, rgba(255,255,255,.12));
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 3;
}

.vnova-nameplate {
  display: inline-block;
  align-self: flex-start;
  padding: 0.2em 0.8em;
  font-size: var(--vnova-nameplate-size, 0.8rem);
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--vnova-nameplate-color, #fff);
  border: 1px solid rgba(255,255,255,.3);
  border-radius: 3px;
  background: rgba(255,255,255,.06);
}

.vnova-text {
  margin: 0;
  font-size: var(--vnova-text-size, 0.95rem);
  line-height: var(--vnova-text-line-height, 1.55);
  color: var(--vnova-text-color, #f0eaf8);
  letter-spacing: 0.01em;
}

.vnova-text--think {
  font-style: italic;
  color: var(--vnova-think-color, #d9d1e8);
}

.vnova-hint {
  position: absolute;
  bottom: 1rem; right: 1.25rem;
  font-size: 1rem;
  color: rgba(255,255,255,.4);
  animation: vnova-blink 1.2s ease-in-out infinite;
}

@keyframes vnova-blink {
  0%, 100% { opacity: .35; }
  50%      { opacity: 1;   }
}

.vnova-choices {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  background: var(--vnova-choices-bg, rgba(0,0,0,.65));
  backdrop-filter: blur(6px);
  z-index: 4;
}

.vnova-choices__prompt {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: rgba(255,255,255,.7);
  text-align: center;
}

.vnova-choice-btn {
  width: 100%;
  max-width: 560px;
  padding: 0.85rem 1.5rem;
  font-size: var(--vnova-choice-size, 0.95rem);
  font-family: inherit;
  color: var(--vnova-choice-color, #f0eaf8);
  background: var(--vnova-choice-bg, rgba(255,255,255,.08));
  border: 1px solid var(--vnova-choice-border, rgba(255,255,255,.2));
  border-radius: var(--vnova-choice-radius, 6px);
  cursor: pointer;
  text-align: center;
  line-height: 1.4;
  transition: background 200ms, border-color 200ms, transform 180ms;
}

.vnova-choice-btn:hover {
  background: var(--vnova-choice-bg-hover, rgba(255,255,255,.18));
  border-color: rgba(255,255,255,.5);
  transform: translateY(-2px);
}

.vnova-choice-btn:active { transform: translateY(0); }

.vnova-end {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,.7);
  z-index: 5;
}

.vnova-end__text {
  font-size: 2rem;
  color: rgba(255,255,255,.8);
  letter-spacing: 0.3em;
}

.vnova-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
}

.vnova-overlay > * { pointer-events: auto; }
</style>
