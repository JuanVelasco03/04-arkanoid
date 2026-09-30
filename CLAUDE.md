# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responde siempre en español en este proyecto. Los specs, los mensajes de commit y los comentarios en el código también van en español.

## Project status

An **Arkanoid/Breakout game** in plain HTML, CSS and JavaScript — **zero dependencies**. No build tool, package manager, test runner or linter, and none should be introduced unless the user asks: the "zero dependencies" constraint is deliberate.

The game is playable. SPEC 01–04 are implemented and merged into `main`: paddle + ball physics, 5 levels with progressive speed, block-break explosion animation, sound effects with mute, lives/score HUD, level selector and pause.

## Development workflow: spec-driven

**Before starting any non-trivial feature, check `specs/` and prefer `/spec` → approve → `/spec-impl` over implementing ad hoc.** Small fixes and UI polish on already-specced behavior don't need a spec; new mechanics or systems do. When in doubt, ask the user which path they want — they have chosen to skip the spec flow before, and that is theirs to decide, not yours to assume.

Two custom slash commands drive this (defined in `.claude/skills/` and `.agents/skills/`, vendored from `Klerith/fernando-skills` and pinned in `skills-lock.json`):

- **`/spec <description>`** — designs a spec through guided clarifying questions, then writes `specs/NN-slug.md`. Never writes code. New specs start as `Borrador`.
- **`/spec-impl <NN-spec-name>`** — implements a spec. Runs in four strict phases: locate the spec → validate its state → create/switch to the branch → implement step by step, pausing after each step for review. **Never commits automatically.**

### Spec lifecycle

`Borrador` → (user reviews and approves) → `Aprobado` → `/spec-impl` → `Implementado`

`/spec-impl` **refuses to run unless the state means Approved** (it accepts `Aprobado`, `Approved`, and equivalents in other languages). It stops on `Borrador`, `Implementado`, or anything unrecognized. Only the user promotes `Borrador` → `Aprobado`; do not flip that yourself. Once all acceptance criteria pass, `/spec-impl` sets the state to `Implementado` and ticks the criteria off.

### Spec file format

Named `specs/NN-slug.md` (`NN` zero-padded, sequential). Every spec opens with this header block:

```markdown
# SPEC NN — Título corto y descriptivo

> **Status:** Borrador
> **Depends on:** SPEC 01
> **Date:** YYYY-MM-DD
> **Objective:** Una sola frase. Si necesitas dos, la feature es muy grande.
```

Then these sections, in this exact order (all four existing specs follow it; `Risks` is the one dropped when there are none — SPEC 02 omits it):

`## Scope` (explicit **In:** / **Out:** lists) · `## Data model` · `## Implementation plan` (numbered steps — these become the pause points in `/spec-impl`) · `## Acceptance criteria` (checkboxes) · `## Decisions` (taken *and* discarded, with the why) · `## Risks` · `## What is **not** in this spec`

Read `.claude/skills/spec/template.md` for the full rules before authoring one.

### Branching

`/spec-impl` creates and switches to `spec-NN-slug` (matching the spec filename without its extension). Controlled by `AutoCreateBranch` in `specs/.spec-config.yml` — `true` (current setting) creates it silently, `false` asks `[y/N]` first.

Merge back to `main` with `--no-ff`. Delete the spec branch and its worktree once merged.

### Existing specs

| Spec | Estado | Aporta |
|---|---|---|
| `01-mvp-jugable.md` | Implementado | Canvas, paleta, física de la bola, bloques, vidas, puntaje, overlays |
| `02-destruccion-bloques-animada.md` | Implementado | `state.explosions` + animación de 4 frames al romper |
| `03-niveles-progresivos.md` | Implementado | `js/levels.js`, 5 niveles como mapas de texto, velocidad creciente |
| `04-sonidos-rebote-y-rotura.md` | Implementado | `js/audio.js`, pool de audio, mute persistido en `localStorage` |

## Architecture

**Everything is a plain classic script — no ES modules, no `import`/`export`.** Each file communicates through globals, so **the `<script>` order in `index.html` is load-bearing**:

```
assets/spritesheet.js  →  js/levels.js  →  js/audio.js  →  js/game.js
```

`js/game.js` runs last because it reads globals from all three.

| File | Exposes | Notes |
|---|---|---|
| `assets/spritesheet.js` | `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`, `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)`, `drawFrame(ctx, frame, x, y, w, h)` | Loads the PNG once and queues callbacks; safe to call repeatedly. Sprite names are `'paddle'`, `'ball'`, `'block_<color>'`. |
| `js/levels.js` | `BLOCK_CHARS`, `BLOCK_HEX`, `LEVELS` | Levels are arrays of 10-char strings; `.` is empty. |
| `js/audio.js` | `playSound(name)`, `toggleMute()`, `isMuted()` | Pool of 4 instances per sound. Mute persists in `localStorage` under `arkanoid:muted`. |
| `js/game.js` | — | `state` object, game loop, and the DOM UI layer (marked `/* ---------- Interfaz (DOM) ---------- */`). |

### Game loop

`loop(timestamp)` → `update(timestamp)` (skipped unless `state.status === 'playing'`) → `render(timestamp)` → `syncUi()`.

`state.status` is `'playing' | 'paused' | 'levelclear' | 'gameover' | 'win'`. Everything else in the UI derives from it.

### Canvas vs. DOM — the split

The canvas (`800x600`) draws **only the game world**: paddle, ball, blocks, explosions. Everything else is real DOM styled in `index.html`:

- The HUD is a sibling **above** the canvas, not drawn inside it. It used to be drawn on the canvas and the ball visibly passed under it — don't move it back.
- The level selector is a sidebar to the right of the canvas.
- Pause/game-over/level-clear overlays are absolutely positioned DOM over the canvas.

`syncUi()` pushes state into the DOM each frame but **guards every write behind a change check** (`shownLevel`, `shownLives`, `shownAlive`, …) so it isn't thrashing the DOM 60 times a second. Keep that pattern when adding HUD elements.

### Gotchas

- **Sprite color names lie.** In the spritesheet, `green` renders blue and `hotpink` renders orange. `BLOCK_HEX` in `js/levels.js` maps each name to the tone it *actually* shows on screen — use it for any UI that must visually match the canvas, never the name itself.
- **Blocks start at `BLOCK_OFFSET_TOP = 10`**, flush to the top of the canvas, because the HUD no longer occupies canvas space.
- **`blur()` DOM buttons after click.** Arrow keys drive the paddle and `Escape`/`P` toggle pause; a focused button swallows them.
- **`state` is a top-level `const`**, not on `window`, so browser-automation `page.evaluate()` cannot read it. Assert against the DOM instead.

## Running the game

Static, no build step. Serve the directory with any static server and open `index.html`:

```bash
python -m http.server 8000
```

Opening the file directly also works (`loadSpritesheet` only draws, never reads pixels, so there's no canvas-tainting issue), but a server matches how it's been tested.

## Assets

- `assets/spritesheet-breakout.png` — master spritesheet, accessed by `assets/spritesheet.js` via a path relative to the **document**, so `index.html` must stay at the repo root.
- `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3`
