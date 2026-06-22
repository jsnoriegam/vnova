/**
 * vnova-engine — core/validator.js
 *
 * Optional dev-time validation. Import and call validateScript(script, characters)
 * before passing the script to createEngine(). Throws descriptive errors early.
 */

import { expandNestedLabels } from './engine.js'

const VALID_TYPES = new Set([
  'label', 'scene', 'show', 'hide', 'say', 'think', 'narrate',
  'choice', 'modal', 'input', 'select', 'jump', 'bgm', 'sfx', 'video', 'particles', 'wait', 'call', 'image', 'notify', 'end', 'stop', 'effect',
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
      const hideTargets = ['character', 'image', 'video', 'particles']
      const presentTargets = hideTargets.filter(key => step[key] !== undefined)

      if (presentTargets.length === 0) {
        warnings.push(`${at} hide step without target — use { type: 'hide', character: true } to hide all characters`)
      } else if (presentTargets.length > 1) {
        errors.push(`${at} hide step must have exactly one of: character, image, video, particles`)
      } else {
        const target = presentTargets[0]
        const value = step[target]
        if (typeof value !== 'string' && value !== true) {
          errors.push(`${at} hide.${target} must be a string or true`)
        }
        if (target === 'character' && typeof value === 'string' && !charIds.has(value)) {
          warnings.push(`${at} character "${value}" not found in registry`)
        }
        if ((target === 'image' || target === 'video') && step.transition && !VALID_TRANSITIONS.has(step.transition)) {
          warnings.push(`${at} unknown transition "${step.transition}"`)
        }
      }
    }

    if (step.type === 'stop') {
      const stopTargets = ['bgm', 'video', 'particles']
      const presentTargets = stopTargets.filter(key => step[key] !== undefined)

      if (presentTargets.length === 0) {
        errors.push(`${at} stop step requires one of: bgm, video, particles`)
      } else if (presentTargets.length > 1) {
        errors.push(`${at} stop step must have exactly one of: bgm, video, particles`)
      } else {
        const target = presentTargets[0]
        const value = step[target]
        if (value !== true && typeof value !== 'string') {
          errors.push(`${at} stop.${target} must be true or a string`)
        }
      }
    }

    if (step.type === 'scene') {
      if (!step.src && !step.color)
        warnings.push(`${at} scene step has neither src nor color — stage will be empty`)
      if (step.transition && !VALID_TRANSITIONS.has(step.transition))
        warnings.push(`${at} unknown transition "${step.transition}"`)
    }

    if (step.type === 'image') {
      const wantsHide = step.hide === true
      const hasId = step.id !== undefined && step.id !== null
      const hasSrc = step.src !== undefined && step.src !== null

      if (wantsHide) {
        warnings.push(`${at} image step with hide:true is deprecated — use { type: 'hide', image: true } instead`)
      }

      if (wantsHide && (hasId || hasSrc))
        errors.push(`${at} image step with hide:true cannot also define id/src`)

      if (!wantsHide && hasId && hasSrc)
        errors.push(`${at} image step must use either id or src, not both`)

      if (step.transition && !VALID_TRANSITIONS.has(step.transition))
        warnings.push(`${at} unknown transition "${step.transition}"`)

      if (step.fit && !VALID_IMAGE_FIT.has(step.fit))
        warnings.push(`${at} unknown fit "${step.fit}" (expected: width|height|both or x|y aliases)`)
    }

    if (step.type === 'video') {
      const hasId = step.id !== undefined && step.id !== null
      const hasSrc = step.src !== undefined && step.src !== null

      if (step.stop === true) {
        warnings.push(`${at} video step with stop:true is deprecated — use { type: 'hide', video: true } or { type: 'stop', video: true } instead`)
      }

      if (hasId && hasSrc)
        errors.push(`${at} video step must use either id or src, not both`)

      if (!step.stop && !hasId && !hasSrc)
        warnings.push(`${at} video step has no source — it will stop active playback`)

      if (step.controls !== undefined && step.controls !== true && step.controls !== false && step.controls !== 'displayable')
        warnings.push(`${at} video controls should be boolean or "displayable"`)
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
          if (opt.condition !== undefined && typeof opt.condition !== 'function' && typeof opt.condition !== 'boolean')
            errors.push(`${at} option[${oi}].condition must be a function or boolean`)
          if (opt.disabled !== undefined && typeof opt.disabled !== 'function' && typeof opt.disabled !== 'boolean')
            errors.push(`${at} option[${oi}].disabled must be a function or boolean`)
          if (opt.disabledText !== undefined && typeof opt.disabledText !== 'string')
            errors.push(`${at} option[${oi}].disabledText must be a string`)
        })
      }
    }

    if (step.type === 'modal') {
      if (!step.id || typeof step.id !== 'string')
        errors.push(`${at} modal step requires a string id field`)

      if (step.options !== undefined) {
        if (!Array.isArray(step.options) || step.options.length < 1) {
          errors.push(`${at} modal step options must contain at least 1 option when provided`)
        } else {
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
    }

    if (step.type === 'input') {
      if (!step.store || typeof step.store !== 'string')
        errors.push(`${at} input step requires a string store field`)
      if (step.required !== undefined && typeof step.required !== 'boolean')
        errors.push(`${at} input step required must be boolean when provided`)
      if (step.maxLength !== undefined && (!Number.isFinite(Number(step.maxLength)) || Number(step.maxLength) < 1))
        errors.push(`${at} input step maxLength must be a positive number when provided`)
      if (step.jump && !labels.has(step.jump))
        errors.push(`${at} input step jump target "${step.jump}" has no matching label`)
    }

    if (step.type === 'select') {
      if (!step.store || typeof step.store !== 'string')
        errors.push(`${at} select step requires a string store field`)

      if (!Array.isArray(step.options) || step.options.length < 1) {
        errors.push(`${at} select step requires at least 1 option`)
      } else {
        step.options.forEach((opt, oi) => {
          if (typeof opt === 'object' && opt !== null) {
            if (opt.label !== undefined && typeof opt.label !== 'string') {
              errors.push(`${at} option[${oi}].label must be a string when provided`)
            }
            if (opt.jump && !labels.has(opt.jump)) {
              errors.push(`${at} option[${oi}].jump target "${opt.jump}" has no matching label`)
            }
            if (opt.inc && typeof opt.inc !== 'object') {
              errors.push(`${at} option[${oi}].inc must be an object`)
            }
          }
        })
      }

      if (step.jump && !labels.has(step.jump))
        errors.push(`${at} select step jump target "${step.jump}" has no matching label`)
    }

    if (step.type === 'wait') {
      if (typeof step.ms !== 'number' || step.ms < 0)
        errors.push(`${at} wait step requires a non-negative ms field`)
    }

    if (step.type === 'effect') {
      if (!step.name || typeof step.name !== 'string')
        errors.push(`${at} effect step requires a string name field`)
      if (step.duration !== undefined && (typeof step.duration !== 'number' || step.duration < 0))
        errors.push(`${at} effect step requires a non-negative ms duration`)
      if (step.wait !== undefined && typeof step.wait !== 'boolean')
        errors.push(`${at} effect step wait must be boolean when provided`)
      if (step.config !== undefined && (typeof step.config !== 'object' || step.config === null || Array.isArray(step.config)))
        errors.push(`${at} effect step config must be a plain object`)
    }

    if (step.type === 'notify') {
      if (!step.text && !step.title)
        warnings.push(`${at} notify step has neither title nor text`)
      if (step.status && !['success', 'error', 'warning', 'info'].includes(step.status))
        warnings.push(`${at} unknown notify status "${step.status}"`)
    }

    if (step.type === 'bgm') {
      if (step.stop === true) {
        warnings.push(`${at} bgm step with stop:true is deprecated — use { type: 'stop', bgm: true } instead`)
      }
    }

    if (step.type === 'particles') {
      if (step.stop === true) {
        warnings.push(`${at} particles step with stop:true is deprecated — use { type: 'hide', particles: true } or { type: 'stop', particles: true } instead`)
      }
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

export function validateMultiLanguageScript(multiScript, characters = {}) {
  if (!multiScript || typeof multiScript !== 'object' || Array.isArray(multiScript)) {
    throw new Error('[vnova] Multi-language script must be a key-value object of language codes to step arrays.')
  }

  const languages = Object.keys(multiScript)
  if (languages.length === 0) {
    throw new Error('[vnova] Multi-language script must contain at least one language.')
  }

  const warnings = []

  // Validate each language script individually first using existing validateScript
  for (const lang of languages) {
    const langScript = multiScript[lang]
    if (!Array.isArray(langScript)) {
      throw new Error(`[vnova] Script for language "${lang}" must be an array.`)
    }
    try {
      const langWarnings = validateScript(langScript, characters)
      warnings.push(...langWarnings.map(w => `[Language: ${lang}] ${w}`))
    } catch (e) {
      throw new Error(`[vnova] Validation failed for language "${lang}":\n${e.message}`)
    }
  }

  // Verify structural equivalence between all languages
  const baseLang = languages[0]
  const baseScript = expandNestedLabels(multiScript[baseLang])

  for (let i = 1; i < languages.length; i++) {
    const targetLang = languages[i]
    const targetScript = expandNestedLabels(multiScript[targetLang])

    if (baseScript.length !== targetScript.length) {
      throw new Error(
        `[vnova] Script mismatch: Language "${baseLang}" has ${baseScript.length} steps, but "${targetLang}" has ${targetScript.length} steps.`
      )
    }

    baseScript.forEach((stepA, idx) => {
      const stepB = targetScript[idx]
      const at = `[step ${idx}]`

      if (stepA.type !== stepB.type) {
        throw new Error(
          `[vnova] Structural equivalence mismatch at ${at}: Language "${baseLang}" type is "${stepA.type}", but "${targetLang}" is "${stepB.type}".`
        )
      }

      // Check specific fields that control flow or logic
      const criticalFields = ['id', 'character', 'position', 'variant', 'expression', 'target', 'store', 'name', 'wait']
      for (const field of criticalFields) {
        if (stepA[field] !== stepB[field]) {
          throw new Error(
            `[vnova] Structural equivalence mismatch at ${at} (type: "${stepA.type}"): Field "${field}" differs between "${baseLang}" ("${stepA[field]}") and "${targetLang}" ("${stepB[field]}").`
          )
        }
      }

      // Check choice/modal/select options equivalence
      if (stepA.type === 'choice' || stepA.type === 'modal' || stepA.type === 'select') {
        const optsA = stepA.options || []
        const optsB = stepB.options || []
        if (optsA.length !== optsB.length) {
          throw new Error(
            `[vnova] Option count mismatch at ${at} (type: "${stepA.type}"): "${baseLang}" has ${optsA.length} options, but "${targetLang}" has ${optsB.length} options.`
          )
        }

        optsA.forEach((optA, optIdx) => {
          const optB = optsB[optIdx]
          const optCriticalFields = ['jump', 'value']
          for (const field of optCriticalFields) {
            if (optA[field] !== optB[field]) {
              throw new Error(
                `[vnova] Option mismatch at ${at} option ${optIdx}: Field "${field}" differs between "${baseLang}" ("${optA[field]}") and "${targetLang}" ("${optB[field]}").`
              )
            }
          }
          const hasCondA = optA.condition !== undefined
          const hasCondB = optB.condition !== undefined
          if (hasCondA !== hasCondB) {
            throw new Error(
              `[vnova] Option condition presence mismatch at ${at} option ${optIdx}: condition is present in "${hasCondA ? baseLang : targetLang}" but missing in "${hasCondA ? targetLang : baseLang}".`
            )
          }
          const hasDisA = optA.disabled !== undefined
          const hasDisB = optB.disabled !== undefined
          if (hasDisA !== hasDisB) {
            throw new Error(
              `[vnova] Option disabled presence mismatch at ${at} option ${optIdx}: disabled is present in "${hasDisA ? baseLang : targetLang}" but missing in "${hasDisA ? targetLang : baseLang}".`
            )
          }
        })
      }
    })
  }

  return warnings
}
