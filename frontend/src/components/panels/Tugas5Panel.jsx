import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useSelectOptions } from '../../hooks/useSelectOptions';
import { api, graphPayload } from '../../api/client';
import { edgeId } from '../../lib/edgeId';
import { PRESETS } from '../../lib/presets';
import PresetGrid from '../shared/PresetGrid';
import ResultBox from '../shared/ResultBox';

export default function Tugas5Panel() {
  const directed = useGraphStore((s) => s.directed);
  const loadGraphData = useGraphStore((s) => s.loadGraphData);
  const animation = useGraphStore((s) => s.animation);
  const setAnimation = useGraphStore((s) => s.setAnimation);
  const [start, setStart] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const options = useSelectOptions();

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
    loadGraphData({ vertices: verts, edges, directed: false });
  }

  async function handleRun() {
    if (!start) return;
    const state = useGraphStore.getState();
    try {
      const data = await api.tugas5Tsp(graphPayload(state, { start }));
      const frames = data.frames || [];

      const pathEdges = new Set();
      for (const edge of data.edges || []) {
        pathEdges.add(edgeId(edge.from, edge.to, directed));
        if (!directed) pathEdges.add(edgeId(edge.to, edge.from, directed));
      }

      setAnimation({
        frames,
        frameIndex: 0,
        isPlayingFrames: false,
        pathNodes: [],
        pathEdges,
        finalPathEdges: pathEdges,
        cutEdges: new Set(),
        swapEdges: new Set(),
      });

      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  const t5Presets = [
    { label: 'K4 Base', onClick: () => loadPreset('t5_k4') },
    { label: 'Pentagon', onClick: () => loadPreset('t5_pentagon') },
    { label: 'Clusters', onClick: () => loadPreset('t5_clusters') },
    { label: 'Greedy Trap', onClick: () => loadPreset('t5_trap') },
    { label: 'Dead End', onClick: () => loadPreset('t5_deadend') },
    { label: 'Dense (K6)', onClick: () => loadPreset('t5_dense') },
  ];

  const expectedLen = Object.keys(useGraphStore.getState().vertices).length + 1;
  const completeTour = result && result.tour && result.tour.length === expectedLen && result.tour[0] === result.tour[result.tour.length - 1];

  return (
    <div className="panel-section">
      <h3 className="panel-title">TSP (Tugas 5)</h3>
      <p className="hint-text">
        Menyelesaikan TSP dengan <strong>Christofides + 3-Opt</strong>.
      </p>
      <div className="field-group mt-4">
        <label className="field-label">Start Node</label>
        <select className="select-input" value={start} onChange={(e) => setStart(e.target.value)}>
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className="preset-grid mt-4">
        <PresetGrid presets={t5Presets} />
      </div>
      <button className="btn-run mt-8" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Run TSP
      </button>
      {animation.frames.length > 0 && (
        <div className="step-controls">
          <button className="btn-ghost small" onClick={() => {
            const s = useGraphStore.getState();
            if (s.animation.frameIndex > 0) {
              const newIndex = s.animation.frameIndex - 1;
              if (newIndex === 0) {
                setAnimation({ frameIndex: 0, pulseNode: null, activePathEdge: null, cutEdges: new Set(), swapEdges: new Set(), pathEdges: s.animation.finalPathEdges || new Set() });
              } else {
                const frame = s.animation.frames[newIndex - 1];
                setAnimation({ frameIndex: newIndex, pulseNode: frame?.node ?? null, activePathEdge: frame?.edge ? edgeId(frame.edge[0], frame.edge[1], directed) : null });
              }
            }
          }}>◀ Step</button>
          <button className="btn-ghost small" onClick={() => { useGraphStore.getState().setAnimation({ frameIndex: 0, isPlayingFrames: true }); }}>Play</button>
          <button className="btn-ghost small" onClick={() => {
            const s = useGraphStore.getState();
            if (s.animation.frameIndex < s.animation.frames.length) {
              useGraphStore.getState().setAnimation({ frameIndex: s.animation.frameIndex + 1 });
            }
          }}>Step ▶</button>
          <span className="step-counter">{animation.frameIndex} / {animation.frames.length}</span>
        </div>
      )}
      {showResult && result && (
        <ResultBox label="Result">
          <div className={`result-badge ${completeTour ? 'connected' : 'disconnected'}`}>
            {completeTour ? '\u2713 TSP Tour Found' : '\u2717 Incomplete Tour (Dead End)'}
          </div>
          <div className="result-content">Tour: {(result.tour || []).join(' \u2192 ')}</div>
          <div className="result-meta">Total weight: {result.total_weight}</div>
          <div className="result-label mt-4" style={{ marginBottom: 4 }}>Legend Warna</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8, fontSize: 11, color: '#64748b' }}>
            <span><span style={{ display: 'inline-block', width: 14, height: 3, background: '#fbbf24', borderRadius: 2, verticalAlign: 'middle', marginRight: 5 }} />Rute TSP saat ini</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 3, background: '#22c55e', borderRadius: 2, verticalAlign: 'middle', marginRight: 5 }} />Sisi baru (setelah swap)</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 3, background: '#ef4444', borderRadius: 2, borderTop: '2px dashed #ef4444', verticalAlign: 'middle', marginRight: 5 }} />Sisi dipotong (3-Opt)</span>
          </div>
          {result.steps && result.steps.length > 0 && (
            <>
              <div className="result-label" style={{ marginBottom: 4 }}>Steps</div>
              <ol className="step-list">
                {result.steps.map((step, i) => (
                  <li key={i} className={i === animation.frameIndex - 1 ? 'active' : ''}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </ResultBox>
      )}
    </div>
  );
}