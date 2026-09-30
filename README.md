# Juego de Arkanoid

Un Arkanoid/Breakout hecho con HTML, CSS y JavaScript, con **cero dependencias**: sin framework, sin bundler, sin paso de compilación.

## Cómo jugar

Sirve la carpeta con cualquier servidor estático y abre `index.html`:

```bash
python -m http.server 8000
```

También puedes abrir `index.html` directamente en el navegador.

### Controles

| Acción | Cómo |
|---|---|
| Mover la paleta | Mouse, o flechas ← → |
| Lanzar la bola | Clic sobre el canvas |
| Pausar / reanudar | Botón de pausa en el header, `Esc` o `P` |
| Silenciar | Botón de sonido en el header (se recuerda entre sesiones) |
| Cambiar de nivel | Clic en cualquier nivel del panel derecho |

## Qué incluye

- Física clásica de rebote: el ángulo de salida depende de dónde golpees la paleta.
- 5 niveles con distintas formaciones de bloques y velocidad creciente.
- Animación de explosión al romper cada bloque.
- Efectos de sonido para rebotes y roturas, con mute persistente.
- Vidas, puntaje y selector de nivel, donde la miniatura del nivel activo se va vaciando conforme rompes bloques.

## Estructura

```
index.html          Layout, estilos y HUD
js/game.js          Estado, bucle de juego y capa de interfaz
js/levels.js        Los 5 niveles como mapas de texto
js/audio.js         Reproducción de sonidos y mute
assets/             Spritesheet y sonidos
specs/              Especificaciones de cada feature
```

Todos los scripts son clásicos (sin módulos) y se comunican por variables globales, así que **el orden de las etiquetas `<script>` en `index.html` importa**.

## Desarrollo

El proyecto sigue un flujo *spec-driven*: cada feature se diseña primero como una especificación en `specs/`, se aprueba y recién entonces se implementa. Ver [`CLAUDE.md`](CLAUDE.md) para el detalle del flujo y de la arquitectura.
