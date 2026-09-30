const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const BALL_LAUNCH_SPEED = 2.5;
const LEVEL_SPEED_FACTOR = 1.1;

const state = {
  status: 'playing', // 'playing' | 'paused' | 'levelclear' | 'gameover' | 'win'
  level: 1,
  ballSpeed: BALL_LAUNCH_SPEED,
  lives: 3,
  score: 0,
  paddle: { x: 360, y: 570, w: 100, h: 14 },
  ball: { x: 400, y: 300, vx: BALL_LAUNCH_SPEED, vy: -BALL_LAUNCH_SPEED, r: 8, stuck: true },
  blocks: [],
  explosions: [],
};

const BLOCK_COLS = 10;
const BLOCK_W = 76;
const BLOCK_H = 24;
const BLOCK_GAP = 4;
const BLOCK_OFFSET_X = ( canvas.width - ( BLOCK_COLS * BLOCK_W + ( BLOCK_COLS - 1 ) * BLOCK_GAP ) ) / 2;
const BLOCK_OFFSET_TOP = 10;

function createBlocks( levelIndex ) {
  const blocks = [];
  const map = LEVELS[ levelIndex ];

  map.forEach( ( rowStr, row ) => {
    [ ...rowStr ].forEach( ( char, col ) => {
      const color = BLOCK_CHARS[ char ];
      if ( !color ) return;

      blocks.push( {
        col,
        row,
        x: BLOCK_OFFSET_X + col * ( BLOCK_W + BLOCK_GAP ),
        y: BLOCK_OFFSET_TOP + row * ( BLOCK_H + BLOCK_GAP ),
        w: BLOCK_W,
        h: BLOCK_H,
        color,
        alive: true,
      } );
    } );
  } );

  return blocks;
}

state.blocks = createBlocks( 0 );

const PADDLE_SPEED = 7;
const keys = { left: false, right: false };

function clampPaddleX( x ) {
  return Math.max( 0, Math.min( canvas.width - state.paddle.w, x ) );
}

canvas.addEventListener( 'mousemove', ( e ) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = ( e.clientX - rect.left ) * scaleX;
  state.paddle.x = clampPaddleX( mouseX - state.paddle.w / 2 );
} );

document.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = true;
  if ( e.key === 'ArrowRight' ) keys.right = true;
  if ( e.key === 'Escape' || e.key.toLowerCase() === 'p' ) togglePause();
} );

document.addEventListener( 'keyup', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = false;
  if ( e.key === 'ArrowRight' ) keys.right = false;
} );

function togglePause() {
  if ( state.status === 'playing' ) state.status = 'paused';
  else if ( state.status === 'paused' ) state.status = 'playing';
}

function update( timestamp ) {
  if ( state.status !== 'playing' ) return;

  if ( keys.left ) state.paddle.x = clampPaddleX( state.paddle.x - PADDLE_SPEED );
  if ( keys.right ) state.paddle.x = clampPaddleX( state.paddle.x + PADDLE_SPEED );

  state.explosions = state.explosions.filter(
    ( explosion ) => ( timestamp - explosion.startTime ) < EXPLOSION_DURATION
  );

  if ( state.ball.stuck ) {
    state.ball.x = state.paddle.x + state.paddle.w / 2;
    state.ball.y = state.paddle.y - state.ball.r;
    return;
  }

  updateBall( timestamp );
}

const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60°, evita trayectorias casi horizontales

function applyLevelSpeed() {
  state.ballSpeed = BALL_LAUNCH_SPEED * Math.pow( LEVEL_SPEED_FACTOR, state.level - 1 );
}

function resetBallAndPaddle() {
  state.paddle.x = 360;
  state.ball.x = state.paddle.x + state.paddle.w / 2;
  state.ball.y = state.paddle.y - state.ball.r;
  state.ball.vx = state.ballSpeed;
  state.ball.vy = -state.ballSpeed;
  state.ball.stuck = true;
}

function loadLevel( level ) {
  state.level = level;
  state.blocks = createBlocks( level - 1 );
  state.explosions = [];
  applyLevelSpeed();
  resetBallAndPaddle();
}

function launchBall() {
  state.ball.stuck = false;
  state.ball.vx = state.ballSpeed;
  state.ball.vy = -state.ballSpeed;
}

