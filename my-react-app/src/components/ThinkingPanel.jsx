import React from 'react';
import { formatNumber, formatMs } from '../utils/helpers.js';

export default function ThinkingPanel({ lastAiStats, rootScores = [], currentDepth }) {
  if (!lastAiStats) {
    return (
      <div className="panel-card thinking-panel-placeholder">
        <div className="panel-header">
          <div className="panel-title-group">
            <span className="panel-icon">🧠</span>
            <h3>AI Thinking & Metrics</h3>
          </div>
        </div>
        <p className="placeholder-text">
          Make a move to see the AI agent's decision breakdown, evaluated column scores, explored nodes, and execution time.
        </p>
      </div>
    );
  }

  const {
    algorithm,
    depth = currentDepth,
    nodesExplored = 0,
    timeMs = 0,
    prunedBranches = 0,
    chosenCol
  } = lastAiStats;

  const isAlphaBeta = algorithm.toLowerCase().includes('alpha');
  const nodesPerSec = timeMs > 0 ? Math.round((nodesExplored / (timeMs / 1000))) : 0;

  // Find min and max score for scaling bar heights
  const validScores = rootScores.filter(s => s && s.score !== undefined && !isNaN(s.score));
  const maxAbsScore = validScores.length > 0
    ? Math.max(...validScores.map(s => Math.abs(s.score)), 10)
    : 100;

  return (
    <div className="panel-card thinking-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-icon">⚡</span>
          <h3>AI Thinking & Telemetry</h3>
        </div>
        <div className={`algo-badge ${isAlphaBeta ? 'badge-alphabeta' : 'badge-minimax'}`}>
          {algorithm}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Chosen Move</span>
          <span className="metric-value highlight-col">
            Col {chosenCol !== null ? chosenCol + 1 : '-'}
            {chosenCol === 3 && <span className="col-subtext"> (Center)</span>}
          </span>
        </div>

        <div className="metric-box">
          <span className="metric-label">Nodes Explored</span>
          <span className="metric-value">{formatNumber(nodesExplored)}</span>
        </div>

        <div className="metric-box">
          <span className="metric-label">Computation Time</span>
          <span className="metric-value">{formatMs(timeMs)}</span>
        </div>

        <div className="metric-box">
          <span className="metric-label">Search Depth</span>
          <span className="metric-value">{depth} plies</span>
        </div>

        {isAlphaBeta && (
          <div className="metric-box">
            <span className="metric-label">Pruned Branches</span>
            <span className="metric-value text-emerald">{formatNumber(prunedBranches)}</span>
          </div>
        )}

        <div className="metric-box">
          <span className="metric-label">Search Speed</span>
          <span className="metric-value">{formatNumber(nodesPerSec)} <small>n/s</small></span>
        </div>
      </div>

      {/* Score Per Column Bar Chart */}
      <div className="thinking-chart-section">
        <div className="chart-header-row">
          <h4>Evaluated Heuristic Score Per Column</h4>
          <span className="chart-sub">Higher = Better for AI</span>
        </div>

        <div className="bar-chart-container">
          {Array.from({ length: 7 }).map((_, c) => {
            const entry = rootScores.find(item => item.column === c);
            const score = entry ? entry.score : null;
            const isChosen = chosenCol === c;
            const isLegal = score !== null && score !== undefined;

            // Height percentage relative to maxAbsScore
            let heightPercent = 0;
            let isPositive = true;

            if (isLegal) {
              // Cap visual scale for huge terminal win/loss values
              let clampedScore = score;
              if (clampedScore > 200) clampedScore = 200;
              if (clampedScore < -200) clampedScore = -200;

              isPositive = clampedScore >= 0;
              heightPercent = Math.min(100, Math.round((Math.abs(clampedScore) / 200) * 85) + 15);
            }

            return (
              <div
                key={`col-bar-${c}`}
                className={`chart-bar-col ${isChosen ? 'bar-chosen' : ''} ${!isLegal ? 'bar-illegal' : ''}`}
              >
                <div className="bar-track">
                  {isLegal ? (
                    <div
                      className={`score-bar ${isPositive ? 'bar-pos' : 'bar-neg'} ${isChosen ? 'bar-best' : ''}`}
                      style={{ height: `${heightPercent}%` }}
                      title={`Column ${c + 1}: Score = ${score}`}
                    >
                      <span className="bar-tooltip">{score}</span>
                    </div>
                  ) : (
                    <div className="bar-full-indicator" title="Column full">✕</div>
                  )}
                </div>
                <div className={`bar-col-label ${isChosen ? 'label-chosen' : ''}`}>
                  C{c + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
