/**
 * Minimax Agent for Connect-4
 * 
 * Algorithm Explanation:
 * Minimax is a recursive backtracking algorithm used in decision theory and zero-sum game theory.
 * It provides an optimal move for the active player assuming that the opponent also plays optimally.
 * 
 * Maximizing Level:
 * - Represents the AI player's turn.
 * - Chooses the child move that yields the MAXIMUM heuristic evaluation.
 * 
 * Minimizing Level:
 * - Represents the opponent's turn.
 * - Chooses the child move that yields the MINIMUM heuristic evaluation (worst outcome for the AI).
 * 
 * Complexity:
 * - Time Complexity: O(b^d), where b is the branching factor (up to 7 for Connect-4)
 *   and d is the search depth.
 * - Space Complexity: O(b * d) recursion stack depth.
 * 
 * Unlike Alpha-Beta pruning, Minimax exhaustively explores every possible state in the game tree
 * up to the depth limit, serving as the ground truth benchmark for optimal decision-making.
 */

import { getOrderedLegalMoves, applyMove, PLAYER_1, PLAYER_2 } from '../game/board.js';
import { isTerminal } from '../game/rules.js';
import { evaluateBoard } from '../game/heuristic.js';

/**
 * Minimax recursive search function
 * 
 * @param {number[][]} board Current board state
 * @param {number} depth Remaining search depth
 * @param {boolean} isMaximizing True if evaluating for maximizing player (AI)
 * @param {number} originalPlayer The player initiating the search
 * @param {Object} stats Reference object tracking nodes visited
 * @param {Object|null} treeNode Optional node for search tree visualization
 * @returns {number} Evaluated score
 */
function minimax(board, depth, isMaximizing, originalPlayer, stats, treeNode = null) {
  stats.nodesExplored++;

  const opponent = originalPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1;
  const terminalState = isTerminal(board);

  // Base Case 1: Terminal game state (Win, Loss, or Draw)
  if (terminalState.isTerminal) {
    const score = evaluateBoard(board, originalPlayer, depth);
    if (treeNode) {
      treeNode.score = score;
      treeNode.isTerminal = true;
    }
    return score;
  }

  // Base Case 2: Depth limit reached - invoke heuristic evaluation function
  if (depth === 0) {
    const score = evaluateBoard(board, originalPlayer, depth);
    if (treeNode) {
      treeNode.score = score;
    }
    return score;
  }

  const legalMoves = getOrderedLegalMoves(board);

  // If no moves available (should be handled by terminal check, but safe fallback)
  if (legalMoves.length === 0) {
    const score = evaluateBoard(board, originalPlayer, depth);
    if (treeNode) treeNode.score = score;
    return score;
  }

  if (isMaximizing) {
    // -------------------------------------------------------------
    // MAXIMIZING PLAYER LEVEL (AI wants to maximize its own score)
    // -------------------------------------------------------------
    let maxEval = -Infinity;

    for (const col of legalMoves) {
      const nextBoard = applyMove(board, col, originalPlayer);

      let childNode = null;
      if (treeNode) {
        childNode = {
          id: `node-${stats.nodesExplored}-${depth}-${col}`,
          col,
          depth,
          isMaximizing: false,
          player: originalPlayer,
          score: null,
          pruned: false,
          children: []
        };
        treeNode.children.push(childNode);
      }

      const evaluation = minimax(nextBoard, depth - 1, false, originalPlayer, stats, childNode);
      if (evaluation > maxEval) {
        maxEval = evaluation;
      }
    }

    if (treeNode) treeNode.score = maxEval;
    return maxEval;
  } else {
    // -------------------------------------------------------------
    // MINIMIZING PLAYER LEVEL (Opponent wants to minimize AI's score)
    // -------------------------------------------------------------
    let minEval = Infinity;

    for (const col of legalMoves) {
      const nextBoard = applyMove(board, col, opponent);

      let childNode = null;
      if (treeNode) {
        childNode = {
          id: `node-${stats.nodesExplored}-${depth}-${col}`,
          col,
          depth,
          isMaximizing: true,
          player: opponent,
          score: null,
          pruned: false,
          children: []
        };
        treeNode.children.push(childNode);
      }

      const evaluation = minimax(nextBoard, depth - 1, true, originalPlayer, stats, childNode);
      if (evaluation < minEval) {
        minEval = evaluation;
      }
    }

    if (treeNode) treeNode.score = minEval;
    return minEval;
  }
}

/**
 * Interface function: chooseMove
 * 
 * Evaluates all legal moves at root level using depth-limited Minimax.
 * 
 * @param {number[][]} board 6x7 grid
 * @param {number} player Active player (PLAYER_1 or PLAYER_2)
 * @param {number} depth Search depth (1 to 8)
 * @param {Object} [options] Optional settings { buildTree: boolean }
 * @returns {{ column: number, stats: Object, rootScores: Array<{ column: number, score: number }>, searchTree?: Object }}
 */
export function chooseMove(board, player, depth, options = {}) {
  const startTime = performance.now();
  const legalMoves = getOrderedLegalMoves(board);

  if (legalMoves.length === 0) {
    return {
      column: null,
      stats: {
        algorithm: 'Minimax',
        depth,
        nodesExplored: 0,
        timeMs: 0,
        columnScores: {},
        prunedBranches: 0
      },
      rootScores: []
    };
  }

  // Quick check: if only 1 move is legal, take it directly
  if (legalMoves.length === 1) {
    return {
      column: legalMoves[0],
      stats: {
        algorithm: 'Minimax',
        depth,
        nodesExplored: 1,
        timeMs: 0.1,
        columnScores: { [legalMoves[0]]: 0 },
        prunedBranches: 0
      },
      rootScores: [{ column: legalMoves[0], score: 0 }]
    };
  }

  const stats = {
    nodesExplored: 0,
    columnScores: {},
    prunedBranches: 0
  };

  let rootTreeNode = null;
  if (options.buildTree && depth <= 3) {
    rootTreeNode = {
      id: 'root',
      col: 'Root',
      depth,
      isMaximizing: true,
      player,
      score: null,
      pruned: false,
      children: []
    };
  }

  let bestMove = legalMoves[0];
  let maxScore = -Infinity;
  const rootScores = [];

  // Evaluate each legal move at root (depth - 1 for child recursive search)
  for (const col of legalMoves) {
    const nextBoard = applyMove(board, col, player);

    let childNode = null;
    if (rootTreeNode) {
      childNode = {
        id: `root-col-${col}`,
        col,
        depth: depth - 1,
        isMaximizing: false,
        player,
        score: null,
        pruned: false,
        children: []
      };
      rootTreeNode.children.push(childNode);
    }

    // Minimax search on child (opponent's turn to minimize)
    const score = minimax(nextBoard, depth - 1, false, player, stats, childNode);

    stats.columnScores[col] = score;
    rootScores.push({ column: col, score });

    // Strictly strictly greater: deterministic tie-breaking based on center order
    if (score > maxScore) {
      maxScore = score;
      bestMove = col;
    }
  }

  if (rootTreeNode) {
    rootTreeNode.score = maxScore;
  }

  const endTime = performance.now();
  const timeMs = Number((endTime - startTime).toFixed(2));

  // Sort rootScores by column number (0..6) for clean charting in UI
  rootScores.sort((a, b) => a.column - b.column);

  return {
    column: bestMove,
    stats: {
      algorithm: 'Minimax',
      depth,
      nodesExplored: stats.nodesExplored,
      timeMs,
      columnScores: stats.columnScores,
      prunedBranches: 0
    },
    rootScores,
    searchTree: rootTreeNode
  };
}
