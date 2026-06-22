<script setup>
import { computed, inject } from 'vue'
import { VNOVA_RUNTIME_CONTEXT_KEY } from './VNovaRuntime.vue'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)
const t = (key, params) => runtime?.t(key, params) ?? key

const props = defineProps({
  progress: { type: Number, default: 0 },
  currentAsset: { type: String, default: '' },
})

const progressPercent = computed(() => Math.round(props.progress * 100))

const displayAsset = computed(() => {
  if (!props.currentAsset) return t('loading.initializing')
  try {
    const parts = props.currentAsset.split('/')
    const file = parts[parts.length - 1]
    return t('loading.loadingAsset', { asset: file.split('?')[0] })
  } catch {
    return t('loading.loadingAssets')
  }
})
</script>

<template>
  <div class="vnova-loading-screen">
    <div class="vnova-loading-content">
      <div class="vnova-loading-spinner-wrapper">
        <div class="vnova-loading-spinner"></div>
        <div class="vnova-loading-percentage">{{ progressPercent }}%</div>
      </div>
      <div class="vnova-loading-bar-container">
        <div class="vnova-loading-bar" :style="{ width: `${progressPercent}%` }"></div>
      </div>
      <div class="vnova-loading-status">{{ displayAsset }}</div>
    </div>
  </div>
</template>

<style scoped>
.vnova-loading-screen {
  position: absolute;
  inset: 0;
  z-index: 99;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, rgba(17, 10, 28, 0.98) 0%, rgba(3, 2, 5, 0.99) 100%);
  font-family: 'Outfit', sans-serif;
  color: #fff;
  user-select: none;
}

.vnova-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 80%;
  max-width: 400px;
  text-align: center;
}

.vnova-loading-spinner-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.vnova-loading-spinner {
  position: absolute;
  inset: 0;
  border: 3px solid rgba(168, 85, 247, 0.08);
  border-top-color: #a855f7;
  border-right-color: #6366f1;
  border-radius: 50%;
  animation: vnova-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.vnova-loading-percentage {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #e9d5ff 0%, #a855f7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
}

.vnova-loading-bar-container {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 99px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.vnova-loading-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
  border-radius: 99px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
}

.vnova-loading-status {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  min-height: 1.2rem;
  animation: vnova-pulse 2s ease-in-out infinite;
}

@keyframes vnova-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes vnova-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
</style>
