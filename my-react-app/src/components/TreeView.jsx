import React, { useState } from 'react';
import { formatNumber } from '../utils/helpers.js';

export default function TreeView({ searchTree, algorithm, depth }) {
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);

  if (!searchTree) {
    return (
      <div className="panel-card tree-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <span className="panel-icon">🌲</span>
            <h3>Search Tree Visualization</h3>
          </div>
        </div>
        <p className="placeholder-text">
          Tree visualization is enabled for depths 1 to 3. Play an AI turn to generate the recursive decision tree.
        </p>
      </div>
    );
  }

  const toggleCollapse = (nodeId) => {
    const next = new Set(collapsedNodes);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setCollapsedNodes(next);
  };

  /**
   * Recursive node renderer
   */
  const renderNode = (node, path = '0') => {
    if (!node) return null;

    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isPruned = !!node.pruned;
    const isChosenBest = searchTree.score !== null && node.score === searchTree.score && node.score !== undefined;

    let nodeTypeClass = node.isMaximizing ? 'node-max' : 'node-min';
    if (isPruned) nodeTypeClass = 'node-pruned';

    return (
      <div key={node.id || path} className="tree-branch">
        <div
          className={`tree-node ${nodeTypeClass} ${isChosenBest ? 'node-best' : ''} ${selectedNode?.id === node.id ? 'node-active' : ''}`}
          onClick={() => setSelectedNode(node)}
        >
          <div className="node-header">
            <span className="node-col-badge">
              {node.col === 'Root' ? 'ROOT' : `Col ${typeof node.col === 'number' ? node.col + 1 : node.col}`}
            </span>
            <span className="node-level-tag">
              {node.isMaximizing ? '▲ MAX' : '▼ MIN'}
            </span>
          </div>

          <div className="node-body">
            {isPruned ? (
              <div className="prune-tag">
                ✂️ PRUNED
                <small>{node.pruneReason || 'α-β Cutoff'}</small>
              </div>
            ) : (
              <div className="node-metrics">
                <span className="score-text">
                  Score: <strong>{node.score !== null && node.score !== undefined ? node.score : '...'}</strong>
                </span>
                {node.alpha !== undefined && node.beta !== undefined && (
                  <span className="bounds-text">
                    [α: {node.alpha === -Infinity ? '-∞' : node.alpha}, β: {node.beta === Infinity ? '∞' : node.beta}]
                  </span>
                )}
              </div>
            )}
          </div>

          {hasChildren && (
            <button
              className="tree-collapse-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.id);
              }}
              title={isCollapsed ? 'Expand Children' : 'Collapse Children'}
            >
              {isCollapsed ? `+ (${node.children.length})` : '−'}
            </button>
          )}
        </div>

        {/* Child branches */}
        {hasChildren && !isCollapsed && (
          <div className="tree-children">
            {node.children.map((child, idx) => renderNode(child, `${path}-${idx}`))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="panel-card tree-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-icon">🌲</span>
          <h3>Search Tree Visualizer (Depth {depth} plies)</h3>
        </div>
        <div className="tree-legend">
          <span className="legend-item"><span className="legend-dot dot-max"></span> Maximizing (▲)</span>
          <span className="legend-item"><span className="legend-dot dot-min"></span> Minimizing (▼)</span>
          <span className="legend-item"><span className="legend-dot dot-pruned"></span> Pruned (✂️ Cutoff)</span>
          <span className="legend-item"><span className="legend-dot dot-best"></span> Chosen Path</span>
        </div>
      </div>

      <div className="tree-scroll-container">
        <div className="tree-canvas">
          {renderNode(searchTree)}
        </div>
      </div>

      {selectedNode && (
        <div className="node-inspector">
          <div className="inspector-title">Node Inspector Details</div>
          <div className="inspector-grid">
            <div><strong>Move:</strong> {selectedNode.col === 'Root' ? 'Root State' : `Column ${selectedNode.col + 1}`}</div>
            <div><strong>Evaluated Score:</strong> {selectedNode.score ?? 'N/A'}</div>
            <div><strong>Role:</strong> {selectedNode.isMaximizing ? 'Maximizer (AI)' : 'Minimizer (Opponent)'}</div>
            <div><strong>Status:</strong> {selectedNode.pruned ? `Pruned: ${selectedNode.pruneReason}` : 'Fully Evaluated'}</div>
            {selectedNode.alpha !== undefined && (
              <div><strong>Alpha (α):</strong> {selectedNode.alpha === -Infinity ? '-Infinity' : selectedNode.alpha}</div>
            )}
            {selectedNode.beta !== undefined && (
              <div><strong>Beta (β):</strong> {selectedNode.beta === Infinity ? 'Infinity' : selectedNode.beta}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
