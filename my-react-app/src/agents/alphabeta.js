/**
 * Alpha-Beta Pruning Agent for Connect-4
 * 
 * Algorithm Explanation:
 * Alpha-Beta pruning is an adversarial search optimization that dramatically reduces the number
 * of nodes evaluated by the Minimax algorithm without altering the final optimal move.
 * 
 * Core Concept:
 * - Alpha (α): The best (highest) score that the MAXIMIZING player is guaranteed so far.
 * - Beta (β): The best (lowest) score that the MINIMIZING player is guaranteed so far.
 * 
 * Cut-off Conditions:
 * 1. Beta Cut-off (at Maximizing level):
 *    If the current child evaluation exceeds or equals β (eval >= β), the minimizing parent
 *    already has a known alternate move that yields a lower or equal value (β).
 *    Therefore, the parent will never allow gameplay to enter this branch.
 *    Further sibling moves at this level can be safely PRUNED.
 * 
 * 2. Alpha Cut-off (at Minimizing level):
 *    If the current child evaluation drops to or below α (eval <= α), the maximizing parent
 *    already has a known alternate move that yields a higher or equal value (α).
 *    Therefore, the parent will never allow gameplay to enter this branch.
 *    Further sibling moves at this level can be safely PRUNED.
 * 
 * Move Ordering:
 * The efficiency of pruning relies heavily on exploring the best moves first.
 * In Connect-4, pieces in center columns (Col 3, then 2 & 4, etc.) participate in far more
 * potential 4-in-a-row connections. By exploring moves in CENTER_MOVE_ORDER ([3, 2, 4, 1, 5, 0, 6]),
 * we discover high-value moves early, tightening the [α, β] bounds rapidly and triggering maximum cut-offs.
 * 
 * Complexity:
 * - Worst Case (poor move ordering): O(b^d) (equivalent to standard Minimax).
 * - Best Case (optimal move ordering): O(b^(d/2)), effectively doubling the searchable depth
 *   for the same computational budget!
 */

import { getOrderedLegalMoves, applyMove, PLAYER_1, PLAYER_2 } from '../game/board.js';
import { isTerminal } from '../game/rules.js';
import { evaluateBoard } from '../game/heuristic.js';

/**
 * Alpha-Beta recursive search function
 * 
 * @param {number[][]} board Current board state
 * @param {number} depth Remaining search depth
 * @param {number} alpha Current lower bound for maximizing player
 * @param {number} beta Current upper bound for minimizing player
 * @param {boolean} isMaximizing True if maximizing player's turn
 * @param {number} originalPlayer The player initiating the search
 * @param {Object} stats Reference object tracking nodes visited and cutoffs
 * @param {Object|null} treeNode Optional node for search tree visualization
 * @returns {number} Evaluated score
 */
