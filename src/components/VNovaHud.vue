<script setup>
import { inject } from 'vue'
import { VNOVA_RUNTIME_CONTEXT_KEY } from './VNovaRuntime.vue'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)
const t = (key, params) => runtime?.t(key, params) ?? key

const props = defineProps({
  canBack: { type: Boolean, default: true },
  audioLog: { type: String, default: '' },
  showAudioLog: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  showBacklog: { type: Boolean, default: true },
  showCredits: { type: Boolean, default: false },
})

const emit = defineEmits([
  'back',
  'open-save',
  'open-load',
  'open-backlog',
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
