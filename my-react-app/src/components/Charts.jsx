import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { formatNumber, formatMs } from '../utils/helpers.js';

export default function Charts({ data = [] }) {
  const [useLogScaleNodes, setUseLogScaleNodes] = useState(true);
  const [useLogScaleTime, setUseLogScaleTime] = useState(false);
  const [chartView, setChartView] = useState('lines'); // 'lines' or 'bars'

  if (!data || data.length === 0) {
    return (
      <div className="panel-card charts-empty">
        <p className="placeholder-text">
          Run a benchmark to generate comparative graphs of Nodes Explored vs Depth and Computation Time vs Depth.
        </p>
      </div>
    );
  }

  // Pre-process data for charts ensuring safe log scale values (> 0)
  const chartData = data.map((d) => ({
    ...d,
    depthLabel: `Depth ${d.depth}`,
    // Ensure > 0 for log scales
    minimaxNodesSafe: Math.max(1, d.minimaxNodes),
    alphabetaNodesSafe: Math.max(1, d.alphabetaNodes),
    minimaxTimeMsSafe: Math.max(0.01, d.minimaxTimeMs),
    alphabetaTimeMsSafe: Math.max(0.01, d.alphabetaTimeMs)
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-title">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-val">
                {entry.dataKey.includes('Nodes')
                  ? formatNumber(entry.value)
                  : entry.dataKey.includes('Time')
                  ? formatMs(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="charts-container">
      {/* Chart 1: Nodes Explored vs Depth */}
      <div className="panel-card chart-card">
        <div className="panel-header">
          <div className="panel-title-group">
            <span className="panel-icon">📊</span>
            <div>
              <h3>Nodes Explored vs Depth</h3>
              <p className="panel-subtitle">Exhaustive Minimax O(b^d) vs Alpha-Beta Pruning O(b^(d/2))</p>
            </div>
          </div>
          <div className="chart-controls-row">
            <button
              className={`scale-toggle-btn ${useLogScaleNodes ? 'active' : ''}`}
              onClick={() => setUseLogScaleNodes(!useLogScaleNodes)}
            >
              {useLogScaleNodes ? 'Log10 Scale' : 'Linear Scale'}
            </button>
          </div>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={320}>
            {chartView === 'lines' ? (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="depthLabel" stroke="#94a3b8" />
                <YAxis
                  scale={useLogScaleNodes ? 'log' : 'auto'}
                  domain={useLogScaleNodes ? ['auto', 'auto'] : [0, 'auto']}
                  stroke="#94a3b8"
                  tickFormatter={(val) => formatNumber(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={useLogScaleNodes ? 'minimaxNodesSafe' : 'minimaxNodes'}
                  name="Minimax Nodes"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#f43f5e' }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey={useLogScaleNodes ? 'alphabetaNodesSafe' : 'alphabetaNodes'}
                  name="Alpha-Beta Nodes"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="depthLabel" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => formatNumber(val)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="minimaxNodes" name="Minimax Nodes" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alphabetaNodes" name="Alpha-Beta Nodes" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Computation Time vs Depth */}
      <div className="panel-card chart-card">
        <div className="panel-header">
          <div className="panel-title-group">
            <span className="panel-icon">⏱️</span>
            <div>
              <h3>Computation Time (ms) vs Depth</h3>
              <p className="panel-subtitle">Average CPU time elapsed per move in milliseconds</p>
            </div>
          </div>
          <div className="chart-controls-row">
            <button
              className={`scale-toggle-btn ${useLogScaleTime ? 'active' : ''}`}
              onClick={() => setUseLogScaleTime(!useLogScaleTime)}
            >
              {useLogScaleTime ? 'Log10 Scale' : 'Linear Scale'}
            </button>
          </div>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="depthLabel" stroke="#94a3b8" />
              <YAxis
                scale={useLogScaleTime ? 'log' : 'auto'}
                domain={useLogScaleTime ? ['auto', 'auto'] : [0, 'auto']}
                stroke="#94a3b8"
                tickFormatter={(val) => `${val}ms`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey={useLogScaleTime ? 'minimaxTimeMsSafe' : 'minimaxTimeMs'}
                name="Minimax Time (ms)"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ r: 5, fill: '#f43f5e' }}
              />
              <Line
                type="monotone"
                dataKey={useLogScaleTime ? 'alphabetaTimeMsSafe' : 'alphabetaTimeMs'}
                name="Alpha-Beta Time (ms)"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 5, fill: '#06b6d4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
