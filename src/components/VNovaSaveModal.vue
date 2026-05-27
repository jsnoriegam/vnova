<script setup>
/**
 * VNovaSaveModal — multi-slot save/load dialog.
 *
 * Props:
 *   saveKey   — localStorage namespace (default: 'vnova')
 *   slotCount — number of slots (default: 8)
 *   stageRef  — Ref<HTMLElement> pointing at the stage for thumbnails
 *   mode      — 'save' | 'load'
 *   open      — controls visibility
 *
 * Emits:
 *   close          — user dismissed the modal
 *   saved(slot)    — slot was written
 *   loaded(slot)   — slot was loaded
 *   deleted(slot)  — slot was deleted
 */
import { ref } from 'vue'
import { useVNovaSaves } from '../composables/useVNovaSaves.js'

const props = defineProps({
  saveKey:   { type: String,  default:  'vnova' },
  slotCount: { type: Number,  default:  8 },
  stageRef:  { type: Object,  default:  null },
  mode:      { type: String,  default:  'save' },
  open:      { type: Boolean, default:  false },
})

const emit = defineEmits(['close', 'saved', 'loaded', 'deleted'])

const saves = useVNovaSaves({
  saveKey:   props.saveKey,
  slotCount: props.slotCount,
  stageRef:  props.stageRef,
})

// Use saves.slots directly in the template — it's a plain ref<array>,
// no computed wrapper needed (that was causing the recursive update cycle).
const { slots, saving } = saves

// ── interaction ─────────────────────────────────────────────────────────────
const pendingSlot    = ref(null)   // slot awaiting overwrite confirmation
const notification   = ref(null)   // { message, type: 'ok'|'err' }
let _notifTimer      = null

function _notify(message, type = 'ok') {
  notification.value = { message, type }
  if (_notifTimer) clearTimeout(_notifTimer)
  _notifTimer = setTimeout(() => { notification.value = null }, 2600)
}

async function handleSave(slot) {
  // If slot is occupied, ask for confirmation first
  if (slots.value[slot - 1] && pendingSlot.value !== slot) {
    pendingSlot.value = slot
    return
  }
  pendingSlot.value = null
  const ok = await saves.saveSlot(slot)
  if (ok) { _notify(`Saved to Slot ${slot}`); emit('saved', slot) }
  else    { _notify('Save failed', 'err') }
}

function cancelOverwrite() {
  pendingSlot.value = null
}

function handleLoad(slot) {
  if (!slots.value[slot - 1]) return
  const ok = saves.loadSlot(slot)
  if (ok) { _notify(`Slot ${slot} loaded`); emit('loaded', slot); emit('close') }
  else    { _notify('Load failed', 'err') }
}

function handleDelete(slot) {
  saves.deleteSlot(slot)
  if (pendingSlot.value === slot) pendingSlot.value = null
  emit('deleted', slot)
  _notify(`Slot ${slot} cleared`)
}

function handleClearAll() {
  saves.clearAll()
  pendingSlot.value = null
  _notify('All slots cleared')
}

async function handleExport() {
  saves.exportSaves()
  _notify('Export downloaded')
}

async function handleImport() {
  const ok = await saves.importSaves()
  if (ok) _notify('Saves imported')
  else    _notify('Import cancelled', 'err')
}

async function handleSaveToDisk() {
  const ok = await saves.saveToDisk()
  if (ok) _notify('File saved')
}

