/**
 * vnova-engine — composables/useVNovaSaves.js
 */

import { ref } from 'vue'
import { useVNovaStore } from '../core/store.js'

const VERSION = 2

function storageKey(saveKey, slot) {
  return `${saveKey}:slot:${slot}`
}

function buildPayload(store, thumbnail = null) {
  return {
    version:   VERSION,
    savedAt:   Date.now(),
    thumbnail,
    snapshot: {
      cursor:         store.cursor,
      current:        store.current,
      stage:          store.stage,
      background:     store.background,
      image:          store.image,
      bgm:            store.bgm,
      vars:           store.vars,
      quests:         store.quests,
      awaitingChoice: store.awaitingChoice,
      ended:          store.ended,
      history:        store.history,
      backStack:      store.backStack,
      settings:       store.settings,
    },
  }
}

function formatDate(ts) {
  if (!ts) return null
  const d   = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function captureThumbnail(stageEl) {
  if (!stageEl) return null
  try {
    const h2c = window.html2canvas
    if (h2c) {
      const canvas = await h2c(stageEl, {
        scale: 0.25, useCORS: true, allowTaint: true,
        logging: false, backgroundColor: null,
        ignoreElements: (el) =>
          el.classList?.contains('vnova-dialogue') ||
          el.classList?.contains('vnova-hud'),
      })
      return canvas.toDataURL('image/jpeg', 0.7)
    }
    // Fallback: paint background into a small canvas
    const style   = window.getComputedStyle(stageEl)
    const canvas  = document.createElement('canvas')
    canvas.width  = 160
    canvas.height = 90
    const ctx     = canvas.getContext('2d')
    ctx.fillStyle = style.backgroundColor || '#1a1a2e'
    ctx.fillRect(0, 0, 160, 90)
    const bgImage = style.backgroundImage || ''
    if (bgImage && bgImage !== 'none') {
      const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/)
      if (urlMatch?.[1]) {
        await new Promise((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const scale = Math.max(160 / img.width, 90 / img.height)
            ctx.drawImage(img,
              (160 - img.width  * scale) / 2,
              (90  - img.height * scale) / 2,
              img.width  * scale,
              img.height * scale)
            resolve()
          }
          img.onerror = resolve
          img.src = urlMatch[1]
        })
      }
    }
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  }
}

function readSlotMeta(saveKey, slot) {
  try {
    const raw = localStorage.getItem(storageKey(saveKey, slot))
    if (!raw) return null
    const data = JSON.parse(raw)
    return {
      slot,
      label:         `Slot ${slot}`,
      savedAt:       data.savedAt ?? null,
      formattedDate: formatDate(data.savedAt),
      thumbnail:     data.thumbnail ?? null,
      bgColor:       data.snapshot?.background?.color ?? null,
      bgSrc:         data.snapshot?.background?.src   ?? null,
    }
  } catch {
    return null
  }
}

// ─── composable ───────────────────────────────────────────────────────────────

