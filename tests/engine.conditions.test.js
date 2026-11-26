import { describe, expect, it, vi } from 'vitest'
import { createEngine } from '../src/core/engine.js'
import { compileScript, collectSteps, expandNestedLabels } from '../src/core/compiler.js'

const dialogueTexts = (engine) => engine.store.history
  .filter((step) => ['say', 'think', 'narrate'].includes(step.type))
  .map((step) => step.text)

describe('declarative logic', () => {
  it('runs the then branch when the condition is true', () => {
    const engine = createEngine([
      { type: 'set', vars: { courage: 5 } },
      {
        type: 'if',
        condition: { var: 'courage', gte: 3 },
        then: [{ type: 'say', text: 'Valiente' }],
        else: [{ type: 'say', text: 'Tímido' }],
      },
      { type: 'say', text: 'Fin' },
    ])

    expect(engine.store.current.text).toBe('Valiente')
    engine.advance()
    expect(engine.store.current.text).toBe('Fin')
  })

  it('runs the else branch when the condition is false', () => {
    const engine = createEngine([
      { type: 'set', vars: { courage: 1 } },
      {
        type: 'if',
        condition: { var: 'courage', gte: 3 },
        then: [{ type: 'say', text: 'Valiente' }],
        else: [{ type: 'say', text: 'Tímido' }],
      },
    ])

    expect(engine.store.current.text).toBe('Tímido')
  })

  it('supports nested conditionals', () => {
    const engine = createEngine([
      {
        type: 'if',
        condition: true,
        then: [
          {
            type: 'if',
            condition: false,
            then: [{ type: 'say', text: 'nunca' }],
            else: [{ type: 'say', text: 'anidado' }],
          },
        ],
      },
    ])

    expect(engine.store.current.text).toBe('anidado')
  })

  it('supports conditional jumps', () => {
    const engine = createEngine([
      { type: 'set', vars: { flag: false } },
      { type: 'jump', target: 'yes', if: { var: 'flag', eq: true } },
      { type: 'say', text: 'no' },
      { type: 'jump', target: 'done' },
      { type: 'label', id: 'yes' },
      { type: 'say', text: 'sí' },
      { type: 'label', id: 'done' },
    ])

    expect(engine.store.current.text).toBe('no')
  })

  it('evaluates shorthand, all/any/not and function conditions', () => {
    const engine = createEngine([
      { type: 'set', vars: { 'flags.met': true, stats: { courage: 4, wisdom: 1 } } },
      {
        type: 'choice',
        options: [
          { label: 'shorthand', condition: { 'flags.met': true } },
          { label: 'all', condition: { all: [{ var: 'stats.courage', gte: 4 }, { var: 'stats.wisdom', lt: 2 }] } },
          { label: 'any', condition: { any: [{ var: 'stats.courage', gt: 10 }, { var: 'stats.wisdom', eq: 1 }] } },
          { label: 'not', condition: { not: { var: 'flags.met', eq: false } } },
          { label: 'fn', condition: (ctx) => ctx.stats.courage === 4 },
          { label: 'no', condition: { var: 'flags.met', eq: false } },
        ],
      },
    ])

    expect(engine.store.current.options.map((option) => option.label))
      .toEqual(['shorthand', 'all', 'any', 'not', 'fn'])
  })

  it('supports declarative disabled options', () => {
    const engine = createEngine([
      { type: 'set', vars: { locked: true } },
      {
        type: 'choice',
        options: [
          { label: 'Abrir', disabled: { var: 'locked', eq: true }, disabledText: 'Cerrado' },
          { label: 'Esperar' },
        ],
      },
    ])

    const [locked, wait] = engine.store.current.options
    expect(locked.disabled).toBe(true)
    expect(wait.disabled).toBe(false)
  })

  it('runs a once block only the first time', () => {
    const engine = createEngine([
      { type: 'label', id: 'loop' },
      { type: 'once', id: 'hint', steps: [{ type: 'say', text: 'pista' }] },
      { type: 'say', text: 'después' },
      { type: 'set', inc: { visits: 1 } },
      { type: 'if', condition: { var: 'visits', lt: 2 }, then: [{ type: 'jump', target: 'loop' }] },
      { type: 'say', text: 'fin' },
    ])

    expect(engine.store.current.text).toBe('pista')
    engine.advance()
    expect(engine.store.current.text).toBe('después')
    engine.advance()
    expect(engine.store.current.text).toBe('después')
    engine.advance()
    expect(engine.store.current.text).toBe('fin')

    expect(dialogueTexts(engine).filter((text) => text === 'pista')).toHaveLength(1)
    expect(dialogueTexts(engine).filter((text) => text === 'después')).toHaveLength(2)
  })

  it('chooses a weighted random branch', () => {
    const script = [
      {
        type: 'random',
        options: [
          { weight: 1, steps: [{ type: 'say', text: 'A' }] },
          { weight: 3, steps: [{ type: 'say', text: 'B' }] },
        ],
      },
    ]

    const random = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(createEngine(script).store.current.text).toBe('A')

    random.mockReturnValue(0.9)
    expect(createEngine(script).store.current.text).toBe('B')
  })

  it('sets, increments and unsets variables by path', () => {
    const engine = createEngine([
      { type: 'set', vars: { name: 'Ada', stats: { courage: 2 } } },
      { type: 'set', inc: { 'stats.courage': 3, visits: 1 } },
      { type: 'set', unset: ['name'] },
    ])

    expect(engine.store.vars).toEqual({ stats: { courage: 5 }, visits: 1 })
    expect(engine.store.ended).toBe(true)
  })

  it('expands nested labels recursively', () => {
    const script = [
      {
        type: 'label',
        id: 'outer',
        steps: [
          { type: 'say', text: 'one' },
          { type: 'label', id: 'inner', steps: [{ type: 'say', text: 'two' }] },
        ],
      },
    ]

    expect(expandNestedLabels(script)).toEqual([
      { type: 'label', id: 'outer' },
      { type: 'say', text: 'one' },
      { type: 'label', id: 'inner' },
      { type: 'say', text: 'two' },
    ])

    const engine = createEngine(script)
    expect(engine.store.current.text).toBe('one')
    engine.advance()
    expect(engine.store.current.text).toBe('two')
  })

  it('collects nested steps for validation', () => {
    const script = [
      { type: 'if', condition: true, then: [{ type: 'say', text: 'nested' }] },
      { type: 'label', id: 'x', steps: [{ type: 'say', text: 'labelled' }] },
    ]

    const types = collectSteps(script).map((step) => step.type)
    expect(types).toEqual(['if', 'say', 'label', 'say'])
  })

  it('compiles blocks into a flat script with synthetic labels', () => {
    const compiled = compileScript([
      { type: 'once', id: 'x', steps: [{ type: 'say', text: 'once' }] },
      { type: 'random', options: [{ steps: [{ type: 'say', text: 'r' }] }] },
      { type: 'if', condition: true, then: [{ type: 'say', text: 'if' }] },
    ])

    expect(compiled.some((step) => step.type === 'once')).toBe(false)
    expect(compiled.some((step) => step.type === 'random')).toBe(false)
    expect(compiled.some((step) => step.type === 'if')).toBe(false)
    expect(compiled.filter((step) => step.type === 'label').every((step) => step.id.startsWith('__vnova_'))).toBe(true)
  })
})
