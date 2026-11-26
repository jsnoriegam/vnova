/**
 * vnova-engine — core/conditions.js
 *
 * Declarative condition evaluation for the no-code DSL.
 *
 * Supported forms:
 *   true / false
 *   (ctx) => boolean
 *   { var: 'stats.courage', gte: 3 }
 *   { var: 'flags.metHana', eq: true }
 *   { var: 'route', in: ['a', 'b'] }
 *   { var: 'player.name', exists: true }
 *   { all: [...] } / { any: [...] } / { not: {...} }
 *   { 'flags.metHana': true, 'stats.courage': 3 }   // shorthand AND
 */

import { isPlainObject } from '../utils/predicates.js'

const COMPARISON_OPS = new Set([
  'eq', 'neq', 'ne', 'gt', 'gte', 'lt', 'lte',
  'in', 'notIn', 'nin', 'contains', 'matches',
  'exists', 'truthy', 'falsy',
])

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function compareValues(value, operator, expected) {
  switch (operator) {
    case 'eq':
      return value === expected
    case 'neq':
    case 'ne':
      return value !== expected
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const left = toNumber(value)
      const right = toNumber(expected)
      if (left === null || right === null) return false
      if (operator === 'gt') return left > right
      if (operator === 'gte') return left >= right
      if (operator === 'lt') return left < right
      return left <= right
    }
    case 'in':
      return Array.isArray(expected) && expected.includes(value)
    case 'notIn':
    case 'nin':
      return Array.isArray(expected) && !expected.includes(value)
    case 'contains':
      if (Array.isArray(value)) return value.includes(expected)
      if (typeof value === 'string') return value.includes(String(expected))
      return false
    case 'matches':
      try {
        return new RegExp(expected).test(String(value ?? ''))
      } catch {
        return false
      }
    case 'exists':
      return expected === false ? value === undefined : value !== undefined
    case 'truthy':
      return expected === false ? !value : Boolean(value)
    case 'falsy':
      return expected === false ? Boolean(value) : !value
    default:
      return false
  }
}

function hasComparisonOperator(condition) {
  return Object.keys(condition).some((key) => COMPARISON_OPS.has(key))
}

/**
 * Evaluates a condition against the current story state.
 *
 * @param {*} condition
 * @param {{ get: (path: string) => *, proxy?: object }} ctx
 * @returns {boolean}
 */
export function evaluateCondition(condition, ctx) {
  if (condition === undefined || condition === null) return true
  if (typeof condition === 'boolean') return condition

  if (typeof condition === 'function') {
    try {
      return Boolean(condition(ctx?.proxy ?? ctx))
    } catch (error) {
      console.warn('[vnova] condition function failed:', error)
      return false
    }
  }

  if (Array.isArray(condition)) {
    return condition.every((entry) => evaluateCondition(entry, ctx))
  }

  if (!isPlainObject(condition)) return Boolean(condition)

  if ('all' in condition) {
    const entries = Array.isArray(condition.all) ? condition.all : []
    return entries.every((entry) => evaluateCondition(entry, ctx))
  }

  if ('any' in condition) {
    const entries = Array.isArray(condition.any) ? condition.any : []
    return entries.some((entry) => evaluateCondition(entry, ctx))
  }

  if ('not' in condition) {
    return !evaluateCondition(condition.not, ctx)
  }

  const get = typeof ctx?.get === 'function' ? ctx.get : () => undefined

  if ('var' in condition || 'path' in condition) {
    const path = condition.var ?? condition.path
    const value = get(path)

    if (hasComparisonOperator(condition)) {
      const operator = Object.keys(condition).find((key) => COMPARISON_OPS.has(key))
      return compareValues(value, operator, condition[operator])
    }

    return Boolean(value)
  }

  // Shorthand: { 'flags.metHana': true, 'stats.courage': 3 }
  return Object.entries(condition).every(([path, expected]) => {
    const value = get(path)
    if (isPlainObject(expected) && hasComparisonOperator(expected)) {
      const operator = Object.keys(expected).find((key) => COMPARISON_OPS.has(key))
      return compareValues(value, operator, expected[operator])
    }
    return value === expected
  })
}