function alphabeta(board, depth, alpha, beta, isMaximizing, originalPlayer, stats, treeNode = null) {
  stats.nodesExplored++;

  const opponent = originalPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1;
  const terminalState = isTerminal(board);

  // Base Case 1: Terminal game state (Win, Loss, or Draw)
  if (terminalState.isTerminal) {
    const score = evaluateBoard(board, originalPlayer, depth);
    if (treeNode) {
      treeNode.score = score;
      treeNode.isTerminal = true;
      treeNode.alpha = alpha;
      treeNode.beta = beta;
    }
    return score;
  }

  // Base Case 2: Depth limit reached - invoke heuristic evaluation function
  if (depth === 0) {
    const score = evaluateBoard(board, originalPlayer, depth);
    if (treeNode) {
      treeNode.score = score;
      treeNode.alpha = alpha;
      treeNode.beta = beta;
    }
    return score;
  }

  // Explore moves ordered by center priority to maximize early pruning
  const legalMoves = getOrderedLegalMoves(board);

  if (legalMoves.length === 0) {
    const score = evaluateBoard(board, originalPlayer, depth);
    if (treeNode) {
      treeNode.score = score;
      treeNode.alpha = alpha;
      treeNode.beta = beta;
    }
    return score;
  }

  if (isMaximizing) {
    // ------------------------------------------------------------------
    // MAXIMIZING LEVEL (AI seeks the maximum score)
    // ------------------------------------------------------------------
    let maxEval = -Infinity;

    for (let i = 0; i < legalMoves.length; i++) {
      const col = legalMoves[i];
      const nextBoard = applyMove(board, col, originalPlayer);

      let childNode = null;
      if (treeNode) {
        childNode = {
          id: `ab-node-${stats.nodesExplored}-${depth}-${col}`,
          col,
          depth,
          isMaximizing: false,
          player: originalPlayer,
          score: null,
          alpha,
          beta,
          pruned: false,
          children: []
        };
        treeNode.children.push(childNode);
      }

      const evaluation = alphabeta(nextBoard, depth - 1, alpha, beta, false, originalPlayer, stats, childNode);

      if (evaluation > maxEval) {
        maxEval = evaluation;
      }

      alpha = Math.max(alpha, evaluation);
      if (childNode) {
        childNode.alpha = alpha;
        childNode.beta = beta;
      }

      // BETA CUT-OFF CONDITION:
      // If alpha >= beta, the minimizing parent will avoid this branch
      // because it already has a move leading to a score <= beta.
      if (alpha >= beta) {
        stats.prunedBranches++;

        // Mark remaining unvisited siblings as PRUNED for visualizer
        if (treeNode) {
          for (let j = i + 1; j < legalMoves.length; j++) {
            treeNode.children.push({
              id: `ab-pruned-${stats.nodesExplored}-${depth}-${legalMoves[j]}`,
              col: legalMoves[j],
              depth: depth - 1,
              isMaximizing: false,
              player: originalPlayer,
              score: null,
              alpha,
              beta,
              pruned: true,
              pruneReason: `Beta Cut-off (α=${alpha} >= β=${beta})`,
              children: []
            });
          }
        }
        break; // Stop evaluating remaining sibling moves
      }
    }

    if (treeNode) {
      treeNode.score = maxEval;
      treeNode.alpha = alpha;
      treeNode.beta = beta;
    }
    return maxEval;
  } else {
    // ------------------------------------------------------------------
    // MINIMIZING LEVEL (Opponent seeks to minimize AI's score)
    // ------------------------------------------------------------------
    let minEval = Infinity;

    for (let i = 0; i < legalMoves.length; i++) {
      const col = legalMoves[i];
      const nextBoard = applyMove(board, col, opponent);

      let childNode = null;
      if (treeNode) {
        childNode = {
          id: `ab-node-${stats.nodesExplored}-${depth}-${col}`,
          col,
          depth,
          isMaximizing: true,
          player: opponent,
          score: null,
          alpha,
          beta,
          pruned: false,
          children: []
        };
        treeNode.children.push(childNode);
      }

      const evaluation = alphabeta(nextBoard, depth - 1, alpha, beta, true, originalPlayer, stats, childNode);

      if (evaluation < minEval) {
        minEval = evaluation;
      }

      beta = Math.min(beta, evaluation);
      if (childNode) {
        childNode.alpha = alpha;
        childNode.beta = beta;
      }

      // ALPHA CUT-OFF CONDITION:
      // If beta <= alpha, the maximizing parent will avoid this branch
      // because it already has a move leading to a score >= alpha.
      if (beta <= alpha) {
        stats.prunedBranches++;

        // Mark remaining unvisited siblings as PRUNED for visualizer
        if (treeNode) {
          for (let j = i + 1; j < legalMoves.length; j++) {
            treeNode.children.push({
              id: `ab-pruned-${stats.nodesExplored}-${depth}-${legalMoves[j]}`,
              col: legalMoves[j],
              depth: depth - 1,
              isMaximizing: true,
              player: opponent,
              score: null,
              alpha,
              beta,
              pruned: true,
              pruneReason: `Alpha Cut-off (β=${beta} <= α=${alpha})`,
              children: []
            });
          }
        }
        break; // Stop evaluating remaining sibling moves
      }
    }

    if (treeNode) {
      treeNode.score = minEval;
      treeNode.alpha = alpha;
      treeNode.beta = beta;
    }
    return minEval;
  }
}

/**
 * Interface function: chooseMove
 * 
 * Evaluates legal moves at root level using Alpha-Beta Pruning.
 * Guarantees identical move selection to Minimax at the same depth.
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
        algorithm: 'Alpha-Beta',
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
        algorithm: 'Alpha-Beta',
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
      alpha: -Infinity,
      beta: Infinity,
      pruned: false,
      children: []
    };
  }

  let bestMove = legalMoves[0];
  let maxScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;
  const rootScores = [];

  // Evaluate each legal move at root level
  for (let i = 0; i < legalMoves.length; i++) {
    const col = legalMoves[i];
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
        alpha,
        beta,
        pruned: false,
        children: []
      };
      rootTreeNode.children.push(childNode);
    }

    // Call alphabeta on child
    const score = alphabeta(nextBoard, depth - 1, alpha, beta, false, player, stats, childNode);

    stats.columnScores[col] = score;
    rootScores.push({ column: col, score });

    if (score > maxScore) {
      maxScore = score;
      bestMove = col;
    }

    // Tighten alpha bound at root
    alpha = Math.max(alpha, score);
    if (rootTreeNode) {
      rootTreeNode.alpha = alpha;
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
      algorithm: 'Alpha-Beta',
      depth,
      nodesExplored: stats.nodesExplored,
      timeMs,
      columnScores: stats.columnScores,
      prunedBranches: stats.prunedBranches
    },
    rootScores,
    searchTree: rootTreeNode
  };
}
