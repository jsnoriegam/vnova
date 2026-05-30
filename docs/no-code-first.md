# No-Code First Charter (vnova)

## Vision

vnova debe permitir crear y publicar una novela visual sin escribir logica de programacion.
El camino principal debe ser declarativo: editar script, assets, characters y config.

## Regla central

Si un autor necesita agregar funciones JS para un caso comun, el diseño aun no esta terminado.
La solucion correcta es mover esa complejidad al core y exponerla como config declarativa.

## Niveles de uso

1. Nivel Autor (sin codigo)
- Edita `story/script.js`, `story/assets.js`, `story/characters.js`, `story/config.js`.
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
