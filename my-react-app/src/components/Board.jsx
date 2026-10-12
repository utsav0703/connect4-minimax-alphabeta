import React from 'react';
import { ROWS, COLS, EMPTY, PLAYER_1, PLAYER_2, getLowestEmptyRow } from '../game/board.js';

export default function Board({
  board,
  onColumnClick,
  hoverCol,
  setHoverCol,
  disabled,
  currentPlayer,
  winningCells = [],
  lastMove = null
}) {
  // Set of winning cell coordinates for O(1) lookup
  const winningSet = new Set(winningCells.map(([r, c]) => `${r},${c}`));

  // Determine landing row for hover indicator ghost piece
  const ghostRow = hoverCol !== null ? getLowestEmptyRow(board, hoverCol) : -1;

  const handleCellClick = (col) => {
    if (disabled) return;
    onColumnClick(col);
  };

  return (
    <div className="board-wrapper">
      {/* Top indicator track showing ghost hover disc */}
      <div className="board-indicator-track">
        {Array.from({ length: COLS }).map((_, c) => {
          const isHovered = hoverCol === c && !disabled && ghostRow !== -1;
          return (
            <div
              key={`ind-${c}`}
              className="indicator-slot"
              onClick={() => handleCellClick(c)}
              onMouseEnter={() => !disabled && setHoverCol(c)}
            >
              {isHovered && (
                <div
                  className={`ghost-disc player-${currentPlayer}`}
                  title={`Drop in Column ${c + 1}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Connect-4 Grid Board */}
      <div 
        className="connect4-board" 
        onMouseLeave={() => setHoverCol(null)}
      >
        {board.map((row, r) => (
          <div key={`row-${r}`} className="board-row">
            {row.map((cellValue, c) => {
              const isWinning = winningSet.has(`${r},${c}`);
              const isGhost = hoverCol === c && ghostRow === r && !disabled && cellValue === EMPTY;
              const isNewest = lastMove && lastMove.row === r && lastMove.col === c;

              let discClass = 'empty';
              if (cellValue === PLAYER_1) discClass = 'disc-red';
              else if (cellValue === PLAYER_2) discClass = 'disc-yellow';
              else if (isGhost) discClass = `disc-ghost player-${currentPlayer}`;

              return (
                <div
                  key={`cell-${r}-${c}`}
                  className={`board-slot ${isWinning ? 'winning-slot' : ''}`}
                  onClick={() => handleCellClick(c)}
                  onMouseEnter={() => !disabled && setHoverCol(c)}
                  data-col={c}
                  data-row={r}
                >
                  <div className="slot-hole">
                    {cellValue !== EMPTY && (
                      <div
                        className={`disc ${discClass} ${isWinning ? 'winning-disc' : ''} ${isNewest ? 'anim-drop' : ''}`}
                        style={{
                          '--drop-row': r
                        }}
                      >
                        <div className="disc-inner-ring" />
                        {isWinning && <div className="win-crown-icon">★</div>}
                      </div>
                    )}

                    {isGhost && (
                      <div className={`disc disc-ghost player-${currentPlayer}`}>
                        <div className="disc-inner-ring" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Column labels 1 to 7 */}
      <div className="board-column-labels">
        {Array.from({ length: COLS }).map((_, c) => (
          <button
            key={`col-btn-${c}`}
            className={`col-number-btn ${hoverCol === c && !disabled ? 'active' : ''}`}
            onClick={() => handleCellClick(c)}
            disabled={disabled || board[0][c] !== EMPTY}
            title={`Column ${c + 1}`}
          >
            {c + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
