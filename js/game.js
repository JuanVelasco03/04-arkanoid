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

function render() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h );
  drawSprite( ctx, 'ball', state.ball.x - state.ball.r, state.ball.y - state.ball.r, state.ball.r * 2, state.ball.r * 2 );
}

loadSpritesheet( () => {
  render();
} );
