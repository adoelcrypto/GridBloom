/**
 * GridBloom - Piece Definitions and Geometry
 * Pure TypeScript polyomino definitions and color palette.
 */

export interface Point {
  readonly r: number; // Row offset
  readonly c: number; // Column offset
}

export type PieceShapeId =
  | 'dot_1'
  | 'line_2_h'
  | 'line_2_v'
  | 'line_3_h'
  | 'line_3_v'
  | 'line_4_h'
  | 'line_4_v'
  | 'line_5_h'
  | 'line_5_v'
  | 'square_2'
  | 'square_3'
  | 'corner_2_tl'
  | 'corner_2_tr'
  | 'corner_2_bl'
  | 'corner_2_br'
  | 'corner_3_tl'
  | 'corner_3_tr'
  | 'corner_3_bl'
  | 'corner_3_br'
  | 't_shape_up'
  | 't_shape_down'
  | 't_shape_left'
  | 't_shape_right'
  | 'z_shape_h'
  | 'z_shape_v'
  | 's_shape_h'
  | 's_shape_v'
  | 'plus_5'
  | 'u_shape_up'
  | 'u_shape_down';

export interface PieceDefinition {
  readonly id: PieceShapeId;
  readonly name: string;
  readonly rows: number;
  readonly cols: number;
  readonly matrix: readonly (readonly number[])[];
  readonly blocks: readonly Point[];
  readonly color: string;       // Primary vibrant jewel tone
  readonly glowColor: string;   // Accent glow tone
  readonly borderColor: string; // Stroke border tone
  readonly weight: number;      // Spawn probability weight
}

// Jewel-toned palette designed for midnight-navy contrast
export const PALETTE = {
  cyan: {
    base: '#06B6D4',
    glow: '#67E8F9',
    border: '#0891B2',
  },
  emerald: {
    base: '#10B981',
    glow: '#6EE7B7',
    border: '#059669',
  },
  amber: {
    base: '#F59E0B',
    glow: '#FDE68A',
    border: '#D97706',
  },
  rose: {
    base: '#F43F5E',
    glow: '#FDA4AF',
    border: '#E11D48',
  },
  violet: {
    base: '#8B5CF6',
    glow: '#DDD6FE',
    border: '#7C3AED',
  },
  indigo: {
    base: '#6366F1',
    glow: '#C7D2FE',
    border: '#4F46E5',
  },
  fuchsia: {
    base: '#D946EF',
    glow: '#F5D0FE',
    border: '#C026D3',
  },
} as const;

function matrixToPoints(matrix: number[][]): Point[] {
  const points: Point[] = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) {
        points.push({ r, c });
      }
    }
  }
  return points;
}

