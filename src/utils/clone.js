const _hasStructuredClone = typeof structuredClone === 'function'

export function cloneDeep(value) {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (_hasStructuredClone) {
    try { return structuredClone(value) } catch { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(value))
}
