const BLOCK_CHARS = {
  g: 'gray',
  r: 'red',
  y: 'yellow',
  c: 'cyan',
  m: 'magenta',
  h: 'hotpink',
  v: 'green',
};

// Color aproximado con el que cada sprite se ve en pantalla. Los nombres del
// spritesheet no siempre coinciden con el tono real (p. ej. 'green' se dibuja
// azul), así que las miniaturas del selector usan esta tabla.
const BLOCK_HEX = {
  gray:     '#9aa0ad',
  red:      '#d2344a',
  yellow:   '#d9bb4a',
  cyan:     '#4fd1a5',
  magenta:  '#6b3ff5',
  hotpink:  '#f07c1e',
  green:    '#3fa9f5',
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
