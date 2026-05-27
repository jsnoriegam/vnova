/**
 * vnova-engine — core/quests.js
 *
 * Lightweight quest system with predicate-based completion/failure rules.
 */

export const QUEST_STATUS = Object.freeze({
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
})

export const QUEST_CATEGORIES = Object.freeze({
  MAIN: 'main',
  SIDE: 'side',
})

const VALID_STATUSES = new Set(Object.values(QUEST_STATUS))

function cloneDeep(value) {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

function asFn(maybeFn) {
  return typeof maybeFn === 'function' ? maybeFn : null
}

function safeRun(fn, context, fallback = false) {
  if (!fn) return fallback
  try {
    return fn(context)
  } catch (error) {
    console.warn('[vnova] quest hook failed:', error)
    return fallback
  }
}

function normalizeStatus(status) {
  if (!status) return QUEST_STATUS.INACTIVE
  return VALID_STATUSES.has(status) ? status : QUEST_STATUS.INACTIVE
}

function normalizeDefinitions(definitions) {
  if (!Array.isArray(definitions)) {
    throw new Error('[vnova][quests] definitions must be an array')
  }

  const byId = {}
  definitions.forEach((quest, index) => {
    if (!quest || typeof quest !== 'object') {
      throw new Error(`[vnova][quests] definition at index ${index} must be an object`)
    }
    if (!quest.id || typeof quest.id !== 'string') {
      throw new Error(`[vnova][quests] definition at index ${index} missing string id`)
    }
    if (byId[quest.id]) {
      throw new Error(`[vnova][quests] duplicated quest id: "${quest.id}"`)
    }
    byId[quest.id] = {
      id: quest.id,
      title: quest.title ?? quest.id,
      description: quest.description ?? '',
      category: quest.category ?? QUEST_CATEGORIES.SIDE,
      initialStatus: normalizeStatus(quest.initialStatus),
      failIf: asFn(quest.failIf),
      doneIf: asFn(quest.doneIf),
      reward: asFn(quest.reward),
      penalty: asFn(quest.penalty),
    }
  })

  return byId
}

function buildInitialState(defById) {
  const next = {}
  Object.values(defById).forEach((def) => {
    next[def.id] = {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      status: def.initialStatus,
      updatedAt: null,
    }
  })
  return next
}

export function createQuestEngine(definitions = [], options = {}) {
  const {
    getContext = () => ({}),
    getState = null,
    setState = null,
    now = () => Date.now(),
  } = options

  const definitionMap = normalizeDefinitions(definitions)
  const initialState = buildInitialState(definitionMap)

  let localState = cloneDeep(initialState)

  function readState() {
    if (typeof getState === 'function') {
      const current = getState() ?? {}
      return cloneDeep(current)
    }
    return cloneDeep(localState)
  }

  function writeState(next) {
    if (typeof setState === 'function') {
      setState(cloneDeep(next))
      return
    }
    localState = cloneDeep(next)
  }

  function reset() {
    writeState(initialState)
    return list()
  }

  function list() {
    const current = readState()
    return Object.values(current)
  }

  function get(id) {
    const current = readState()
    return current[id] ?? null
  }

  function setStatus(id, status) {
    const nextStatus = normalizeStatus(status)
    const current = readState()
    if (!current[id]) return false
    if (current[id].status === nextStatus) return false
    current[id].status = nextStatus
    current[id].updatedAt = now()
    writeState(current)
    return true
  }

  function evaluate() {
    const current = readState()
    const context = getContext()
    let changed = false

    Object.values(definitionMap).forEach((def) => {
      const quest = current[def.id]
      if (!quest || quest.status !== QUEST_STATUS.ACTIVE) return

      const shouldFail = Boolean(safeRun(def.failIf, context, false))
      if (shouldFail) {
        quest.status = QUEST_STATUS.FAILED
        quest.updatedAt = now()
        safeRun(def.penalty, context)
        changed = true
        return
      }

      const shouldComplete = Boolean(safeRun(def.doneIf, context, false))
      if (shouldComplete) {
        quest.status = QUEST_STATUS.COMPLETED
        quest.updatedAt = now()
        safeRun(def.reward, context)
        changed = true
      }
    })

    if (changed) writeState(current)
    return changed
  }

  return {
    QS: QUEST_STATUS,
    definitions: Object.values(definitionMap),
    reset,
    evaluate,
    list,
    get,
    setStatus,
    activate: (id) => setStatus(id, QUEST_STATUS.ACTIVE),
    complete: (id) => setStatus(id, QUEST_STATUS.COMPLETED),
    fail: (id) => setStatus(id, QUEST_STATUS.FAILED),
    deactivate: (id) => setStatus(id, QUEST_STATUS.INACTIVE),
  }
}
