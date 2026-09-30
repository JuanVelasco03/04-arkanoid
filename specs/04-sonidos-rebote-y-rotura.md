# SPEC 04 — Sonidos de rebote y rotura

> **Status:** Borrador
> **Depends on:** SPEC 01
> **Date:** 2026-09-30
> **Objective:** Reproducir `ball-bounce.mp3` cuando la bola rebota en una pared o en la paleta y `break-sound.mp3` cuando se rompe un bloque, mediante un módulo `js/audio.js` con pool de audio y un botón de mute en el HUD persistido en `localStorage`.

## Scope

**In:**

- Nuevo archivo `js/audio.js` (script plano, sin módulos, igual que `assets/spritesheet.js`) cargado desde `index.html` antes de `js/game.js`.
- `js/audio.js` expone: `playSound(name)`, `isMuted()`, `toggleMute()`.
- Cada sonido mantiene un pool de 4 instancias `HTMLAudioElement` precargadas (`preload = 'auto'`). `playSound` usa la primera instancia libre (pausada o terminada); si todas están sonando, reinicia la más antigua del pool.
- Sonido `'bounce'` (`assets/sounds/ball-bounce.mp3`, volumen 0.5): se dispara al rebotar en la pared izquierda, la pared derecha, la pared superior y la paleta.
- Sonido `'break'` (`assets/sounds/break-sound.mp3`, volumen 0.6): se dispara al romper un bloque.
- Al colisionar con un bloque suena **solo** `'break'`, nunca `'bounce'`, aunque físicamente la bola rebote.
- Botón de mute dibujado en el canvas dentro del panel del HUD, en la zona derecha, a la izquierda del grupo "VIDAS": icono de nota musical (`♪`) cuando hay sonido y nota tachada cuando está muteado.
- Hit-test del botón de mute en el handler de `click` del canvas, evaluado **antes** de cualquier otra acción (lanzar la bola, botón "Reintentar"), con retorno temprano para que un clic en el mute no lance la bola.
- Estado de mute persistido en `localStorage` bajo la clave `arkanoid:muted` con valores `'true'` / `'false'`. Se lee al iniciar; si la clave no existe, arranca con sonido.
- Si `localStorage` no está disponible o lanza una excepción (modo privado, permisos), el mute funciona igual en memoria durante la sesión y no se registran errores en consola.
- Las promesas rechazadas de `play()` (bloqueo de autoplay del navegador) se descartan en silencio.

**Out of scope (for future specs):**

- Música de fondo.
- Sonidos para otros eventos: perder una vida, game over, victoria, cambio de nivel. `assets/sounds/` solo contiene los dos mp3 usados en este spec.
- Control de volumen granular (slider) o volúmenes configurables por el jugador.
- Atajo de teclado para mutear.
- Web Audio API, `AudioContext` o efectos de audio (pitch por ángulo de rebote, reverb, etc.).
- Menú de configuración o pantalla de ajustes.

## Data model

```js
// js/audio.js — globales nuevas

const SOUND_SOURCES = {
  bounce: { src: 'assets/sounds/ball-bounce.mp3', volume: 0.5 },
  break:  { src: 'assets/sounds/break-sound.mp3', volume: 0.6 },
};

const SOUND_POOL_SIZE = 4;
const MUTED_STORAGE_KEY = 'arkanoid:muted';

// Pool interno: { bounce: [Audio, Audio, Audio, Audio], break: [...] }
// Índice rotativo por sonido para el fallback cuando todas las instancias suenan.
```

Convenciones:

- `playSound(name)` no hace nada si `isMuted()` es `true`.
- El mute vive en `js/audio.js`, no en el `state` del juego: `js/game.js` solo consulta `isMuted()` para dibujar el icono y llama a `toggleMute()` al hacer clic.
- `toggleMute()` invierte el estado, intenta escribirlo en `localStorage` y pausa todas las instancias que estén sonando al activar el mute.
- Las rutas de los mp3 son relativas al HTML, igual que `assets/spritesheet-breakout.png` en `assets/spritesheet.js`.

```js
// Geometría del botón de mute en el HUD (js/game.js)
const MUTE_BUTTON = { w: 24, h: 24, x: /* a la izquierda del grupo VIDAS */, y: 11 };
```

## Implementation plan

1. Crear `js/audio.js` con `SOUND_SOURCES`, la construcción del pool de 4 instancias por sonido, y `playSound(name)` que elige la primera instancia libre. Agregar su `<script defer>` en `index.html` antes de `js/game.js`. Test manual: recargar y ejecutar `playSound('bounce')` en consola; se escucha el rebote.
2. Agregar `isMuted()` / `toggleMute()` con lectura y escritura de `localStorage` envuelta en `try/catch`, y el corte temprano en `playSound` cuando está muteado. Test manual: `toggleMute()` en consola silencia `playSound('break')`; recargar la página mantiene el estado muteado.
3. En `updateBall()` (`js/game.js`), llamar `playSound('bounce')` en los tres rebotes de pared y en el rebote de la paleta. Test manual: cada rebote de pared y de paleta suena una sola vez.
4. En `checkBlockCollision()`, llamar `playSound('break')` junto con `block.alive = false`, sin disparar `'bounce'` en esa rama. Test manual: romper un bloque suena el sonido de rotura y no el de rebote.
5. Definir `MUTE_BUTTON` y dibujar el icono en `renderHud()` a la izquierda del grupo "VIDAS", con la nota tachada cuando `isMuted()` es `true`. Test manual: el icono refleja el estado actual al recargar.
6. En el handler de `click` del canvas, evaluar primero el hit-test de `MUTE_BUTTON`: si acierta, llamar `toggleMute()` y retornar antes de la lógica de lanzamiento de bola y de "Reintentar". Test manual: clic en el icono alterna el mute sin lanzar la bola pegada a la paleta, y también funciona con el overlay de Game Over visible.