function updateBall( timestamp ) {
  const ball = state.ball;
  const paddle = state.paddle;

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Paredes izquierda/derecha
  if ( ball.x - ball.r <= 0 ) {
    ball.x = ball.r;
    ball.vx = Math.abs( ball.vx );
    playSound( 'bounce' );
  } else if ( ball.x + ball.r >= canvas.width ) {
    ball.x = canvas.width - ball.r;
    ball.vx = -Math.abs( ball.vx );
    playSound( 'bounce' );
  }

  // Pared superior
  if ( ball.y - ball.r <= 0 ) {
    ball.y = ball.r;
    ball.vy = Math.abs( ball.vy );
    playSound( 'bounce' );
  }

  // Colisión con la paleta
  const hitsPaddle =
    ball.vy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.h &&
    ball.x >= paddle.x - ball.r &&
    ball.x <= paddle.x + paddle.w + ball.r;

  if ( hitsPaddle ) {
    ball.y = paddle.y - ball.r;

    const paddleCenter = paddle.x + paddle.w / 2;
    const relativeIntersect = ( ball.x - paddleCenter ) / ( paddle.w / 2 ); // -1 a 1
    const clampedRelative = Math.max( -1, Math.min( 1, relativeIntersect ) );
    const bounceAngle = clampedRelative * MAX_BOUNCE_ANGLE;

    ball.vx = state.ballSpeed * Math.sin( bounceAngle );
    ball.vy = -state.ballSpeed * Math.cos( bounceAngle );
    playSound( 'bounce' );
  }

  // La bola cae debajo de la paleta: se pierde una vida
  if ( ball.y - ball.r > canvas.height ) {
    state.lives -= 1;

    if ( state.lives <= 0 ) {
      state.status = 'gameover';
      return;
    }

    resetBallAndPaddle();
  }

  checkBlockCollision( timestamp );

  if ( state.blocks.every( ( block ) => !block.alive ) ) {
    state.status = state.level < LEVELS.length ? 'levelclear' : 'win';
  }
}

function checkBlockCollision( timestamp ) {
  const ball = state.ball;

  for ( const block of state.blocks ) {
    if ( !block.alive ) continue;

    const blockCenterX = block.x + block.w / 2;
    const blockCenterY = block.y + block.h / 2;
    const overlapX = ( ball.r + block.w / 2 ) - Math.abs( ball.x - blockCenterX );
    const overlapY = ( ball.r + block.h / 2 ) - Math.abs( ball.y - blockCenterY );

    if ( overlapX > 0 && overlapY > 0 ) {
      if ( overlapX < overlapY ) {
        ball.vx = -ball.vx;
      } else {
        ball.vy = -ball.vy;
      }

      block.alive = false;
      playSound( 'break' );
      state.score += 10;
      state.explosions.push( {
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
        color: block.color,
        startTime: timestamp,
      } );
      break;
    }
  }
}

function resetGame() {
  state.status = 'playing';
  state.lives = 3;
  state.score = 0;
  loadLevel( 1 );
}

function startLevel( level ) {
  state.lives = 3;
  state.score = 0;
  loadLevel( level );
  state.status = 'playing';
}

canvas.addEventListener( 'click', () => {
  if ( state.status === 'playing' && state.ball.stuck ) launchBall();
} );

function render( timestamp ) {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h );
  drawSprite( ctx, 'ball', state.ball.x - state.ball.r, state.ball.y - state.ball.r, state.ball.r * 2, state.ball.r * 2 );

  state.blocks.forEach( ( block ) => {
    if ( !block.alive ) return;
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.w, block.h );
  } );

  state.explosions.forEach( ( explosion ) => {
    const frames = EXPLOSION_FRAMES[ explosion.color ];
    const frameIndex = Math.min(
      frames.length - 1,
      Math.floor( ( timestamp - explosion.startTime ) / ( EXPLOSION_DURATION / 4 ) )
    );
    drawFrame( ctx, frames[ frameIndex ], explosion.x, explosion.y, explosion.w, explosion.h );
  } );

  syncUi();
}

/* ---------- Interfaz (DOM) ---------- */

const ICONS = {
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l11-6.5a1 1 0 0 0 0-1.8l-11-6.5A1 1 0 0 0 8 5.5Z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  muted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
};

const cabinetEl = document.getElementById( 'cabinet' );
const hudScoreEl = document.getElementById( 'hudScore' );
const hudLevelEl = document.getElementById( 'hudLevel' );
const hudLivesEl = document.getElementById( 'hudLives' );
const muteBtn = document.getElementById( 'muteBtn' );
const pauseBtn = document.getElementById( 'pauseBtn' );
const levelButtonsEl = document.getElementById( 'levelButtons' );
const overlayEl = document.getElementById( 'overlay' );
const overlayEyebrowEl = document.getElementById( 'overlayEyebrow' );
const overlayTitleEl = document.getElementById( 'overlayTitle' );
const overlayBtn = document.getElementById( 'overlayBtn' );

// Color que representa a cada nivel: el tono de bloque más frecuente en su mapa.
// En empates gana el color cromático, porque el gris es un acento apagado.
function dominantColor( levelIndex ) {
  const tally = {};

  LEVELS[ levelIndex ].forEach( ( rowStr ) => {
    [ ...rowStr ].forEach( ( char ) => {
      const color = BLOCK_CHARS[ char ];
      if ( color ) tally[ color ] = ( tally[ color ] || 0 ) + 1;
    } );
  } );

  const winner = Object.keys( tally ).sort( ( a, b ) =>
    ( tally[ b ] - tally[ a ] ) || ( ( a === 'gray' ) - ( b === 'gray' ) )
  )[ 0 ];

  return BLOCK_HEX[ winner ];
}

const LEVEL_ACCENTS = LEVELS.map( ( _, index ) => dominantColor( index ) );

