/**
 * vnova-engine — utils/richText.js
 *
 * Parser de BBCode ligero para textos de diálogo.
 * Etiquetas soportadas: [b], [i], [color=#rrggbb]
 *
 * Formato de etiquetas:
 *   [b]negrita[/b]
 *   [i]cursiva[/i]
 *   [color=#aabbcc]color[/color]
 *
 * ── Extensibilidad (interna) ──────────────────────────────────────────────
 * Para añadir una nueva etiqueta:
 *   1. Añade una entrada en TAG_REGISTRY con { hasValue: bool }.
 *   2. Añade la propiedad correspondiente en _makeToken().
 *   3. Añade el estilo en VNovaRichText.vue.
 * El parser, el slicer y el extractor de texto plano se actualizan solos.
 */

/**
 * Registro interno de etiquetas soportadas.
 * hasValue: true si la etiqueta acepta un valor (ej. [color=#fff]).
 *
 * @type {Record<string, { hasValue: boolean }>}
 */
const TAG_REGISTRY = {
  b:     { hasValue: false },
  i:     { hasValue: false },
  color: { hasValue: true  },
}

// Regex source construido una sola vez a partir del registro
const _tagNames  = Object.keys(TAG_REGISTRY).join('|')
const _TAG_RE_SRC = `\\[(\\/?)(?:(${_tagNames})(?:=([^\\]]+))?)\\]`

// ── API pública ────────────────────────────────────────────────────────────

/**
 * Divide un string BBCode en tokens listos para renderizar.
 * Soporta anidamiento: un segmento puede ser negrita Y tener color.
 *
 * @param {string} str
 * @returns {Array<{ text: string, bold: boolean, italic: boolean, color: string|null }>}
 */
export function parseRichText(str) {
  if (!str) return []

  const re     = new RegExp(_TAG_RE_SRC, 'gi')
  const tokens = []
  const stack  = [] // { name, value }
  let lastIndex = 0
  let match

  while ((match = re.exec(str)) !== null) {
    const [full, closing, name] = match
    const nameLower = name?.toLowerCase()

    if (match.index > lastIndex) {
      const text = str.slice(lastIndex, match.index)
      if (text) tokens.push(_makeToken(text, stack))
    }
    lastIndex = match.index + full.length

    if (closing) {
      const idx = [...stack].reverse().findIndex(t => t.name === nameLower)
      if (idx !== -1) stack.splice(stack.length - 1 - idx, 1)
    } else if (nameLower in TAG_REGISTRY) {
      stack.push({ name: nameLower, value: match[3] ?? null })
    }
  }

  if (lastIndex < str.length) {
    const text = str.slice(lastIndex)
    if (text) tokens.push(_makeToken(text, stack))
  }

  return tokens
}

/**
 * Devuelve el texto visible (sin etiquetas BBCode).
 *
 * @param {string} str
 * @returns {string}
 */
export function plainText(str) {
  if (!str) return ''
  return str.replace(new RegExp(_TAG_RE_SRC, 'gi'), '')
}

/**
 * Devuelve el string BBCode mostrando solo los primeros `n` caracteres
 * visibles, cerrando correctamente las etiquetas abiertas en el corte.
 * Usado por el typewriter para revelar texto carácter a carácter.
 *
 * @param {string} str   String BBCode completo
 * @param {number} n     Número de chars visibles a mostrar
 * @returns {string}
 */
export function sliceRichText(str, n) {
  if (!str || n <= 0) return ''

  const re       = new RegExp(_TAG_RE_SRC, 'gi')
  let result     = ''
  let visible    = 0
  let lastIndex  = 0
  const openTags = [] // { name } — para cerrarlas al cortar
  let match

  function _closeTags() {
    for (let i = openTags.length - 1; i >= 0; i--) {
      result += `[/${openTags[i].name}]`
    }
  }

  while ((match = re.exec(str)) !== null) {
    const [full, closing, name] = match
    const nameLower = name?.toLowerCase()

    if (match.index > lastIndex) {
      const text      = str.slice(lastIndex, match.index)
      const remaining = n - visible
      if (text.length <= remaining) {
        result  += text
        visible += text.length
      } else {
        result += text.slice(0, remaining)
        _closeTags()
        return result
      }
    }
    lastIndex = match.index + full.length

    if (visible >= n) break

    if (closing) {
      const idx = [...openTags].reverse().findIndex(t => t.name === nameLower)
      if (idx !== -1) {
        openTags.splice(openTags.length - 1 - idx, 1)
        result += full
      }
    } else if (nameLower in TAG_REGISTRY) {
      openTags.push({ name: nameLower })
      result += full
    }
  }

  if (visible < n && lastIndex < str.length) {
    const text      = str.slice(lastIndex)
    const remaining = n - visible
    result += text.slice(0, remaining)
  }

  _closeTags()
  return result
}

// ── Interno ────────────────────────────────────────────────────────────────

/**
 * Crea un token con los estilos acumulados del stack actual.
 * Para añadir una nueva propiedad de estilo: agregar aquí y en TAG_REGISTRY.
 */
function _makeToken(text, stack) {
  const token = { text, bold: false, italic: false, color: null }
  for (const { name, value } of stack) {
    if (name === 'b')     token.bold  = true
    if (name === 'i')     token.italic = true
    if (name === 'color') token.color = value
  }
  return token
}