export function useVNovaSaves(options = {}) {
  const {
    saveKey   = 'vnova',
    slotCount = 8,
    stageRef  = null,
  } = options

  // Read store directly from Pinia — no engine prop needed
  const store = useVNovaStore()

  // Plain array ref — no readonly wrapper, no computed on top
  const slots = ref(
    Array.from({ length: slotCount }, (_, i) => readSlotMeta(saveKey, i + 1))
  )

  function _refreshSlot(slot) {
    slots.value[slot - 1] = readSlotMeta(saveKey, slot)
  }

  function _refreshAll() {
    for (let i = 0; i < slotCount; i++) {
      slots.value[i] = readSlotMeta(saveKey, i + 1)
    }
  }

  // ── save ─────────────────────────────────────────────────────────────────
  const saving = ref(false)

  async function saveSlot(slot) {
    if (saving.value) return false
    saving.value = true
    try {
      const thumbnail = await captureThumbnail(stageRef?.value ?? null)
      const payload   = buildPayload(store, thumbnail)
      localStorage.setItem(storageKey(saveKey, slot), JSON.stringify(payload))
      _refreshSlot(slot)
      return true
    } catch (e) {
      console.warn('[vnova] saveSlot failed:', e)
      return false
    } finally {
      saving.value = false
    }
  }

  // ── load ──────────────────────────────────────────────────────────────────
  function loadSlot(slot) {
    try {
      const raw = localStorage.getItem(storageKey(saveKey, slot))
      if (!raw) return false
      const data = JSON.parse(raw)
      if (data?.snapshot) { store.loadSnapshot(data.snapshot); return true }
      return false
    } catch (e) {
      console.warn('[vnova] loadSlot failed:', e)
      return false
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────
  function deleteSlot(slot) {
    localStorage.removeItem(storageKey(saveKey, slot))
    _refreshSlot(slot)
  }

  function clearAll() {
    for (let i = 1; i <= slotCount; i++)
      localStorage.removeItem(storageKey(saveKey, i))
    _refreshAll()
  }

  // ── export / import ───────────────────────────────────────────────────────
  function exportSaves() {
    const allSlots = {}
    for (let i = 1; i <= slotCount; i++) {
      try {
        const raw = localStorage.getItem(storageKey(saveKey, i))
        if (raw) allSlots[i] = JSON.parse(raw)
      } catch {}
    }
    const blob = new Blob(
      [JSON.stringify({ saveKey, version: VERSION, slots: allSlots }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a   = Object.assign(document.createElement('a'), { href: url, download: `${saveKey}-saves.json` })
    a.click()
    URL.revokeObjectURL(url)
  }

  function importSaves() {
    return new Promise((resolve) => {
      const input  = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' })
      input.onchange = (e) => {
        const file = e.target.files?.[0]
        if (!file) { resolve(false); return }
        const reader = new FileReader()
        reader.onload = (ev) => {
          try {
            const data     = JSON.parse(ev.target.result)
            const incoming = data?.slots ?? {}
            for (const [slotStr, payload] of Object.entries(incoming)) {
              const slot = Number(slotStr)
              if (!Number.isInteger(slot) || slot < 1 || slot > slotCount) continue
              if (!payload?.snapshot) continue
              localStorage.setItem(storageKey(saveKey, slot), JSON.stringify(payload))
            }
            _refreshAll()
            resolve(true)
          } catch (err) {
            console.warn('[vnova] importSaves failed:', err)
            resolve(false)
          }
        }
        reader.readAsText(file)
      }
      input.click()
    })
  }

  // ── on disk ───────────────────────────────────────────────────────────────
  async function saveToDisk() {
    const thumbnail = await captureThumbnail(stageRef?.value ?? null)
    const json      = JSON.stringify(buildPayload(store, thumbnail), null, 2)
    if (window.showSaveFilePicker) {
      try {
        const fh       = await window.showSaveFilePicker({ suggestedName: `${saveKey}-save.json`, types: [{ description: 'VNova save', accept: { 'application/json': ['.json'] } }] })
        const writable = await fh.createWritable()
        await writable.write(json)
        await writable.close()
        return true
      } catch (e) {
        if (e.name === 'AbortError') return false
      }
    }
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${saveKey}-save.json` })
    a.click()
    URL.revokeObjectURL(url)
    return true
  }

  function loadFromDisk() {
    return new Promise((resolve) => {
      const input  = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' })
      input.onchange = (e) => {
        const file = e.target.files?.[0]
        if (!file) { resolve(false); return }
        const reader = new FileReader()
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result)
            if (data?.snapshot) { store.loadSnapshot(data.snapshot); resolve(true) }
            else resolve(false)
          } catch { resolve(false) }
        }
        reader.readAsText(file)
      }
      input.click()
    })
  }

  return {
    slots,
    saving,
    saveSlot,
    loadSlot,
    deleteSlot,
    clearAll,
    exportSaves,
    importSaves,
    saveToDisk,
    loadFromDisk,
    refresh: _refreshAll,
  }
}
