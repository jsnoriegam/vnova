/**
 * Helpers to register runtime UI extensions with minimal boilerplate.
 */

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function cloneRuntimeConfig(config) {
  return isObject(config) ? { ...config } : {}
}

function cloneUi(config) {
  return isObject(config.ui) ? { ...config.ui } : {}
}

function cloneUiModals(config) {
  const modals = config.ui?.modals
  return isObject(modals) ? { ...modals } : {}
}

export function registerRuntimeModal(config, id, component) {
  if (typeof id !== 'string' || id.trim().length === 0) return cloneRuntimeConfig(config)
  if (!component) return cloneRuntimeConfig(config)

  const nextConfig = cloneRuntimeConfig(config)
  const nextUi = cloneUi(nextConfig)
  const nextModals = cloneUiModals(nextConfig)

  nextModals[id] = component
  nextUi.modals = nextModals
  nextConfig.ui = nextUi

  return nextConfig
}

export function registerRuntimeModals(config, modalMap) {
  const nextConfig = cloneRuntimeConfig(config)
  if (!isObject(modalMap)) return nextConfig

  const nextUi = cloneUi(nextConfig)
  const nextModals = cloneUiModals(nextConfig)

  for (const [id, component] of Object.entries(modalMap)) {
    if (typeof id !== 'string' || id.trim().length === 0) continue
    if (!component) continue
    nextModals[id] = component
  }

  nextUi.modals = nextModals
  nextConfig.ui = nextUi

  return nextConfig
}
