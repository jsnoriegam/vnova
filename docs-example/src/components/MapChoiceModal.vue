<script setup>
import { computed, inject } from 'vue'
import { VNovaBaseModal } from 'vnova-engine'

const RUNTIME_KEY = 'vnova-runtime'

const runtime = inject(RUNTIME_KEY, null)

const stageState = computed(() => runtime?.state?.value ?? null)
const currentStep = computed(() => stageState.value?.current ?? null)

const isOpen = computed(() => {
  const state = stageState.value
  const step = currentStep.value
  return Boolean(state?.awaitingChoice && step?.type === 'modal' && step?.id === 'city-map-route')
})

const modalTitle = computed(() => currentStep.value?.title || 'Route Selection Map')
const modalPrompt = computed(() => currentStep.value?.prompt || 'Select an infiltration point on the map.')

const pins = computed(() => {
  const options = Array.isArray(currentStep.value?.options) ? currentStep.value.options : []
  return options.map((option, index) => {
    const pin = option?.pin && typeof option.pin === 'object' ? option.pin : {}
    const x = Number.isFinite(Number(pin.x)) ? Number(pin.x) : 50
    const y = Number.isFinite(Number(pin.y)) ? Number(pin.y) : 50

    return {
      key: option.label || `pin-${index}`,
      option,
      x,
      y,
      caption: typeof pin.caption === 'string' ? pin.caption : option.label,
      detail: typeof pin.detail === 'string' ? pin.detail : '',
    }
  })
})

function pick(option) {
  runtime?.actions?.choose?.(option)
}

function closeModal() {
  runtime?.actions?.closeModal?.()
}
</script>

<template>
  <VNovaBaseModal
    id="city-map-route"
    :open="isOpen"
    :title="modalTitle"
    @close="closeModal"
  >
    <div class="map-modal">
      <p class="map-modal__prompt">{{ modalPrompt }}</p>

      <div class="map-board" role="group" aria-label="Map pins">
        <div class="map-board__grid" aria-hidden="true" />

        <button
          v-for="pin in pins"
          :key="pin.key"
          class="map-pin"
          type="button"
          :style="{ left: `${pin.x}%`, top: `${pin.y}%` }"
          @click="pick(pin.option)"
        >
          <span class="map-pin__dot" aria-hidden="true" />
          <span class="map-pin__label">{{ pin.caption }}</span>
          <span v-if="pin.detail" class="map-pin__detail">{{ pin.detail }}</span>
        </button>
      </div>
    </div>
  </VNovaBaseModal>
</template>

<style scoped>
.map-modal {
  display: grid;
  gap: 0.9rem;
}

.map-modal__prompt {
  margin: 0;
  color: rgba(235, 244, 255, 0.95);
  font-size: 0.98rem;
  letter-spacing: 0.02em;
}

.map-board {
  position: relative;
  min-height: 340px;
  border-radius: 14px;
  border: 1px solid rgba(146, 209, 255, 0.24);
  overflow: hidden;
  background:
    radial-gradient(circle at 24% 32%, rgba(56, 158, 255, 0.42), transparent 46%),
    radial-gradient(circle at 79% 64%, rgba(255, 165, 102, 0.35), transparent 42%),
    linear-gradient(145deg, rgba(5, 15, 26, 0.95), rgba(12, 35, 58, 0.96));
}

.map-board__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(130, 195, 255, 0.14) 1px, transparent 1px),
    linear-gradient(90deg, rgba(130, 195, 255, 0.14) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.2));
}

.map-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: #ecf7ff;
  cursor: pointer;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
}

.map-pin__dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(180deg, #ffe17c 0%, #ff9738 100%);
  border: 2px solid rgba(255, 249, 234, 0.9);
  box-shadow: 0 0 0 0 rgba(255, 170, 77, 0.5);
  animation: map-ping 1.5s ease-out infinite;
}

.map-pin__label {
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(4, 19, 34, 0.75);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.map-pin__detail {
  font-size: 0.68rem;
  opacity: 0.82;
}

.map-pin:hover .map-pin__dot,
.map-pin:focus-visible .map-pin__dot {
  transform: scale(1.15);
  box-shadow: 0 0 0 8px rgba(255, 170, 77, 0.22);
}

.map-pin:focus-visible {
  outline: 2px solid rgba(255, 221, 162, 0.85);
  outline-offset: 4px;
  border-radius: 8px;
}

@keyframes map-ping {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 170, 77, 0.5);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(255, 170, 77, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 170, 77, 0);
  }
}

@media (max-width: 720px) {
  .map-board {
    min-height: 280px;
  }

  .map-pin__label {
    font-size: 0.72rem;
  }
}
</style>
