import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAnimation } from '../../hooks/useAnimation';
import { edgeId } from '../../lib/edgeId';
import { api, graphPayload } from '../../api/client';
import ResultBox from '../shared/ResultBox';
import StepControls from '../shared/StepControls';
import PresetGrid from '../shared/PresetGrid';

export default function Tugas6MatchingPanel() {
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const { startFrameAnimation } = useAnimation();
  const setDirected = useGraphStore((s) => s.setDirected);
  const loadGraphData = useGraphStore((s) => s.loadGraphData);
  const clearGraph = useGraphStore((s) => s.clearGraph);
  const setAnimation = useGraphStore((s) => s.setAnimation);

  function getCanvasSize() {
    const el = document.querySelector('.canvas-wrapper') || document.querySelector('[data-canvas]');
    return el ? { w: el.clientWidth || 600, h: el.clientHeight || 400 } : { w: 600, h: 400 };
  }

  function loadBipartitePreset(name) {
    clearGraph();
    const { w, h } = getCanvasSize();
    const padding = 80;
    let uNodes, vNodes, edges;

    if (name === 'perfect') {
      uNodes = ['A', 'B', 'C', 'D'];
      vNodes = ['1', '2', '3', '4'];
      edges = [
        ['A', '1'], ['A', '2'],
        ['B', '2'], ['B', '3'],
        ['C', '3'], ['C', '4'],
        ['D', '4'], ['D', '1'],
      ];
    } else if (name === 'imperfect') {
      uNodes = ['A', 'B', 'C'];
      vNodes = ['1', '2', '3', '4', '5'];
      edges = [
        ['A', '1'], ['A', '2'],
        ['B', '2'], ['B', '3'],
        ['C', '4'], ['C', '5'],
      ];
    } else if (name === 'star') {
      uNodes = ['Center'];
      vNodes = ['1', '2', '3', '4', '5'];
      edges = [
        ['Center', '1'], ['Center', '2'], ['Center', '3'], ['Center', '4'], ['Center', '5'],
      ];
    } else if (name === 'chain') {
      uNodes = ['A', 'B', 'C', 'D'];
      vNodes = ['1', '2', '3', '4'];
      edges = [
        ['A', '1'], ['B', '1'], ['B', '2'], ['C', '2'], ['C', '3'], ['D', '3'], ['D', '4'],
      ];
    }

    const uYStep = uNodes.length > 1 ? (h - padding * 2) / (uNodes.length - 1) : 0;
    const vYStep = vNodes.length > 1 ? (h - padding * 2) / (vNodes.length - 1) : 0;

    const vertices = {};
    for (let i = 0; i < uNodes.length; i++) {
      vertices[uNodes[i]] = { x: padding, y: padding + i * uYStep };
    }
    for (let j = 0; j < vNodes.length; j++) {
      vertices[vNodes[j]] = { x: w - padding, y: padding + j * vYStep };
    }

    const allEdges = [];
    for (const [from, to] of edges) {
      allEdges.push({ from, to, weight: 1 });
      allEdges.push({ from: to, to: from, weight: 1 });
    }

    setDirected(false);
    loadGraphData({ vertices, edges: allEdges, directed: false });
  }

  const matchingPresets = [
    { label: 'Perfect 4×4', onClick: () => loadBipartitePreset('perfect') },
    { label: 'Imperfect 3×5', onClick: () => loadBipartitePreset('imperfect') },
    { label: 'Star Graph', onClick: () => loadBipartitePreset('star') },
    { label: 'Chain Graph', onClick: () => loadBipartitePreset('chain') },
  ];

  async function handleRun() {
    const state = useGraphStore.getState();
    if (state.edges.length === 0) {
      alert('Please draw a bipartite graph first.');
      return;
    }
    try {
      const payload = graphPayload(state);
      const data = await api.tugas6Matching(payload);
      startFrameAnimation(data.frames || []);

      // Auto-highlight all matched edges
      const pathEdges = new Set();
      for (const e of data.matched_edges || []) {
        pathEdges.add(edgeId(e.from, e.to, false));
      }
      setAnimation({ pathEdges, finalPathEdges: pathEdges });

      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Maximum Matching (Tugas 6)</h3>
      <p className="hint-text">
        Draw a bipartite graph on the canvas or load a preset. The algorithm will find the maximum matching using Hopcroft-Karp.
      </p>
      <div className="mt-4">
        <PresetGrid presets={matchingPresets} fullWidth />
      </div>
      <button className="btn-run mt-8" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Find Maximum Matching
      </button>
      <StepControls type="frames" />
      {showResult && result && (
        <ResultBox label="Result">
          <div className={`result-badge ${result.is_perfect ? 'connected' : 'disconnected'}`}>
            {result.is_perfect ? '\u2713 Perfect Matching' : '\u2713 Maximum Matching'}
          </div>
          <div className="result-content">
            Match count: {result.match_count}
          </div>
          <div className="result-meta">
            U nodes: {result.u_nodes?.length || 0} · V nodes: {result.v_nodes?.length || 0}
          </div>
          {result.matches && Object.keys(result.matches).length > 0 && (
            <>
              <div className="result-label mt-4">Matches</div>
              <div className="result-content">
                {Object.entries(result.matches)
                  .filter(([, v]) => v !== null)
                  .map(([u, v]) => `${u} → ${v}`)
                  .join(' · ')}
              </div>
            </>
          )}
        </ResultBox>
      )}
    </div>
  );
}
