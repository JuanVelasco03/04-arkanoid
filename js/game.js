const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const state = {
  status: 'playing', // 'playing' | 'gameover' | 'win'
  lives: 3,
  score: 0,
  paddle: { x: 360, y: 570, w: 100, h: 14 },
  ball: { x: 400, y: 300, vx: 4, vy: -4, r: 8 },
  blocks: [],
};

const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 76;
const BLOCK_H = 24;
const BLOCK_GAP = 4;
const BLOCK_OFFSET_X = ( canvas.width - ( BLOCK_COLS * BLOCK_W + ( BLOCK_COLS - 1 ) * BLOCK_GAP ) ) / 2;
const BLOCK_OFFSET_TOP = 50;
const BLOCK_COLORS = Object.keys( SPRITES.blocks );

function createBlocks() {
  const blocks = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      blocks.push( {
        col,
        row,
        x: BLOCK_OFFSET_X + col * ( BLOCK_W + BLOCK_GAP ),
        y: BLOCK_OFFSET_TOP + row * ( BLOCK_H + BLOCK_GAP ),
        w: BLOCK_W,
        h: BLOCK_H,
        color: BLOCK_COLORS[ Math.floor( Math.random() * BLOCK_COLORS.length ) ],
        alive: true,
      } );
    }
  }
  return blocks;
}

state.blocks = createBlocks();

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
} );

document.addEventListener( 'keyup', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = false;
  if ( e.key === 'ArrowRight' ) keys.right = false;
} );

function update() {
  if ( keys.left ) state.paddle.x = clampPaddleX( state.paddle.x - PADDLE_SPEED );
  if ( keys.right ) state.paddle.x = clampPaddleX( state.paddle.x + PADDLE_SPEED );

  updateBall();
}

const BALL_SPEED = Math.hypot( 4, 4 );
const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60°, evita trayectorias casi horizontales

function resetBallAndPaddle() {
  state.paddle.x = 360;
  state.ball.x = 400;
  state.ball.y = 300;
  state.ball.vx = 4;
  state.ball.vy = -4;
}

function updateBall() {
  const ball = state.ball;
  const paddle = state.paddle;

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Paredes izquierda/derecha
  if ( ball.x - ball.r <= 0 ) {
    ball.x = ball.r;
    ball.vx = Math.abs( ball.vx );
  } else if ( ball.x + ball.r >= canvas.width ) {
    ball.x = canvas.width - ball.r;
    ball.vx = -Math.abs( ball.vx );
  }

  // Pared superior
  if ( ball.y - ball.r <= 0 ) {
    ball.y = ball.r;
    ball.vy = Math.abs( ball.vy );
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

    ball.vx = BALL_SPEED * Math.sin( bounceAngle );
    ball.vy = -BALL_SPEED * Math.cos( bounceAngle );
  }

  // La bola cae debajo de la paleta: se pierde una vida
  if ( ball.y - ball.r > canvas.height ) {
    state.lives -= 1;
    resetBallAndPaddle();
  }
}

function render() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h );
  drawSprite( ctx, 'ball', state.ball.x - state.ball.r, state.ball.y - state.ball.r, state.ball.r * 2, state.ball.r * 2 );

  state.blocks.forEach( ( block ) => {
    if ( !block.alive ) return;
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.w, block.h );
  } );
}

function loop() {
  update();
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  loop();
} );
