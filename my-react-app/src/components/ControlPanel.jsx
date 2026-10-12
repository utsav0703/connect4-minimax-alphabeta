import React from 'react';
import { PLAYER_1, PLAYER_2 } from '../game/board.js';

export default function ControlPanel({
  gameMode,
  setGameMode,
  algorithm,
  setAlgorithm,
  depth,
  setDepth,
  aiVsAiConfig,
  setAiVsAiConfig,
  startingPlayer,
  setStartingPlayer,
  onNewGame,
  onUndo,
  canUndo,
  isAiPlaying,
  setIsAiPlaying,
  onStepAiMove,
  isAiThinking,
  showTreeVisualizer,
  setShowTreeVisualizer,
  isMuted,
  setIsMuted
}) {
  const getDepthLabel = (d) => {
    if (d <= 2) return 'Fast / Shallow';
    if (d <= 4) return 'Balanced';
    if (d <= 6) return 'Advanced';
    return 'Deep / Master';
  };

  return (
    <div className="panel-card control-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-icon">⚙️</span>
          <h3>Game Setup & Controls</h3>
        </div>
        <button
          className="icon-btn"
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="control-group">
        <label className="control-label">Game Mode</label>
        <div className="pill-tabs">
          <button
            className={`pill-tab ${gameMode === 'human_vs_ai' ? 'active' : ''}`}
            onClick={() => setGameMode('human_vs_ai')}
          >
            Human vs AI
          </button>
          <button
            className={`pill-tab ${gameMode === 'ai_vs_ai' ? 'active' : ''}`}
            onClick={() => setGameMode('ai_vs_ai')}
          >
            AI vs AI (Battle)
          </button>
          <button
            className={`pill-tab ${gameMode === 'human_vs_human' ? 'active' : ''}`}
            onClick={() => setGameMode('human_vs_human')}
          >
            2-Player Local
          </button>
        </div>
      </div>

      {/* Human vs AI Configuration */}
      {gameMode === 'human_vs_ai' && (
        <>
          <div className="control-group">
            <label className="control-label">AI Agent Algorithm</label>
            <div className="pill-tabs">
              <button
                className={`pill-tab ${algorithm === 'alphabeta' ? 'active' : ''}`}
                onClick={() => setAlgorithm('alphabeta')}
              >
                Alpha-Beta Pruning
              </button>
              <button
                className={`pill-tab ${algorithm === 'minimax' ? 'active' : ''}`}
                onClick={() => setAlgorithm('minimax')}
              >
                Minimax (Exhaustive)
              </button>
            </div>
          </div>

          <div className="control-group">
            <div className="slider-label-row">
              <span className="control-label">AI Search Depth</span>
              <span className="slider-badge">
                Depth {depth} ({getDepthLabel(depth)})
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="custom-slider"
            />
            <div className="slider-ticks">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">First Turn (Red Disc)</label>
            <div className="pill-tabs">
              <button
                className={`pill-tab ${startingPlayer === PLAYER_1 ? 'active' : ''}`}
                onClick={() => setStartingPlayer(PLAYER_1)}
              >
                Human Starts (Red)
              </button>
              <button
                className={`pill-tab ${startingPlayer === PLAYER_2 ? 'active' : ''}`}
                onClick={() => setStartingPlayer(PLAYER_2)}
              >
                AI Starts (Red)
              </button>
            </div>
          </div>
        </>
      )}

      {/* AI vs AI (Agent Battle) Configuration */}
      {gameMode === 'ai_vs_ai' && (
        <div className="ai-battle-settings">
          <div className="ai-player-card card-red">
            <div className="card-tag red-tag">Red (Player 1)</div>
            <div className="select-row">
              <select
                value={aiVsAiConfig.p1Algo}
                onChange={(e) =>
                  setAiVsAiConfig({ ...aiVsAiConfig, p1Algo: e.target.value })
                }
                className="custom-select"
              >
                <option value="minimax">Minimax</option>
                <option value="alphabeta">Alpha-Beta</option>
              </select>
              <select
                value={aiVsAiConfig.p1Depth}
                onChange={(e) =>
                  setAiVsAiConfig({ ...aiVsAiConfig, p1Depth: Number(e.target.value) })
                }
                className="custom-select"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    Depth {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ai-player-card card-yellow">
            <div className="card-tag yellow-tag">Yellow (Player 2)</div>
            <div className="select-row">
              <select
                value={aiVsAiConfig.p2Algo}
                onChange={(e) =>
                  setAiVsAiConfig({ ...aiVsAiConfig, p2Algo: e.target.value })
                }
                className="custom-select"
              >
                <option value="alphabeta">Alpha-Beta</option>
                <option value="minimax">Minimax</option>
              </select>
              <select
                value={aiVsAiConfig.p2Depth}
                onChange={(e) =>
                  setAiVsAiConfig({ ...aiVsAiConfig, p2Depth: Number(e.target.value) })
                }
                className="custom-select"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    Depth {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="control-group">
            <div className="slider-label-row">
              <span className="control-label">AI Move Delay</span>
              <span className="slider-badge">{aiVsAiConfig.speedMs} ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={aiVsAiConfig.speedMs}
              onChange={(e) =>
                setAiVsAiConfig({ ...aiVsAiConfig, speedMs: Number(e.target.value) })
              }
              className="custom-slider"
            />
          </div>

          {/* AI vs AI Battle Buttons */}
          <div className="battle-action-row">
            <button
              className={`primary-btn ${isAiPlaying ? 'btn-pause' : 'btn-play'}`}
              onClick={() => setIsAiPlaying(!isAiPlaying)}
            >
              {isAiPlaying ? '⏸ Pause Battle' : '▶ Auto-Play Battle'}
            </button>
            <button
              className="secondary-btn"
              onClick={onStepAiMove}
              disabled={isAiPlaying || isAiThinking}
            >
              ⏭ Step 1 Move
            </button>
          </div>
        </div>
      )}

      {/* Tree Visualization Toggle (Depths 1-3) */}
      <div className="tree-toggle-row">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={showTreeVisualizer}
            onChange={(e) => setShowTreeVisualizer(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="toggle-label">
          Search Tree Visualizer {depth > 3 && <span className="dim-text">(Active for depth ≤ 3)</span>}
        </span>
      </div>

      {/* Primary Action Buttons */}
      <div className="primary-actions">
        <button className="new-game-btn" onClick={onNewGame}>
          🔄 New Game
        </button>
        <button
          className="undo-btn"
          onClick={onUndo}
          disabled={!canUndo || isAiThinking}
        >
          ↩ Undo Move
        </button>
      </div>
    </div>
  );
}
