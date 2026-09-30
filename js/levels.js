const BLOCK_CHARS = {
  g: 'gray',
  r: 'red',
  y: 'yellow',
  c: 'cyan',
  m: 'magenta',
  h: 'hotpink',
  v: 'green',
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
