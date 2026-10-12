/**
 * Connect-4 Board Logic and Pure State Operations
 * Standard 6 Rows x 7 Columns grid
 * 
 * Coordinate System:
 * - Row 0 is the TOP row
 * - Row 5 is the BOTTOM row (where gravity pieces land first)
 * - Col 0 is the leftmost column, Col 6 is the rightmost column
 */

export const ROWS = 6;
export const COLS = 7;

export const EMPTY = 0;
export const PLAYER_1 = 1; // Typically Red / Human
export const PLAYER_2 = 2; // Typically Yellow / AI

/**
 * Move ordering priority: center columns have higher tactical control in Connect-4
 * Col 3 (center) participates in 16 four-in-a-row lines
 * Cols 2 & 4 participate in 13 lines
 * Cols 1 & 5 participate in 8 lines
 * Cols 0 & 6 participate in only 4 lines
 */
export const CENTER_MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6];

/**
 * Creates an empty 6x7 grid filled with EMPTY (0)
 * @returns {number[][]} 6x7 array
 */
export function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

/**
 * Deep clones a board to ensure pure functional state transitions
 * @param {number[][]} board 
 * @returns {number[][]}
 */
export function cloneBoard(board) {
  return board.map(row => [...row]);
}

/**
 * Finds the lowest unoccupied row in a column (gravity simulation)
 * @param {number[][]} board 
 * @param {number} col 
 * @returns {number} Row index (0..5) or -1 if column is full
 */
export function getLowestEmptyRow(board, col) {
  if (col < 0 || col >= COLS) return -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) {
      return r;
    }
  }
  return -1;
}

/**
 * Checks if a move in a specific column is legal
 * @param {number[][]} board 
 * @param {number} col 
 * @returns {boolean}
 */
export function isMoveLegal(board, col) {
  return col >= 0 && col < COLS && board[0][col] === EMPTY;
}

/**
 * Returns all valid columns where a disc can be dropped
 * @param {number[][]} board 
 * @returns {number[]} Array of valid column indices [0..6]
 */
export function getLegalMoves(board) {
  const legal = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === EMPTY) {
      legal.push(c);
    }
  }
  return legal;
}

/**
 * Returns legal moves sorted by center proximity: [3, 2, 4, 1, 5, 0, 6]
 * Crucial for Alpha-Beta pruning cut-off efficiency and deterministic tie-breaking.
 * @param {number[][]} board 
 * @returns {number[]}
 */
export function getOrderedLegalMoves(board) {
  return CENTER_MOVE_ORDER.filter(c => board[0][c] === EMPTY);
}

/**
 * Pure function: drops a disc in column `col` for `player`
 * Returns a new board without mutating the original board.
 * @param {number[][]} board 
 * @param {number} col 
 * @param {number} player (1 or 2)
 * @returns {number[][]} New board state
 */
export function applyMove(board, col, player) {
  const r = getLowestEmptyRow(board, col);
  if (r === -1) {
    throw new Error(`Illegal move: Column ${col} is already full.`);
  }
  const newBoard = cloneBoard(board);
  newBoard[r][col] = player;
  return newBoard;
}

/**
 * Returns true if every cell in the top row is filled
 * @param {number[][]} board 
 * @returns {boolean}
 */
export function isBoardFull(board) {
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === EMPTY) return false;
  }
  return true;
}

/**
 * Counts total pieces placed on the board
 * @param {number[][]} board 
 * @returns {number}
 */
export function countPieces(board) {
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== EMPTY) count++;
    }
  }
  return count;
}