// Cada nivel se dibuja como una miniatura de su mapa real. Guardamos las celdas
// por "fila-columna" para poder apagarlas conforme se rompen los bloques.
const levelChips = LEVELS.map( ( map, index ) => {
  const level = index + 1;
  const accent = LEVEL_ACCENTS[ index ];

  const chip = document.createElement( 'button' );
  chip.className = 'chip';
  chip.style.setProperty( '--chip-accent', accent );
  chip.setAttribute( 'aria-label', `Jugar nivel ${ level }` );

  const num = document.createElement( 'span' );
  num.className = 'chip__num';
  num.textContent = String( level ).padStart( 2, '0' );
  chip.appendChild( num );

  const mapEl = document.createElement( 'span' );
  mapEl.className = 'chip__map';
  chip.appendChild( mapEl );

  const cells = new Map();

  map.forEach( ( rowStr, row ) => {
    [ ...rowStr ].forEach( ( char, col ) => {
      const cell = document.createElement( 'span' );
      const color = BLOCK_CHARS[ char ];

      cell.className = color ? 'cell' : 'cell is-void';
      if ( color ) {
        cell.style.setProperty( '--cell', BLOCK_HEX[ color ] );
        cells.set( `${ row }-${ col }`, cell );
      }

      mapEl.appendChild( cell );
    } );
  } );

  chip.addEventListener( 'click', () => {
    startLevel( level );
    chip.blur(); // devuelve el teclado al juego
  } );

  levelButtonsEl.appendChild( chip );

  return { chip, cells };
} );

muteBtn.addEventListener( 'click', () => {
  toggleMute();
  muteBtn.blur();
} );

pauseBtn.addEventListener( 'click', () => {
  togglePause();
  pauseBtn.blur();
} );

const OVERLAYS = {
  paused:     { eyebrow: () => `Nivel ${ state.level }`, title: 'Pausa',            action: 'Continuar' },
  levelclear: { eyebrow: () => 'Completado',             title: '¡Nivel superado!', action: 'Siguiente nivel' },
  gameover:   { eyebrow: () => `Nivel ${ state.level }`, title: 'Game over',        action: 'Reintentar' },
  win:        { eyebrow: () => 'Todos los niveles',      title: '¡Ganaste!',        action: 'Jugar de nuevo' },
};

overlayBtn.addEventListener( 'click', () => {
  if ( state.status === 'paused' ) togglePause();
  else if ( state.status === 'levelclear' ) startNextLevel();
  else resetGame();

  overlayBtn.blur();
} );

function startNextLevel() {
  loadLevel( state.level + 1 );
  state.status = 'playing';
}

let shownLives = -1;
let shownStatus = null;
let shownLevel = -1;
let shownAlive = -1;
let shownMuted = null;

function syncUi() {
  hudScoreEl.textContent = String( state.score ).padStart( 4, '0' );

  if ( shownLevel !== state.level ) {
    hudLevelEl.textContent = String( state.level );
    cabinetEl.style.setProperty( '--accent', LEVEL_ACCENTS[ state.level - 1 ] );

    levelChips.forEach( ( { chip }, index ) => {
      chip.classList.toggle( 'is-active', index + 1 === state.level );
    } );

    shownLevel = state.level;
    shownAlive = -1; // fuerza el repintado de la miniatura activa
  }

  if ( shownLives !== state.lives ) {
    hudLivesEl.replaceChildren(
      ...Array.from( { length: state.lives }, () => {
        const life = document.createElement( 'span' );
        life.className = 'life';
        return life;
      } )
    );
    shownLives = state.lives;
  }

  const aliveCount = state.blocks.reduce( ( total, block ) => total + ( block.alive ? 1 : 0 ), 0 );

  if ( shownAlive !== aliveCount ) {
    const { cells } = levelChips[ state.level - 1 ];

    state.blocks.forEach( ( block ) => {
      const cell = cells.get( `${ block.row }-${ block.col }` );
      if ( cell ) cell.classList.toggle( 'is-broken', !block.alive );
    } );

    shownAlive = aliveCount;
  }

  if ( shownMuted !== isMuted() ) {
    muteBtn.innerHTML = isMuted() ? ICONS.muted : ICONS.sound;
    muteBtn.setAttribute( 'aria-label', isMuted() ? 'Activar sonido' : 'Silenciar' );
    muteBtn.setAttribute( 'aria-pressed', String( isMuted() ) );
    shownMuted = isMuted();
  }

  if ( shownStatus !== state.status ) {
    const paused = state.status === 'paused';
    pauseBtn.innerHTML = paused ? ICONS.play : ICONS.pause;
    pauseBtn.setAttribute( 'aria-label', paused ? 'Reanudar' : 'Pausar' );

    const overlay = OVERLAYS[ state.status ];

    if ( overlay ) {
      overlayEyebrowEl.textContent = overlay.eyebrow();
      overlayTitleEl.textContent = overlay.title;
      overlayBtn.textContent = overlay.action;
    }

    overlayEl.classList.toggle( 'is-open', Boolean( overlay ) );
    shownStatus = state.status;
  }
}

function loop( timestamp ) {
  update( timestamp );
  render( timestamp );
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );
