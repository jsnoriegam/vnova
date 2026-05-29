import Notify from 'simple-notify'
import 'simple-notify/dist/simple-notify.css'

function normalizeStatus(status) {
  if (status === 'success' || status === 'error' || status === 'warning' || status === 'info') {
    return status
  }
  return 'info'
}

export function showNotify(payload = {}) {
  if (typeof window === 'undefined') return

  const {
    status = 'info',
    title = '',
    text = '',
    autoclose = true,
  } = payload

  new Notify({
    status: normalizeStatus(status),
    title,
    text,
    effect: 'fade',
    speed: 220,
    showIcon: true,
    showCloseButton: true,
    autoclose,
    autotimeout: 2800,
  })
}
