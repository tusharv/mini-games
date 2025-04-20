import { BOARD_WIDTH, BOARD_HEIGHT, Board, PlayerPiece, Shape } from './constants';

/**
 * Checks for collision between the player's piece and the board boundaries or existing pieces.
 * @param player The current player piece state.
 * @param board The current game board state.
 * @param move The intended move (e.g., {x: 0, y: 1} for moving down).
 * @returns True if a collision occurs, false otherwise.
 */
export const checkCollision = (
  player: PlayerPiece,
  board: Board,
  move: { x: number; y: number }
): boolean => {
  for (let y = 0; y < player.tetromino.length; y++) {
    for (let x = 0; x < player.tetromino[y].length; x++) {
      // 1. Check if the cell is part of the tetromino shape
      if (player.tetromino[y][x] !== 0) {
        const nextY = player.pos.y + y + move.y;
        const nextX = player.pos.x + x + move.x;

        // 2. Check if the move is within the board boundaries (height)
        if (nextY >= BOARD_HEIGHT) {
          return true;
        }

        // 3. Check if the move is within the board boundaries (width)
        if (nextX < 0 || nextX >= BOARD_WIDTH) {
          return true;
        }

        // 4. Check if the target cell on the board is already occupied
        // Make sure we don't check collision outside the top boundary (y < 0)
        if (nextY >= 0 && board[nextY] && board[nextY][nextX] !== 0) {
          return true;
        }
      }
    }
  }
  // No collision detected
  return false;
};


/**
 * Rotates a matrix (tetromino shape) clockwise.
 * @param matrix The matrix to rotate.
 * @returns The rotated matrix.
 */
export const rotateMatrix = (matrix: Shape): Shape => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotatedMatrix: Shape = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotatedMatrix[x][rows - 1 - y] = matrix[y][x];
    }
  }
  return rotatedMatrix;
};
