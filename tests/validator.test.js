import { describe, expect, it } from 'vitest'
import { validateMultiLanguageScript, validateScript } from '../src/core/validator.js'

const characters = { hana: { name: 'Hana' } }

describe('validateScript', () => {
  it('accepts the declarative logic steps', () => {
    const warnings = validateScript([
      { type: 'set', vars: { courage: 1 }, inc: { visits: 1 }, unset: ['old'] },
      {
        type: 'if',
        condition: { var: 'courage', gte: 1 },
        then: [{ type: 'say', character: 'hana', text: 'Hola' }],
        else: [{ type: 'say', text: 'Adiós' }],
      },
      { type: 'once', id: 'hint', steps: [{ type: 'say', text: 'Pista' }] },
      {
        type: 'random',
        options: [
          { weight: 2, steps: [{ type: 'say', text: 'A' }] },
          { weight: 1, steps: [{ type: 'say', text: 'B' }] },
        ],
      },
      { type: 'jump', target: 'end', if: { var: 'visits', gt: 0 } },
      { type: 'label', id: 'end' },
      { type: 'end' },
    ], characters)

    expect(warnings).toEqual([])
  })

  it('resolves jump targets declared inside blocks', () => {
    const warnings = validateScript([
      {
        type: 'if',
        condition: true,
        then: [
          { type: 'label', id: 'inside' },
          { type: 'jump', target: 'outside' },
        ],
      },
      { type: 'label', id: 'outside' },
      { type: 'jump', target: 'inside' },
    ])

    expect(warnings).toEqual([])
  })

  it('throws when a jump target does not exist', () => {
    expect(() => validateScript([{ type: 'jump', target: 'missing' }]))
      .toThrow(/no matching label/)
  })

  it('warns about duplicate labels', () => {
    const warnings = validateScript([
      { type: 'label', id: 'same' },
      { type: 'label', id: 'same' },
    ])

    expect(warnings.some((warning) => warning.includes('duplicate label'))).toBe(true)
  })

  it('rejects incomplete logic steps', () => {
    expect(() => validateScript([{ type: 'if', then: [] }])).toThrow(/requires a condition/)
    expect(() => validateScript([{ type: 'if', condition: true }])).toThrow(/requires then/)
    expect(() => validateScript([{ type: 'once', steps: [] }])).toThrow(/requires a string id/)
    expect(() => validateScript([{ type: 'once', id: 'x' }])).toThrow(/requires steps/)
    expect(() => validateScript([{ type: 'set' }])).toThrow(/at least one of/)
    expect(() => validateScript([{ type: 'random', options: [] }])).toThrow(/at least 1 option/)
    expect(() => validateScript([{
      type: 'random',
      options: [{ weight: 0, steps: [] }],
    }])).toThrow(/positive number/)
  })

  it('accepts condition objects on choice options', () => {
    const warnings = validateScript([
      {
        type: 'choice',
        options: [
          { label: 'A', condition: { var: 'courage', gte: 2 } },
          { label: 'B', disabled: { var: 'locked', eq: true } },
        ],
      },
    ])

    expect(warnings).toEqual([])
  })

  it('accepts unlock steps with all target forms', () => {
    const warnings = validateScript([
      { type: 'unlock', cg: 'cg-01' },
      { type: 'unlock', cgs: ['cg-02', 'cg-03'], ending: 'true-end' },
      { type: 'unlock', kind: 'achievement', id: 'first-step' },
      { type: 'unlock', targets: [{ kind: 'chapter', id: 'chapter-2' }] },
    ])

    expect(warnings).toEqual([])
  })

  it('rejects unlock steps without valid targets', () => {
    expect(() => validateScript([{ type: 'unlock' }])).toThrow(/at least one target/)
    expect(() => validateScript([{ type: 'unlock', cg: [] }])).toThrow(/non-empty string or an array/)
    expect(() => validateScript([{ type: 'unlock', targets: [{}] }])).toThrow(/requires string kind and id/)
  })
})

describe('validateMultiLanguageScript', () => {
  it('compares dialogue nested inside blocks', () => {
    const base = [
      { type: 'if', condition: true, then: [{ type: 'say', text: 'Hola' }] },
    ]
    const translated = [
      { type: 'if', condition: true, then: [{ type: 'say', text: 'Hello' }] },
    ]

    expect(validateMultiLanguageScript({ es: base, en: translated })).toEqual([])
  })

  it('detects structural mismatches inside blocks', () => {
    const base = [
      { type: 'if', condition: true, then: [{ type: 'say', text: 'Hola' }] },
    ]
    const broken = [
      {
        type: 'if',
        condition: true,
        then: [
          { type: 'say', text: 'Hello' },
          { type: 'say', text: 'Extra line' },
        ],
      },
    ]

    expect(() => validateMultiLanguageScript({ es: base, en: broken }))
      .toThrow(/step count|has .* steps/)
  })

  it('detects different critical fields inside blocks', () => {
    const base = [
      { type: 'if', condition: true, then: [{ type: 'say', character: 'hana', text: 'Hola' }] },
    ]
    const broken = [
      { type: 'if', condition: true, then: [{ type: 'say', character: 'kenji', text: 'Hello' }] },
    ]

    expect(() => validateMultiLanguageScript({ es: base, en: broken }, { hana: {}, kenji: {} }))
      .toThrow(/Field "character" differs/)
  })
})
