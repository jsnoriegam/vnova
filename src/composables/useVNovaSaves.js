/**
 * vnova-engine — composables/useVNovaSaves.js
 */

import { computed, ref } from 'vue'
import { useVNovaStore } from '../core/store.js'

const VERSION = 2
const FILE_FORMAT = 'vnova-file'
const FILE_VERSION = 1
const SIGN_ALGO = 'HMAC-SHA-256'
const SIGN_KEY_VERSION = 1
const SIGN_SALTS = {
  1: 'vnova-file-signature-v1',
}
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function storageKey(saveKey, slot) {
  return `${saveKey}:slot:${slot}`
}

function _toBase64(bytes) {
  let out = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk)
    out += String.fromCharCode(...slice)
  }
  return btoa(out)
}

function _fromBase64(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function _gzip(bytes) {
  if (typeof CompressionStream !== 'function') {
    return { compression: 'none', bytes }
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))
  const buffer = await new Response(stream).arrayBuffer()
  return { compression: 'gzip', bytes: new Uint8Array(buffer) }
}

async function _gunzip(bytes, compression) {
  if (!compression || compression === 'none') return bytes
  if (compression !== 'gzip') throw new Error(`Unsupported compression: ${compression}`)
  if (typeof DecompressionStream !== 'function') throw new Error('Gzip decompression not supported')
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  const buffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(buffer)
}

async function _hmacKey(saveKey, keyVersion = SIGN_KEY_VERSION) {
  if (!globalThis.crypto?.subtle) throw new Error('WebCrypto subtle API not available')
  const salt = SIGN_SALTS[keyVersion]
  if (!salt) throw new Error(`Unsupported signature key version: ${keyVersion}`)
  const seed = `${salt}|${saveKey}|${globalThis.location?.origin ?? 'unknown-origin'}`
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(seed))
  return crypto.subtle.importKey('raw', digest, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

function _signatureInput(envelope) {
  return [
    envelope.format,
    envelope.fileVersion,
    envelope.kind,
    envelope.saveKey,
    envelope.compression,
    envelope.payload,
  ].join('|')
}

async function _signEnvelope(envelope, saveKey) {
  const key = await _hmacKey(saveKey, envelope.keyVersion)
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(_signatureInput(envelope)))
  return _toBase64(new Uint8Array(signature))
}

async function _verifyEnvelope(envelope) {
  if (!envelope?.signature || !envelope?.saveKey) return false
  const keyVersion = Number.isInteger(envelope?.keyVersion) ? envelope.keyVersion : 1
  const key = await _hmacKey(envelope.saveKey, keyVersion)
  return crypto.subtle.verify(
    'HMAC',
    key,
    _fromBase64(envelope.signature),
    textEncoder.encode(_signatureInput(envelope))
  )
}

async function _packSignedFile({ kind, saveKey, data }) {
  const raw = textEncoder.encode(JSON.stringify(data))
  const packed = await _gzip(raw)
  const envelope = {
    format: FILE_FORMAT,
    fileVersion: FILE_VERSION,
    keyVersion: SIGN_KEY_VERSION,
    kind,
    saveKey,
    alg: SIGN_ALGO,
    compression: packed.compression,
    payload: _toBase64(packed.bytes),
    createdAt: Date.now(),
    signature: '',
  }
  envelope.signature = await _signEnvelope(envelope, saveKey)
  return JSON.stringify(envelope)
}

async function _unpackSignedFile({ text, expectedKind }) {
  const parsed = JSON.parse(text)

  // Backward compatibility with old plain JSON exports and saves.
  if (parsed?.format !== FILE_FORMAT) return parsed

  if (parsed?.fileVersion !== FILE_VERSION) throw new Error('Unsupported file version')
  if (parsed?.kind !== expectedKind) throw new Error(`Invalid file type: expected ${expectedKind}`)
  if (parsed?.alg !== SIGN_ALGO) throw new Error('Unsupported signature algorithm')

  const ok = await _verifyEnvelope(parsed)
  if (!ok) throw new Error('Signature verification failed')

  const packed = _fromBase64(parsed.payload)
  const raw = await _gunzip(packed, parsed.compression)
  return JSON.parse(textDecoder.decode(raw))
}

