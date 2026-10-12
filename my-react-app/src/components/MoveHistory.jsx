import React from 'react';
import { PLAYER_1 } from '../game/board.js';
import { formatNumber, formatMs } from '../utils/helpers.js';

export default function MoveHistory({ history = [], currentStepIndex, onSelectStep }) {
  if (history.length === 0) {
    return (
      <div className="panel-card history-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <span className="panel-icon">📜</span>
            <h3>Move History</h3>
          </div>
        </div>
        <p className="placeholder-text">No moves played yet. Drop a disc to begin!</p>
      </div>
    );
  }

  return (
    <div className="panel-card history-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-icon">📜</span>
          <h3>Move History ({history.length} plies)</h3>
        </div>
      </div>

      <div className="history-list">
        {history.map((item, idx) => {
          const isSelected = currentStepIndex === idx;
          const isRed = item.player === PLAYER_1;

          return (
            <div
              key={`move-${idx}`}
              className={`history-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectStep && onSelectStep(idx)}
            >
              <div className="history-index">#{idx + 1}</div>
              <div className={`history-disc ${isRed ? 'disc-red' : 'disc-yellow'}`} />
              <div className="history-info">
                <span className="history-col">
                  Col {item.col + 1}
                  {item.col === 3 && <small className="text-muted"> (Center)</small>}
                </span>
                {item.stats && (
                  <span className="history-ai-telemetry">
                    <span className="algo-mini-badge">{item.stats.algorithm}</span>
                    <span className="nodes-mini">{formatNumber(item.stats.nodesExplored)} nodes</span>
                    <span className="time-mini">{formatMs(item.stats.timeMs)}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
