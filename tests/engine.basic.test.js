import { describe, expect, it } from 'vitest'
import { createEngine } from '../src/core/engine.js'

const characters = { hana: { name: 'Hana', color: '#e879b0' } }

describe('engine basics', () => {
  it('starts on the first step and advances through dialogue', () => {
    const engine = createEngine([
      { type: 'say', character: 'hana', text: 'Hola' },
      { type: 'say', character: 'hana', text: 'Adiós' },
    ], { characters })

    expect(engine.store.current.text).toBe('Hola')
    expect(engine.speakerName.value).toBe('Hana')

    engine.advance()
    expect(engine.store.current.text).toBe('Adiós')
    expect(engine.store.history).toHaveLength(2)
  })

  it('restores cursor, stage and variables on back()', () => {
    const engine = createEngine([
      { type: 'say', text: 'uno' },
      { type: 'set', vars: { flag: true } },
      { type: 'say', text: 'dos' },
    ])

    engine.advance()
    expect(engine.store.current.text).toBe('dos')
    expect(engine.getVar('flag')).toBe(true)

    expect(engine.back()).toBe(true)
    expect(engine.store.current.text).toBe('uno')
    expect(engine.getVar('flag')).toBeUndefined()
    expect(engine.store.canBack).toBe(false)
  })

  it('applies choice effects and jumps', () => {
    const engine = createEngine([
      {
        type: 'choice',
        prompt: '¿Qué haces?',
        options: [
          { label: 'Ayudar', jump: 'help', set: { karma: 1 }, inc: { courage: 2 } },
          { label: 'Ignorar', jump: 'ignore' },
        ],
      },
      { type: 'label', id: 'help' },
      { type: 'say', text: 'Ayudas.' },
      { type: 'jump', target: 'done' },
      { type: 'label', id: 'ignore' },
      { type: 'say', text: 'Ignoras.' },
      { type: 'label', id: 'done' },
    ])

    engine.choose(engine.store.current.options[0])
    expect(engine.store.current.text).toBe('Ayudas.')
    expect(engine.getVar('karma')).toBe(1)
    expect(engine.getVar('courage')).toBe(2)
  })

  it('filters choice options using functions and booleans', () => {
    const engine = createEngine([
      { type: 'choice', options: [
        { label: 'Siempre' },
        { label: 'Nunca', condition: false },
        { label: 'Con valor', condition: (ctx) => ctx.courage >= 3 },
      ] },
    ], { initialState: { courage: 5 } })

    expect(engine.store.current.options.map((option) => option.label)).toEqual(['Siempre', 'Con valor'])
  })

  it('interpolates variables in dialogue', () => {
    const engine = createEngine([
      { type: 'set', vars: { 'player.name': 'Ada' } },
      { type: 'say', text: 'Hola, {{ player.name }}.' },
    ])

    expect(engine.store.current.text).toBe('Hola, Ada.')
  })
})
