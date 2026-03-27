import { LevelDef, Direction, PieceType } from './types';

/** Helper to create beam colors */
const WHITE = { r: 1, g: 1, b: 1 };
const RED = { r: 1, g: 0, b: 0 };
const GREEN = { r: 0, g: 1, b: 0 };
const BLUE = { r: 0, g: 0, b: 1 };
const MAGENTA = { r: 1, g: 0, b: 1 };

export const LEVELS: LevelDef[] = [
  // Level 1: Simple mirror redirect
  {
    id: 1,
    name: 'Primo Riflesso',
    description: 'Usa uno specchio per dirigere la luce verso il bersaglio.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 2, direction: Direction.RIGHT, color: WHITE },
    ],
    targets: [
      { col: 4, row: 5, requiredColor: WHITE, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.MIRROR, count: 1 },
    ],
    par: 1,
  },

  // Level 2: Two mirrors, angle the path
  {
    id: 2,
    name: 'Doppia Curva',
    description: 'Due specchi per creare un percorso a zig-zag.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 1, direction: Direction.RIGHT, color: WHITE },
    ],
    targets: [
      { col: 7, row: 4, requiredColor: WHITE, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.MIRROR, count: 2 },
    ],
    par: 2,
  },

  // Level 3: First prism - split white into RGB, hit red target
  {
    id: 3,
    name: 'Arcobaleno',
    description: 'Usa un prisma per scomporre la luce bianca e colpire il bersaglio rosso.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 2, direction: Direction.RIGHT, color: WHITE },
    ],
    targets: [
      { col: 7, row: 2, requiredColor: RED, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.PRISM, count: 1 },
    ],
    par: 1,
  },

  // Level 4: Split and redirect to hit red AND blue
  {
    id: 4,
    name: 'Due Colori',
    description: 'Scomponi la luce e guida rosso e blu ai rispettivi bersagli.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 2, direction: Direction.RIGHT, color: WHITE },
    ],
    targets: [
      { col: 7, row: 0, requiredColor: RED, receivedColor: null, activated: false },
      { col: 7, row: 4, requiredColor: BLUE, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.PRISM, count: 1 },
      { type: PieceType.MIRROR, count: 2 },
    ],
    par: 3,
  },

  // Level 5: Color combining - merge Red+Blue into Magenta
  {
    id: 5,
    name: 'Fusione',
    description: 'Combina rosso e blu per creare il magenta.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 1, direction: Direction.RIGHT, color: RED },
      { col: 0, row: 4, direction: Direction.RIGHT, color: BLUE },
    ],
    targets: [
      { col: 7, row: 2, requiredColor: MAGENTA, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.MIRROR, count: 2 },
    ],
    par: 2,
  },

  // Level 6: Filter introduction
  {
    id: 6,
    name: 'Filtro',
    description: 'Filtra la luce bianca per ottenere solo il verde.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 2, direction: Direction.RIGHT, color: WHITE },
    ],
    targets: [
      { col: 7, row: 2, requiredColor: GREEN, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.FILTER_GREEN, count: 1 },
    ],
    par: 1,
  },

  // Level 7: Split, filter, redirect to hit 3 colored targets
  {
    id: 7,
    name: 'Triade',
    description: 'Scomponi, filtra e reindirizza per colpire tre bersagli colorati.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 2, direction: Direction.RIGHT, color: WHITE },
    ],
    targets: [
      { col: 7, row: 0, requiredColor: RED, receivedColor: null, activated: false },
      { col: 7, row: 2, requiredColor: GREEN, receivedColor: null, activated: false },
      { col: 7, row: 4, requiredColor: BLUE, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.PRISM, count: 1 },
      { type: PieceType.MIRROR, count: 3 },
    ],
    par: 4,
  },

  // Level 8: Combining + splitting in same level
  {
    id: 8,
    name: 'Sintesi',
    description: 'Combina e scomponi la luce nello stesso livello.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 1, direction: Direction.RIGHT, color: RED },
      { col: 0, row: 3, direction: Direction.RIGHT, color: GREEN },
    ],
    targets: [
      { col: 7, row: 1, requiredColor: RED, receivedColor: null, activated: false },
      { col: 7, row: 3, requiredColor: GREEN, receivedColor: null, activated: false },
      { col: 4, row: 5, requiredColor: { r: 1, g: 1, b: 0 }, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.MIRROR, count: 4 },
    ],
    par: 4,
  },

  // Level 9: Multiple prisms and mirrors, 4 targets
  {
    id: 9,
    name: 'Prismatico',
    description: 'Usa prismi e specchi multipli per colpire 4 bersagli.',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 0, direction: Direction.RIGHT, color: WHITE },
      { col: 0, row: 5, direction: Direction.RIGHT, color: WHITE },
    ],
    targets: [
      { col: 7, row: 0, requiredColor: RED, receivedColor: null, activated: false },
      { col: 7, row: 2, requiredColor: GREEN, receivedColor: null, activated: false },
      { col: 7, row: 3, requiredColor: BLUE, receivedColor: null, activated: false },
      { col: 7, row: 5, requiredColor: RED, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.PRISM, count: 2 },
      { type: PieceType.MIRROR, count: 3 },
    ],
    par: 5,
  },

  // Level 10: Grand finale - create white from separate R, G, B sources
  {
    id: 10,
    name: 'Luce Bianca',
    description: 'Combina rosso, verde e blu per ricreare la luce bianca!',
    gridCols: 8,
    gridRows: 6,
    sources: [
      { col: 0, row: 0, direction: Direction.RIGHT, color: RED },
      { col: 0, row: 2, direction: Direction.RIGHT, color: GREEN },
      { col: 0, row: 4, direction: Direction.RIGHT, color: BLUE },
    ],
    targets: [
      { col: 7, row: 2, requiredColor: WHITE, receivedColor: null, activated: false },
    ],
    fixedPieces: [],
    availablePieces: [
      { type: PieceType.MIRROR, count: 4 },
    ],
    par: 4,
  },
];
