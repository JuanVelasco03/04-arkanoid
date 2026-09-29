# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Implementado
> **Depends on:** (ninguno)
> **Date:** 2026-09-29
> **Objective:** Construir una versión mínima jugable de Arkanoid de punta a punta: paleta controlable por mouse y teclado, bola con rebote físico clásico, un único nivel de bloques 10x6, sistema de vidas, puntaje básico y overlays de victoria/derrota con reintento.

## Scope

**In:**

- `index.html` en la raíz del repo: canvas de 800x600 px, carga `assets/spritesheet.js` y el/los script(s) del juego.
- Loop de juego (`requestAnimationFrame`) con física de bola y colisiones.
- Paleta controlada simultáneamente por mouse (posición horizontal) y teclado (flechas izquierda/derecha).
- Rebote de la bola estilo clásico: en la paleta, el ángulo de salida depende del punto de impacto (extremos = ángulos más cerrados/agudos respecto al borde); en paredes y bloques, reflexión simple (se invierte la componente de velocidad correspondiente).
- Un único nivel: grilla de bloques de 10 columnas x 6 filas (60 bloques), con colores asignados bloque a bloque (mezclados), usando los 7 colores disponibles en `SPRITES.blocks`.
- Bloques de un solo golpe: al romperse suman 10 puntos.
- 3 vidas. Si la bola cae debajo de la paleta, se resta una vida y se reinicia la posición de bola y paleta.
- HUD simple en el canvas mostrando puntaje y vidas actuales.
- Puntaje visible durante la partida, sin persistencia (se pierde al recargar el navegador).
- Overlay de "Game Over" cuando las vidas llegan a 0, y overlay de "¡Ganaste!" cuando se rompen los 60 bloques. Ambos overlays incluyen un botón "Reintentar" que reinicia el estado del juego sin recargar la página.

