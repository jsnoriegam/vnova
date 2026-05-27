/**
 * vnova-engine — core/validator.js
 *
 * Optional dev-time validation. Import and call validateScript(script, characters)
 * before passing the script to createEngine(). Throws descriptive errors early.
 */

import { expandNestedLabels } from './engine.js'

const VALID_TYPES = new Set([
  'label', 'scene', 'show', 'hide', 'say', 'think', 'narrate',
  'choice', 'jump', 'bgm', 'sfx', 'wait', 'call', 'image', 'end',
])

const VALID_POSITIONS  = new Set(['left', 'center', 'right', 'left-far', 'right-far'])
const VALID_TRANSITIONS = new Set(['fade', 'cut', 'dissolve', 'slide-left', 'slide-right'])
const VALID_IMAGE_FIT  = new Set(['x', 'y', 'width', 'height', 'both'])

/**
 * @param {object[]} script
 * @param {object}   characters  — character registry used in createEngine()
 * @returns {string[]}           — array of warning strings (empty = clean)
 * @throws   {Error}             — on critical structural errors
 */
export function validateScript(script, characters = {}) {
  const flatScript = expandNestedLabels(script)
  const errors   = []
  const warnings = []
  const labels   = new Set()
  const charIds  = new Set(Object.keys(characters))

  // first pass: collect labels
  flatScript.forEach((step, i) => {
    if (step.type === 'label') {
      if (!step.id) errors.push(`[step ${i}] label missing required field: id`)
      else labels.add(step.id)
    }
  })

  // second pass: validate each step
  flatScript.forEach((step, i) => {
    const at = `[step ${i} / type="${step.type}"]`

    if (!step.type)
      errors.push(`${at} missing required field: type`)

    if (step.type && !VALID_TYPES.has(step.type))
      warnings.push(`${at} unknown step type — will be skipped at runtime`)

    if (step.type === 'say') {
      if (!step.text) warnings.push(`${at} empty text field`)
      if (step.character && !charIds.has(step.character))
        warnings.push(`${at} character "${step.character}" not found in registry`)
    }

    if (step.type === 'think') {
      if (!step.text) warnings.push(`${at} empty text field`)
      if (step.character && !charIds.has(step.character))
        warnings.push(`${at} character "${step.character}" not found in registry`)
    }

    if (step.type === 'narrate') {
      if (!step.text) warnings.push(`${at} empty text field`)
    }

    if (step.type === 'show') {
      if (!step.character)
        errors.push(`${at} show step missing required field: character`)
      else if (!charIds.has(step.character))
        warnings.push(`${at} character "${step.character}" not found in registry`)
      if (step.position && !VALID_POSITIONS.has(step.position))
        warnings.push(`${at} unknown position "${step.position}"`)
    }

    if (step.type === 'hide') {
      if (step.character && !charIds.has(step.character))
        warnings.push(`${at} character "${step.character}" not found in registry`)
    }

    if (step.type === 'scene') {
      if (!step.src && !step.color)
        warnings.push(`${at} scene step has neither src nor color — stage will be empty`)
      if (step.transition && !VALID_TRANSITIONS.has(step.transition))
        warnings.push(`${at} unknown transition "${step.transition}"`)
    }

    if (step.type === 'image') {
      const hasId = step.id !== undefined && step.id !== null
      const hasSrc = step.src !== undefined && step.src !== null

      if (hasId && hasSrc)
        errors.push(`${at} image step must use either id or src, not both`)

      if (step.transition && !VALID_TRANSITIONS.has(step.transition))
        warnings.push(`${at} unknown transition "${step.transition}"`)

      if (step.fit && !VALID_IMAGE_FIT.has(step.fit))
        warnings.push(`${at} unknown fit "${step.fit}" (expected: width|height|both or x|y aliases)`)
    }

    if (step.type === 'jump') {
      if (!step.target)
        errors.push(`${at} jump step missing required field: target`)
      else if (!labels.has(step.target))
        errors.push(`${at} jump target "${step.target}" has no matching label in script`)
    }

    if (step.type === 'choice') {
      if (!Array.isArray(step.options) || step.options.length < 2)
        errors.push(`${at} choice step requires at least 2 options`)
      else {
        step.options.forEach((opt, oi) => {
          if (!opt.label)
            errors.push(`${at} option[${oi}] missing required field: label`)
          if (opt.jump && !labels.has(opt.jump))
            errors.push(`${at} option[${oi}].jump target "${opt.jump}" has no matching label`)
          if (opt.inc && typeof opt.inc !== 'object')
            errors.push(`${at} option[${oi}].inc must be an object`)
        })
      }
    }

    if (step.type === 'wait') {
      if (typeof step.ms !== 'number' || step.ms < 0)
        errors.push(`${at} wait step requires a non-negative ms field`)
    }

    if (step.type === 'call') {
      if (typeof step.fn !== 'function')
        errors.push(`${at} call step requires a fn field of type function`)
    }
  })

  if (errors.length)
    throw new Error('[vnova] Script validation failed:\n' + errors.map(e => '  • ' + e).join('\n'))

  return warnings
}
