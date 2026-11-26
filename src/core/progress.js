/**
 * vnova-engine — core/progress.js
 *
 * Meta-progress shared across playthroughs: unlocked CGs, endings,
 * achievements and chapters. Stored separately from save slots so it survives
 * new games and save-slot deletion.
 */

import { computed, readonly, ref } from 'vue'

const STORAGE_SUFFIX = ':progress'
const PERSIST_DELAY = 250
const KINDS = ['cgs', 'endings', 'achievements', 'chapters']
const KIND_ALIASES = {
  cg: 'cgs',
  cgs: 'cgs',
  ending: 'endings',
  endings: 'endings',
  achievement: 'achievements',
  achievements: 'achievements',
  chapter: 'chapters',
  chapters: 'chapters',
}

const trackers = new Map()
const persistTimers = new Map()

function emptyState() {
  return { cgs: [], endings: [], achievements: [], chapters: [] }
}

function normalizeKind(kind) {
  return typeof kind === 'string' ? (KIND_ALIASES[kind] ?? null) : null
}

export function normalizeProgressKind(kind) {
  return normalizeKind(kind)
}

function storageKey(key) {
  return `${key}${STORAGE_SUFFIX}`
}

function loadState(key) {
  const state = emptyState()
  if (typeof localStorage === 'undefined') return state
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return state
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return state
    for (const kind of KINDS) {
      if (!Array.isArray(parsed[kind])) continue
      state[kind] = parsed[kind].filter((id) => typeof id === 'string')
    }
  } catch {
    // Corrupt progress should never block the game.
  }
  return state
}

function createTracker(key) {
  const state = ref(loadState(key))
  let dirty = false

  function persist() {
    const timer = persistTimers.get(key)
    if (timer !== undefined) {
      clearTimeout(timer)
      persistTimers.delete(key)
    }
    if (!dirty || typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(state.value))
      dirty = false
    } catch {
      // Keep the in-memory state working when storage is full/disabled.
    }
  }

  function schedulePersist() {
    dirty = true
    if (persistTimers.has(key)) clearTimeout(persistTimers.get(key))
    persistTimers.set(key, setTimeout(persist, PERSIST_DELAY))
  }

  function has(kind, id) {
    const bucket = normalizeKind(kind)
    if (!bucket || typeof id !== 'string' || id.length === 0) return false
    return state.value[bucket].includes(id)
  }

  function unlock(kind, id) {
    const bucket = normalizeKind(kind)
    if (!bucket || typeof id !== 'string' || id.length === 0) return false
    if (state.value[bucket].includes(id)) return false

    state.value = {
      ...state.value,
      [bucket]: [...state.value[bucket], id],
    }
    schedulePersist()
    return true
  }

  function unlockMany(entries) {
    if (!Array.isArray(entries)) return 0
    let changed = 0
    for (const entry of entries) {
      if (entry && unlock(entry.kind, entry.id)) changed++
    }
    return changed
  }

  function reset(kind = null) {
    if (kind === null || kind === undefined) {
      state.value = emptyState()
    } else {
      const bucket = normalizeKind(kind)
      if (!bucket) return
      state.value = { ...state.value, [bucket]: [] }
    }
    schedulePersist()
  }

  const counts = computed(() => ({
    cg: state.value.cgs.length,
    ending: state.value.endings.length,
    achievement: state.value.achievements.length,
    chapter: state.value.chapters.length,
  }))

  return {
    key,
    state: readonly(state),
    counts,
    has,
    unlock,
    unlockMany,
    reset,
    flush: persist,
  }
}

/**
 * Returns the shared meta-progress tracker for a story key.
 *
 * @param {string} key
 * @returns {{
 *   key: string,
 *   state: import('vue').DeepReadonly<import('vue').Ref<{cgs: string[], endings: string[], achievements: string[], chapters: string[]}>>,
 *   counts: import('vue').ComputedRef<{cg: number, ending: number, achievement: number, chapter: number}>,
 *   has(kind: string, id: string): boolean,
 *   unlock(kind: string, id: string): boolean,
 *   unlockMany(entries: Array<{kind: string, id: string}>): number,
 *   reset(kind?: string | null): void,
 *   flush(): void,
 * }}
 */
export function useVNovaProgress(key = 'vnova') {
  const normalized = typeof key === 'string' && key.length > 0 ? key : 'vnova'
  if (!trackers.has(normalized)) trackers.set(normalized, createTracker(normalized))
  return trackers.get(normalized)
}

/** Clears meta-progress for every story key in this session. */
export function resetAllProgress() {
  for (const tracker of trackers.values()) tracker.reset()
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => {
    for (const tracker of trackers.values()) tracker.flush()
  })
}