**Out of scope (for future specs):**

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`).
- Múltiples niveles o progresión entre niveles.
- Power-ups.
- Bloques con más de un golpe de resistencia o bloques indestructibles.
- Persistencia de puntaje / high scores (localStorage u otro medio).
- Pausa del juego.
- Versión responsive o adaptada a mobile.
- Menú de configuración o ajuste de dificultad.

## Data model

```js
// Estado global del juego
const state = {
  status: 'playing', // 'playing' | 'gameover' | 'win'
  lives: 3,
  score: 0,
  paddle: { x: 360, y: 570, w: 100, h: 14 },
  ball: { x: 400, y: 300, vx: 4, vy: -4, r: 8 },
  blocks: [ /* 60 objetos: { col, row, x, y, w, h, color, alive } */ ],
};
```

Convenciones:

- Origen de coordenadas: esquina superior izquierda del canvas (800x600 px).
- Velocidades en píxeles/frame.
- La grilla de bloques tiene 10 columnas x 6 filas. El color de cada bloque se asigna individualmente (no por fila completa), recorriendo los 7 colores de `SPRITES.blocks` en un patrón mezclado.
- `status` determina qué overlay se dibuja (`'gameover'` o `'win'`) y si el loop de física sigue actualizando posiciones.

## Implementation plan

1. Crear `index.html` en la raíz: canvas de 800x600, carga `assets/spritesheet.js` y un nuevo `js/game.js` (defer). Test manual: abrir el archivo, ver el canvas vacío sin errores en consola.
2. En `js/game.js`, llamar a `loadSpritesheet` y, al terminar de cargar, dibujar la paleta y la bola en sus posiciones iniciales usando `drawSprite`. Test manual: recargar y ver paleta + bola dibujadas.
3. Implementar movimiento de la paleta: `mousemove` sobre el canvas y teclas `ArrowLeft`/`ArrowRight`, con el movimiento acotado a los límites del canvas. Test manual: mover el mouse y usar las flechas, la paleta responde a ambos.
4. Implementar el loop de movimiento de la bola con reflexión en paredes (izquierda, derecha, arriba) y colisión con la paleta calculando el ángulo de salida según el punto de impacto. Si la bola cae debajo de la paleta, restar una vida y reiniciar posiciones. Test manual: la bola rebota de forma predecible; golpear los extremos de la paleta produce ángulos más cerrados que golpear el centro.
5. Generar la grilla de 60 bloques (10x6) con color por bloque y renderizarlos con `drawSprite`. Test manual: se ven los 60 bloques con colores mezclados al cargar.
6. Implementar colisión bola-bloque: al impactar, marcar el bloque como no vivo, sumar 10 puntos. Test manual: romper bloques suma puntos.
7. Dibujar el HUD (puntaje y vidas) en el canvas sobre el juego. Test manual: los valores se actualizan en tiempo real al jugar.
8. Implementar el cambio de `status` a `'gameover'` (vidas en 0) o `'win'` (0 bloques vivos), pausar el loop de física y mostrar el overlay correspondiente con botón "Reintentar" que reinicializa `state` y reanuda el juego. Test manual: perder las 3 vidas muestra "Game Over"; romper todos los bloques muestra "¡Ganaste!"; en ambos casos "Reintentar" reinicia la partida sin recargar la página.

## Acceptance criteria

- [x] Abrir `index.html` carga el canvas de 800x600 sin errores en consola.
- [x] La paleta se mueve tanto con el mouse como con las flechas del teclado.
- [x] La bola rebota en paredes y paleta con ángulo dependiente del punto de impacto (extremos de la paleta producen ángulos más cerrados).
- [x] Se ven 60 bloques (10 columnas x 6 filas) con colores mezclados por bloque, no organizados en filas de un solo color.
- [x] Perder la bola resta una vida y reinicia la posición de bola y paleta.
- [x] Al llegar a 0 vidas aparece un overlay de "Game Over" con botón "Reintentar".
- [x] Al romper los 60 bloques aparece un overlay de "¡Ganaste!" con botón "Reintentar".
- [x] El botón "Reintentar" reinicia el juego completo (vidas, puntaje, bola, paleta, bloques) sin recargar la página.
- [x] El puntaje se pierde al recargar el navegador (no se usa localStorage).

## Decisions

- **Sí:** control simultáneo de mouse y teclado para la paleta. Pedido explícito del usuario.
- **Sí:** física de rebote estilo clásico (ángulo de salida según punto de impacto en la paleta). Pedido explícito del usuario.
- **Sí:** bloques de un solo golpe con puntaje uniforme (10 pts). Simplifica el MVP y evita definir una tabla de resistencia/puntaje por color.
- **Sí:** colores asignados por bloque individual, no por fila completa. Pedido explícito del usuario para evitar franjas de un solo color.
- **Sí:** overlay simple sobre el mismo canvas para victoria/derrota, en vez de pantallas o rutas separadas. Es más simple de implementar y suficiente para un MVP.
- **No:** sonidos (`ball-bounce.mp3`, `break-sound.mp3`). Decisión explícita del usuario de no implementarlos en este MVP; queda para un spec futuro.
- **No:** persistencia de puntaje (localStorage). Decisión explícita del usuario de no guardarlo por ahora.
- **No:** múltiples niveles. Un único nivel fijo de 10x6 es suficiente para un MVP jugable de punta a punta.
- **No:** bloques con más de un golpe de resistencia o indestructibles. Fuera de alcance del MVP.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un ángulo de rebote muy agudo en los extremos de la paleta puede generar trayectorias casi horizontales indeseadas. | Al implementar el paso 4, acotar (clamp) el ángulo resultante a un máximo razonable respecto a la vertical. |

## What is **not** in this spec

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`).
- Múltiples niveles o progresión entre niveles.
- Power-ups.
- Bloques con resistencia mayor a un golpe o indestructibles.
- Persistencia de puntaje / high scores.
- Pausa del juego.
- Versión responsive o mobile.
- Menú de configuración o dificultad ajustable.

Cada uno de estos, si se implementa, va en su propio spec.
