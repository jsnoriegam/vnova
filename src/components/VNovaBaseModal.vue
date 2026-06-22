<script setup>
/**
 * VNovaBaseModal — base modal component for custom modals.
 *
 * This component provides a standardized modal structure that can be extended
 * by authors to create custom modals using the declarative syntax:
 * { type: 'modal', id: 'some-component' }
 *
 * Props:
 *   open      — controls visibility (default: false)
 *   id        — unique identifier for the modal (default: 'vnova-modal')
 *   title     — modal title text (default: 'Modal')
 *   size      — modal size: small, medium, large, xlarge, fullscreen
 *   close     — modal fue cerrado (usar @close en el padre)
 *   children  — Vue slots for modal content
 *
 * Emits:
 *   close     — modal was closed
 */

import { computed, inject, watch } from 'vue'
import { VNOVA_RUNTIME_CONTEXT_KEY } from './VNovaRuntime.vue'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)
const t = (key, params) => runtime?.t(key, params) ?? key

const MODAL_SIZE_ALIASES = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
  xl: 'xlarge',
  full: 'fullscreen',
}

const props = defineProps({
  open: { type: Boolean, default: false },
  id: { type: String, default: 'vnova-modal' },
  title: { type: String, default: '' },
  closeOnBackdrop: { type: Boolean, default: false },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => [
      'small',
      'medium',
      'large',
      'xlarge',
      'fullscreen',
      'sm',
      'md',
      'lg',
      'xl',
      'full',
    ].includes(value),
  },
  showHeader:  { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

// Watch for open prop changes
watch(() => props.open, (newOpen) => {
  if (!newOpen) {
    emit('close')
  }
})

const modalSizeClass = computed(() => {
  const size = MODAL_SIZE_ALIASES[props.size] || props.size
  return `vnova-base-modal--${size}`
})

defineSlots()
</script>

<template>
  <transition name="vnova-slide-up">
    <div v-if="props.open" class="vnova-modal-overlay" @click.self="() => props.closeOnBackdrop ? $emit('close') : false">
      <div class="vnova-glass-modal vnova-base-modal" :class="modalSizeClass">
        <div v-if="props.showHeader" class="vnova-modal-header">
          <h2>{{ props.title || t('common.modal') }}</h2>
          <button class="vnova-close-btn" @click="$emit('close')">&times;</button>
        </div>
        <div class="vnova-modal-body">
          <slot />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.vnova-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
  z-index: 999;
}

.vnova-glass-modal {
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  width: min(var(--vnova-base-modal-width), calc(100vw - 2rem));
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
  overflow: hidden;
  box-sizing: border-box;
  animation: vnova-modal-enter 0.2s ease-out;
}

.vnova-base-modal--small {
  --vnova-base-modal-width: 360px;
}

.vnova-base-modal--medium {
  --vnova-base-modal-width: 520px;
}

.vnova-base-modal--large {
  --vnova-base-modal-width: 720px;
}

.vnova-base-modal--xlarge {
  --vnova-base-modal-width: 960px;
}

.vnova-base-modal--fullscreen {
  --vnova-base-modal-width: calc(100vw - 2rem);
  height: calc(100vh - 2rem);
  height: calc(100dvh - 2rem);
}

@keyframes vnova-modal-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.vnova-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.vnova-modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vnova-color-text);
  flex: 1;
}

.vnova-close-btn {
  background: transparent;
  border: none;
  color: var(--vnova-color-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
  transition: color 0.2s;
}

.vnova-close-btn:hover {
  color: var(--vnova-color-text);
}

.vnova-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 1.25rem;
  overflow: auto;
}

.vnova-base-modal {
  font-family: var(--vnova-font-family);
}
</style>