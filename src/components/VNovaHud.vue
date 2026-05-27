<script setup>
const props = defineProps({
  canBack:  { type: Boolean, default: true },
  audioLog: { type: String,  default: '' },
})

const emit = defineEmits(['back', 'open-save', 'open-load', 'open-backlog', 'open-settings', 'restart', 'exit-menu'])
</script>

<template>
  <div class="hud">
    <nav class="hud-strip" aria-label="Visual novel controls">
      <button class="hud-link" :disabled="!props.canBack" @click="emit('back')">Back</button>
      <button class="hud-link" @click="emit('open-backlog')">Log</button>
      <button class="hud-link" @click="emit('open-save')">Save</button>
      <button class="hud-link" @click="emit('open-load')">Load</button>
      <button class="hud-link" @click="emit('open-settings')">Settings</button>
      <button class="hud-link" @click="emit('restart')">Restart</button>
      <button class="hud-link danger" @click="emit('exit-menu')">Quit</button>
    </nav>

    <p v-if="props.audioLog" class="hud-audio">{{ props.audioLog }}</p>
  </div>
</template>

<style scoped>
.hud {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
}

.hud-strip {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(14, 10, 24, 0.78);
  border: 1px solid rgba(240, 234, 248, 0.2);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(7px);
  pointer-events: auto;
}

.hud-link {
  background: transparent;
  border: 0;
  color: rgba(245, 239, 252, 0.88);
  font-size: 0.95rem;
  font-family: 'Outfit', sans-serif;
  padding: 0.18rem 0.55rem;
  cursor: pointer;
  transition: color 180ms ease;
  line-height: 1;
}

.hud-link + .hud-link {
  border-left: 1px solid rgba(240, 234, 248, 0.2);
}

.hud-link:hover:not(:disabled) {
  color: #ffffff;
}

.hud-link:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hud-link.danger:hover {
  color: #ffb3b3;
}

.hud-audio {
  margin: 0;
  font-size: 0.72rem;
  color: rgba(233, 213, 255, 0.72);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}
</style>