async function handleLoadFromDisk() {
  const ok = await saves.loadFromDisk()
  if (ok) { _notify('File loaded'); emit('close') }
  else    { _notify('Load cancelled or failed', 'err') }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="vnsm-backdrop" @click.self="emit('close')">
      <div class="vnsm-modal" role="dialog" aria-modal="true" aria-label="Saves">

        <!-- ── header ───────────────────────────────────────── -->
        <div class="vnsm-header">
          <span class="vnsm-title">SAVES</span>
          <button class="vnsm-close" @click="emit('close')" aria-label="Close">✕</button>
        </div>

        <!-- ── notification banner ──────────────────────────── -->
        <Transition name="vnsm-notif">
          <div
            v-if="notification"
            class="vnsm-notification"
            :class="`vnsm-notification--${notification.type}`"
          >
            {{ notification.message }}
          </div>
        </Transition>

        <!-- ── In Browser section ───────────────────────────── -->
        <div class="vnsm-section-label">In Browser</div>

        <div class="vnsm-slots">
          <div
            v-for="(meta, i) in slots"
            :key="meta?.slot ?? i"
            class="vnsm-slot"
            :class="{
              'vnsm-slot--empty':   !meta,
              'vnsm-slot--confirm': pendingSlot === meta?.slot,
            }"
          >
            <!-- thumbnail -->
            <div class="vnsm-thumb" :style="meta?.thumbnail ? `background-image:url(${meta.thumbnail})` : meta?.bgSrc ? `background-image:url(${meta.bgSrc})` : meta?.bgColor ? `background:${meta.bgColor}` : ''">
              <span v-if="!meta" class="vnsm-thumb-empty-icon">🎮</span>
            </div>

            <!-- slot info -->
            <div class="vnsm-slot-info">
              <span class="vnsm-slot-label">{{ meta?.label ?? `Slot ${i + 1}` }}</span>
              <span v-if="meta?.formattedDate" class="vnsm-slot-date">{{ meta.formattedDate }}</span>
              <span v-else class="vnsm-slot-empty-text">Empty</span>
            </div>

            <!-- overwrite confirmation -->
            <Transition name="vnsm-confirm">
              <div v-if="pendingSlot === meta?.slot" class="vnsm-overwrite">
                <span>Overwrite?</span>
                <button class="vnsm-btn vnsm-btn--danger" @click="handleSave(meta.slot)">Yes</button>
                <button class="vnsm-btn vnsm-btn--ghost"  @click="cancelOverwrite">No</button>
              </div>
            </Transition>

            <!-- slot actions -->
            <div v-if="pendingSlot !== meta?.slot" class="vnsm-slot-actions">
              <button
                class="vnsm-btn vnsm-btn--icon"
                title="Save here"
                :disabled="saving"
                @click="handleSave(i + 1)"
              >
                💾
              </button>
              <button
                v-if="meta"
                class="vnsm-btn vnsm-btn--icon"
                title="Load"
                @click="handleLoad(meta.slot)"
              >
                ▶
              </button>
              <button
                v-if="meta"
                class="vnsm-btn vnsm-btn--icon vnsm-btn--trash"
                title="Delete"
                @click="handleDelete(meta.slot)"
              >
                🗑
              </button>
            </div>
          </div>
        </div>

        <!-- ── In Browser footer ────────────────────────────── -->
        <div class="vnsm-footer-row">
          <button class="vnsm-btn vnsm-btn--primary" @click="handleExport">📤 Export…</button>
          <button class="vnsm-btn vnsm-btn--primary" @click="handleImport">📥 Import…</button>
          <button class="vnsm-btn vnsm-btn--danger vnsm-ml-auto" @click="handleClearAll">🗑 Clear All</button>
        </div>

        <!-- ── On Disk section ──────────────────────────────── -->
        <div class="vnsm-section-label vnsm-section-label--disk">On Disk</div>

        <div class="vnsm-footer-row">
          <button class="vnsm-btn vnsm-btn--primary" @click="handleSaveToDisk">💾 Save…</button>
          <button class="vnsm-btn vnsm-btn--primary" @click="handleLoadFromDisk">📂 Load…</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Variables ── */
.vnsm-modal {
  --vnsm-bg:          #1a1a1e;
  --vnsm-surface:     #26262c;
  --vnsm-border:      rgba(255,255,255,.10);
  --vnsm-header-bg:   #111114;
  --vnsm-accent:      #4a6cf7;
  --vnsm-danger:      #c0392b;
  --vnsm-text:        #e4e4e7;
  --vnsm-muted:       #71717a;
  --vnsm-thumb-w:     112px;
  --vnsm-thumb-h:     63px;
  --vnsm-radius:      6px;
}

/* ── Backdrop ── */
.vnsm-backdrop {
  position:        fixed;
  inset:           0;
  z-index:         9999;
  background:      rgba(0,0,0,.72);
  display:         flex;
  align-items:     center;
  justify-content: center;
  padding:         1rem;
}

/* ── Modal shell ── */
.vnsm-modal {
  background:    var(--vnsm-bg);
  border:        1px solid var(--vnsm-border);
  border-radius: 8px;
  width:         min(680px, 100%);
  max-height:    90vh;
  overflow-y:    auto;
  color:         var(--vnsm-text);
  font-family:   var(--vnova-font-ui, system-ui, sans-serif);
  font-size:     0.875rem;
  box-shadow:    0 24px 64px rgba(0,0,0,.6);
  scrollbar-width: thin;
  scrollbar-color: var(--vnsm-border) transparent;
}

/* ── Header ── */
.vnsm-header {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  padding:         0.75rem 1.25rem;
  background:      var(--vnsm-header-bg);
  border-bottom:   1px solid var(--vnsm-border);
  position:        sticky;
  top:             0;
  z-index:         1;
}

.vnsm-title {
  font-weight:     700;
  font-size:       1rem;
  letter-spacing:  .08em;
}

.vnsm-close {
  background:  none;
  border:      none;
  color:       var(--vnsm-muted);
  font-size:   1.1rem;
  cursor:      pointer;
  padding:     0.2rem 0.4rem;
  line-height: 1;
  border-radius: var(--vnsm-radius);
  transition:  color 150ms;
}
.vnsm-close:hover { color: var(--vnsm-text); }