export const PIECE_DEFINITIONS: Record<PieceShapeId, PieceDefinition> = {
  dot_1: {
    id: 'dot_1',
    name: 'Monomino',
    rows: 1,
    cols: 1,
    matrix: [[1]],
    blocks: [{ r: 0, c: 0 }],
    color: PALETTE.amber.base,
    glowColor: PALETTE.amber.glow,
    borderColor: PALETTE.amber.border,
    weight: 2,
  },
  line_2_h: {
    id: 'line_2_h',
    name: 'Domino H',
    rows: 1,
    cols: 2,
    matrix: [[1, 1]],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }],
    color: PALETTE.cyan.base,
    glowColor: PALETTE.cyan.glow,
    borderColor: PALETTE.cyan.border,
    weight: 4,
  },
  line_2_v: {
    id: 'line_2_v',
    name: 'Domino V',
    rows: 2,
    cols: 1,
    matrix: [[1], [1]],
    blocks: [{ r: 0, c: 0 }, { r: 1, c: 0 }],
    color: PALETTE.cyan.base,
    glowColor: PALETTE.cyan.glow,
    borderColor: PALETTE.cyan.border,
    weight: 4,
  },
  line_3_h: {
    id: 'line_3_h',
    name: 'Tromino H',
    rows: 1,
    cols: 3,
    matrix: [[1, 1, 1]],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }],
    color: PALETTE.indigo.base,
    glowColor: PALETTE.indigo.glow,
    borderColor: PALETTE.indigo.border,
    weight: 4,
  },
  line_3_v: {
    id: 'line_3_v',
    name: 'Tromino V',
    rows: 3,
    cols: 1,
    matrix: [[1], [1], [1]],
    blocks: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }],
    color: PALETTE.indigo.base,
    glowColor: PALETTE.indigo.glow,
    borderColor: PALETTE.indigo.border,
    weight: 4,
  },
  line_4_h: {
    id: 'line_4_h',
    name: 'Tetromino Line H',
    rows: 1,
    cols: 4,
    matrix: [[1, 1, 1, 1]],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }],
    color: PALETTE.cyan.base,
    glowColor: PALETTE.cyan.glow,
    borderColor: PALETTE.cyan.border,
    weight: 3,
  },
  line_4_v: {
    id: 'line_4_v',
    name: 'Tetromino Line V',
    rows: 4,
    cols: 1,
    matrix: [[1], [1], [1], [1]],
    blocks: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 }],
    color: PALETTE.cyan.base,
    glowColor: PALETTE.cyan.glow,
    borderColor: PALETTE.cyan.border,
    weight: 3,
  },
  line_5_h: {
    id: 'line_5_h',
    name: 'Pentomino Line H',
    rows: 1,
    cols: 5,
    matrix: [[1, 1, 1, 1, 1]],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 0, c: 4 }],
    color: PALETTE.emerald.base,
    glowColor: PALETTE.emerald.glow,
    borderColor: PALETTE.emerald.border,
    weight: 2,
  },
  line_5_v: {
    id: 'line_5_v',
    name: 'Pentomino Line V',
    rows: 5,
    cols: 1,
    matrix: [[1], [1], [1], [1], [1]],
    blocks: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 4, c: 0 }],
    color: PALETTE.emerald.base,
    glowColor: PALETTE.emerald.glow,
    borderColor: PALETTE.emerald.border,
    weight: 2,
  },
  square_2: {
    id: 'square_2',
    name: 'Square 2x2',
    rows: 2,
    cols: 2,
    matrix: [
      [1, 1],
      [1, 1],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
    color: PALETTE.amber.base,
    glowColor: PALETTE.amber.glow,
    borderColor: PALETTE.amber.border,
    weight: 4,
  },
  square_3: {
    id: 'square_3',
    name: 'Square 3x3',
    rows: 3,
    cols: 3,
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    blocks: matrixToPoints([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]),
    color: PALETTE.fuchsia.base,
    glowColor: PALETTE.fuchsia.glow,
    borderColor: PALETTE.fuchsia.border,
    weight: 1,
  },
  corner_2_tl: {
    id: 'corner_2_tl',
    name: 'Small Corner TL',
    rows: 2,
    cols: 2,
    matrix: [
      [1, 1],
      [1, 0],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }],
    color: PALETTE.violet.base,
    glowColor: PALETTE.violet.glow,
    borderColor: PALETTE.violet.border,
    weight: 3,
  },
  corner_2_tr: {
    id: 'corner_2_tr',
    name: 'Small Corner TR',
    rows: 2,
    cols: 2,
    matrix: [
      [1, 1],
      [0, 1],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }],
    color: PALETTE.violet.base,
    glowColor: PALETTE.violet.glow,
    borderColor: PALETTE.violet.border,
    weight: 3,
  },
  corner_2_bl: {
    id: 'corner_2_bl',
    name: 'Small Corner BL',
    rows: 2,
    cols: 2,
    matrix: [
      [1, 0],
      [1, 1],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
    color: PALETTE.violet.base,
    glowColor: PALETTE.violet.glow,
    borderColor: PALETTE.violet.border,
    weight: 3,
  },
  corner_2_br: {
    id: 'corner_2_br',
    name: 'Small Corner BR',
    rows: 2,
    cols: 2,
    matrix: [
      [0, 1],
      [1, 1],
    ],
    blocks: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
    color: PALETTE.violet.base,
    glowColor: PALETTE.violet.glow,
    borderColor: PALETTE.violet.border,
    weight: 3,
  },
  corner_3_tl: {
    id: 'corner_3_tl',
    name: 'Big Corner TL',
    rows: 3,
    cols: 3,
    matrix: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
    ],
    blocks: [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
    ],
    color: PALETTE.rose.base,
    glowColor: PALETTE.rose.glow,
    borderColor: PALETTE.rose.border,
    weight: 2,
  },
  corner_3_tr: {
    id: 'corner_3_tr',
    name: 'Big Corner TR',
    rows: 3,
    cols: 3,
    matrix: [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    blocks: [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 },
      { r: 1, c: 2 },
      { r: 2, c: 2 },
    ],
    color: PALETTE.rose.base,
    glowColor: PALETTE.rose.glow,
    borderColor: PALETTE.rose.border,
    weight: 2,
  },
  corner_3_bl: {
    id: 'corner_3_bl',
    name: 'Big Corner BL',
    rows: 3,
    cols: 3,
    matrix: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
    blocks: [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 },
    ],
    color: PALETTE.rose.base,
    glowColor: PALETTE.rose.glow,
    borderColor: PALETTE.rose.border,
    weight: 2,
  },
  corner_3_br: {
    id: 'corner_3_br',
    name: 'Big Corner BR',
    rows: 3,
    cols: 3,
    matrix: [
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
    blocks: [
      { r: 0, c: 2 },
      { r: 1, c: 2 },
      { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 },
    ],
    color: PALETTE.rose.base,
    glowColor: PALETTE.rose.glow,
    borderColor: PALETTE.rose.border,
    weight: 2,
  },
  t_shape_up: {
    id: 't_shape_up',
    name: 'T Shape Up',
    rows: 2,
    cols: 3,
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    blocks: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    color: PALETTE.emerald.base,
    glowColor: PALETTE.emerald.glow,
    borderColor: PALETTE.emerald.border,
    weight: 3,
  },
  t_shape_down: {
    id: 't_shape_down',
    name: 'T Shape Down',
    rows: 2,
    cols: 3,
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 1 }],
    color: PALETTE.emerald.base,
    glowColor: PALETTE.emerald.glow,
    borderColor: PALETTE.emerald.border,
    weight: 3,
  },
  t_shape_left: {
    id: 't_shape_left',
    name: 'T Shape Left',
    rows: 3,
    cols: 2,
    matrix: [
      [0, 1],
      [1, 1],
      [0, 1],
    ],
    blocks: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
    color: PALETTE.emerald.base,
    glowColor: PALETTE.emerald.glow,
    borderColor: PALETTE.emerald.border,
    weight: 3,
  },
  t_shape_right: {
    id: 't_shape_right',
    name: 'T Shape Right',
    rows: 3,
    cols: 2,
    matrix: [
      [1, 0],
      [1, 1],
      [1, 0],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 0 }],
    color: PALETTE.emerald.base,
    glowColor: PALETTE.emerald.glow,
    borderColor: PALETTE.emerald.border,
    weight: 3,
  },
  z_shape_h: {
    id: 'z_shape_h',
    name: 'Z Shape H',
    rows: 2,
    cols: 3,
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    color: PALETTE.rose.base,
    glowColor: PALETTE.rose.glow,
    borderColor: PALETTE.rose.border,
    weight: 3,
  },
  z_shape_v: {
    id: 'z_shape_v',
    name: 'Z Shape V',
    rows: 3,
    cols: 2,
    matrix: [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    blocks: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 0 }],
    color: PALETTE.rose.base,
    glowColor: PALETTE.rose.glow,
    borderColor: PALETTE.rose.border,
    weight: 3,
  },
  s_shape_h: {
    id: 's_shape_h',
    name: 'S Shape H',
    rows: 2,
    cols: 3,
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    blocks: [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
    color: PALETTE.cyan.base,
    glowColor: PALETTE.cyan.glow,
    borderColor: PALETTE.cyan.border,
    weight: 3,
  },
  s_shape_v: {
    id: 's_shape_v',
    name: 'S Shape V',
    rows: 3,
    cols: 2,
    matrix: [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
    color: PALETTE.cyan.base,
    glowColor: PALETTE.cyan.glow,
    borderColor: PALETTE.cyan.border,
    weight: 3,
  },
  plus_5: {
    id: 'plus_5',
    name: 'Plus Shape',
    rows: 3,
    cols: 3,
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    blocks: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }],
    color: PALETTE.violet.base,
    glowColor: PALETTE.violet.glow,
    borderColor: PALETTE.violet.border,
    weight: 2,
  },
  u_shape_up: {
    id: 'u_shape_up',
    name: 'U Shape Up',
    rows: 2,
    cols: 3,
    matrix: [
      [1, 0, 1],
      [1, 1, 1],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    color: PALETTE.amber.base,
    glowColor: PALETTE.amber.glow,
    borderColor: PALETTE.amber.border,
    weight: 2,
  },
  u_shape_down: {
    id: 'u_shape_down',
    name: 'U Shape Down',
    rows: 2,
    cols: 3,
    matrix: [
      [1, 1, 1],
      [1, 0, 1],
    ],
    blocks: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 2 }],
    color: PALETTE.amber.base,
    glowColor: PALETTE.amber.glow,
    borderColor: PALETTE.amber.border,
    weight: 2,
  },
};

export const ALL_PIECE_IDS = Object.keys(PIECE_DEFINITIONS) as PieceShapeId[];
