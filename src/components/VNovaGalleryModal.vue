<script setup>
/**
 * VNovaGalleryModal — meta-progress browser: CGs, endings, achievements and
 * chapter select. Definitions come from `config.gallery`; unlocked state comes
 * from `useVNovaProgress(progressKey)`.
 */
import { computed, inject, ref, watch } from 'vue'
import { VNOVA_RUNTIME_CONTEXT_KEY } from './VNovaRuntime.vue'
import VNovaBaseModal from './VNovaBaseModal.vue'
import { useVNovaProgress } from '../core/progress.js'
import { normalizeAssetUrl } from '../utils/normalize.js'

const runtime = inject(VNOVA_RUNTIME_CONTEXT_KEY, null)
const t = (key, params) => runtime?.t(key, params) ?? key

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  progressKey: { type: String, default: 'vnova' },
  gallery: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'select-chapter'])

const progress = useVNovaProgress(props.progressKey)
const activeTab = ref('cgs')
const preview = ref(null)

const definitions = computed(() => ({
  cgs: Array.isArray(props.gallery?.cgs) ? props.gallery.cgs : [],
  endings: Array.isArray(props.gallery?.endings) ? props.gallery.endings : [],
  achievements: Array.isArray(props.gallery?.achievements) ? props.gallery.achievements : [],
  chapters: Array.isArray(props.gallery?.chapters) ? props.gallery.chapters : [],
}))

const tabs = computed(() => [
  { id: 'cgs', kind: 'cg', label: t('gallery.cgs'), items: definitions.value.cgs },
  { id: 'endings', kind: 'ending', label: t('gallery.endings'), items: definitions.value.endings },
  { id: 'achievements', kind: 'achievement', label: t('gallery.achievements'), items: definitions.value.achievements },
  { id: 'chapters', kind: 'chapter', label: t('gallery.chapters'), items: definitions.value.chapters },
].filter((tab) => tab.items.length > 0))

const active = computed(() => tabs.value.find((tab) => tab.id === activeTab.value) ?? tabs.value[0] ?? null)
const activeItems = computed(() => active.value?.items ?? [])
const activeKind = computed(() => active.value?.kind ?? null)
const isEmpty = computed(() => tabs.value.length === 0)

watch(tabs, (list) => {
  if (list.length > 0 && !list.some((tab) => tab.id === activeTab.value)) {
    activeTab.value = list[0].id
  }
}, { immediate: true })

watch(() => props.open, (open) => {
  if (!open) preview.value = null
  else progress.flush()
})

function isUnlocked(item) {
  return Boolean(activeKind.value && progress.has(activeKind.value, item?.id))
}

function unlockedCount(tab) {
  return tab.items.filter((item) => progress.has(tab.kind, item.id)).length
}

function itemTitle(item, unlocked = isUnlocked(item)) {
  if (unlocked) return item?.title || item?.id || ''
  if (item?.hidden === true) return '???'
  if (activeKind.value === 'achievement' && item?.title) return item.title
  return t('gallery.locked')
}

function itemDescription(item, unlocked = isUnlocked(item)) {
  if (!unlocked) return ''
  return item?.description || ''
}

function openCg(item) {
  if (!isUnlocked(item) || !item?.src) return
  preview.value = item
}

function selectChapter(item) {
  if (!isUnlocked(item) || !item?.label) return
  if (runtime?.actions?.selectChapter) {
    runtime.actions.selectChapter(item)
    return
  }
  emit('select-chapter', item)
  emit('close')
}