/* ── Notification ── */
.vnsm-notification {
  margin:        0.5rem 1.25rem 0;
  padding:       0.45rem 0.9rem;
  border-radius: var(--vnsm-radius);
  font-size:     0.8rem;
  font-weight:   500;
}
.vnsm-notification--ok  { background: rgba(74,108,247,.18); color: #93c5fd; border: 1px solid rgba(74,108,247,.35); }
.vnsm-notification--err { background: rgba(192,57,43,.18);  color: #fca5a5; border: 1px solid rgba(192,57,43,.35); }

.vnsm-notif-enter-active, .vnsm-notif-leave-active { transition: opacity 200ms, transform 200ms; }
.vnsm-notif-enter-from, .vnsm-notif-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Section labels ── */
.vnsm-section-label {
  padding:       0.55rem 1.25rem 0.4rem;
  font-size:     0.72rem;
  font-weight:   700;
  letter-spacing:.1em;
  text-transform: uppercase;
  color:         var(--vnsm-muted);
  border-bottom: 1px solid var(--vnsm-border);
  margin-top:    0.25rem;
}
.vnsm-section-label--disk { margin-top: 0.5rem; }

/* ── Slot list ── */
.vnsm-slots {
  display:       flex;
  flex-direction: column;
  gap:           1px;
  background:    var(--vnsm-border);
  border-bottom: 1px solid var(--vnsm-border);
}

/* ── Single slot ── */
.vnsm-slot {
  display:        flex;
  align-items:    center;
  gap:            0.9rem;
  padding:        0.5rem 1rem 0.5rem 0.75rem;
  background:     var(--vnsm-surface);
  min-height:     80px;
  transition:     background 150ms;
  position:       relative;
}
.vnsm-slot:hover              { background: #2e2e36; }
.vnsm-slot--confirm           { background: #2a1f1f; }

/* ── Thumbnail ── */
.vnsm-thumb {
  width:               var(--vnsm-thumb-w);
  min-width:           var(--vnsm-thumb-w);
  height:              var(--vnsm-thumb-h);
  border-radius:       4px;
  background-color:    #111;
  background-size:     cover;
  background-position: center;
  border:              1px solid var(--vnsm-border);
  display:             flex;
  align-items:         center;
  justify-content:     center;
  overflow:            hidden;
  flex-shrink:         0;
}
.vnsm-thumb-empty-icon { font-size: 1.4rem; opacity: .3; }

/* ── Slot info ── */
.vnsm-slot-info {
  flex:        1;
  display:     flex;
  flex-direction: column;
  gap:         0.15rem;
  min-width:   0;
}
.vnsm-slot-label {
  font-weight: 600;
  font-size:   0.85rem;
  white-space: nowrap;
  overflow:    hidden;
  text-overflow: ellipsis;
}
.vnsm-slot-date {
  font-size: 0.75rem;
  color:     var(--vnsm-muted);
}
.vnsm-slot-empty-text {
  font-size: 0.75rem;
  color:     #3f3f46;
  font-style: italic;
}

/* ── Slot actions ── */
.vnsm-slot-actions {
  display:    flex;
  gap:        0.35rem;
  flex-shrink: 0;
}

/* ── Overwrite confirm ── */
.vnsm-overwrite {
  display:    flex;
  align-items: center;
  gap:        0.5rem;
  font-size:  0.8rem;
  color:      #fca5a5;
  flex-shrink: 0;
}

.vnsm-confirm-enter-active, .vnsm-confirm-leave-active { transition: opacity 150ms; }
.vnsm-confirm-enter-from, .vnsm-confirm-leave-to { opacity: 0; }

/* ── Buttons ── */
.vnsm-btn {
  display:       inline-flex;
  align-items:   center;
  gap:           0.35rem;
  padding:       0.35rem 0.75rem;
  border-radius: var(--vnsm-radius);
  border:        1px solid transparent;
  font-size:     0.8rem;
  font-weight:   500;
  cursor:        pointer;
  transition:    background 150ms, opacity 150ms;
  white-space:   nowrap;
  line-height:   1.3;
}
.vnsm-btn:disabled { opacity: .4; cursor: not-allowed; }

.vnsm-btn--primary {
  background:  var(--vnsm-accent);
  color:       #fff;
  border-color: transparent;
}
.vnsm-btn--primary:hover:not(:disabled) { background: #5a7cf9; }

.vnsm-btn--danger {
  background:  var(--vnsm-danger);
  color:       #fff;
  border-color: transparent;
}
.vnsm-btn--danger:hover:not(:disabled) { background: #e74c3c; }

.vnsm-btn--ghost {
  background:  transparent;
  color:       var(--vnsm-muted);
  border-color: var(--vnsm-border);
}
.vnsm-btn--ghost:hover:not(:disabled) { background: rgba(255,255,255,.06); color: var(--vnsm-text); }

.vnsm-btn--icon {
  background:  transparent;
  color:       var(--vnsm-muted);
  border-color: transparent;
  padding:     0.3rem 0.4rem;
  font-size:   1rem;
  border-radius: 4px;
}
.vnsm-btn--icon:hover:not(:disabled) { background: rgba(255,255,255,.08); color: var(--vnsm-text); }
.vnsm-btn--trash:hover:not(:disabled) { color: #fca5a5; }

/* ── Footer rows ── */
.vnsm-footer-row {
  display:     flex;
  gap:         0.5rem;
  align-items: center;
  padding:     0.65rem 1rem;
}
.vnsm-ml-auto { margin-left: auto; }
</style>
