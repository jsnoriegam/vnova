/**
 * vnova-engine — core/compiler.js
 *
 * Turns the authoring DSL into the flat step array the engine consumes.
 *
 * Public block steps (`if`, `once`, `random`) and labels with nested `steps`
 * are compiled into plain jumps + synthetic labels so the runtime keeps a
 * single cursor. That preserves back(), save/load and every existing helper.
 */

const SYNTHETIC_PREFIX = '__vnova_'

/** Prefix used for compiler-generated labels. */
export const SYNTHETIC_LABEL_PREFIX = SYNTHETIC_PREFIX

function isStep(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function blockChildren(step) {
  const lists = []
  if (Array.isArray(step.steps)) lists.push(step.steps)
  if (Array.isArray(step.then)) lists.push(step.then)
  if (Array.isArray(step.else)) lists.push(step.else)
  if (step.type === 'random' && Array.isArray(step.options)) {
    for (const option of step.options) {
      if (Array.isArray(option?.steps)) lists.push(option.steps)
      if (Array.isArray(option?.then)) lists.push(option.then)
    }
  }
  return lists
}

/**
 * Depth-first traversal over every authored step, including block children.
 * The step container is visited before its children.
 */
export function walkSteps(steps, visit) {
  if (!Array.isArray(steps)) return
  for (const step of steps) {
    if (!isStep(step)) continue
    visit(step)
    for (const children of blockChildren(step)) walkSteps(children, visit)
  }
}

/**
 * Flattens nested `label: { steps: [...] }` blocks recursively. Block steps
 * such as `if`/`once`/`random` are kept intact; the engine compiles them.
 */
export function expandNestedLabels(script) {
  const expanded = []

  function pushSteps(steps) {
    for (const step of steps ?? []) {
      if (step?.type === 'label' && Array.isArray(step.steps)) {
        expanded.push({ type: 'label', id: step.id })
        pushSteps(step.steps)
        continue
      }
      expanded.push(step)
    }
  }

  pushSteps(script)
  return expanded
}

/**
 * Flat list of every authored step (containers included). Used by validation
 * so labels and jump targets inside blocks are checked too.
 */
export function collectSteps(script) {
  const collected = []
  walkSteps(script, (step) => collected.push(step))
  return collected
}

/**
 * Compiles the authoring DSL into a flat runtime script.
 *
 * @param {object[]} script
 * @returns {object[]}
 */
export function compileScript(script) {
  const output = []
  const usedLabels = new Set()
  let counter = 0

  walkSteps(script, (step) => {
    if (step.type === 'label' && typeof step.id === 'string') usedLabels.add(step.id)
  })

  function uniqueLabel(hint) {
    let id
    do {
      id = `${SYNTHETIC_PREFIX}${hint}_${counter++}`
    } while (usedLabels.has(id))
    usedLabels.add(id)
    return id
  }

  function emit(step) {
    output.push(step)
  }

  function compileList(steps) {
    if (!Array.isArray(steps)) return
    for (const step of steps) compileStep(step)
  }

  function compileIf(step) {
    const thenSteps = Array.isArray(step.then) ? step.then : step.steps
    const elseSteps = Array.isArray(step.else) ? step.else : step.otherwise
    const hasElse = Array.isArray(elseSteps) && elseSteps.length > 0

    if (!hasElse) {
      const endLabel = uniqueLabel('endif')
      emit({ type: '__branch', condition: step.condition, fail: endLabel })
      compileList(thenSteps)
      emit({ type: 'label', id: endLabel })
      return
    }

    const elseLabel = uniqueLabel('else')
    const endLabel = uniqueLabel('endif')
    emit({ type: '__branch', condition: step.condition, fail: elseLabel })
    compileList(thenSteps)
    emit({ type: 'jump', target: endLabel })
    emit({ type: 'label', id: elseLabel })
    compileList(elseSteps)
    emit({ type: 'label', id: endLabel })
  }

  function compileOnce(step) {
    const skipLabel = uniqueLabel('once')
    emit({
      type: '__once',
      id: typeof step.id === 'string' && step.id.length > 0 ? step.id : skipLabel,
      fail: skipLabel,
    })
    compileList(step.steps ?? step.then)
    emit({ type: 'label', id: skipLabel })
  }

  function compileRandom(step) {
    const options = (Array.isArray(step.options) ? step.options : [])
      .map((option) => ({
        weight: Number(option?.weight ?? 1),
        label: uniqueLabel('random'),
        steps: option?.steps ?? option?.then ?? [],
      }))
      .filter((option) => option.weight > 0)

    if (options.length === 0) return

    const endLabel = uniqueLabel('random_end')
    emit({
      type: '__random',
      choices: options.map(({ weight, label }) => ({ weight, label })),
    })

    for (const option of options) {
      emit({ type: 'label', id: option.label })
      compileList(option.steps)
      emit({ type: 'jump', target: endLabel })
    }

    emit({ type: 'label', id: endLabel })
  }

  function compileStep(step) {
    if (!isStep(step)) return

    switch (step.type) {
      case 'label':
        emit({ type: 'label', id: step.id })
        if (Array.isArray(step.steps)) compileList(step.steps)
        return

      case 'if':
        compileIf(step)
        return

      case 'once':
        compileOnce(step)
        return

      case 'random':
        compileRandom(step)
        return

      case 'jump': {
        const condition = step.if ?? step.condition ?? step.when
        if (condition === undefined) {
          emit({ type: 'jump', target: step.target })
          return
        }
        const skipLabel = uniqueLabel('skip_jump')
        emit({ type: '__branch', condition, fail: skipLabel })
        emit({ type: 'jump', target: step.target })
        emit({ type: 'label', id: skipLabel })
        return
      }

      default:
        emit(step)
    }
  }

  compileList(script)
  return output
}
