# SPEC 03 — Niveles progresivos

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-09-30
> **Objective:** Reemplazar el único nivel fijo por 5 niveles definidos como mapas de texto en `js/levels.js`, con velocidad de bola creciente, overlay de "¡Nivel completado!" entre niveles y el nivel actual visible en el HUD.

## Scope

**In:**

- Nuevo archivo `js/levels.js` (script plano, sin módulos, igual que `assets/spritesheet.js`) que expone dos globales: `BLOCK_CHARS` (mapa carácter → color) y `LEVELS` (array de 5 niveles).
- Cada nivel es un array de strings. Cada string es una fila, cada carácter una celda de la grilla. `'.'` significa celda vacía (sin bloque).
- Se mantiene la geometría del SPEC 01 sin cambios: 10 columnas, `BLOCK_W = 76`, `BLOCK_H = 24`, `BLOCK_GAP = 4`, `BLOCK_OFFSET_TOP = 50`. Cada fila del mapa tiene exactamente 10 caracteres y cada nivel tiene como máximo 6 filas.
- `index.html` carga `js/levels.js` antes de `js/game.js`.
- `createBlocks()` pasa a recibir el índice de nivel y construir los bloques parseando el mapa correspondiente, en vez de generar siempre la grilla 10x6 con color por fila.
- Nuevo campo `state.level` (1 a 5) y nuevo campo `state.ballSpeed`.
- Dificultad progresiva: la velocidad de la bola del nivel N es `BALL_LAUNCH_SPEED * 1.1^(N-1)` por eje. El nivel 1 conserva exactamente la velocidad actual (2.5 px/frame por eje).
- Nuevo valor `'levelclear'` en `state.status`. Al romper el último bloque vivo de un nivel que no es el 5: la física se detiene y se muestra un overlay "¡Nivel completado!" con el número del nivel siguiente y el texto "Clic para continuar".
- Un clic en cualquier parte del canvas durante `'levelclear'` carga el nivel siguiente, conservando vidas y puntaje, con la bola pegada a la paleta esperando el clic de lanzamiento.
- Al romper el último bloque del nivel 5, `state.status` pasa a `'win'` y se muestra el overlay "¡Ganaste!" existente.
- HUD: se agrega al centro del panel superior la etiqueta "NIVEL" y el número de nivel actual, con el mismo estilo tipográfico que "PUNTAJE" y "VIDAS".
- El botón "Reintentar" (game over y victoria) reinicia la partida completa: nivel 1, puntaje 0, 3 vidas.

**Out of scope (for future specs):**

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`). Van en SPEC 04.
- Editor visual de niveles o carga de niveles desde un archivo JSON externo.
- Grillas con distinto número de columnas o tamaño de bloque recalculado por nivel.
- Bloques con más de un golpe de resistencia o indestructibles.
- Puntaje distinto por color o por nivel: se mantienen 10 puntos por bloque.
- Bonus de puntaje por completar un nivel o por vidas restantes.
- Persistencia de nivel alcanzado o high scores.
- Transición animada entre niveles (fade, slide). El cambio de nivel es un overlay estático.

## Data model

```js
// js/levels.js — globales nuevas

const BLOCK_CHARS = {
  g: 'gray',
  r: 'red',
  y: 'yellow',
  c: 'cyan',
  m: 'magenta',
  h: 'hotpink',
  v: 'green',
  // '.' no está en el mapa: significa celda vacía
};

const LEVELS = [
  // Nivel 1 — 4 filas completas (40 bloques)
  [
    'rrrrrrrrrr',
    'yyyyyyyyyy',
    'cccccccccc',
    'mmmmmmmmmm',
  ],
  // Nivel 2 — pirámide (30 bloques)
  [
    'vvvvvvvvvv',
    '.hhhhhhhh.',
    '..mmmmmm..',
    '...cccc...',
    '....yy....',
  ],
  // Nivel 3 — damero (25 bloques)
  [
    'r.r.r.r.r.',
    '.y.y.y.y.y',
    'c.c.c.c.c.',
    '.m.m.m.m.m',
    'h.h.h.h.h.',
  ],
  // Nivel 4 — dos torres (40 bloques)
  [
    'rrr....rrr',
    'yyy....yyy',
    'ccc....ccc',
    'mmm....mmm',
    'hhh....hhh',
    'vvvvvvvvvv',
  ],
  // Nivel 5 — grilla completa (60 bloques)
  [
    'gggggggggg',
    'rrrrrrrrrr',
    'yyyyyyyyyy',
    'cccccccccc',
    'mmmmmmmmmm',
    'hhhhhhhhhh',
  ],
];
```

```js
// Se agrega al estado global existente (SPEC 01):
state.level = 1;        // 1..LEVELS.length
state.ballSpeed = 2.5;  // px/frame por eje del nivel actual

