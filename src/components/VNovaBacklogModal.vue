<script setup>
import { inject } from 'vue'
import { VNOVA_RUNTIME_CONTEXT_KEY } from './VNovaRuntime.vue'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)
const t = (key, params) => runtime?.t(key, params) ?? key

const props = defineProps({
  open: { type: Boolean, default: false },
  history: { type: Array, default: () => [] },
  characters: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close'])
</script>

<template>
  <transition name="vnova-slide-up">
    <div v-if="props.open" class="vnova-modal-overlay" @click.self="emit('close')">
      <div class="vnova-glass-modal vnova-backlog-modal">
        <div class="vnova-modal-header">
          <h2>{{ t('backlog.title') }}</h2>
          <button class="vnova-close-btn" @click="emit('close')">&times;</button>
        </div>

        <div class="vnova-modal-body vnova-backlog-body">
          <div v-if="props.history.length === 0" class="vnova-no-history">{{ t('backlog.noHistory') }}</div>

            <template v-for="(item, index) in props.history" :key="index">
              <div
                v-if="item.type === 'say' || item.type === 'think'"
                class="vnova-history-item"
              >
                <strong :style="{ color: props.characters[item.character]?.color ?? '#fff' }">
                  {{ props.characters[item.character]?.name ?? item.character }}
                </strong>
                <p :class="{ narration: item.type === 'think' }">{{ item.text }}</p>
              </div>

              <div
                v-else-if="item.type === 'narrate'"
                class="vnova-history-item"
              >
                <p class="narration">{{ item.text }}</p>
              </div>

              <div
                v-else-if="item.type === 'choice'"
                class="vnova-history-item vnova-choice-made"
              >
                <span class="vnova-choice-tag">{{ t('backlog.choicePrompt') }}</span>
                <p class="vnova-choice-text">{{ item.prompt || t('backlog.chooseOption') }}</p>
              </div>

              <div
                v-else-if="item.type === '_choice_made'"
                class="vnova-history-item vnova-choice-made"
              >
                <span class="vnova-choice-tag">{{ t('backlog.selectedChoice') }}</span>
                <p class="vnova-choice-text">{{ item.label }}</p>
              </div>
            </template>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.vnova-backlog-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.vnova-no-history {
  text-align: center;
  color: var(--vnova-color-dim);
  padding: 2rem;
  font-style: italic;
}

.vnova-history-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 6px;
}

.vnova-history-item strong {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.vnova-history-item p {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--vnova-color-text);
  margin: 0;
}

.vnova-history-item p.narration {
  font-style: italic;
  color: var(--vnova-color-muted);
}

.vnova-history-item.vnova-choice-made {
  border-left: 3px solid var(--vnova-color-secondary);
  background: rgba(99, 102, 241, 0.05);
}

.vnova-choice-tag {
  font-size: 0.75rem;
  color: var(--vnova-color-secondary);
  text-transform: uppercase;
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.vnova-choice-text {
  font-weight: 600;
  color: #a5b4fc;
  margin: 0;
}
</style>
