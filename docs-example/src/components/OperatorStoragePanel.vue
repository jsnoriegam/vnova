<script setup>
import { computed, inject } from 'vue'
import { useUserStorage, VNOVA_RUNTIME_CONTEXT_KEY } from 'vnova-engine'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)

const storage = useUserStorage({
  state: computed(() => runtime?.state?.value ?? null),
})

const operatorName = storage.ref('player.name', 'Astra')
const commMode = computed(() => storage.get('player.commMode', 'pending'))
const trust = computed(() => Number(storage.get('trust', 0)))
const risk = computed(() => Number(storage.get('risk', 0)))
const tone = computed(() => storage.get('tone', 'undecided'))
const overheat = computed(() => Boolean(storage.get('overheat', false)))
const manualOverride = computed(() => Boolean(storage.get('flags.manualOverride', false)))

function tuneTrust() {
  storage.inc('trust', 1)
}

function tuneRisk() {
  storage.inc('risk', 1)
}

function toggleOverride() {
  storage.toggle('flags.manualOverride')
}
</script>

<template>
  <aside class="operator-storage" aria-label="Operator storage">
    <label class="operator-storage__field">
      <span>Operator</span>
      <input v-model="operatorName" type="text" autocomplete="off">
    </label>

    <div class="operator-storage__grid">
      <span>Comm</span>
      <strong>{{ commMode }}</strong>
      <span>Trust</span>
      <strong>{{ trust }}</strong>
      <span>Risk</span>
      <strong>{{ risk }}</strong>
      <span>Tone</span>
      <strong>{{ tone }}</strong>
    </div>

    <p v-if="overheat" class="operator-storage__warning">Relay overheating</p>

    <div class="operator-storage__actions">
      <button type="button" @click="tuneTrust">+ Trust</button>
      <button type="button" @click="tuneRisk">+ Risk</button>
      <button
        type="button"
        :class="{ 'is-active': manualOverride }"
        @click="toggleOverride"
      >
        Override
      </button>
    </div>
  </aside>
</template>

<style scoped>
.operator-storage {
  position: fixed;
  right: 1rem;
  bottom: 5.25rem;
  z-index: calc(var(--vnova-z-hud, 40) + 1);
  width: min(18rem, calc(100vw - 2rem));
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid rgba(126, 222, 255, 0.28);
  border-radius: 8px;
  background: rgba(4, 14, 24, 0.84);
  color: #eef9ff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  font-size: 0.82rem;
}

.operator-storage__field {
  display: grid;
  gap: 0.3rem;
}

.operator-storage__field span,
.operator-storage__grid span {
  color: rgba(216, 240, 255, 0.72);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.operator-storage__field input {
  min-width: 0;
  border: 1px solid rgba(126, 222, 255, 0.32);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.22);
  color: #ffffff;
  padding: 0.45rem 0.55rem;
  font: inherit;
}

.operator-storage__grid {
  display: grid;
  grid-template-columns: minmax(4rem, 1fr) minmax(0, 1.4fr);
  gap: 0.32rem 0.7rem;
  align-items: center;
}

.operator-storage__grid strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: 700;
}

.operator-storage__warning {
  margin: 0;
  color: #ffd28a;
  font-weight: 700;
}

.operator-storage__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
}

.operator-storage__actions button {
  min-width: 0;
  border: 1px solid rgba(126, 222, 255, 0.3);
  border-radius: 6px;
  background: rgba(126, 222, 255, 0.1);
  color: #ffffff;
  padding: 0.45rem 0.35rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.operator-storage__actions button:hover,
.operator-storage__actions button.is-active {
  background: rgba(126, 222, 255, 0.24);
}

@media (max-width: 720px) {
  .operator-storage {
    left: 1rem;
    right: 1rem;
    bottom: 4.5rem;
    width: auto;
  }
}
</style>
