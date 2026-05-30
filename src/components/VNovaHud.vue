<script setup>
const props = defineProps({
  canBack: { type: Boolean, default: true },
  audioLog: { type: String, default: '' },
  showAudioLog: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  showBacklog: { type: Boolean, default: true },
})

const emit = defineEmits(['back', 'open-save', 'open-load', 'open-backlog', 'open-settings', 'restart', 'exit-menu'])
</script>

<template>
  <div v-if="props.visible" class="vnova-hud">
    <nav class="vnova-hud-strip" aria-label="Visual novel controls">
      <button class="vnova-hud-link" :disabled="!props.canBack" @click="emit('back')">Back</button>
      <button v-if="props.showBacklog" class="vnova-hud-link" @click="emit('open-backlog')">Log</button>
      <button class="vnova-hud-link" @click="emit('open-save')">Save</button>
      <button class="vnova-hud-link" @click="emit('open-load')">Load</button>
      <button class="vnova-hud-link" @click="emit('open-settings')">Settings</button>
      <button class="vnova-hud-link" @click="emit('restart')">Restart</button>
      <button class="vnova-hud-link danger" @click="emit('exit-menu')">Quit</button>
    </nav>

    <p v-if="props.audioLog && props.showAudioLog" class="vnova-hud-audio">{{ props.audioLog }}</p>
  </div>
</template>