// state.status suma un valor:
// 'playing' | 'levelclear' | 'gameover' | 'win'
```

Convenciones:

- `state.level` es 1-based para mostrarlo tal cual en el HUD; el acceso al array usa `LEVELS[state.level - 1]`.
- `state.ballSpeed` se recalcula al cargar un nivel: `BALL_LAUNCH_SPEED * Math.pow(LEVEL_SPEED_FACTOR, state.level - 1)` con `LEVEL_SPEED_FACTOR = 1.1`.
- `BALL_SPEED` del SPEC 01 (la magnitud usada en el rebote de la paleta) deja de ser una constante de módulo y se calcula como `Math.hypot(state.ballSpeed, state.ballSpeed)` cada vez que se necesita.
- El parseo del mapa ignora los caracteres `'.'`; cualquier otro carácter se busca en `BLOCK_CHARS`. Si no existe, no se crea bloque.
- La posición de cada bloque sigue la fórmula del SPEC 01: `x = BLOCK_OFFSET_X + col * (BLOCK_W + BLOCK_GAP)`, `y = BLOCK_OFFSET_TOP + row * (BLOCK_H + BLOCK_GAP)`.
- `'levelclear'` se comporta como `'gameover'`/`'win'` respecto a la física: `update()` retorna temprano y no mueve la bola.

## Implementation plan

1. Crear `js/levels.js` con `BLOCK_CHARS` y los 5 mapas de `LEVELS`, y agregar su `<script defer>` en `index.html` antes de `js/game.js`. Test manual: recargar, sin errores en consola, y en devtools `LEVELS.length === 5`.
2. En `js/game.js`, reemplazar `createBlocks()` por `createBlocks(levelIndex)` que parsea `LEVELS[levelIndex]` usando `BLOCK_CHARS`. Agregar `state.level = 1` y llamar `createBlocks(0)` en la inicialización. Test manual: al cargar se ve el layout de 4 filas del nivel 1 (40 bloques), no la grilla de 60.
3. Agregar `LEVEL_SPEED_FACTOR = 1.1` y `state.ballSpeed`, con una función `applyLevelSpeed()` que lo recalcula según `state.level`. Reemplazar los usos de `BALL_LAUNCH_SPEED` en `resetBallAndPaddle()` y `launchBall()`, y el `BALL_SPEED` del rebote de paleta, por valores derivados de `state.ballSpeed`. Test manual: fijar `state.level = 5; applyLevelSpeed()` en consola y confirmar que la bola se mueve notablemente más rápido.
4. Agregar una función `loadLevel(level)` que setea `state.level`, regenera los bloques, vacía `state.explosions`, aplica la velocidad del nivel y llama a `resetBallAndPaddle()`. Test manual: `loadLevel(3)` en consola carga el damero con la bola pegada a la paleta.
5. En `updateBall()`, cambiar la condición de victoria: si no quedan bloques vivos y `state.level < LEVELS.length`, `state.status = 'levelclear'`; si es el último nivel, `state.status = 'win'`. Test manual: en consola marcar todos los bloques como `alive = false` y verificar que la física se detiene sin mostrar todavía overlay.
6. Dibujar el overlay de `'levelclear'` en `render()`: título "¡Nivel completado!", subtítulo con el nivel siguiente y el texto "Clic para continuar" (sin botón). Test manual: se ve el overlay al limpiar un nivel.
7. Extender el click handler del canvas: si `state.status === 'levelclear'`, llamar `loadLevel(state.level + 1)` y volver a `'playing'`. Test manual: limpiar el nivel 1, hacer clic y aparecer en el nivel 2 conservando puntaje y vidas.
8. En `renderHud()`, dibujar al centro del panel la etiqueta "NIVEL" y el número de nivel. Test manual: el número cambia al pasar de nivel.
9. En `resetGame()`, volver al nivel 1 con puntaje 0 y 3 vidas usando `loadLevel(1)`. Test manual: perder las 3 vidas en el nivel 2 y verificar que "Reintentar" arranca en el nivel 1 con puntaje `0000`.

## Acceptance criteria

- [ ] `js/levels.js` existe, se carga desde `index.html` y expone `BLOCK_CHARS` y `LEVELS` con exactamente 5 niveles.
- [ ] Cada nivel de `LEVELS` tiene filas de exactamente 10 caracteres y como máximo 6 filas.
- [ ] Al cargar el juego se ve el layout del nivel 1 (4 filas completas, 40 bloques), no la grilla de 60 bloques del SPEC 01.
- [ ] Los caracteres `'.'` del mapa no generan bloque: en los niveles 2, 3 y 4 se ven huecos visibles en la grilla.
- [ ] Cada carácter del mapa se dibuja con el color correcto de `SPRITES.blocks` según `BLOCK_CHARS` (`r` rojo, `c` cian, `v` verde, etc.).
- [ ] Romper todos los bloques de un nivel que no es el 5 muestra el overlay "¡Nivel completado!" con el número del nivel siguiente, y la bola deja de moverse.
- [ ] Un clic durante el overlay de nivel completado carga el nivel siguiente con la bola pegada a la paleta, conservando el puntaje y las vidas que tenía el jugador.
- [ ] Romper todos los bloques del nivel 5 muestra el overlay "¡Ganaste!" con botón "Reintentar".
- [ ] La bola es medible y perceptiblemente más rápida en cada nivel: `state.ballSpeed` del nivel 1 es 2.5 y el del nivel 5 es 2.5 × 1.1⁴ ≈ 3.66.
- [ ] El HUD muestra al centro la etiqueta "NIVEL" y el número de nivel actual, y el número se actualiza al avanzar de nivel.
- [ ] Perder las 3 vidas en cualquier nivel muestra "Game Over"; el botón "Reintentar" reinicia en el nivel 1 con puntaje 0 y 3 vidas.
- [ ] Las explosiones del SPEC 02 siguen funcionando en todos los niveles y no queda ninguna dibujada al cambiar de nivel.
- [ ] No hay errores en consola durante una partida completa del nivel 1 al 5.

## Decisions

- **Sí:** niveles definidos como mapas de texto en `js/levels.js`. Pedido explícito del usuario. Son legibles de un vistazo y agregar un nivel no requiere tocar la lógica del juego.
- **Sí:** 5 niveles. Pedido explícito del usuario.
- **Sí:** letras iniciales de cada color como caracteres del mapa, con `v` para `green` (para no chocar con `g` de `gray`) y `h` para `hotpink`. Pedido explícito del usuario; más legible que dígitos al diseñar un nivel.
- **Sí:** velocidad de bola +10% por nivel (`1.1^(nivel-1)`). Pedido explícito del usuario. Da progresión perceptible sin obligar a afinar cinco valores a mano.
- **No:** velocidad configurable por nivel en `LEVELS`. Descartada por el usuario: más control pero más trabajo de ajuste manual.
- **Sí:** overlay "¡Nivel completado!" con clic para continuar, en vez de transición automática. Pedido explícito del usuario. El jugador controla cuándo arranca el nivel siguiente.
- **Sí:** `'levelclear'` como nuevo valor de `state.status`, reusando el mecanismo de pausa de física que ya usan `'gameover'` y `'win'`. Es consistente con el SPEC 01 y no agrega un flag paralelo.
- **Sí:** "Reintentar" vuelve al nivel 1 con puntaje 0. Pedido explícito del usuario. Reintentar el mismo nivel conservando puntaje permitiría acumular puntaje de forma indefinida.
- **Sí:** geometría fija de 10 columnas y bloques de 76x24, reusando las constantes del SPEC 01. Pedido explícito del usuario. La variedad entre niveles viene de huecos y formas, no de cambiar el tamaño de los bloques.
- **No:** grilla de tamaño libre con bloques recalculados por nivel. Descartada por el usuario: más flexible pero agrega código de layout sin beneficio claro para 5 niveles.
- **Sí:** nivel visible al centro del HUD. Pedido explícito del usuario; el centro del panel superior está vacío hoy.
- **No:** puntaje diferenciado por color o bonus por nivel completado. Se mantienen los 10 puntos por bloque del SPEC 01 para no abrir una tabla de puntaje en este spec.
- **No:** persistencia del nivel alcanzado. Sigue la decisión del SPEC 01 de no usar almacenamiento.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un mapa con una fila de menos o más de 10 caracteres desalinea la grilla silenciosamente. | El parseo recorre solo los caracteres presentes en cada string, así que una fila corta genera menos bloques sin romper el render. Los 5 mapas del spec ya tienen 10 caracteres verificados. |
| La velocidad del nivel 5 (~3.66 px/frame por eje) puede hacer que la bola atraviese un bloque entre frames (tunneling). | El paso 3 no cambia la detección de colisión, que es por solapamiento AABB con bloques de 24 px de alto: un desplazamiento de ~5 px por frame sigue siendo muy inferior a la altura del bloque. Si aparece tunneling, se acota `LEVEL_SPEED_FACTOR`. |
| Quedan explosiones del SPEC 02 dibujándose al cambiar de nivel, apareciendo sobre el layout nuevo. | `loadLevel()` vacía `state.explosions` (paso 4). |

## What is **not** in this spec

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`): van en SPEC 04.
- Editor de niveles o carga desde JSON externo.
- Grillas de distinto tamaño o bloques redimensionados por nivel.
- Bloques con más de un golpe de resistencia o indestructibles.
- Puntaje por color, bonus por nivel o por vidas restantes.
- Persistencia de nivel alcanzado o high scores.
- Transición animada entre niveles.

Cada uno de estos, si se implementa, va en su propio spec.
