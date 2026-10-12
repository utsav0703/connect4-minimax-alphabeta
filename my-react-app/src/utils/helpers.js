/**
 * General UI and Math Helper Utilities
 */

import confetti from 'canvas-confetti';

/**
 * Formats a number with comma separators (e.g. 1,420,890)
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString();
}

/**
 * Formats milliseconds into clean human-readable text
 * @param {number} ms 
 * @returns {string}
 */
export function formatMs(ms) {
  if (ms === null || ms === undefined) return '0.0 ms';
  if (ms < 1) return `${(ms).toFixed(2)} ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Formats percentage
 * @param {number} val 
 * @returns {string}
 */
export function formatPercent(val) {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${Number(val).toFixed(1)}%`;
}

/**
 * Converts benchmark result rows into CSV format and initiates browser download
 * @param {Array<Object>} benchmarkRows 
 * @param {string} [filename='connect4_benchmark_results.csv']
 */
export function exportBenchmarkToCSV(benchmarkRows, filename = 'connect4_benchmark_results.csv') {
  if (!benchmarkRows || benchmarkRows.length === 0) return;

  const headers = [
    'Depth',
    'Minimax Nodes',
    'Alpha-Beta Nodes',
    'Nodes Saved (%)',
    'Minimax Time (ms)',
    'Alpha-Beta Time (ms)',
    'Speedup Factor',
    'Same Move Match (%)',
    'Positions Tested'
  ];

  const csvRows = [headers.join(',')];

  benchmarkRows.forEach(row => {
    const values = [
      row.depth,
      row.minimaxNodes,
      row.alphabetaNodes,
      row.nodesSavedPercent,
      row.minimaxTimeMs,
      row.alphabetaTimeMs,
      row.speedupFactor || (row.minimaxTimeMs > 0 ? (row.minimaxTimeMs / Math.max(0.01, row.alphabetaTimeMs)).toFixed(2) : '1.0x'),
      row.sameMovePercent,
      row.positionsTested
    ];
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Fires colorful victory confetti across the viewport
 */
export function triggerVictoryConfetti() {
  try {
    const end = Date.now() + 1.8 * 1000;
    const colors = ['#f43f5e', '#fbbf24', '#3b82f6', '#10b981', '#a855f7'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}

/**
 * Simple Web Audio API sound generator for game feedback (no external audio files required)
 */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playDiscDrop(player = 1) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = player === 1 ? 320 : 440;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (_) {}
  }

  playWin() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch (_) {}
  }
}

export const sfx = new SoundEffects();

/**
 * Seedable Linear Congruential Generator for reproducible mid-game positions
 * @param {number} seed 
 * @returns {() => number} Returns pseudo-random float [0, 1)
 */
export function createRng(seed = 123456789) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
