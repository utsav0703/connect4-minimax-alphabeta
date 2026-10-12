import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Board from './components/Board.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import ThinkingPanel from './components/ThinkingPanel.jsx';
import MoveHistory from './components/MoveHistory.jsx';
import TreeView from './components/TreeView.jsx';
import Benchmark from './components/Benchmark.jsx';

import {
  ROWS,
  COLS,
  PLAYER_1,
  PLAYER_2,
  createEmptyBoard,
  getLowestEmptyRow,
  isMoveLegal,
  applyMove,
  getLegalMoves
} from './game/board.js';
import { isTerminal } from './game/rules.js';
import { chooseMove as minimaxChooseMove } from './agents/minimax.js';
import { chooseMove as alphabetaChooseMove } from './agents/alphabeta.js';
import { sfx, triggerVictoryConfetti } from './utils/helpers.js';

export default function App() {
  // Navigation
  const [activeMainTab, setActiveMainTab] = useState('game'); // 'game' | 'benchmark'

  // Game Core State
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_1);
  const [gameMode, setGameMode] = useState('human_vs_ai'); // 'human_vs_ai' | 'ai_vs_ai' | 'human_vs_human'
  const [startingPlayer, setStartingPlayer] = useState(PLAYER_1);

  // AI Configuration for Human vs AI
  const [algorithm, setAlgorithm] = useState('alphabeta'); // 'alphabeta' | 'minimax'
  const [depth, setDepth] = useState(5);

  // AI vs AI Battle Configuration
  const [aiVsAiConfig, setAiVsAiConfig] = useState({
    p1Algo: 'minimax',
    p1Depth: 4,
    p2Algo: 'alphabeta',
    p2Depth: 4,
    speedMs: 500
  });
  const [isAiPlaying, setIsAiPlaying] = useState(false);

  // Interactive UI State
  const [hoverCol, setHoverCol] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [winningCells, setWinningCells] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showTreeVisualizer, setShowTreeVisualizer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // AI Telemetry & Tree Data
  const [lastAiStats, setLastAiStats] = useState(null);
  const [rootScores, setRootScores] = useState([]);
  const [searchTree, setSearchTree] = useState(null);

  // Chronological Move History
  const [history, setHistory] = useState([]);

  // Audio mute sync
  useEffect(() => {
    sfx.muted = isMuted;
  }, [isMuted]);

  // Restart new game
  const handleNewGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(startingPlayer);
    setWinner(null);
    setIsDraw(false);
    setWinningCells([]);
    setLastMove(null);
    setIsAiThinking(false);
    setIsAiPlaying(false);
    setHistory([]);
    setLastAiStats(null);
    setRootScores([]);
    setSearchTree(null);
  }, [startingPlayer]);

  // Execute a human or AI move
  const executeMove = useCallback((col, aiStats = null, scores = [], tree = null) => {
    const landingRow = getLowestEmptyRow(board, col);
    if (landingRow === -1) return false;

    sfx.playDiscDrop(currentPlayer);

    const newBoard = applyMove(board, col, currentPlayer);
    const terminalState = isTerminal(newBoard);

    const moveRecord = {
      row: landingRow,
      col,
      player: currentPlayer,
      board: newBoard,
      stats: aiStats
    };

    setBoard(newBoard);
    setLastMove({ row: landingRow, col, player: currentPlayer });
    setHistory((prev) => [...prev, moveRecord]);

    if (aiStats) {
      setLastAiStats(aiStats);
      setRootScores(scores);
      if (tree) setSearchTree(tree);
    }

    if (terminalState.isTerminal) {
      setIsAiThinking(false);
      setIsAiPlaying(false);

      if (terminalState.winner !== null) {
        setWinner(terminalState.winner);
        setWinningCells(terminalState.winningCells);
        sfx.playWin();
        triggerVictoryConfetti();
      } else if (terminalState.isDraw) {
        setIsDraw(true);
      }
      return true;
    }

    // Switch turns
    setCurrentPlayer(currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1);
    return true;
  }, [board, currentPlayer]);

  // Handle column drop by human player
  const handleColumnClick = (col) => {
    if (winner !== null || isDraw || isAiThinking) return;

    // Check if it's currently an AI turn in Human vs AI
    if (gameMode === 'human_vs_ai') {
      const isHumanTurn = (startingPlayer === PLAYER_1 && currentPlayer === PLAYER_1) ||
                          (startingPlayer === PLAYER_2 && currentPlayer === PLAYER_2);
      if (!isHumanTurn) return;
    } else if (gameMode === 'ai_vs_ai') {
      return; // Humans don't play in AI vs AI mode
    }

    if (!isMoveLegal(board, col)) return;

    executeMove(col);
  };

  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isAiThinking) return;

    let stepsToUndo = 1;
    // In human vs AI mode, undo 2 moves (both AI and Human ply) to bring user back to their turn
    if (gameMode === 'human_vs_ai' && history.length >= 2) {
      stepsToUndo = 2;
    }

    const targetIndex = history.length - stepsToUndo - 1;

    if (targetIndex < 0) {
      handleNewGame();
      return;
    }

    const prevMove = history[targetIndex];
    setBoard(prevMove.board);
    setLastMove({ row: prevMove.row, col: prevMove.col, player: prevMove.player });
    setHistory(history.slice(0, targetIndex + 1));
    setWinner(null);
    setIsDraw(false);
    setWinningCells([]);
    setCurrentPlayer(prevMove.player === PLAYER_1 ? PLAYER_2 : PLAYER_1);
    setIsAiPlaying(false);
  };

  // Trigger AI decision calculation
  const triggerAiStep = useCallback(() => {
    if (winner !== null || isDraw || isAiThinking) return;

    let activeAlgo = algorithm;
    let activeDepth = depth;

    if (gameMode === 'ai_vs_ai') {
      if (currentPlayer === PLAYER_1) {
        activeAlgo = aiVsAiConfig.p1Algo;
        activeDepth = aiVsAiConfig.p1Depth;
      } else {
        activeAlgo = aiVsAiConfig.p2Algo;
        activeDepth = aiVsAiConfig.p2Depth;
      }
    }

    setIsAiThinking(true);

    // Run AI move calculation with non-blocking delay so browser can render thinking indicator
    setTimeout(() => {
      try {
        const agentFunc = activeAlgo === 'minimax' ? minimaxChooseMove : alphabetaChooseMove;
        const options = { buildTree: showTreeVisualizer && activeDepth <= 3 };

        const decision = agentFunc(board, currentPlayer, activeDepth, options);

        if (decision.column !== null) {
          executeMove(
            decision.column,
            { ...decision.stats, chosenCol: decision.column },
            decision.rootScores,
            decision.searchTree
          );
        }
      } catch (err) {
        console.error('Error during AI move execution:', err);
      } finally {
        setIsAiThinking(false);
      }
    }, 40);
  }, [
    winner,
    isDraw,
    isAiThinking,
    algorithm,
    depth,
    gameMode,
    currentPlayer,
    aiVsAiConfig,
    showTreeVisualizer,
    board,
    executeMove
  ]);

  // AI Turn Observer
  useEffect(() => {
    if (winner !== null || isDraw || isAiThinking) return;

    if (gameMode === 'human_vs_ai') {
      const isHumanTurn = (startingPlayer === PLAYER_1 && currentPlayer === PLAYER_1) ||
                          (startingPlayer === PLAYER_2 && currentPlayer === PLAYER_2);
      if (!isHumanTurn) {
        const timer = setTimeout(() => {
          triggerAiStep();
        }, 120);
        return () => clearTimeout(timer);
      }
    } else if (gameMode === 'ai_vs_ai' && isAiPlaying) {
      const timer = setTimeout(() => {
        triggerAiStep();
      }, aiVsAiConfig.speedMs);
      return () => clearTimeout(timer);
    }
  }, [
    currentPlayer,
    gameMode,
    startingPlayer,
    isAiPlaying,
    winner,
    isDraw,
    isAiThinking,
    aiVsAiConfig.speedMs,
    triggerAiStep
  ]);

  return (
    <div className="app-layout">
      {/* Top Cyber Navigation Bar */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">
            <span className="disc-icon disc-icon-red"></span>
            <span className="disc-icon disc-icon-yellow"></span>
          </div>
          <div className="brand-titles">
            <h1 className="main-title">CONNECT-4 AI</h1>
            <span className="subtitle">Minimax vs Alpha-Beta Pruning Laboratory</span>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <nav className="header-nav">
          <button
            className={`nav-tab ${activeMainTab === 'game' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('game')}
          >
            🎮 Play Arena
          </button>
          <button
            className={`nav-tab ${activeMainTab === 'benchmark' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('benchmark')}
          >
            ⚡ Benchmark Mode
          </button>
        </nav>
      </header>

      {/* Main Viewport Content */}
      <main className="main-content">
        {activeMainTab === 'benchmark' ? (
          <Benchmark />
        ) : (
          <div className="game-grid">
            {/* Left Column: Interactive Board & Turn Status */}
            <div className="game-board-section">
              {/* Turn Banner */}
              <div className="turn-banner">
                {winner !== null ? (
                  <div className="banner-status status-winner">
                    🎉 <strong className={winner === PLAYER_1 ? 'text-red' : 'text-yellow'}>
                      {winner === PLAYER_1 ? 'Red (Player 1)' : 'Yellow (Player 2)'}
                    </strong> WINS THE GAME!
                  </div>
                ) : isDraw ? (
                  <div className="banner-status status-draw">
                    🤝 STALEMATE: Board is full!
                  </div>
                ) : (
                  <div className="banner-status">
                    <span className={`turn-indicator-disc ${currentPlayer === PLAYER_1 ? 'disc-red' : 'disc-yellow'}`} />
                    <span>
                      {currentPlayer === PLAYER_1 ? "Red's Turn" : "Yellow's Turn"}
                      {isAiThinking && <span className="thinking-pulse"> (AI Computing Move...)</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* The Connect-4 Board */}
              <Board
                board={board}
                onColumnClick={handleColumnClick}
                hoverCol={hoverCol}
                setHoverCol={setHoverCol}
                disabled={winner !== null || isDraw || isAiThinking}
                currentPlayer={currentPlayer}
                winningCells={winningCells}
                lastMove={lastMove}
              />

              {/* Collapsible Search Tree View for Depths 1-3 */}
              {showTreeVisualizer && (
                <TreeView
                  searchTree={searchTree}
                  algorithm={lastAiStats?.algorithm || algorithm}
                  depth={depth}
                />
              )}
            </div>

            {/* Right Column: Controls, Telemetry & Move History */}
            <div className="game-sidebar">
              <ControlPanel
                gameMode={gameMode}
                setGameMode={(mode) => {
                  setGameMode(mode);
                  handleNewGame();
                }}
                algorithm={algorithm}
                setAlgorithm={setAlgorithm}
                depth={depth}
                setDepth={setDepth}
                aiVsAiConfig={aiVsAiConfig}
                setAiVsAiConfig={setAiVsAiConfig}
                startingPlayer={startingPlayer}
                setStartingPlayer={(p) => {
                  setStartingPlayer(p);
                  handleNewGame();
                }}
                onNewGame={handleNewGame}
                onUndo={handleUndo}
                canUndo={history.length > 0}
                isAiPlaying={isAiPlaying}
                setIsAiPlaying={setIsAiPlaying}
                onStepAiMove={triggerAiStep}
                isAiThinking={isAiThinking}
                showTreeVisualizer={showTreeVisualizer}
                setShowTreeVisualizer={setShowTreeVisualizer}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
              />

              <ThinkingPanel
                lastAiStats={lastAiStats}
                rootScores={rootScores}
                currentDepth={depth}
              />

              <MoveHistory history={history} />
            </div>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="app-footer">
        <div>
          Connect-4 Adversarial Search Engine • Minimax O(b<sup>d</sup>) vs Alpha-Beta Pruning O(b<sup>d/2</sup>)
        </div>
        <div className="footer-links">
          <span>Standard 6x7 Grid</span> • <span>Heuristic 4-Cell Window Evaluation</span> • <span>Web Worker Multithreading</span>
        </div>
      </footer>
    </div>
  );
}
