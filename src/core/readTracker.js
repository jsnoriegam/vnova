/**
 * vnova-engine — core/readTracker.js
 *
 * Persistent "already read" registry used by skip mode. It is shared across
 * save slots (like meta-progress) and keyed by the story `saveKey`.
 *
 * Lines are identified by an explicit `id` when present, otherwise by a hash
 * of type + character + text. That keeps read state stable when a line moves
 * in the script, while edited text becomes unread again.
 */

import { ref } from 'vue'

const STORAGE_SUFFIX = ':read'
const MAX_ENTRIES = 100000
const PERSIST_DELAY = 250

const trackers = new Map()
const persistTimers = new Map()

function hashText(value) {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/**
 * Stable key for a dialogue line, or `null` for non-dialogue steps.
 *
 * @param {object} step
 * @returns {string|null}
 */
export function lineReadKey(step) {
  if (!step || (step.type !== 'say' && step.type !== 'think' && step.type !== 'narrate')) {
    return null
  }
  if (typeof step.id === 'string' && step.id.length > 0) return `id:${step.id}`

  const text = typeof step.text === 'string' ? step.text : ''
  if (!text) return null
  const character = typeof step.character === 'string' ? step.character : ''
  return hashText(`${step.type}\u0000${character}\u0000${text}`)
}

function storageKey(key) {
  return `${key}${STORAGE_SUFFIX}`
}

function loadKeys(key) {
  if (typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((entry) => typeof entry === 'string'))
  } catch {
    return new Set()
  }
}

function createTracker(key) {
  const read = loadKeys(key)
  const size = ref(read.size)
  let dirty = false

  function persist() {
    const timer = persistTimers.get(key)
    if (timer !== undefined) {
      clearTimeout(timer)
      persistTimers.delete(key)
    }
    if (!dirty || typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(storageKey(key), JSON.stringify([...read]))
      dirty = false
    } catch {
      // Storage full or disabled: keep the in-memory registry working.
    }
  }

  function schedulePersist() {
    dirty = true
    if (persistTimers.has(key)) clearTimeout(persistTimers.get(key))
    persistTimers.set(key, setTimeout(persist, PERSIST_DELAY))
  }

  return {
    key,
    size,
    isRead(step) {
      const lineKey = lineReadKey(step)
      return lineKey ? read.has(lineKey) : false
    },
    markRead(step) {
      const lineKey = lineReadKey(step)
      if (!lineKey || read.has(lineKey)) return false
      if (read.size >= MAX_ENTRIES) {
        const oldest = read.values().next().value
        if (oldest !== undefined) read.delete(oldest)
      }
      read.add(lineKey)
      size.value = read.size
      schedulePersist()
      return true
    },
    reset() {
      read.clear()
      size.value = 0
      dirty = false
      const timer = persistTimers.get(key)
      if (timer !== undefined) {
        clearTimeout(timer)
        persistTimers.delete(key)
      }
      if (typeof localStorage !== 'undefined') {
        try { localStorage.removeItem(storageKey(key)) } catch {}
      }
    },
    flush: persist,
  }
}

/**
 * Returns the shared read tracker for a story key.
 *
 * @param {string} key
 * @returns {{
 *   key: string,
 *   size: import('vue').Ref<number>,
 *   isRead(step: object): boolean,
 *   markRead(step: object): boolean,
 *   reset(): void,
 *   flush(): void,
 * }}
 */
export function useVNovaReadTracker(key = 'vnova') {
  const normalized = typeof key === 'string' && key.length > 0 ? key : 'vnova'
  if (!trackers.has(normalized)) trackers.set(normalized, createTracker(normalized))
  return trackers.get(normalized)
}

/** Clears the read registry for every story key in this session. */
export function resetAllReadTrackers() {
  for (const tracker of trackers.values()) tracker.reset()
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => {
    for (const tracker of trackers.values()) tracker.flush()
  })
}
