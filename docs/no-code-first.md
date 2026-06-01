# No-Code First Charter (vnova)

## Vision

vnova debe permitir crear y publicar una novela visual sin escribir logica de programacion.
El camino principal debe ser declarativo: editar script, assets, characters, credits y config.

## Regla central

Si un autor necesita agregar funciones JS para un caso comun, el diseño aun no esta terminado.
La solucion correcta es mover esa complejidad al core y exponerla como config declarativa.

## Niveles de uso

1. Nivel Autor (sin codigo)
- Edita `story/script.js`, `story/assets.js`, `story/characters.js`, `story/credits.js`, `story/config.js`.
- Usa componentes oficiales por defecto.
- No necesita modificar App ni runtime interno.

2. Nivel Integrador (bajo codigo)
- Cambia tema visual, estilos y composicion de componentes oficiales.
- Puede ajustar opciones del runtime por config.

3. Nivel Avanzado (con codigo)
- Reemplaza handlers (`onAudio`, `onNotify`, `onVideo`) o componentes.
- Extiende comportamiento del motor con hooks.
- Esta capa es opcional, nunca requisito para escenarios comunes.

## Politica de API

- Default-first: toda feature nueva debe tener un default util.
- Override-friendly: el default se puede reemplazar sin forkear core.
- Declarative over imperative: priorizar campos en script/config sobre callbacks.
- Progressive disclosure: el camino simple aparece primero en docs.

## Definition of Done (DoD)

Una feature se considera terminada solo si cumple todo:

- Se puede activar con config/script, sin funciones custom.
- Tiene valor por defecto razonable.
- Mantiene compatibilidad con overrides avanzados.
- Incluye ejemplo minimo en docs-example.
- README documenta primero la forma no-code.

## Checklist para PR

- [ ] El flujo basico funciona sin editar App ni crear hooks.
- [ ] No obliga a escribir funciones JS para un caso comun.
- [ ] El default es util para un autor no tecnico.
- [ ] Existe escape hatch para integradores avanzados.
- [ ] README y demo reflejan primero la ruta no-code.

## Heuristica de decision

Antes de mergear una feature, responder:

- "Un autor puede usar esto solo tocando config y contenido?"
- "Si no, que parte se puede absorber en core?"
- "El override sigue siendo opcional y no obligatorio?"

Si alguna respuesta es "no", la feature vuelve a diseño.

## Modales Declarativos

Los autores pueden abrir un modal personalizado desde el script con un paso declarativo:

```javascript
{
  type: 'modal',
  id: 'modal-id',
  title: 'Titulo opcional',
  prompt: 'Texto opcional',
}
```

### Caracteristicas

- **Sintaxis simple**: `{ type: 'modal', id: 'some-component' }`
- **Componente base**: Usa `VNovaBaseModal` como estructura visual
- **Overlay oscuro**: Fondo semitransparente que bloquea interacciones
- **Header con titulo y boton cerrar**: Estilo consistente con otros modales
- **Body scrollable**: Contenido con altura limitada y scroll interno
- **Animacion de entrada**: Slide-up suave al abrir

### Modal con opciones (pines como choices)

El paso `modal` puede incluir `options`, igual que `choice`. Esto permite que un componente custom renderice cada opcion como un pin de mapa:

```javascript
{
  type: 'modal',
  id: 'city-map-route',
  title: 'Tactical Infiltration Map',
  prompt: 'Select your insertion route by choosing one of the active pins.',
  options: [
    {
      label: 'Canal district route',
      jump: 'route-steady',
      set: { approach: 'steady' },
      inc: { trust: 2, risk: -1 },
      pin: { x: 22, y: 70, caption: 'Canals' },
    },
    {
      label: 'Relay core sprint',
      jump: 'route-risky',
      set: { approach: 'risky' },
      inc: { trust: -1, risk: 3 },
      pin: { x: 68, y: 38, caption: 'Core Relay' },
    },
  ],
}
```

### Uso en Showcase

En el showcase ya existe un ejemplo completo:

- Paso `modal` en `docs-example/src/story/script.js`
- Componente de mapa con pines en `docs-example/src/components/MapChoiceModal.vue`
- Registro del modal en `docs-example/src/App.vue`

El componente custom toma el estado del runtime y llama `runtime.actions.choose(option)`, por lo que mantiene la semantica nativa de `choice` (`set`, `inc`, `jump`) sin logica duplicada.

## Inputs, Selects e Interpolacion

El motor soporta pasos declarativos para capturar datos del jugador y guardarlos en `vars`, incluyendo rutas anidadas como `player.name`.

### Input

```javascript
{
  type: 'input',
  store: 'player.name',
  prompt: 'Ingresa tu nombre:',
  placeholder: 'Codename',
  default: 'Astra',
  submitLabel: 'Continuar',
}
```

### Select

```javascript
{
  type: 'select',
  store: 'player.style',
  prompt: 'Elige un estilo:',
  options: [
    { label: 'Diplomatico', value: 'diplomatic' },
    { label: 'Tactico', value: 'tactical' },
  ],
}
```

### Interpolar datos del store en textos

Usa placeholders con `{{ruta.del.store}}` en textos de `say`, `think`, `narrate`, `choice`, `select`, `modal` y `notify`.

```javascript
{ type: 'narrate', text: 'Bienvenido, {{player.name}}.' }
{ type: 'notify', title: 'Perfil', text: 'Modo: {{player.style}}' }
```

### Uso en template (modo declarativo)

Tambien puedes declarar un modal directamente en el slot de `VNovaRuntime`:

```vue
<!-- En docs-example/src/App.vue o similar -->
<VNovaRuntime :script="script" ...>
  <modal id="mi-modal" type="modal">
    <div>
      <h2>Modal Personalizado</h2>
      <p>Este es un modal creado por el autor</p>
    </div>
  </modal>
</VNovaRuntime>
```
