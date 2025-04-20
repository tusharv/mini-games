export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: 'orange' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'fuchsia' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'indigo' },
  O: { shape: [[1, 1], [1, 1]], color: 'yellow' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'lime' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'green' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'teal' }
};

export type TetrominoKey = keyof typeof TETROMINOES;

export type CellValue = TetrominoKey | 0; // 0 represents an empty cell
export type Board = CellValue[][];
export type Shape = number[][];

export interface Position {
  x: number;
  y: number;
}

export interface PlayerPiece {
  pos: Position;
  tetromino: Shape;
  key: TetrominoKey;
  collided: boolean;
}

// Initial drop speed (milliseconds per step down)
export const INITIAL_DROP_SPEED = {
  easy: 1000,
  medium: 700,
  hard: 400,
};

// Scoring
export const SCORE_PER_LINE = [0, 100, 300, 500, 800]; // 0 lines, 1 line, 2 lines, 3 lines, 4 lines (Tetris)
export const LEVEL_UP_LINES = 10; // Lines to clear to level up
export const SPEED_INCREASE_FACTOR = 0.9; // Factor to multiply speed by each level up

export const GHOST_PIECE_OPACITY = 0.3;

// Helper function to create an empty board
export const createEmptyBoard = (): Board =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

// Helper function to get a random tetromino key
export const getRandomTetrominoKey = (): TetrominoKey => {
  const keys = Object.keys(TETROMINOES) as TetrominoKey[];
  return keys[Math.floor(Math.random() * keys.length)];
};
