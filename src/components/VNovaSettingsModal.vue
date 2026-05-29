<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  bgmVolume: { type: Number, default: 0.5 },
  sfxVolume: { type: Number, default: 0.5 },
  typewriterSpeed: { type: Number, default: 30 },
  textSize: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
})

const emit = defineEmits([
  'close',
  'update:bgm-volume',
  'update:sfx-volume',
  'update:typewriter-speed',
  'update:text-size',
])

function onBgmInput(event) {
  emit('update:bgm-volume', Number(event.target.value))
}

function onSfxInput(event) {
  emit('update:sfx-volume', Number(event.target.value))
}

function onTypewriterInput(event) {
  emit('update:typewriter-speed', Number(event.target.value))
}

function onTextSizeSelect(size) {
  emit('update:text-size', size)
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="props.open" class="modal-overlay" @click.self="emit('close')">
      <div class="glass-modal">
        <div class="modal-header">
          <h2>System Preferences</h2>
          <button class="close-btn" @click="emit('close')">&times;</button>
        </div>

        <div class="modal-body">
          <div class="setting-group">
            <label>BGM Master Volume ({{ (props.bgmVolume * 100).toFixed(0) }}%)</label>
            <input type="range" min="0" max="1" step="0.1" :value="props.bgmVolume" @input="onBgmInput" />
          </div>

          <div class="setting-group">
            <label>SFX Master Volume ({{ (props.sfxVolume * 100).toFixed(0) }}%)</label>
            <input type="range" min="0" max="1" step="0.1" :value="props.sfxVolume" @input="onSfxInput" />
          </div>

          <div class="setting-group">
            <label>Typewriter Speed ({{ props.typewriterSpeed }}ms)</label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              :value="props.typewriterSpeed"
              @input="onTypewriterInput"
            />
          </div>

          <div class="setting-group">
            <label>Dialogue Text Size</label>
            <div class="segmented-control" role="radiogroup" aria-label="Dialogue text size">
              <button
                type="button"
                class="segment-btn"
                :class="{ 'segment-btn--active': props.textSize === 'small' }"
                @click="onTextSizeSelect('small')"
              >
                Small
              </button>
              <button
                type="button"
                class="segment-btn"
                :class="{ 'segment-btn--active': props.textSize === 'medium' }"
                @click="onTextSizeSelect('medium')"
              >
                Medium
              </button>
              <button
                type="button"
                class="segment-btn"
                :class="{ 'segment-btn--active': props.textSize === 'large' }"
                @click="onTextSizeSelect('large')"
              >
                Large
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 40;
  display: flex;
  justify-content: center;
  align-items: center;
}

.glass-modal {
  background: rgba(20, 15, 30, 0.9);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  color: #e9d5ff;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.75rem;
  cursor: pointer;
  transition: color 150ms;
}

.close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group label {
  display: block;
  font-size: 0.85rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.setting-group input[type='range'] {
  width: 100%;
  accent-color: #a855f7;
}

.segmented-control {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  overflow: hidden;
}

.segment-btn {
  border: 0;
  background: rgba(255, 255, 255, 0.04);
  color: #d1d5db;
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.segment-btn + .segment-btn {
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.segment-btn:hover {
  background: rgba(168, 85, 247, 0.18);
  color: #f5f3ff;
}

.segment-btn--active {
  background: rgba(168, 85, 247, 0.28);
  color: #ffffff;
  font-weight: 600;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
