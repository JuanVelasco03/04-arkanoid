# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responde siempre en español en este proyecto.

## Project status

This is an **Arkanoid/Breakout game** built with plain HTML, CSS, and JavaScript — **zero dependencies**. As of now the game itself is not yet implemented; only assets and the spec workflow scaffolding exist. There is no build tool, package manager, test runner, or linter configured (and none should be introduced unless the user asks — the "zero dependencies" constraint is intentional).

## Development workflow: spec-driven

This repo uses a spec-driven workflow via two custom slash commands (defined in `.claude/skills/` and `.agents/skills/`, sourced from `Klerith/fernando-skills`):

- **`/spec <description>`** — designs a new feature spec through guided clarifying questions, then writes it to `specs/NN-slug.md`. Never writes code. New specs start in `Draft` state.
- **`/spec-impl <NN-spec-name>`** — implements a spec, but **only if its state is `Approved`**. Creates a branch `spec-NN-slug`, shows the spec summary, then implements the plan step by step, pausing after each step for review. Never commits automatically.

Before starting any non-trivial feature work in this repo, check whether a relevant spec exists in `specs/` (the folder does not exist yet at the time of writing) and prefer going through `/spec` → review/approve → `/spec-impl` rather than implementing ad hoc. Branch naming convention for implemented specs: `spec-NN-slug`.

## Assets

- `assets/spritesheet-breakout.png` — the master spritesheet image.
- `assets/spritesheet.js` — plain-script (non-module) helper for the spritesheet, exposing globals:
  - `SPRITES` — coordinate/size table (`sx, sy, sw, sh`) for `paddle`, `ball`, and `blocks.<color>` (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`).
  - `EXPLOSION_FRAMES` — 4-frame explosion animation per color, plus `EXPLOSION_DURATION` (ms).
  - `loadSpritesheet(cb)` — loads the PNG once (via an offscreen canvas) and invokes `cb` when ready; safe to call multiple times, queues callbacks until loaded.
  - `drawSprite(ctx, name, x, y, w, h)` — draws a named sprite (`'paddle'`, `'ball'`, or `'block_<color>'`) onto a canvas context, scaled to `w x h`.
  - `drawFrame(ctx, frame, x, y, w, h)` — draws a raw `{sx, sy, sw, sh}` frame (used for explosion animation frames).
  - Note: `loadSpritesheet` references `assets/spritesheet-breakout.png` as a relative path — the game's HTML entry point must be served/opened such that this path resolves correctly.
- `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3` — sound effects for paddle/wall bounces and block breaks.

## Running the game

Once implemented, this will be a static HTML/CSS/JS game with no build step — open the HTML file directly or serve the directory with any static file server. There is currently no entry HTML file in the repo.
