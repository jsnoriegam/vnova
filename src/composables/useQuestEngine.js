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
import { useVNovaStore } from '../core/store.js'

export const QS = Object.freeze({
  INACTIVE:  'inactive',
  ACTIVE:    'active',
  COMPLETED: 'completed',
  FAILED:    'failed',
})

export function useQuestEngine() {
  const store = useVNovaStore()

  const all = computed(() => store.quests ?? {})

  function status(id) {
    return all.value[id]?.status ?? QS.INACTIVE
  }

  function is(id, expectedStatus) {
    return status(id) === expectedStatus
  }

  function _set(id, newStatus) {
    const current = store.quests ?? {}
    store.setQuests({
      ...current,
      [id]: { ...(current[id] ?? {}), status: newStatus },
    })
  }

  function activate(id)   { _set(id, QS.ACTIVE) }
  function complete(id)   { _set(id, QS.COMPLETED) }
  function fail(id)       { _set(id, QS.FAILED) }
  function deactivate(id) { _set(id, QS.INACTIVE) }

  function list() {
    return Object.entries(all.value).map(([id, data]) => ({ id, ...data }))
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
  }
}