function _readFileText(file) {
  return file.arrayBuffer().then((buffer) => textDecoder.decode(buffer))
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
      particles:      store.particles,
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

function resolveStageElement(stageRef) {
  const raw = stageRef?.value ?? stageRef ?? null
  if (!raw) return null
  const el = raw?.$el ?? raw
  if (!(el instanceof HTMLElement)) return null
  return el.classList?.contains('vnova-stage')
    ? el
    : (el.querySelector?.('.vnova-stage') ?? el)
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
  const fallback = async () => {
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
  }

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
      try {
        return canvas.toDataURL('image/jpeg', 0.7)
      } catch {
        return await fallback()
      }
    }
    return await fallback()
  } catch {
    return await fallback()
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
    store: explicitStore = null,
  } = options

  function resolveStore() {
    const candidate = explicitStore?.value ?? explicitStore ?? null
    if (candidate && typeof candidate.loadSnapshot === 'function') return candidate
    try {
      return useVNovaStore()
    } catch {
      return null
    }
  }

  // Plain array ref — no readonly wrapper, no computed on top
  const lastFileError = ref(null)
  const slots = ref(
    Array.from({ length: slotCount }, (_, i) => readSlotMeta(saveKey, i + 1))
  )

  function _setFileError(code, message) {
    lastFileError.value = { code, message }
  }

  function _clearFileError() {
    lastFileError.value = null
  }

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
  const hasSave = computed(() => slots.value.some(Boolean))

  async function saveSlot(slot) {
    if (saving.value) return false
    saving.value = true
    try {
      const store = resolveStore()
      if (!store) return false
      const thumbnail = await captureThumbnail(resolveStageElement(stageRef))
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
      const store = resolveStore()
      if (!store) return false
      const raw = localStorage.getItem(storageKey(saveKey, slot))
      if (!raw) return false
      const data = JSON.parse(raw)
      if (data?.snapshot) {
        if (typeof store.__vnovaPrepareLoad === 'function') {
          store.__vnovaPrepareLoad()
        }
        store.loadSnapshot(data.snapshot)
        if (typeof store.__vnovaSyncRuntime === 'function') {
          store.__vnovaSyncRuntime(data.snapshot)
        }
        return true
      }
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
  async function exportSaves() {
    try {
      _clearFileError()
      const allSlots = {}
      for (let i = 1; i <= slotCount; i++) {
        try {
          const raw = localStorage.getItem(storageKey(saveKey, i))
          if (raw) allSlots[i] = JSON.parse(raw)
        } catch {}
      }
      const content = await _packSignedFile({
        kind: 'bundle',
        saveKey,
        data: { saveKey, version: VERSION, slots: allSlots },
      })
      const blob = new Blob([content], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `${saveKey}-saves.bundle`,
      })
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch (err) {
      console.warn('[vnova] exportSaves failed:', err)
      _setFileError('export-failed', 'Could not generate export bundle')
      return false
    }
  }

  function importSaves() {
    return new Promise((resolve) => {
      const input  = Object.assign(document.createElement('input'), { type: 'file', accept: '.bundle,.json,application/json' })
      input.onchange = (e) => {
        _clearFileError()
        const file = e.target.files?.[0]
        if (!file) { _setFileError('cancelled', 'No file selected'); resolve(false); return }
        _readFileText(file)
          .then(async (text) => {
            const data = await _unpackSignedFile({ text, expectedKind: 'bundle' })
            const incoming = data?.slots ?? {}
            for (const [slotStr, payload] of Object.entries(incoming)) {
              const slot = Number(slotStr)
              if (!Number.isInteger(slot) || slot < 1 || slot > slotCount) continue
              if (!payload?.snapshot) continue
              localStorage.setItem(storageKey(saveKey, slot), JSON.stringify(payload))
            }
            _refreshAll()
            _clearFileError()
            resolve(true)
          })
          .catch((err) => {
            console.warn('[vnova] importSaves failed:', err)
            const msg = String(err?.message ?? '')
            if (msg.includes('Signature verification failed')) {
              _setFileError('invalid-signature', 'Bundle signature is invalid')
            } else if (msg.includes('Unsupported file version')) {
              _setFileError('unsupported-version', 'Bundle version is not supported')
            } else if (msg.includes('Invalid file type')) {
              _setFileError('invalid-type', 'This file is not a bundle export')
            } else {
              _setFileError('invalid-file', 'Bundle is corrupted or unreadable')
            }
            resolve(false)
          }
        )
      }
      input.click()
    })
  }

  // ── on disk ───────────────────────────────────────────────────────────────
  async function saveToDisk() {
    try {
      _clearFileError()
      const store = resolveStore()
      if (!store) return false
      const thumbnail = await captureThumbnail(resolveStageElement(stageRef))
      const content = await _packSignedFile({
        kind: 'save',
        saveKey,
        data: buildPayload(store, thumbnail),
      })
      if (window.showSaveFilePicker) {
        try {
          const fh = await window.showSaveFilePicker({
            suggestedName: `${saveKey}-save.save`,
            types: [{ description: 'VNova signed save', accept: { 'application/octet-stream': ['.save'] } }],
          })
          const writable = await fh.createWritable()
          await writable.write(content)
          await writable.close()
          return true
        } catch (e) {
          if (e.name === 'AbortError') return false
        }
      }
      const blob = new Blob([content], { type: 'application/octet-stream' })
      const url  = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `${saveKey}-save.save`,
      })
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch (e) {
      console.warn('[vnova] saveToDisk failed:', e)
      _setFileError('save-failed', 'Could not write save file')
      return false
    }
  }

  function loadFromDisk() {
    return new Promise((resolve) => {
      const input  = Object.assign(document.createElement('input'), { type: 'file', accept: '.save,.json,application/json' })
      input.onchange = (e) => {
        _clearFileError()
        const store = resolveStore()
        if (!store) { _setFileError('store-missing', 'Store unavailable'); resolve(false); return }
        const file = e.target.files?.[0]
        if (!file) { _setFileError('cancelled', 'No file selected'); resolve(false); return }
        _readFileText(file)
          .then(async (text) => {
            const data = await _unpackSignedFile({ text, expectedKind: 'save' })
            if (data?.snapshot) {
              if (typeof store.__vnovaPrepareLoad === 'function') {
                store.__vnovaPrepareLoad()
              }
              store.loadSnapshot(data.snapshot)
              if (typeof store.__vnovaSyncRuntime === 'function') {
                store.__vnovaSyncRuntime(data.snapshot)
              }
              _clearFileError()
              resolve(true)
            } else {
              _setFileError('invalid-file', 'Save file has no snapshot data')
              resolve(false)
            }
          })
          .catch((err) => {
            const msg = String(err?.message ?? '')
            if (msg.includes('Signature verification failed')) {
              _setFileError('invalid-signature', 'Save signature is invalid')
            } else if (msg.includes('Unsupported file version')) {
              _setFileError('unsupported-version', 'Save version is not supported')
            } else if (msg.includes('Invalid file type')) {
              _setFileError('invalid-type', 'This file is not a save file')
            } else {
              _setFileError('invalid-file', 'Save is corrupted or unreadable')
            }
            resolve(false)
          })
      }
      input.click()
    })
  }

  return {
    slots,
      hasSave,
    saving,
    saveSlot,
    loadSlot,
    deleteSlot,
    clearAll,
    exportSaves,
    importSaves,
    saveToDisk,
    loadFromDisk,
    lastFileError,
    refresh: _refreshAll,
  }
}
