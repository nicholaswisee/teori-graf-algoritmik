import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAnimation } from '../../hooks/useAnimation';
import { useSelectOptions } from '../../hooks/useSelectOptions';
import { api, graphPayload } from '../../api/client';
import { PRESETS } from '../../lib/presets';
import PresetGrid from '../shared/PresetGrid';
import ResultBox from '../shared/ResultBox';

export default function Tugas4Panel() {
  const t4Algorithm = useGraphStore((s) => s.t4Algorithm);
  const setT4Algorithm = useGraphStore((s) => s.setT4Algorithm);
  const directed = useGraphStore((s) => s.directed);
  const setDirected = useGraphStore((s) => s.setDirected);
  const loadGraphData = useGraphStore((s) => s.loadGraphData);
  const animation = useGraphStore((s) => s.animation);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const options = useSelectOptions();
  const { startFrameAnimation } = useAnimation();

  function getCanvasSize() {
    const el = document.querySelector('.canvas-wrapper') || document.querySelector('[data-canvas]');
    return el ? { w: el.clientWidth || 600, h: el.clientHeight || 400 } : { w: 600, h: 400 };
  }

  function loadPreset(name) {
    const state = useGraphStore.getState();
    state.clearGraph();
    const preset = PRESETS[name];
    if (!preset) return;
    const { w, h } = getCanvasSize();
    const cx = w / 2;
    const cy = h / 2;
    let v, e;
    if (preset.build) {
      const result = preset.build(w, h);
      v = result.v;
      e = result.e;
    } else {
      v = preset.v;
      e = preset.e;
    }
    const verts = {};
    for (const [label, [dx, dy]] of Object.entries(v)) {
      verts[label] = { x: cx + dx, y: cy + dy };
    }
    const edges = [];
    for (const edge of e) {
      const [from, to, weight = 1] = edge;
      edges.push({ from, to, weight });
      if (!directed) edges.push({ from: to, to: from, weight });
    }
    if (preset.directedOverride) setDirected(true);
    if (preset.algoOverride) setT4Algorithm(preset.algoOverride);
    loadGraphData({ vertices: verts, edges, directed: preset.directedOverride ?? false });

    if (preset.startOverride) setStart(preset.startOverride);
    if (preset.endOverride) setEnd(preset.endOverride);
  }

  async function handleRun() {
    const state = useGraphStore.getState();
    const payload = graphPayload(state, { algorithm: t4Algorithm });
    if (t4Algorithm === 'shortest_path') {
      if (!start || !end) return;
      payload.start = start;
      payload.end = end;
    }
    try {
      const data = await api.tugas4Run(payload);
      startFrameAnimation(data.frames || []);
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  const t4Presets = [
    { label: 'Shortest Path Demo', onClick: () => loadPreset('t4_shortest') },
    { label: 'Shortest Alt Demo', onClick: () => loadPreset('t4_shortest_alt') },
    { label: 'Prim Demo', onClick: () => loadPreset('t4_mst') },
    { label: 'Dense MST Demo', onClick: () => loadPreset('t4_mst_dense') },
    { label: 'Sparse MST Demo', onClick: () => loadPreset('t4_mst_sparse') },
    { label: 'Kruskal Demo', onClick: () => loadPreset('t4_kruskal') },
  ];

  return (
    <div className="panel-section">
      <h3 className="panel-title">Weighted Graph Algorithms (Tugas 4)</h3>
      <p className="hint-text">Run Dijkstra, Prim, or Kruskal on a weighted graph.</p>
      <div className="field-group mt-4">
        <label className="field-label">Algorithm</label>
        <select className="select-input" value={t4Algorithm} onChange={(e) => setT4Algorithm(e.target.value)}>
          <option value="shortest_path">Dijkstra / Shortest Path</option>
          <option value="prim">Prim MST</option>
          <option value="kruskal">Kruskal MST</option>
        </select>
      </div>
      {t4Algorithm === 'shortest_path' && (
        <div className="field-group">
          <label className="field-label">Shortest Path Nodes</label>
          <div className="input-row">
            <select className="select-input narrow" value={start} onChange={(e) => setStart(e.target.value)}>
              <option value="">From</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <span className="arrow-sep">&rarr;</span>
            <select className="select-input narrow" value={end} onChange={(e) => setEnd(e.target.value)}>
              <option value="">To</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      )}
      <div className="preset-grid mt-4">
        <PresetGrid presets={t4Presets} />
      </div>
      <button className="btn-run mt-8" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Run Weighted Algorithm
      </button>
      {animation.frames.length > 0 && (
        <div className="step-controls">
          <button className="btn-ghost small" onClick={() => { const s = useGraphStore.getState(); if (s.animation.frameIndex > 0) { useGraphStore.getState().setAnimation({ frameIndex: s.animation.frameIndex - 1 }); } }}>◀ Step</button>
          <button className="btn-ghost small" onClick={() => { useGraphStore.getState().setAnimation({ frameIndex: 0, isPlayingFrames: true }); }}>Play</button>
          <button className="btn-ghost small" onClick={() => { const s = useGraphStore.getState(); if (s.animation.frameIndex < s.animation.frames.length) { useGraphStore.getState().setAnimation({ frameIndex: s.animation.frameIndex + 1 }); } }}>Step ▶</button>
          <span className="step-counter">{animation.frameIndex} / {animation.frames.length}</span>
        </div>
      )}
      {showResult && result && (
        <ResultBox label="Result">
          {result.algorithm === 'shortest_path' ? (
            result.found ? (
              <>
                <div className={`result-badge connected`}>&#10003; Shortest path found</div>
                <div className="result-content">Path: {result.path.join(' \u2192 ')}</div>
                <div className="result-meta">Total distance: {result.distance} \u00b7 Algorithm: Dijkstra</div>
              </>
            ) : (
              <>
                <div className="result-badge disconnected">&#10007; No path</div>
                <div className="result-content">No weighted path found between the selected nodes.</div>
              </>
            )
          ) : (
            <>
              <div className="result-badge connected">&#10003; MST total weight {result.total_weight}</div>
              <div className="result-content">
                Selected edges: {(result.edges || []).map((edge) => `${edge.from} - ${edge.to} (${edge.weight})`).join(' \u00b7 ')}
              </div>
              <div className="result-meta">
                Algorithm: {result.algorithm === 'prim' ? 'Prim' : 'Kruskal'} \u00b7 Total weight: {result.total_weight}
              </div>
            </>
          )}
          {result.steps && result.steps.length > 0 && (
            <>
              <div className="result-label mt-4">Steps</div>
              <ol className="step-list">
                {result.steps.map((step, i) => (
                  <li key={i} className={i < animation.frameIndex ? 'active' : ''}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </ResultBox>
      )}
    </div>
  );
}