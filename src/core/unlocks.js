/**
 * vnova-engine — core/unlocks.js
 *
 * Normalizes the declarative `unlock` step into a list of meta-progress
 * targets. Shared by the engine and the validator.
 */

const SINGULAR = {
  cg: 'cg',
  cgs: 'cg',
  ending: 'ending',
  endings: 'ending',
  achievement: 'achievement',
  achievements: 'achievement',
  chapter: 'chapter',
  chapters: 'chapter',
}

const FIELD_GROUPS = [
  ['cg', 'cg', 'cgs'],
  ['ending', 'ending', 'endings'],
  ['achievement', 'achievement', 'achievements'],
  ['chapter', 'chapter', 'chapters'],
]

function pushTarget(targets, kind, id) {
  if (typeof id === 'string' && id.length > 0) targets.push({ kind, id })
}

/**
 * @param {object} step
 * @returns {Array<{ kind: 'cg'|'ending'|'achievement'|'chapter', id: string }>}
 */
export function collectUnlockTargets(step) {
  if (!step || typeof step !== 'object') return []

  const targets = []

  for (const [kind, singularKey, pluralKey] of FIELD_GROUPS) {
    for (const key of [singularKey, pluralKey]) {
      const value = step[key]
      if (Array.isArray(value)) {
        for (const id of value) pushTarget(targets, kind, id)
      } else {
        pushTarget(targets, kind, value)
      }
    }
  }

  if (typeof step.kind === 'string' && SINGULAR[step.kind]) {
    pushTarget(targets, SINGULAR[step.kind], step.id)
  }

  if (Array.isArray(step.targets)) {
    for (const target of step.targets) {
      const kind = typeof target?.kind === 'string' ? SINGULAR[target.kind] : null
      if (!kind) continue
      pushTarget(targets, kind, target.id)
    }
  }

  // De-duplicate while keeping declaration order.
  const seen = new Set()
  return targets.filter((target) => {
    const key = `${target.kind}|${target.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
