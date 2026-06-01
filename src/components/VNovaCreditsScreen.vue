<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Credits' },
  credits: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])
</script>

<template>
  <transition name="vnova-fade">
    <div v-if="props.open" class="vnova-credits-screen">
      <div class="vnova-credits-panel" role="dialog" aria-modal="true" :aria-label="props.title">
        <header class="vnova-credits-header">
          <h2>{{ props.title }}</h2>
          <button class="vnova-credits-close" type="button" aria-label="Close credits" @click="emit('close')">
            &times;
          </button>
        </header>

        <div class="vnova-credits-body">
          <section
            v-for="(section, sectionIndex) in props.credits"
            :key="`${section.label || 'credits'}-${sectionIndex}`"
            class="vnova-credits-section"
          >
            <h3 v-if="section.label">{{ section.label }}</h3>

            <ul class="vnova-credits-lines">
              <li
                v-for="(line, lineIndex) in section.lines || []"
                :key="lineIndex"
                class="vnova-credits-line"
              >
                <span v-if="line.text">{{ line.text }}</span>
                <span v-else-if="line.html" v-html="line.html"></span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.vnova-credits-screen {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
  background: rgba(4, 3, 8, 0.86);
  backdrop-filter: blur(8px);
}

.vnova-credits-panel {
  width: min(720px, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(20, 20, 30, 0.96);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5);
  font-family: var(--vnova-font-family, 'Outfit', sans-serif);
}

.vnova-credits-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.vnova-credits-header h2 {
  margin: 0;
  color: var(--vnova-color-text, #f8fafc);
  font-size: 1.15rem;
  font-weight: 700;
}

.vnova-credits-close {
  flex: 0 0 auto;
  background: transparent;
  border: none;
  color: var(--vnova-color-muted, #a1a1aa);
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.vnova-credits-close:hover {
  color: var(--vnova-color-text, #f8fafc);
}

.vnova-credits-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 1.5rem;
}

.vnova-credits-section + .vnova-credits-section {
  margin-top: 2rem;
}

.vnova-credits-section h3 {
  margin: 0 0 0.75rem;
  color: var(--vnova-color-primary, #a855f7);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.vnova-credits-lines {
  list-style: none;
  margin: 0;
  padding: 0;
}

.vnova-credits-line {
  color: var(--vnova-color-text, #f8fafc);
  font-size: 1rem;
  line-height: 1.7;
}

.vnova-credits-line :deep(a) {
  color: var(--vnova-color-primary, #a855f7);
  text-decoration: none;
}

.vnova-credits-line :deep(a:hover) {
  text-decoration: underline;
}
</style>
