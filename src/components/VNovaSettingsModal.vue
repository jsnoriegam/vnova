<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  bgmVolume: { type: Number, default: 0.5 },
  sfxVolume: { type: Number, default: 0.5 },
  typewriterSpeed: { type: Number, default: 30 },
  spacebarFastForward: {
    type: String,
    default: 'fullspeed',
    validator: (value) => ['fullspeed', 'throttled', 'off'].includes(value),
  },
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
  'update:spacebar-fast-forward',
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

function onSpacebarFastForwardSelect(mode) {
  emit('update:spacebar-fast-forward', mode)
}

function onTextSizeSelect(size) {
  emit('update:text-size', size)
}
</script>

<template>
  <transition name="vnova-slide-up">
    <div v-if="props.open" class="vnova-modal-overlay" @click.self="emit('close')">
      <div class="vnova-glass-modal">
        <div class="vnova-modal-header">
          <h2>System Preferences</h2>
          <button class="vnova-close-btn" @click="emit('close')">&times;</button>
        </div>

        <div class="vnova-modal-body">
          <div class="vnova-setting-group">
            <label>BGM Master Volume ({{ (props.bgmVolume * 100).toFixed(0) }}%)</label>
            <input type="range" min="0" max="1" step="0.1" :value="props.bgmVolume" @input="onBgmInput" />
          </div>

          <div class="vnova-setting-group">
            <label>SFX Master Volume ({{ (props.sfxVolume * 100).toFixed(0) }}%)</label>
            <input type="range" min="0" max="1" step="0.1" :value="props.sfxVolume" @input="onSfxInput" />
          </div>

          <div class="vnova-setting-group">
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

          <div class="vnova-setting-group vnova-setting-group--toggle">
            <label>Spacebar Fast-Forward</label>
            <div class="vnova-segmented-control" role="radiogroup" aria-label="Spacebar fast-forward mode">
              <button
                type="button"
                class="vnova-segment-btn"
                :class="{ 'vnova-segment-btn--active': props.spacebarFastForward === 'fullspeed' }"
                @click="onSpacebarFastForwardSelect('fullspeed')"
              >
                Fullspeed
              </button>
              <button
                type="button"
                class="vnova-segment-btn"
                :class="{ 'vnova-segment-btn--active': props.spacebarFastForward === 'throttled' }"
                @click="onSpacebarFastForwardSelect('throttled')"
              >
                Throttled
              </button>
              <button
                type="button"
                class="vnova-segment-btn"
                :class="{ 'vnova-segment-btn--active': props.spacebarFastForward === 'off' }"
                @click="onSpacebarFastForwardSelect('off')"
              >
                Off
              </button>
            </div>
            <small class="vnova-setting-help">
              `on` and `true` map to Fullspeed. `off` and `false` map to Off.
            </small>
          </div>

          <div class="vnova-setting-group">
            <label>Dialogue Text Size</label>
            <div class="vnova-segmented-control" role="radiogroup" aria-label="Dialogue text size">
              <button
                type="button"
                class="vnova-segment-btn"
                :class="{ 'vnova-segment-btn--active': props.textSize === 'small' }"
                @click="onTextSizeSelect('small')"
              >
                Small
              </button>
              <button
                type="button"
                class="vnova-segment-btn"
                :class="{ 'vnova-segment-btn--active': props.textSize === 'medium' }"
                @click="onTextSizeSelect('medium')"
              >
                Medium
              </button>
              <button
                type="button"
                class="vnova-segment-btn"
                :class="{ 'vnova-segment-btn--active': props.textSize === 'large' }"
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
.vnova-setting-group {
  margin-bottom: 1.5rem;
}

.vnova-setting-group label {
  display: block;
  font-size: 0.85rem;
  color: var(--vnova-color-muted);
  margin-bottom: 0.5rem;
}

.vnova-setting-help {
  display: block;
  margin-top: 0.5rem;
  color: var(--vnova-color-muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.vnova-setting-group input[type='range'] {
  width: 100%;
  accent-color: var(--vnova-color-primary);
}

.vnova-segmented-control {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  overflow: hidden;
}

.vnova-segment-btn {
  border: 0;
  background: rgba(255, 255, 255, 0.04);
  color: #d1d5db;
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.vnova-segment-btn + .vnova-segment-btn {
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.vnova-segment-btn:hover {
  background: rgba(168, 85, 247, 0.18);
  color: #f5f3ff;
}

.vnova-segment-btn--active {
  background: rgba(168, 85, 247, 0.28);
  color: #ffffff;
  font-weight: 600;
}
</style>
