/**
 * Connect-4 Rules & Win Verification
 * Pure functions to check wins, terminal states, and generate valid mid-game boards.
 */

import { ROWS, COLS, EMPTY, PLAYER_1, PLAYER_2, getLegalMoves, applyMove, createEmptyBoard } from './board.js';

/**
 * Checks if either player has connected 4 in a row
 * @param {number[][]} board 
 * @returns {{ winner: number | null, winningCells: number[][] }}
 */
export function checkWinner(board) {
  // 1. Horizontal check (-)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const p = board[r][c];
      if (
        p !== EMPTY &&
        p === board[r][c + 1] &&
        p === board[r][c + 2] &&
        p === board[r][c + 3]
      ) {
        return {
          winner: p,
          winningCells: [
            [r, c],
            [r, c + 1],
            [r, c + 2],
            [r, c + 3]
          ]
        };
      }
    }
  }

  // 2. Vertical check (|)
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      const p = board[r][c];
      if (
        p !== EMPTY &&
        p === board[r + 1][c] &&
        p === board[r + 2][c] &&
        p === board[r + 3][c]
      ) {
        return {
          winner: p,
          winningCells: [
            [r, c],
            [r + 1, c],
            [r + 2, c],
            [r + 3, c]
          ]
        };
      }
    }
  }

  // 3. Positive diagonal check (/) - bottom-left to top-right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const p = board[r][c];
      if (
        p !== EMPTY &&
        p === board[r - 1][c + 1] &&
        p === board[r - 2][c + 2] &&
        p === board[r - 3][c + 3]
      ) {
        return {
          winner: p,
          winningCells: [
            [r, c],
            [r - 1, c + 1],
            [r - 2, c + 2],
            [r - 3, c + 3]
          ]
        };
      }
    }
  }

  // 4. Negative diagonal check (\) - top-left to bottom-right
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const p = board[r][c];
      if (
        p !== EMPTY &&
        p === board[r + 1][c + 1] &&
        p === board[r + 2][c + 2] &&
        p === board[r + 3][c + 3]
      ) {
        return {
          winner: p,
          winningCells: [
            [r, c],
            [r + 1, c + 1],
            [r + 2, c + 2],
            [r + 3, c + 3]
          ]
        };
      }
    }
  }

  return { winner: null, winningCells: [] };
}

/**
 * Checks if the board has reached a terminal state (win or draw)
 * @param {number[][]} board 
 * @returns {{ isTerminal: boolean, winner: number | null, isDraw: boolean, winningCells: number[][] }}
 */
export function isTerminal(board) {
  const winResult = checkWinner(board);
  if (winResult.winner !== null) {
    return {
      isTerminal: true,
      winner: winResult.winner,
      isDraw: false,
      winningCells: winResult.winningCells
    };
  }

  const legalMoves = getLegalMoves(board);
  if (legalMoves.length === 0) {
    return {
      isTerminal: true,
      winner: null,
      isDraw: true,
      winningCells: []
    };
  }

  return {
    isTerminal: false,
    winner: null,
    isDraw: false,
    winningCells: []
  };
}

/**
 * Generates a valid random mid-game board position for benchmarking
 * @param {number} numMoves Number of plies to simulate (e.g. 6 to 12)
 * @param {() => number} [rng] Optional random number generator for reproducibility
 * @returns {number[][]}
 */
export function generateRandomMidGameBoard(numMoves = 8, rng = Math.random) {
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    let currentBoard = createEmptyBoard();
    let player = PLAYER_1;
    let validGame = true;

    for (let m = 0; m < numMoves; m++) {
      const legalMoves = getLegalMoves(currentBoard);
      if (legalMoves.length === 0) {
        validGame = false;
        break;
      }
      
      // Bias slightly toward center columns to simulate realistic human/AI play
      const weights = legalMoves.map(col => {
        const distFromCenter = Math.abs(col - 3);
        return 4 - distFromCenter; // 4 for col 3, 3 for cols 2,4, etc.
      });
      const totalWeight = weights.reduce((acc, w) => acc + w, 0);
      let rand = rng() * totalWeight;
      let chosenCol = legalMoves[0];
      for (let i = 0; i < legalMoves.length; i++) {
        rand -= weights[i];
        if (rand <= 0) {
          chosenCol = legalMoves[i];
          break;
        }
      }

      currentBoard = applyMove(currentBoard, chosenCol, player);

      const winResult = checkWinner(currentBoard);
      if (winResult.winner !== null) {
        // Someone won prematurely; discard and retry
        validGame = false;
        break;
      }

      player = player === PLAYER_1 ? PLAYER_2 : PLAYER_1;
    }

    if (validGame) {
      return currentBoard;
    }
  }

  // Fallback: if all attempts had early wins, create a safe symmetrical 4-move board
  let fallback = createEmptyBoard();
  fallback = applyMove(fallback, 3, PLAYER_1);
  fallback = applyMove(fallback, 3, PLAYER_2);
  fallback = applyMove(fallback, 2, PLAYER_1);
  fallback = applyMove(fallback, 4, PLAYER_2);
  return fallback;
}
