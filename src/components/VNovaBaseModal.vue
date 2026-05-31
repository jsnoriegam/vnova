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
 *   onClose   — callback when modal is closed
 *   children  — Vue slots for modal content
 *
 * Emits:
 *   close     — modal was closed
 */

import { watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  id: { type: String, default: 'vnova-modal' },
  title: { type: String, default: 'Modal' },
  onClose: { type: Function, default: null },
})

const emit = defineEmits(['close'])

// Watch for open prop changes
watch(() => props.open, (newOpen) => {
  if (!newOpen) {
    emit('close')
  }
})

defineSlots()
</script>

<template>
  <transition name="vnova-slide-up">
    <div v-if="props.open" class="vnova-modal-overlay" @click.self="$emit('close')">
      <div class="vnova-glass-modal vnova-base-modal">
        <div class="vnova-modal-header">
          <h2>{{ props.title }}</h2>
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
  z-index: 999;
}

.vnova-glass-modal {
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 320px;
  max-width: 90vw;
  max-height: 85vh;
  overflow: hidden;
  animation: vnova-modal-enter 0.2s ease-out;
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
  padding: 1.25rem;
  overflow-y: auto;
  max-height: calc(85vh - 80px);
}

.vnova-base-modal {
  font-family: var(--vnova-font-family);
}
</style>
