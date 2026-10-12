# Plan — Optimizaciones de rendimiento y limpieza

Rama: `perf/engine-optimizations`

Objetivo: reducir trabajo en el hot path de avance, acelerar la pantalla de
guardado, corregir bugs concretos y eliminar código muerto/duplicado, sin
cambiar la API pública ni el flujo no-code.

## Fase A — Hot path del motor (`src/core/engine.js`, `src/core/store.js`)

- **A1.** Sacar `history` de `TRACKED_STATE_KEYS`. Hoy se clona y serializa el
  historial completo en cada avance → coste O(n²). Se registra aparte la
  longitud previa para poder truncarlo al retroceder.
- **A2.** Eliminar el campo `after` del diff (solo se usa `before`) y no
  serializar dos veces lo que ya se clona.
- **A3.** Poner tope al historial (`MAX_HISTORY`, por defecto 500) para acotar
  memoria y tamaño de snapshots/guardados.

## Fase B — Guardado (`src/composables/useVNovaSaves.js`)

- **B1.** Cachear la `CryptoKey` HMAC por `saveKey` + versión + origen. Hoy se
  deriva (`SHA-256` + `importKey`) en cada firma/verificación, y `_refreshAll`
  procesa todos los slots.

## Fase C — Correcciones

- **C1.** `vite-plugin/index.js`: `__filename` no existe en ESM →
  `fileURLToPath(import.meta.url)`.
- **C2.** `src/utils/normalize.js`: quitar optional chaining de
  `import.meta.env.BASE_URL` para no romper el reemplazo estático de Vite.
- **C3.** `useVNovaSaves.js` llama a `store.__vnovaPrepareLoad()` /
  `store.__vnovaSyncRuntime()`, que no existen. Sustituir por
  `engine.syncRuntimeState()`, implementado en `engine.js`, que resincroniza el
  BGM (y el vídeo) tras cargar una partida.
- **C4.** `VNovaTopHud.vue`: quitar `null` del tipo de prop `customClass` y
  reubicar `resolveCustomClasses` después de `props`.

## Fase D — Limpieza / duplicación

- **D1.** Quitar el import sin usar `createBgTransition` en
  `useVNovaEngine.js`.
- **D2.** `package.json`: quitar la dependencia `particles.js` (no se importa;
  la implementación real está en `src/utils/particles.js`).
- **D3.** `useUserStorage.js`: usar `utils/clone.js` y `utils/predicates.js`
  compartidos en vez de duplicarlos.
- **D4.** `.gitignore`: quitar `yarn.lock` (está versionado).
- **D5.** `AGENTS.md`: corregir la referencia inexistente
  `docs/no-code-first.md` → `docs/guide/no-code.md`.

## Fase E — Render de `VNovaRuntime.vue`

- **E1.** Un solo recorrido de los nodos del slot (`scanNodes`) en vez de 4–5
  `containsComponent`, y asignar los flags reactivos solo cuando cambian.

## Fase F — Quests (`src/core/quests.js`)

- **F1.** Evitar `cloneDeep` del mapa completo en cada lectura (`list`/`get`) y
  en cada `setStatus`; usar copia superficial y reconstruir solo la entrada
  afectada.

## Verificación

- `yarn build:lib` debe compilar sin errores.
- Repaso manual de `back()` con historial, carga de partida (BGM) y slots.