function cgStyle(item) {
  const src = item?.thumbnail || item?.src
  if (!isUnlocked(item) || !src) return {}
  return {
    backgroundImage: `url(${normalizeAssetUrl(src)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}
</script>

<template>
  <VNovaBaseModal
    :open="props.open"
    :title="props.title || t('gallery.title')"
    size="large"
    close-on-backdrop
    @close="emit('close')"
  >
    <div class="vnova-gallery">
      <div v-if="isEmpty" class="vnova-gallery-empty">{{ t('gallery.empty') }}</div>

      <template v-else>
        <div class="vnova-gallery-tabs" role="tablist" :aria-label="t('gallery.ariaLabel')">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            role="tab"
            class="vnova-gallery-tab"
            :class="{ 'vnova-gallery-tab--active': active?.id === tab.id }"
            :aria-selected="active?.id === tab.id ? 'true' : 'false'"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
            <span class="vnova-gallery-tab-count">{{ unlockedCount(tab) }}/{{ tab.items.length }}</span>
          </button>
        </div>

        <div v-if="active?.id === 'cgs'" class="vnova-gallery-grid" role="tabpanel">
          <button
            v-for="item in activeItems"
            :key="item.id"
            type="button"
            class="vnova-gallery-cg"
            :class="{ 'vnova-gallery-cg--locked': !isUnlocked(item) }"
            :style="cgStyle(item)"
            :disabled="!isUnlocked(item)"
            @click="openCg(item)"
          >
            <span v-if="!isUnlocked(item)" class="vnova-gallery-lock" aria-hidden="true">🔒</span>
            <span class="vnova-gallery-cg-caption">{{ itemTitle(item) }}</span>
          </button>
        </div>

        <div v-else-if="active?.id === 'endings'" class="vnova-gallery-list" role="tabpanel">
          <article
            v-for="item in activeItems"
            :key="item.id"
            class="vnova-gallery-card"
            :class="{ 'vnova-gallery-card--locked': !isUnlocked(item) }"
          >
            <h3>{{ itemTitle(item) }}</h3>
            <p v-if="itemDescription(item)">{{ itemDescription(item) }}</p>
          </article>
        </div>

        <div v-else-if="active?.id === 'achievements'" class="vnova-gallery-list" role="tabpanel">
          <article
            v-for="item in activeItems"
            :key="item.id"
            class="vnova-gallery-card vnova-gallery-achievement"
            :class="{ 'vnova-gallery-card--locked': !isUnlocked(item) }"
          >
            <span class="vnova-gallery-icon" aria-hidden="true">{{ isUnlocked(item) ? '🏆' : '🔒' }}</span>
            <div>
              <h3>{{ itemTitle(item) }}</h3>
              <p v-if="itemDescription(item)">{{ itemDescription(item) }}</p>
            </div>
          </article>
        </div>

        <div v-else-if="active?.id === 'chapters'" class="vnova-gallery-list" role="tabpanel">
          <button
            v-for="item in activeItems"
            :key="item.id"
            type="button"
            class="vnova-gallery-card vnova-gallery-chapter"
            :class="{ 'vnova-gallery-card--locked': !isUnlocked(item) }"
            :disabled="!isUnlocked(item) || !item.label"
            @click="selectChapter(item)"
          >
            <div>
              <h3>{{ itemTitle(item) }}</h3>
              <p v-if="itemDescription(item)">{{ itemDescription(item) }}</p>
            </div>
            <span v-if="isUnlocked(item) && item.label" class="vnova-gallery-jump">{{ t('gallery.jumpToChapter') }}</span>
            <span v-else class="vnova-gallery-lock" aria-hidden="true">🔒</span>
          </button>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="preview" class="vnova-gallery-preview" @click.self="preview = null">
        <button type="button" class="vnova-gallery-preview-close" :aria-label="t('gallery.close')" @click="preview = null">✕</button>
        <img :src="normalizeAssetUrl(preview.src)" :alt="preview.title || preview.id" class="vnova-gallery-preview-img">
        <p v-if="preview.title" class="vnova-gallery-preview-title">{{ preview.title }}</p>
      </div>
    </Teleport>
  </VNovaBaseModal>
</template>

<style scoped>
.vnova-gallery {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 240px;
}

.vnova-gallery-empty {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--vnova-color-dim, #8b8b9a);
  font-style: italic;
}

.vnova-gallery-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.vnova-gallery-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--vnova-modal-border, rgba(255, 255, 255, 0.12));
  background: transparent;
  color: var(--vnova-color-muted, #b8b8c8);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 150ms, color 150ms, border-color 150ms;
}

.vnova-gallery-tab:hover,
.vnova-gallery-tab--active {
  color: var(--vnova-color-text, #f2f2f8);
  border-color: var(--vnova-color-primary, #c084fc);
  background: color-mix(in srgb, var(--vnova-color-primary, #c084fc) 18%, transparent);
}

.vnova-gallery-tab-count {
  font-size: 0.7rem;
  opacity: 0.75;
}

.vnova-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.vnova-gallery-cg {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  border: 1px solid var(--vnova-modal-border, rgba(255, 255, 255, 0.12));
  background-color: #15121f;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  transition: transform 160ms, border-color 160ms;
}

.vnova-gallery-cg:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--vnova-color-primary, #c084fc);
}

.vnova-gallery-cg--locked {
  cursor: not-allowed;
  filter: saturate(0.2);
}

.vnova-gallery-cg-caption {
  position: absolute;
  inset: auto 0 0;
  padding: 0.4rem 0.55rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.82), transparent);
  color: #f5f0ff;
  font-size: 0.75rem;
  text-align: left;
}

.vnova-gallery-lock {
  position: absolute;
  top: 0.4rem;
  right: 0.5rem;
  font-size: 0.9rem;
}

.vnova-gallery-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.vnova-gallery-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--vnova-modal-border, rgba(255, 255, 255, 0.12));
  background: color-mix(in srgb, var(--vnova-color-surface, #1b1726) 82%, transparent);
  color: inherit;
  text-align: left;
  font: inherit;
}

.vnova-gallery-card h3 {
  margin: 0 0 0.2rem;
  font-size: 0.9rem;
}

.vnova-gallery-card p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--vnova-color-muted, #b8b8c8);
  line-height: 1.4;
}

.vnova-gallery-card--locked {
  opacity: 0.55;
}

.vnova-gallery-achievement {
  justify-content: flex-start;
}

.vnova-gallery-icon {
  font-size: 1.35rem;
}

.vnova-gallery-chapter {
  cursor: pointer;
  width: 100%;
  transition: border-color 150ms, transform 150ms;
}

.vnova-gallery-chapter:hover:not(:disabled) {
  border-color: var(--vnova-color-primary, #c084fc);
  transform: translateX(2px);
}

.vnova-gallery-chapter:disabled {
  cursor: not-allowed;
}

.vnova-gallery-jump {
  flex-shrink: 0;
  font-size: 0.72rem;
  color: var(--vnova-color-primary, #c084fc);
}

.vnova-gallery-preview {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.86);
}

.vnova-gallery-preview-img {
  max-width: min(92vw, 1100px);
  max-height: 78vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
}

.vnova-gallery-preview-title {
  margin: 0;
  color: #f5f0ff;
  font-size: 0.95rem;
}

.vnova-gallery-preview-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 1.4rem;
  cursor: pointer;
}
</style>
