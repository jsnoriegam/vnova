<script setup>
import { computed, inject } from 'vue'
import { normalizeAssetUrl } from '../utils/normalize.js'
import { VNOVA_RUNTIME_CONTEXT_KEY } from './VNovaRuntime.vue'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)
const t = (key, params) => runtime?.t(key, params) ?? key

const props = defineProps({
  visible: { type: Boolean, default: false },
  hasSave: { type: Boolean, default: false },
  hasCredits: { type: Boolean, default: false },
  title: { type: String, default: 'VNOVA ENGINE' },
  subtitle: { type: String, default: 'Vuex-powered visual novel framework' },
  meta: { type: String, default: '' },
  background: { type: String, default: '' },
})

const emit = defineEmits(['new-game', 'open-load', 'open-settings', 'open-credits'])

const titleBgStyle = computed(() => {
  if (!props.background) return {}
  const bg = props.background.trim()
  if (
    bg.startsWith('linear-gradient') ||
    bg.startsWith('radial-gradient') ||
    bg.startsWith('#') ||
    bg.startsWith('rgb') ||
    bg.startsWith('hsl') ||
    bg.includes('gradient')
  ) {
    return { background: bg }
  }
  return {
    backgroundImage: `url(${normalizeAssetUrl(bg)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})
</script>

<template>
  <transition name="vnova-fade">
    <div v-if="props.visible" class="title-screen" :style="titleBgStyle">
      <div class="title-card">
        <h1 class="game-logo">{{ props.title }}</h1>
        <p class="game-subtitle">{{ props.subtitle }}</p>

        <div class="menu-actions">
          <button class="menu-btn primary" @click="emit('new-game')">{{ t('titleScreen.newGame') }}</button>
          <button class="menu-btn secondary" @click="emit('open-load')">{{ t('titleScreen.loadGame') }}</button>
          <button v-if="props.hasCredits" class="menu-btn secondary" @click="emit('open-credits')">{{ t('titleScreen.credits') }}</button>
          <button class="menu-btn secondary" @click="emit('open-settings')">{{ t('titleScreen.settings') }}</button>
        </div>

        <div v-if="props.meta" class="engine-meta">{{ props.meta }}</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.title-screen {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, rgba(30, 15, 50, 0.95) 0%, rgba(5, 3, 8, 0.99) 100%);
}

.title-card {
  text-align: center;
  padding: 3rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
}

.game-logo {
  font-family: 'Cinzel', serif;
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  background: linear-gradient(135deg, #e9d5ff 0%, #a855f7 50%, #6366f1 100%);
  -webkit-background-clip: text;
  -moz-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -moz-text-fill-color: transparent;
  filter: drop-shadow(0 2px 8px rgba(168, 85, 247, 0.3));
  margin-bottom: 0.5rem;
}

.game-subtitle {
  font-size: 0.9rem;
  color: #9333ea;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 3rem;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
}

.menu-btn {
  padding: 0.85rem 2rem;
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.05em;
}

.menu-btn.primary {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
}

.menu-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
}

.menu-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #e9d5ff;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.menu-btn.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(168, 85, 247, 0.4);
  color: #fff;
  transform: translateY(-2px);
}

.menu-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.engine-meta {
  font-size: 0.75rem;
  color: #6b7280;
}
</style>
