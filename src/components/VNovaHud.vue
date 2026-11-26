<script setup>
import { computed, inject, unref } from 'vue'
import { VNOVA_RUNTIME_CONTEXT_KEY } from './VNovaRuntime.vue'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)
const t = (key, params) => runtime?.t(key, params) ?? key

const autoMode = computed(() => Boolean(unref(runtime?.autoMode)))
const skipMode = computed(() => Boolean(unref(runtime?.skipMode)))

function toggleAuto() {
  runtime?.actions?.toggleAuto?.()
}

function toggleSkip() {
  runtime?.actions?.toggleSkip?.()
}

const props = defineProps({
  canBack: { type: Boolean, default: true },
  audioLog: { type: String, default: '' },
  showAudioLog: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  showBacklog: { type: Boolean, default: true },
  showGallery: { type: Boolean, default: false },
  showCredits: { type: Boolean, default: false },
})

const emit = defineEmits([
  'back',
  'open-save',
  'open-load',
  'open-backlog',
  'open-gallery',
  'open-credits',
  'open-settings',
  'restart',
  'exit-menu',
])
</script>

<template>
  <div v-if="props.visible" class="vnova-hud">
    <nav class="vnova-hud-strip" :aria-label="t('hud.ariaLabel')">
      <button class="vnova-hud-link" :disabled="!props.canBack" @click="emit('back')">{{ t('hud.back') }}</button>
      <button v-if="props.showBacklog" class="vnova-hud-link" @click="emit('open-backlog')">{{ t('hud.log') }}</button>
      <button v-if="props.showGallery" class="vnova-hud-link" @click="emit('open-gallery')">{{ t('hud.gallery') }}</button>
      <button
        class="vnova-hud-link"
        :class="{ 'is-active': autoMode }"
        :aria-pressed="autoMode ? 'true' : 'false'"
        @click="toggleAuto"
      >{{ t('hud.auto') }}</button>
      <button
        class="vnova-hud-link"
        :class="{ 'is-active': skipMode }"
        :aria-pressed="skipMode ? 'true' : 'false'"
        @click="toggleSkip"
      >{{ t('hud.skip') }}</button>
      <button class="vnova-hud-link" @click="emit('open-save')">{{ t('hud.save') }}</button>
      <button class="vnova-hud-link" @click="emit('open-load')">{{ t('hud.load') }}</button>
      <button class="vnova-hud-link" @click="emit('open-settings')">{{ t('hud.settings') }}</button>
      <button v-if="props.showCredits" class="vnova-hud-link" @click="emit('open-credits')">{{ t('hud.credits') }}</button>
      <button class="vnova-hud-link" @click="emit('restart')">{{ t('hud.restart') }}</button>
      <button class="vnova-hud-link danger" @click="emit('exit-menu')">{{ t('hud.quit') }}</button>
    </nav>

    <p v-if="props.audioLog && props.showAudioLog" class="vnova-hud-audio">{{ props.audioLog }}</p>
  </div>
</template>