## Acceptance criteria

- [ ] `js/audio.js` existe, se carga desde `index.html` y expone `playSound`, `isMuted` y `toggleMute`.
- [ ] La bola rebotando en la pared izquierda, la pared derecha o la pared superior reproduce `ball-bounce.mp3`.
- [ ] La bola rebotando en la paleta reproduce `ball-bounce.mp3`.
- [ ] Romper un bloque reproduce `break-sound.mp3` y **no** reproduce `ball-bounce.mp3`.
- [ ] Dos rebotes en menos de la duración del mp3 se escuchan solapados, sin que el segundo corte al primero.
- [ ] El HUD muestra un botón de mute en la zona derecha del panel, a la izquierda de los iconos de vidas.
- [ ] Un clic en el botón de mute silencia todos los sonidos y cambia el icono a la nota tachada; otro clic los reactiva.
- [ ] Un clic en el botón de mute con la bola pegada a la paleta no lanza la bola.
- [ ] Un clic en el botón de mute con el overlay de Game Over visible alterna el mute y no dispara el botón "Reintentar".
- [ ] Mutear, recargar la página y volver a jugar mantiene el juego en silencio (`localStorage.getItem('arkanoid:muted') === 'true'`).
- [ ] Con `localStorage` bloqueado (ventana privada con almacenamiento deshabilitado), el juego carga, suena y el mute funciona durante la sesión sin errores en consola.
- [ ] No hay errores ni promesas rechazadas sin capturar en consola durante una partida normal.

## Decisions

- **Sí:** `ball-bounce.mp3` para paredes y paleta, `break-sound.mp3` para bloques. Pedido explícito del usuario: "cuando colisiona con un bloque, suena el bloque, no la pelota".
- **Sí:** pool de 4 `HTMLAudioElement` por sonido. Pedido explícito del usuario. Permite solapar rebotes seguidos sin la complejidad de Web Audio y mantiene la restricción de cero dependencias.
- **No:** un único `Audio` por sonido reiniciado con `currentTime = 0`. Descartado por el usuario: es más simple pero cada rebote corta el anterior.
- **No:** Web Audio API con `AudioBuffer`. Descartado por el usuario: mejor latencia y solapamiento perfecto, pero agrega manejo de `AudioContext` suspendido y código de decodificación para una ganancia poco perceptible en este juego.
- **Sí:** ignorar en silencio el bloqueo de autoplay. Pedido explícito del usuario. El primer clic del juego (el que lanza la bola) ya habilita el audio, así que en la práctica no se percibe.
- **No:** desbloqueo explícito reproduciendo los sonidos a volumen 0 en el primer clic. Descartado por el usuario: innecesario dado que el juego ya requiere un clic para empezar.
- **Sí:** botón de mute en el HUD. Pedido explícito del usuario.
- **No:** tecla `M` para mutear. Descartado por el usuario a favor del botón visible.
- **No:** slider de volumen. Los volúmenes quedan fijos en código (0.5 rebote, 0.6 rotura); un control granular va en otro spec.
- **Sí:** mute persistido en `localStorage` con la clave `arkanoid:muted`. Pedido explícito del usuario. Es la primera persistencia del proyecto y rompe deliberadamente la decisión del SPEC 01 de no usar almacenamiento, limitada a esta única preferencia.
- **Sí:** el hit-test del mute se evalúa antes que el resto del handler de clic, con retorno temprano. Sin esto, un clic en el icono lanzaría la bola o activaría "Reintentar" como efecto colateral.
- **Sí:** el estado de mute vive en `js/audio.js`, no en `state`. Mantiene al módulo de audio autocontenido y evita que `resetGame()` tenga que preservarlo.
- **No:** sonidos para perder una vida, game over, victoria o cambio de nivel. Pedido explícito del usuario: `assets/sounds/` solo tiene dos mp3 y reusarlos para esos eventos sonaría forzado.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Rebotes en esquinas pueden disparar `'bounce'` dos veces en el mismo frame (pared lateral + pared superior), sonando más fuerte. | El pool permite el solapamiento, así que no se corta ni genera error. Si molesta, se acota a un `playSound` por frame en una iteración posterior. |
| `localStorage` lanza excepción en modo privado o con almacenamiento bloqueado. | Lectura y escritura envueltas en `try/catch`; el estado cae a una variable en memoria y el juego sigue funcionando (paso 2). |
| Los mp3 no cargan si el HTML se abre con `file://` y el navegador restringe rutas relativas. | Es la misma condición que ya tiene `assets/spritesheet-breakout.png` en el SPEC 01: servir el directorio con cualquier servidor estático. No se agrega mitigación en código. |

## What is **not** in this spec

- Música de fondo.
- Sonidos para perder una vida, game over, victoria o cambio de nivel.
- Slider o control granular de volumen.
- Atajo de teclado para mutear.
- Web Audio API o efectos de audio.
- Menú de configuración o pantalla de ajustes.

Cada uno de estos, si se implementa, va en su propio spec.
