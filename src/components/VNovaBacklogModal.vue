<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  history: { type: Array, default: () => [] },
  characters: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close'])
</script>

<template>
  <transition name="slide-up">
    <div v-if="props.open" class="modal-overlay" @click.self="emit('close')">
      <div class="glass-modal backlog-modal">
        <div class="modal-header">
          <h2>Dialogue Backlog</h2>
          <button class="close-btn" @click="emit('close')">&times;</button>
        </div>

        <div class="modal-body backlog-body">
          <div v-if="props.history.length === 0" class="no-history">No dialogue has been spoken yet.</div>

          <div
            v-for="(item, index) in props.history"
            :key="index"
            class="history-item"
            :class="{ 'choice-made': item.type === '_choice_made' }"
          >
            <template v-if="item.type === 'say'">
              <strong :style="{ color: props.characters[item.character]?.color ?? '#fff' }">
                {{ props.characters[item.character]?.name ?? item.character }}
              </strong>
              <p>{{ item.text }}</p>
            </template>

            <template v-else-if="item.type === 'narrate'">
              <p class="narration">{{ item.text }}</p>
            </template>

            <template v-else-if="item.type === '_choice_made'">
              <span class="choice-tag">Selected Choice:</span>
              <p class="choice-text">{{ item.label }}</p>
            </template>
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
  z-index: 20;
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

.backlog-modal {
  max-width: 600px;
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

.backlog-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.no-history {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
  font-style: italic;
}

.history-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 6px;
}

.history-item strong {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.history-item p {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #e9d5ff;
}

.history-item p.narration {
  font-style: italic;
  color: #9ca3af;
}

.history-item.choice-made {
  border-left: 3px solid #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.choice-tag {
  font-size: 0.75rem;
  color: #6366f1;
  text-transform: uppercase;
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.choice-text {
  font-weight: 600;
  color: #a5b4fc;
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
