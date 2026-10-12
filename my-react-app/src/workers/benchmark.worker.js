/**
 * Web Worker for Benchmarking Minimax vs Alpha-Beta Pruning
 * 
 * Runs intensive comparisons across multiple game positions and depths
 * on a background thread so the browser UI remains completely fluid and responsive.
 */

import { chooseMove as chooseMoveMinimax } from '../agents/minimax.js';
import { chooseMove as chooseMoveAlphaBeta } from '../agents/alphabeta.js';
import { generateRandomMidGameBoard } from '../game/rules.js';
import { PLAYER_1 } from '../game/board.js';
import { createRng } from '../utils/helpers.js';

let isCancelled = false;

self.onmessage = function (e) {
  const { type } = e.data;

  if (type === 'CANCEL') {
    isCancelled = true;
    return;
  }

  if (type === 'START_BENCHMARK') {
    isCancelled = false;
    const depths = e.data.depths || [1, 2, 3, 4, 5, 6, 7];
    const numPositions = e.data.numPositions || 30;
    const seed = e.data.seed || 4242;

    runBenchmark(depths, numPositions, seed);
  }
};

/**
 * Executes benchmark across selected depths and positions
 * 
 * @param {number[]} depths 
 * @param {number} numPositions 
 * @param {number} seed 
 */
function runBenchmark(depths, numPositions, seed) {
  const rng = createRng(seed);

  // 1. Generate identical test positions upfront
  const positions = [];
  for (let i = 0; i < numPositions; i++) {
    // Generate mid-game boards with 6 to 12 moves played
    const plies = 6 + Math.floor(rng() * 7);
    const board = generateRandomMidGameBoard(plies, rng);
    positions.push(board);
  }

  const allResults = [];
  const totalSteps = depths.length * numPositions;
  let completedSteps = 0;

  for (let dIdx = 0; dIdx < depths.length; dIdx++) {
    const depth = depths[dIdx];

    let totalMinimaxNodes = 0;
    let totalAlphaBetaNodes = 0;
    let totalMinimaxTime = 0;
    let totalAlphaBetaTime = 0;
    let matchedMovesCount = 0;

    for (let pIdx = 0; pIdx < numPositions; pIdx++) {
      if (isCancelled) {
        self.postMessage({ type: 'CANCELLED' });
        return;
      }

      const board = positions[pIdx];

      // Run Minimax
      const mmResult = chooseMoveMinimax(board, PLAYER_1, depth);
      totalMinimaxNodes += mmResult.stats.nodesExplored;
      totalMinimaxTime += mmResult.stats.timeMs;

      // Run Alpha-Beta
      const abResult = chooseMoveAlphaBeta(board, PLAYER_1, depth);
      totalAlphaBetaNodes += abResult.stats.nodesExplored;
      totalAlphaBetaTime += abResult.stats.timeMs;

      // Verify that both agents selected the exact same move
      if (mmResult.column === abResult.column) {
        matchedMovesCount++;
      }

      completedSteps++;

      // Post progress report
      const percent = Math.round((completedSteps / totalSteps) * 100);
      self.postMessage({
        type: 'PROGRESS',
        currentDepth: depth,
        totalDepths: depths.length,
        currentPosIndex: pIdx + 1,
        totalPositions: numPositions,
        percent,
        statusText: `Depth ${depth}/${depths[depths.length - 1]} • Position ${pIdx + 1}/${numPositions} (${percent}%)`
      });
    }

    // Calculate averages for this depth
    const avgMinimaxNodes = Math.round(totalMinimaxNodes / numPositions);
    const avgAlphaBetaNodes = Math.round(totalAlphaBetaNodes / numPositions);
    const avgMinimaxTime = Number((totalMinimaxTime / numPositions).toFixed(2));
    const avgAlphaBetaTime = Number((totalAlphaBetaTime / numPositions).toFixed(2));

    const nodesSavedPercent = avgMinimaxNodes > 0
      ? Number((((avgMinimaxNodes - avgAlphaBetaNodes) / avgMinimaxNodes) * 100).toFixed(1))
      : 0;

    const speedupFactor = avgAlphaBetaTime > 0
      ? Number((avgMinimaxTime / avgAlphaBetaTime).toFixed(2))
      : 1.0;

    const sameMovePercent = Number(((matchedMovesCount / numPositions) * 100).toFixed(1));

    const depthRow = {
      depth,
      minimaxNodes: avgMinimaxNodes,
      alphabetaNodes: avgAlphaBetaNodes,
      nodesSavedPercent,
      minimaxTimeMs: avgMinimaxTime,
      alphabetaTimeMs: avgAlphaBetaTime,
      speedupFactor,
      sameMovePercent,
      positionsTested: numPositions
    };

    allResults.push(depthRow);

    // Notify UI of depth row completion
    self.postMessage({
      type: 'DEPTH_COMPLETE',
      depthRow
    });
  }

  // Final summary notification
  const allMovesMatched = allResults.every(r => r.sameMovePercent === 100);

  self.postMessage({
    type: 'COMPLETE',
    results: allResults,
    summary: {
      totalPositionsTested: numPositions,
      allMovesMatched,
      depthsTested: depths
    }
  });
}
