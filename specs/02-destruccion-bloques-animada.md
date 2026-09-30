# SPEC 02 — Destrucción de bloques con animación

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-09-30
> **Objective:** Al romperse un bloque, mostrar una animación de explosión de 4 frames (usando `EXPLOSION_FRAMES` del color del bloque) en su posición, en vez de que el bloque simplemente desaparezca.

## Scope

**In:**

- Al detectar la colisión bola-bloque en `checkBlockCollision` (`js/game.js`), además de marcar `block.alive = false` y sumar puntaje (comportamiento ya existente de SPEC 01, sin cambios), registrar una explosión activa en `state.explosions` con la posición, tamaño, color y timestamp de inicio del bloque destruido.
- Animar cada explosión avanzando por los 4 frames de `EXPLOSION_FRAMES[color]` repartidos en partes iguales dentro de `EXPLOSION_DURATION` (150ms), medido con el timestamp real que entrega `requestAnimationFrame` (no conteo de frames de render).
- Dibujar las explosiones activas con `drawFrame` en `render()`, después de dibujar los bloques vivos.
- Eliminar cada explosión de `state.explosions` en cuanto termina su cuarto frame.
- Soporte para múltiples explosiones simultáneas e independientes (cada una con su propio color, posición y progreso), ya que la duración (150ms) puede abarcar varios frames de render y el jugador puede romper más de un bloque en sucesión rápida.
- El bloque deja de existir físicamente (ya no bloquea la bola ni se puede volver a golpear) de forma inmediata al impactarlo, igual que hoy; la animación es puramente visual y no afecta la física.

**Out of scope (for future specs):**

- Sonido de rotura (`break-sound.mp3`). Se mantiene fuera de alcance, tal como ya lo definía SPEC 01.
- Cualquier otro efecto visual (partículas propias, shake de cámara, etc.) fuera de los frames ya provistos por el spritesheet.
- Colisión sólida o bloqueo físico del bloque durante la animación.

## Data model

```js
// Se agrega al estado global existente (SPEC 01):
state.explosions = [
  // { x, y, w, h, color, startTime }
];
```

Convenciones:

- `x, y, w, h`: mismos valores que tenía el bloque destruido (posición y tamaño), para dibujar la explosión en el mismo lugar.
- `color`: el `block.color` del bloque roto, usado para indexar `EXPLOSION_FRAMES[color]`.
- `startTime`: timestamp (el que entrega `requestAnimationFrame` a `update`/`loop`) en el momento en que el bloque fue destruido.
- El frame a dibujar en cada instante se calcula como `Math.floor((timestampActual - startTime) / (EXPLOSION_DURATION / 4))`. Cuando ese índice llega a 4, la explosión se remueve de `state.explosions`.

## Implementation plan

1. En `checkBlockCollision` (`js/game.js`), cuando se marca `block.alive = false`, agregar a `state.explosions` una entrada `{ x: block.x, y: block.y, w: block.w, h: block.h, color: block.color, startTime }`, usando el timestamp recibido por `update`. Test manual: sin cambios visibles todavía; en devtools, `state.explosions` gana una entrada cada vez que se rompe un bloque.
2. Modificar `loop(timestamp)` para recibir el timestamp de `requestAnimationFrame` y pasarlo a `update(timestamp)`. Dentro de `update`, recorrer `state.explosions` y quitar (filter) las que ya completaron sus 4 frames (`(timestamp - startTime) >= EXPLOSION_DURATION`). Test manual: sin errores en consola; `state.explosions` se vacía sola ~150ms después de cada rotura.
3. En `render()`, después de dibujar los bloques vivos, recorrer `state.explosions` y dibujar con `drawFrame` el frame correspondiente de `EXPLOSION_FRAMES[color]` según `Math.floor((timestamp - startTime) / (EXPLOSION_DURATION / 4))` (pasando el mismo timestamp de `loop` a `render`). Test manual: al romper un bloque se ve la animación de explosión de 4 frames en su lugar, con el color del bloque, y desaparece sola.

## Acceptance criteria

- [ ] Al romper un bloque, aparece una animación de explosión de 4 frames en la posición exacta del bloque destruido.
- [ ] La explosión usa los frames de `EXPLOSION_FRAMES` correspondientes al color del bloque roto (un bloque rojo explota con los frames de `red`, uno cian con los de `cyan`, etc.).
- [ ] La animación dura `EXPLOSION_DURATION` (150ms) en total y luego desaparece por completo, sin dejar ningún frame residual dibujado.
- [ ] El bloque deja de bloquear la bola y el puntaje se suma de forma inmediata al golpearlo, sin esperar a que la animación termine.
- [ ] Romper varios bloques en sucesión rápida (por ejemplo, dos bloques en menos de 150ms) muestra varias explosiones animándose en paralelo, cada una en su propia posición y con su propio color, sin que se pisen o interfieran entre sí.
- [ ] El juego no muestra errores en consola durante una partida normal con explosiones activas.

## Decisions

- **Sí:** destrucción lógica inmediata del bloque (ya existente desde SPEC 01); la animación de explosión es puramente visual y no bloquea ni retrasa la física. Pedido explícito del usuario.
- **Sí:** el color de la explosión es el color del bloque roto (`EXPLOSION_FRAMES[block.color]`), en vez de un color fijo. Pedido explícito del usuario.
- **Sí:** el avance de los 4 frames se mide con el timestamp real de `requestAnimationFrame` (tiempo transcurrido), no contando frames de render, para que la duración de 150ms sea consistente sin importar el framerate del navegador. Pedido explícito del usuario.
- **Sí:** soporte para múltiples explosiones simultáneas e independientes mediante un arreglo `state.explosions`. Pedido explícito del usuario ("si las explosiones sucedieran en paralelo").
- **No:** sonido de rotura (`break-sound.mp3`). Decisión explícita del usuario de mantenerlo fuera de alcance; ya estaba fuera de alcance en SPEC 01.
- **No:** colisión sólida durante la animación (el bloque no vuelve a bloquear la bola mientras explota). Se prioriza el comportamiento clásico de Arkanoid/Breakout, donde el bloque se destruye al primer impacto.

## What is **not** in this spec

- Sonido de rotura (`break-sound.mp3`).
- Efectos visuales adicionales fuera de los frames del spritesheet (partículas propias, shake de cámara, etc.).
- Colisión sólida o bloqueo físico del bloque durante la animación de explosión.

Cada uno de estos, si se implementa, va en su propio spec.
