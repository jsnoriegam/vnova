/**
 * vnova-engine — composables/useQuestEngine.js
 *
 * Sistema de quests del autor. Se conecta al motor activo sin parámetros.
 * Las definiciones de quests se pasan en useVNovaEngine() una sola vez.
 *
 * Uso:
 *   // 1. Registrar definiciones al crear el engine
 *   const vn = useVNovaEngine(script, { quests: misQuests })
 *
 *   // 2. Usar el composable en cualquier componente hijo
 *   const quests = useQuestEngine()
 *
 *   quests.activate('intro')
 *   quests.complete('cofre_encontrado')
 *   quests.fail('no_llegaste_a_tiempo')
 *   quests.status('intro')        // → 'inactive' | 'active' | 'completed' | 'failed'
 *   quests.is('intro', 'active')  // → boolean
 *   quests.list()                 // → todas las quests con su estado
 *   quests.active                 // → computed: array de quests activas
 *   quests.completed              // → computed: array de quests completadas
 */

import { computed } from 'vue'
import { getActiveEngineHandle } from '../core/engine.js'
import { QUEST_STATUS } from '../core/quests.js'
import { useVNovaStore } from '../core/store.js'

export const QS = QUEST_STATUS

function safeRun(fn, fallback = false) {
  if (typeof fn !== 'function') return fallback
  try {
    return fn()
  } catch (error) {
    console.warn('[vnova] quest hook failed:', error)
    return fallback
  }
}

export function useQuestEngine() {
  const store = useVNovaStore()

  const getQuestDefinitions = () => {
    const defs = getActiveEngineHandle()?.questDefinitions
    return Array.isArray(defs) ? defs : []
  }

  const setQuestStatusFromEngine = (id, nextStatus) => {
    const setter = getActiveEngineHandle()?.setQuestStatus
    if (typeof setter === 'function') return Boolean(setter(id, nextStatus))
    return false
  }

  const all = computed(() => store.quests ?? {})

  function status(id) {
    return all.value[id]?.status ?? QS.INACTIVE
  }

  function is(id, expectedStatus) {
    return status(id) === expectedStatus
  }

  function _set(id, newStatus) {
    if (setQuestStatusFromEngine(id, newStatus)) return true
    const current = store.quests ?? {}
    if (!current[id]) return false
    if (current[id].status === newStatus) return false
    store.setQuests({
      ...current,
      [id]: { ...(current[id] ?? {}), status: newStatus, updatedAt: Date.now() },
    })
    return true
  }

  function activate(id)   { return _set(id, QS.ACTIVE) }
  function complete(id)   { return _set(id, QS.COMPLETED) }
  function fail(id)       { return _set(id, QS.FAILED) }
  function deactivate(id) { return _set(id, QS.INACTIVE) }

  function list() {
    return Object.entries(all.value).map(([id, data]) => ({ id, ...data }))
  }

  function evaluate(id) {
    const definitions = getQuestDefinitions()
    const candidates = typeof id === 'string' && id.length > 0
      ? definitions.filter((def) => def?.id === id)
      : definitions
    if (candidates.length === 0) return false

    let changed = false
    for (const def of candidates) {
      const quest = all.value[def.id]
      if (!quest || quest.status !== QS.ACTIVE) continue

      const shouldFail = Boolean(safeRun(def.failIf, false))
      if (shouldFail) {
        changed = fail(def.id) || changed
        continue
      }

      const shouldComplete = Boolean(safeRun(def.doneIf, false))
      if (shouldComplete) {
        changed = complete(def.id) || changed
      }
    }
    return changed
  }

  const active    = computed(() => list().filter(q => q.status === QS.ACTIVE))
  const completed = computed(() => list().filter(q => q.status === QS.COMPLETED))
  const failed    = computed(() => list().filter(q => q.status === QS.FAILED))

  return {
    QS,
    all,
    active,
    completed,
    failed,
    status,
    is,
    activate,
    complete,
    fail,
    deactivate,
    list,
    evaluate,
  }
}
