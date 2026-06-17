export function normalizeSpacebarFastForward(value) {
  if (value === true || value === 'true' || value === 'on' || value === 'fullspeed') return 'fullspeed'
  if (value === false || value === 'false' || value === 'off') return 'off'
  if (value === 'throttled') return 'throttled'
  return 'fullspeed'
}
