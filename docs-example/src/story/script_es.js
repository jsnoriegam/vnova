/**
 * docs-example/src/story/script_es.js
 *
 * “La última luz de la Academia Hoshimi” — guion en español.
 * Debe mantener paridad estructural con script_en.js.
 */

export default [
  {
    type: 'label',
    id: 'start',
    steps: [
      { type: 'scene', id: 'school-yard', transition: 'fade' },
      { type: 'bgm', id: 'grid', volume: 0.55, loop: true },
      { type: 'particles', id: 'stars' },
      {
        type: 'narrate',
        text: 'Academia Hoshimi, 17:47. El festival empieza en dos horas — y la torre del reloj se ha quedado [b]en silencio[/b].',
      },
      { type: 'show', character: 'mio', position: 'left', expression: 'happy' },
      { type: 'say', character: 'mio', text: '¡Ahí estás! El comité está a un desastre de cancelarlo todo.' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'neutral' },
      { type: 'say', character: 'lucien', text: 'La torre se paró a las 17:47. Nadie sabe por qué. Solo nos queda una carta: tú.' },
      {
        type: 'input',
        store: 'player.name',
        prompt: 'Antes de empezar, ¿cómo te llamamos?',
        placeholder: 'Tu nombre',
        default: 'Akira',
        submitLabel: 'Unirme al comité',
      },
      { type: 'say', character: 'mio', text: '¡{{player.name}}! Perfecto. Elige un equipo y aún podemos salvar la última luz.' },
      { type: 'unlock', chapter: 'chapter-1', achievement: 'first-day', cg: 'cg-yard' },
      { type: 'item', id: 'energyDrink', qty: 2 },
      {
        type: 'once',
        id: 'festival-hint',
        steps: [
          {
            type: 'notify',
            status: 'info',
            title: 'COMITÉ// PISTA',
            text: 'Las decisiones desbloquean CGs y logros. El botón de Inventario está en el HUD.',
          },
        ],
      },
      {
        type: 'choice',
        prompt: '¿A qué equipo te unes?',
        options: [
          {
            label: 'Backstage con Mina y Vittorio',
            jump: 'route-stage',
            set: { route: 'stage' },
            inc: { trust: 1 },
          },
          {
            label: 'El archivo con Lucienne y Nova',
            jump: 'route-archive',
            set: { route: 'archive' },
            inc: { clues: 1 },
          },
          {
            label: 'La torre del reloj con Nova y Shun',
            jump: 'route-tower',
            set: { route: 'tower' },
            inc: { courage: 1 },
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'route-stage',
    steps: [
      { type: 'scene', id: 'school-stages', transition: 'fade' },
      { type: 'show', character: 'mina', position: 'center', expression: 'happy' },
      { type: 'show', character: 'vittorio', position: 'left-far', expression: 'neutral' },
      {
        type: 'narrate',
        text: 'El escenario huele a pintura, polvo y demasiado laca. Mina lleva su traje de actuación.',
      },
      { type: 'say', character: 'mina', text: '¡Por fin alguien con manos útiles! Sujeta este cable. No — el otro extremo.' },
      { type: 'say', character: 'vittorio', text: 'Ignórala. La emergencia real es la iluminación. Necesitamos un pase para subir al balcón.' },
      { type: 'item', id: 'stagePass' },
      { type: 'unlock', cg: 'cg-stage', achievement: 'stage-route' },
      { type: 'set', inc: { clues: 1 } },
      { type: 'say', character: 'mina', text: 'Toma el pase. Y si las luces se apagan, culpo a la torre, no a ti.' },
      { type: 'jump', target: 'cafe' },
    ],
  },

  {
    type: 'label',
    id: 'route-archive',
    steps: [
      { type: 'scene', id: 'school-library', transition: 'fade' },
      { type: 'show', character: 'lucienne', position: 'right', expression: 'neutral' },
      { type: 'show', character: 'nova', position: 'left-far', expression: 'surprised' },
      {
        type: 'narrate',
        text: 'El archivo está más frío que el resto del instituto. Lucienne ya ha sacado tres cajas de las estanterías.',
      },
      { type: 'say', character: 'lucienne', text: 'La torre no está rota. La apagaron. La orden está en uno de estos archivos.' },
      { type: 'say', character: 'nova', text: 'Puedo dejar en bucle las cámaras del pasillo seis minutos. Después seremos fantasmas oficiales.' },
      { type: 'item', id: 'archiveKey' },
      { type: 'item', id: 'filmRoll' },
      { type: 'unlock', cg: 'cg-library', achievement: 'archive-route' },
      { type: 'set', inc: { clues: 2 } },
      { type: 'say', character: 'lucienne', text: 'Toma la llave del archivo y el carrete. No lo pongas hasta que la torre despierte.' },
      { type: 'jump', target: 'cafe' },
    ],
  },

  {
    type: 'label',
    id: 'route-tower',
    steps: [
      { type: 'scene', id: 'school-corridor', transition: 'fade' },
      { type: 'show', character: 'nova', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'shun', position: 'right', expression: 'happy' },
      {
        type: 'narrate',
        text: 'El pasillo a la torre está cerrado, pero Shun ya ha encontrado una ventana que “definitivamente abre”.',
      },
      { type: 'say', character: 'shun', text: 'Primero las escaleras, después las preguntas. Yo llevo el equipo. Seguramente.' },
      { type: 'say', character: 'nova', text: 'La llave del reloj está en la caja de mantenimiento. Si el mecanismo está atascado, aún podemos arrancarlo.' },
      { type: 'item', id: 'clockKey' },
      { type: 'unlock', cg: 'cg-tower', achievement: 'tower-route' },
      { type: 'set', inc: { courage: 1, clues: 1 } },
      { type: 'say', character: 'shun', text: 'Una llave, una torre y una idea pésima. Vamos.' },
      { type: 'jump', target: 'cafe' },
    ],
  },

  {
    type: 'label',
    id: 'cafe',
    steps: [
      { type: 'scene', id: 'cafe-night', transition: 'fade' },
      { type: 'show', character: 'mio', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'neutral' },
      {
        type: 'narrate',
        text: 'La cafetería está medio vacía. Cinco tazas, una mesa y un reloj que sigue equivocado.',
      },
      {
        type: 'if',
        condition: { var: 'route', eq: 'stage' },
        then: [
          { type: 'say', character: 'mio', text: 'Mina dice que las luces del balcón están listas. También dijo “no toques el cable rojo”.' },
        ],
        else: [
          {
            type: 'if',
            condition: { var: 'route', eq: 'archive' },
            then: [
              { type: 'say', character: 'lucien', text: 'Lucienne encontró la orden de apagado. Alguien por encima de nosotros quería la torre callada.' },
            ],
            else: [
              { type: 'say', character: 'mio', text: 'Shun sigue eufórico. Nova dice que la llave del reloj encaja.' },
            ],
          },
        ],
      },
      { type: 'say', character: 'lucien', text: 'Aún podemos elegir qué significa la última luz. Solo tenemos una jugada.' },
      { type: 'unlock', cg: 'cg-cafe' },
      {
        type: 'choice',
        prompt: '¿Un respiro antes del último empujón?',
        options: [
          {
            label: 'Beber una bebida energética',
            jump: 'drink',
            condition: { hasItem: 'energyDrink' },
          },
          {
            label: 'Mantener la concentración',
            jump: 'midnight',
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'drink',
    steps: [
      { type: 'item', action: 'use', id: 'energyDrink' },
      { type: 'say', character: 'mio', text: '¿Mejor? Parecías a punto de echarte una siesta de pie.' },
      { type: 'say', character: 'lucien', text: 'Bien. Entonces nos movemos.' },
      { type: 'jump', target: 'midnight' },
    ],
  },

  {
    type: 'label',
    id: 'midnight',
    steps: [
      { type: 'scene', id: 'city-night', transition: 'fade' },
      { type: 'particles', id: 'stars' },
      { type: 'show', character: 'nova', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'sad' },
      { type: 'narrate', text: '23:58. La ciudad es una rejilla de ventanas y la torre es la única apagada.' },
      { type: 'say', character: 'nova', text: 'La señal está limpia. Lo que hagamos ahora se recordará.' },
      {
        type: 'if',
        condition: { hasItem: 'clockKey' },
        then: [
          { type: 'say', character: 'lucien', text: 'La llave del reloj está caliente. Sabe que estamos aquí.' },
        ],
        else: [
          { type: 'say', character: 'lucien', text: 'Sin la llave del reloj, la torre seguirá dormida. Tendremos que ser más fuertes que ella.' },
        ],
      },
      { type: 'unlock', chapter: 'chapter-2' },
      { type: 'jump', target: 'finale' },
    ],
  },

  {
    type: 'label',
    id: 'finale',
    steps: [
      { type: 'scene', id: 'school-stages', transition: 'fade' },
      { type: 'show', character: 'mio', position: 'left', expression: 'happy' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'neutral' },
      { type: 'show', character: 'mina', position: 'center', expression: 'surprised' },
      {
        type: 'narrate',
        text: 'La última luz no es una máquina. Es una decisión sobre quién tiene derecho a ponerse debajo.',
      },
      { type: 'say', character: 'mina', text: 'El escenario es tuyo, {{player.name}}. Intenta no romperlo.' },
      { type: 'say', character: 'lucien', text: 'Elijas lo que elijas, el comité te sigue.' },
      { type: 'unlock', chapter: 'chapter-3', cg: 'cg-finale' },
      {
        type: 'choice',
        prompt: '¿Cómo termina el festival?',
        options: [
          {
            label: 'Abrir las puertas a toda la ciudad',
            jump: 'ending-open',
          },
          {
            label: 'Sellar el archivo y proteger al club',
            jump: 'ending-archive',
          },
          {
            label: 'Emitir la verdad desde la torre del reloj',
            jump: 'ending-broadcast',
            disabled: { not: { hasItem: 'clockKey' } },
            disabledText: 'Necesitas la llave del reloj.',
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'ending-open',
    steps: [
      { type: 'scene', id: 'city-day', transition: 'fade' },
      { type: 'show', character: 'mio', position: 'left', expression: 'happy' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'happy' },
      { type: 'narrate', text: 'Al amanecer, las puertas se abren. La ciudad entra.' },
      { type: 'say', character: 'mio', text: 'Nos quedamos sin entradas hace veinte minutos. A nadie le importa.' },
      { type: 'say', character: 'lucien', text: 'La torre sigue mal. Pero por una mañana, todo el mundo llega a tiempo.' },
      { type: 'unlock', ending: 'ending-open' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'ending-archive',
    steps: [
      { type: 'scene', id: 'school-library', transition: 'fade' },
      { type: 'show', character: 'lucienne', position: 'center', expression: 'b_smile' },
      { type: 'narrate', text: 'El archivo cierra al amanecer. Algunas verdades se quedan archivadas, seguras y afiladas.' },
      { type: 'say', character: 'lucienne', text: 'Elegiste el final silencioso. El club sobrevivirá. La ciudad se preguntará.' },
      { type: 'say', character: 'lucienne', text: 'Vuelve el año que viene. Dejaré la luz encendida.' },
      { type: 'unlock', ending: 'ending-archive' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'ending-broadcast',
    steps: [
      { type: 'scene', id: 'city-night', transition: 'fade' },
      { type: 'show', character: 'nova', position: 'left', expression: 'happy' },
      { type: 'show', character: 'shun', position: 'right', expression: 'surprised' },
      { type: 'effect', name: 'flash', duration: 500, config: { color: 'rgba(180, 240, 255, 0.9)' }, wait: true },
      { type: 'narrate', text: 'La torre habla en todos los idiomas que conoce la ciudad.' },
      { type: 'say', character: 'nova', text: 'La señal está en todas partes. Esta no pueden ignorarla.' },
      { type: 'say', character: 'shun', text: 'Acabas de emitir toda la verdad. En la noche del festival. Leyenda.' },
      { type: 'unlock', ending: 'ending-broadcast' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'epilogue',
    steps: [
      { type: 'scene', id: 'beach', transition: 'fade', stopMusic: true },
      { type: 'unlock', cg: 'cg-beach', achievement: 'dawn-witness' },
      { type: 'narrate', text: 'Más tarde, el comité escapa a la playa con arena en los zapatos y el festival a la espalda.' },
      { type: 'show', character: 'mio', position: 'left', expression: 'happy' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'happy' },
      { type: 'say', character: 'mio', text: 'Entonces… ¿mismo desastre el año que viene?' },
      { type: 'say', character: 'lucien', text: 'Mismo comité. Mejor reloj.' },
      { type: 'end' },
    ],
  },
]
