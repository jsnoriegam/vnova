export function normalizeSpacebarFastForward(value) {
  if (value === true || value === 'true' || value === 'on' || value === 'fullspeed') return 'fullspeed'
  if (value === false || value === 'false' || value === 'off') return 'off'
  if (value === 'throttled') return 'throttled'
  return 'fullspeed'
}

export function hasPathPrefix(path, prefix) {
  if (!prefix) return false
  const normPath = path.endsWith('/') ? path : path + '/'
  const normPrefix = prefix.endsWith('/') ? prefix : prefix + '/'
  return normPath.startsWith(normPrefix)
}

export function normalizeAssetUrl(value) {
  if (typeof value !== 'string') return value
  const raw = value.trim()
  if (!raw) return raw
  
  // Already absolute URL (http, https, data, blob, file)
  if (raw.startsWith('http://') || raw.startsWith('https://') || 
      raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('file:')) {
    return raw
  }

  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
  
  // For paths starting with /, prepend base URL if available
  if (raw.startsWith('/')) {
    // If the path already has the base URL prefix, do not prepend it again
    if (base && hasPathPrefix(raw, base)) {
      return raw
    }
    
    // Avoid double slashes: if base ends with /, remove leading / from raw
    if (base && base.endsWith('/')) {
      return base + raw.slice(1)
    }
    if (base) {
      return base + raw
    }
    return raw
  }

  // Vite-friendly fallback: treat relative author paths as files under /src.
  if (raw.startsWith('./') || raw.startsWith('../')) {
    const stripped = raw.replace(/^(?:\.\.\/|\.\/)+/, '')
    return `/src/${stripped}`
  }

  // For relative paths without leading slash (e.g., 'characters/hana.png'),
  // prepend base URL to ensure they work in GitHub Pages and other static hosts
  if (!raw.startsWith('.')) {
    if (base && base.endsWith('/')) {
      return base + raw
    }
    if (base) {
      return base + '/' + raw
    }
  }

  return raw
}
