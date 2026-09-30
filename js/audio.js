const SOUND_SOURCES = {
  bounce: { src: 'assets/sounds/ball-bounce.mp3', volume: 0.5 },
  break:  { src: 'assets/sounds/break-sound.mp3', volume: 0.6 },
};

const SOUND_POOL_SIZE = 4;
const MUTED_STORAGE_KEY = 'arkanoid:muted';

const soundPools = {};
const poolFallbackIndex = {};

let muted = false;

try {
  muted = localStorage.getItem( MUTED_STORAGE_KEY ) === 'true';
} catch ( e ) {}

Object.keys( SOUND_SOURCES ).forEach( ( name ) => {
  const { src, volume } = SOUND_SOURCES[ name ];

  soundPools[ name ] = Array.from( { length: SOUND_POOL_SIZE }, () => {
    const audio = new Audio( src );
    audio.preload = 'auto';
    audio.volume = volume;
    return audio;
  } );

  poolFallbackIndex[ name ] = 0;
} );

function isMuted() {
  return muted;
}

function toggleMute() {
  muted = !muted;

  try {
    localStorage.setItem( MUTED_STORAGE_KEY, String( muted ) );
  } catch ( e ) {}

  if ( muted ) {
    Object.values( soundPools ).forEach( ( pool ) => {
      pool.forEach( ( audio ) => {
        if ( !audio.paused ) audio.pause();
      } );
    } );
  }
}

function playSound( name ) {
  if ( muted ) return;

  const pool = soundPools[ name ];
  if ( !pool ) return;

  let instance = pool.find( ( audio ) => audio.paused || audio.ended );

  if ( !instance ) {
    instance = pool[ poolFallbackIndex[ name ] ];
    poolFallbackIndex[ name ] = ( poolFallbackIndex[ name ] + 1 ) % pool.length;
  }

  instance.currentTime = 0;
  instance.play().catch( () => {} );
}
