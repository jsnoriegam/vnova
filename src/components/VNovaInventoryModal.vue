<script setup>
/**
 * VNovaInventoryModal — player inventory browser.
 *
 * Reads the reactive inventory exposed by the active VNovaStage, so it works
 * with the built-in runtime without extra props.
 */
import { computed, inject, ref, unref } from 'vue'
import { VNOVA_RUNTIME_CONTEXT_KEY } from './VNovaRuntime.vue'
import VNovaBaseModal from './VNovaBaseModal.vue'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)
const t = (key, params) => runtime?.t(key, params) ?? key

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const inventory = computed(() => unref(runtime?.inventory) ?? null)
const entries = computed(() => unref(inventory.value?.entries) ?? [])
const types = computed(() => unref(inventory.value?.types) ?? {})
const activeType = ref('all')

const typeOptions = computed(() => {
  const used = new Set()
  for (const entry of entries.value) {
    for (const type of entry.types ?? []) used.add(type)
  }
  return [...used].map((id) => ({
    id,
    label: types.value?.[id]?.label ?? id,
    icon: types.value?.[id]?.icon ?? '',
  }))
})

const visibleEntries = computed(() => {
  if (activeType.value === 'all') return entries.value
  return entries.value.filter((entry) => entry.types?.includes(activeType.value))
})

function useEntry(entry) {
  if (!entry?.usable) return
  inventory.value?.use(entry.id)
}

function dropEntry(entry) {
  if (!entry) return
  inventory.value?.remove(entry.id, 1)
}

function typeLabel(type) {
  return types.value?.[type]?.label ?? type
}
</script>

<template>
  <VNovaBaseModal
    :open="props.open"
    :title="props.title || t('inventory.title')"
    size="large"
    close-on-backdrop
    @close="emit('close')"
  >
    <div class="vnova-inventory">
      <div v-if="entries.length === 0" class="vnova-inventory-empty">
        {{ t('inventory.empty') }}
      </div>

      <template v-else>
        <div class="vnova-inventory-filters">
          <button
            type="button"
            class="vnova-inventory-filter"
            :class="{ 'vnova-inventory-filter--active': activeType === 'all' }"
            @click="activeType = 'all'"
          >
            {{ t('inventory.all') }}
            <span class="vnova-inventory-count">{{ entries.length }}</span>
          </button>
          <button
            v-for="type in typeOptions"
            :key="type.id"
            type="button"
            class="vnova-inventory-filter"
            :class="{ 'vnova-inventory-filter--active': activeType === type.id }"
            @click="activeType = type.id"
          >
            <span v-if="type.icon" aria-hidden="true">{{ type.icon }}</span>
            {{ type.label }}
          </button>
        </div>

        <div class="vnova-inventory-list">
          <article
            v-for="entry in visibleEntries"
            :key="entry.id"
            class="vnova-inventory-item"
            :class="{ 'vnova-inventory-item--missing': entry.missing }"
          >
            <div class="vnova-inventory-icon" aria-hidden="true">{{ entry.icon || '❓' }}</div>

            <div class="vnova-inventory-info">
              <div class="vnova-inventory-heading">
                <h3>{{ entry.name || entry.id }}</h3>
                <span v-if="entry.qty > 0" class="vnova-inventory-qty">×{{ entry.qty }}</span>
              </div>

              <p v-if="entry.description" class="vnova-inventory-description">{{ entry.description }}</p>

              <div class="vnova-inventory-tags">
                <span v-for="type in entry.types" :key="type" class="vnova-inventory-tag">
                  {{ typeLabel(type) }}
                </span>
                <span v-for="tag in entry.tags" :key="tag" class="vnova-inventory-tag vnova-inventory-tag--soft">
                  {{ tag }}
                </span>
              </div>
            </div>

            <div class="vnova-inventory-actions">
              <button
                v-if="entry.usable"
                type="button"
                class="vnova-inventory-btn vnova-inventory-btn--primary"
                @click="useEntry(entry)"
              >
                {{ t('inventory.use') }}
              </button>
              <button
                type="button"
                class="vnova-inventory-btn"
                :title="t('inventory.drop')"
                @click="dropEntry(entry)"
              >
                {{ t('inventory.drop') }}
              </button>
            </div>
          </article>
        </div>
      </template>
    </div>
  </VNovaBaseModal>
</template>

<style scoped>
.vnova-inventory {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 220px;
}

.vnova-inventory-empty {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--vnova-color-dim, #8b8b9a);
  font-style: italic;
}

.vnova-inventory-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.vnova-inventory-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--vnova-modal-border, rgba(255, 255, 255, 0.12));
  background: transparent;
  color: var(--vnova-color-muted, #b8b8c8);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 150ms, color 150ms, border-color 150ms;
}

.vnova-inventory-filter:hover,
.vnova-inventory-filter--active {
  color: var(--vnova-color-text, #f2f2f8);
  border-color: var(--vnova-color-primary, #c084fc);
  background: color-mix(in srgb, var(--vnova-color-primary, #c084fc) 18%, transparent);
}

.vnova-inventory-count {
  font-size: 0.68rem;
  opacity: 0.7;
}

.vnova-inventory-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.vnova-inventory-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--vnova-modal-border, rgba(255, 255, 255, 0.12));
  background: color-mix(in srgb, var(--vnova-color-surface, #1b1726) 82%, transparent);
}

.vnova-inventory-item--missing {
  opacity: 0.65;
  border-style: dashed;
}

.vnova-inventory-icon {
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
}

.vnova-inventory-info {
  flex: 1;
  min-width: 0;
}

.vnova-inventory-heading {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.vnova-inventory-heading h3 {
  margin: 0;
  font-size: 0.92rem;
}

.vnova-inventory-qty {
  font-size: 0.78rem;
  color: var(--vnova-color-muted, #b8b8c8);
}

.vnova-inventory-description {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--vnova-color-muted, #b8b8c8);
}

.vnova-inventory-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
}

.vnova-inventory-tag {
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  font-size: 0.66rem;
  color: var(--vnova-color-primary, #c084fc);
  background: color-mix(in srgb, var(--vnova-color-primary, #c084fc) 14%, transparent);
}

.vnova-inventory-tag--soft {
  color: var(--vnova-color-muted, #b8b8c8);
  background: rgba(255, 255, 255, 0.06);
}

.vnova-inventory-actions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
}

.vnova-inventory-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--vnova-modal-border, rgba(255, 255, 255, 0.12));
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
}

.vnova-inventory-btn:hover {
  border-color: var(--vnova-color-primary, #c084fc);
}

.vnova-inventory-btn--primary {
  border-color: var(--vnova-color-primary, #c084fc);
  background: color-mix(in srgb, var(--vnova-color-primary, #c084fc) 18%, transparent);
}
</style>
