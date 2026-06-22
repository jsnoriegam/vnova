/**
 * docs-example/src/story/script_es.js
 *
 * Traducción al español del guion de la demo.
 * IMPORTANTE: debe ser estructuralmente idéntico a script_en.js:
 *   - Mismo número de pasos
 *   - Mismos tipos de pasos
 *   - Mismas etiquetas (id)
 *   - Mismos caracteres, posiciones y saltos de elección
 * Solo difieren los campos de texto (text, prompt, label, title, etc.)
 */

import { useEngine } from 'vnova-engine'

export default [
  {
    type: 'label',
    id: 'start',
    steps: [
      { type: 'scene', id: 'control-room', transition: 'fade' },
      { type: 'particles', id: 'stars' },
      { type: 'bgm', id: 'grid', volume: 0.6, loop: true },

      { type: 'narrate', text: 'Año [b]2147[/b]. La ciudad funciona con [i]memoria[/i] y [color=#e06c75]tiempo prestado[/color].' },
      { type: 'show', character: 'hana', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'kenji', position: 'right', expression: 'concerned' },

      { type: 'say', character: 'kenji', text: 'El bloqueo de señal está [color=#e5c07b]inestable[/color]. Tenemos [b]una oportunidad[/b] de transmitir.' },
      {
        type: 'notify',
        status: 'warning',
        title: 'SYS// ALERTA PRIORITARIA',
        text: 'Integridad del relay al 39%. Se requiere decisión táctica.',
      },
      { type: 'think', character: 'hana', text: 'Una oportunidad. Una decisión. Una línea temporal que aún puedo salvar.' },
      {
        type: 'input',
        store: 'player.name',
        prompt: 'Antes de continuar, identifícate, operadora:',
        placeholder: 'Introduce tu nombre en clave',
        default: 'Astra',
        submitLabel: 'Confirmar identidad',
      },
      {
        type: 'select',
        store: 'player.commMode',
        prompt: 'Elige tu modo de comunicación:',
        options: [
          { label: 'Canal diplomático', value: 'diplomatic', inc: { trust: 1 } },
          { label: 'Canal táctico directo', value: 'tactical', inc: { risk: 1 } },
          { label: 'Modo observador silencioso', value: 'silent', inc: { trust: 0, risk: -1 } },
        ],
      },
      { type: 'narrate', text: 'Operadora {{player.name}} en línea. Perfil de comunicación: {{player.commMode}}.' },

      {
        type: 'modal',
        id: 'city-map-route',
        title: 'Mapa de Infiltración Táctica',
        prompt: 'Selecciona tu ruta de inserción eligiendo uno de los marcadores activos.',
        options: [
          {
            label: 'Ruta por el distrito del canal',
            jump: 'route-steady',
            set: { approach: 'steady' },
            inc: { trust: 2, risk: -1 },
            pin: { x: 22, y: 70, caption: 'Canales', detail: 'Aproximación discreta' },
          },
          {
            label: 'Sprint al núcleo del relay',
            jump: 'route-risky',
            set: { approach: 'risky' },
            inc: { trust: -1, risk: 3 },
            pin: { x: 68, y: 38, caption: 'Núcleo Relay', detail: 'Más rápido, mayor riesgo' },
          },
          {
            label: 'Barrido desde el observatorio de señales',
            jump: 'route-analyst',
            set: { approach: 'analyst' },
            inc: { trust: 1, risk: 0 },
            pin: { x: 52, y: 18, caption: 'Observatorio', detail: 'Ruta de inteligencia primero' },
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'route-steady',
    steps: [
      {
        type: 'notify',
        status: 'success',
        title: 'SYS// ESTABILIZACIÓN',
        text: 'Sincronización de equipo +12%. Piso de ruido reducido.',
      },
      { type: 'say', character: 'hana', text: 'Respira. Lo hacemos limpio, paso a paso.' },
      { type: 'say', character: 'kenji', text: 'Copiado. Sincronizando canales ahora.', expression: 'happy' },
      { type: 'wait', ms: 500 },
      { type: 'jump', target: 'checkpoint' },
    ],
  },

  {
    type: 'label',
    id: 'route-risky',
    steps: [
      {
        type: 'notify',
        status: 'error',
        title: 'SYS// SOBRECALENTAMIENTO TÉRMICO',
        text: 'El núcleo del relay entra en zona de riesgo.',
      },
      { type: 'say', character: 'hana', text: 'Sin tiempo. Empuja el ancho de banda completo ahora.' },
      { type: 'say', character: 'kenji', text: 'Eso podría fundir el relay.', expression: 'concerned' },
      { type: 'effect', name: 'shake', target: 'kenji', duration: 300, config: { intensity: 4 } },
      {
        type: 'call',
        fn: () => {
          const engine = useEngine()
          engine.setVar('overheat', true)
        },
      },
      { type: 'jump', target: 'checkpoint' },
    ],
  },

  {
    type: 'label',
    id: 'route-analyst',
    steps: [
      { type: 'image', id: 'diagnostic-overlay', transition: 'dissolve', fit: 'both' },
      { type: 'effect', name: 'pulse', target: 'image', duration: 1000, config: { cycles: 2, opacity: 0.6 }, wait: true },
      {
        type: 'notify',
        status: 'info',
        title: 'SYS// DIAGNÓSTICOS EN LÍNEA',
        text: 'Mapa de amenazas y telemetría de paquetes sincronizados.',
      },
      { type: 'narrate', text: 'Capa de diagnóstico proyectada: pérdida de paquetes, deriva del relay, pings hostiles.' },
      { type: 'say', character: 'hana', text: 'Patrón encontrado. Podemos enrutar alrededor del inhibidor.' },
      { type: 'say', character: 'kenji', text: 'Buen hallazgo.', expression: 'happy' },
      { type: 'hide', image: true, transition: 'fade' },
      { type: 'jump', target: 'checkpoint' },
    ],
  },

  {
    type: 'label',
    id: 'checkpoint',
    steps: [
      {
        type: 'call',
        fn: () => {
          const engine = useEngine()
          const trust = Number(engine.getVar('trust') ?? 0)
          const risk = Number(engine.getVar('risk') ?? 0)
          engine.setVar('tone', trust >= risk ? 'hopeful' : 'tense')
        },
      },
      { type: 'scene', id: 'tower-roof', transition: 'slide-left' },
      { type: 'effect', name: 'shake', target: 'bg', duration: 400, config: { intensity: 5, direction: 'vertical' } },
      { type: 'particles', id: 'leaves' },
      { type: 'effect', name: 'shake', target: 'stage', duration: 600, config: { intensity: 10 }, wait: true },

      { type: 'narrate', text: 'La torre de relay [b]despierta[/b]. [color=#61afef]Lluvia de neón[/color] corta a través del [i]horizonte[/i].' },
      {
        type: 'choice',
        prompt: 'Modo de transmisión final:',
        options: [
          { label: 'Canal abierto: decir toda la verdad', jump: 'ending-open', inc: { trust: 1 } },
          { label: 'Canal cifrado: proteger al equipo primero', jump: 'ending-shield', inc: { risk: -1 } },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'ending-open',
    steps: [
      { type: 'say', character: 'hana', text: 'No más secretos. Transmitimos todo.' },
      {
        type: 'notify',
        status: 'success',
        title: 'SYS// MODO UPLINK: ABIERTO',
        text: 'Canal global establecido. Blindaje de identidad desactivado.',
      },
      { type: 'effect', name: 'flash', duration: 400, config: { color: 'rgba(255, 255, 255, 0.9)' }, wait: true },
      { type: 'hide', character: 'kenji' },
      { type: 'narrate', text: 'Un millón de pantallas parpadean vivas en toda la ciudad.' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'ending-shield',
    steps: [
      { type: 'say', character: 'hana', text: 'Mantenemos las identidades selladas. Datos afuera, nombres protegidos.' },
      {
        type: 'notify',
        status: 'info',
        title: 'SYS// MODO UPLINK: CIFRADO',
        text: 'Canal protegido bloqueado. Identidades fuente enmascaradas.',
      },
      { type: 'say', character: 'kenji', text: 'Entonces los dos vivimos para luchar mañana.', expression: 'thoughtful' },
      { type: 'effect', name: 'pulse', duration: 800, config: { cycles: 3, opacity: 0.4 } },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'epilogue',
    steps: [
      { type: 'hide', particles: true },
      { type: 'scene', id: 'sunrise', transition: 'fade', stopMusic: true },
      { type: 'narrate', text: 'Al amanecer, la ciudad es [b]diferente[/b]. No [i]curada[/i], pero [color=#98c379]despierta[/color].' },
      { type: 'narrate', text: '[b][color=#61afef]Demo de texto enriquecido:[/color][/b] [i]cursiva[/i], [b]negrita[/b], [color=#e06c75]color[/color], y [b][i]negrita+cursiva[/i][/b].' },
      { type: 'say', character: 'hana', text: '¿Misma misión mañana?' },
      { type: 'say', character: 'kenji', text: 'Siempre.' },
      { type: 'effect', name: 'zoom', duration: 1000, config: { scale: 1.1, zoomDirection: 'in' }, wait: true },
      { type: 'end' },
    ],
  },
]
