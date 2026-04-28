import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { SPECIAL_GRAPHS } from '../../lib/constants';
import { generateSpecialGraph } from '../../lib/specialGraphs';
import { PRESETS } from '../../lib/presets';
import PresetGrid from '../shared/PresetGrid';

export default function SetupPanel() {
  const loadGraphData = useGraphStore((s) => s.loadGraphData);
  const setDirected = useGraphStore((s) => s.setDirected);
  const setT4Algorithm = useGraphStore((s) => s.setT4Algorithm);
  const directed = useGraphStore((s) => s.directed);

  const [nodeLabel, setNodeLabel] = useState('');
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [edgeWeight, setEdgeWeight] = useState(1);
  const [specialKey, setSpecialKey] = useState('complete');
  const [specialParams, setSpecialParams] = useState(() => {
    const spec = SPECIAL_GRAPHS.complete;
    const p = {};
    spec.params.forEach((param) => { p[param.id] = String(param.default); });
    return p;
  });
  const [randomizeWeights, setRandomizeWeights] = useState(false);
  const [weightMin, setWeightMin] = useState(1);
  const [weightMax, setWeightMax] = useState(20);
  const [triangleIneq, setTriangleIneq] = useState(false);

  const vertices = useGraphStore((s) => s.vertices);
  const addVertex = useGraphStore((s) => s.addVertex);
  const addEdge = useGraphStore((s) => s.addEdge);
  const clearGraph = useGraphStore((s) => s.clearGraph);

  function getCanvasSize() {
    const el = document.querySelector('.canvas-wrapper') || document.querySelector('[data-canvas]');
    return el ? { w: el.clientWidth || 600, h: el.clientHeight || 400 } : { w: 600, h: 400 };
  }

  function handleAddNode() {
    const label = nodeLabel.trim().toUpperCase();
    if (!label || label in vertices) return;
    const { w, h } = getCanvasSize();
    const angle = (Object.keys(vertices).length / 8) * Math.PI * 2;
    const r = Math.min(w, h) * 0.3;
    addVertex(label, w / 2 + r * Math.cos(angle), h / 2 + r * Math.sin(angle));
    setNodeLabel('');
  }

  function handleAddEdge() {
    const from = edgeFrom.trim().toUpperCase();
    const to = edgeTo.trim().toUpperCase();
    const wt = Number.isFinite(Number(edgeWeight)) && Number(edgeWeight) > 0 ? Number(edgeWeight) : 1;
    if (!from || !to) return;
    if (!(from in vertices)) {
      const { w, h } = getCanvasSize();
      addVertex(from, w * 0.3, h * 0.5);
    }
    if (!(to in vertices)) {
      const { w, h } = getCanvasSize();
      addVertex(to, w * 0.7, h * 0.5);
    }
    addEdge(from, to, wt);
    if (!directed) addEdge(to, from, wt);
    setEdgeFrom('');
    setEdgeTo('');
    setEdgeWeight(1);
  }

  function loadPreset(name) {
    clearGraph();
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
    const isDirected = preset.directedOverride ?? directed;
    const edges = [];
    for (const edge of e) {
      const [from, to, weight = 1] = edge;
      edges.push({ from, to, weight });
      if (!isDirected) edges.push({ from: to, to: from, weight });
    }

    if (preset.directedOverride !== undefined) setDirected(preset.directedOverride);
    if (preset.algoOverride) setT4Algorithm(preset.algoOverride);

    loadGraphData({ vertices: verts, edges, directed: isDirected });
  }

  function handleSpecialKeyChange(key) {
    setSpecialKey(key);
    const spec = SPECIAL_GRAPHS[key];
    if (!spec) return;
    const p = {};
    spec.params.forEach((param) => { p[param.id] = String(param.default); });
    setSpecialParams(p);
  }

  function handleGenerate() {
    const { w, h } = getCanvasSize();
    const result = generateSpecialGraph(
      specialKey, specialParams, w, h,
      randomizeWeights, weightMin, weightMax, triangleIneq,
    );
    setDirected(false);
    loadGraphData({
      vertices: result.vertices,
      edges: result.edges.map((e) => ({ from: e.from, to: e.to, weight: e.weight })),
      directed: false,
    });
  }

  const setupPresets = [
    { label: 'Triangle', onClick: () => loadPreset('triangle') },
    { label: 'Chain', onClick: () => loadPreset('chain') },
    { label: 'Disconnected', onClick: () => loadPreset('disconnected') },
    { label: 'K4', onClick: () => loadPreset('complete4') },
  ];

  return (
    <div className="panel-section">
      <h3 className="panel-title">Graph Setup</h3>
      <div className="field-group">
        <label className="field-label">Add Node</label>
        <div className="input-row">
          <input
            type="text" className="text-input" placeholder="Node label"
            maxLength={8} value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
          />
          <button className="btn-primary" onClick={handleAddNode}>Add</button>
        </div>
      </div>
      <div className="field-group">
        <label className="field-label">Add Edge</label>
        <div className="input-row">
          <input type="text" className="text-input narrow" placeholder="From" maxLength={8} value={edgeFrom} onChange={(e) => setEdgeFrom(e.target.value)} />
          <span className="arrow-sep">&rarr;</span>
          <input type="text" className="text-input narrow" placeholder="To" maxLength={8} value={edgeTo} onChange={(e) => setEdgeTo(e.target.value)} />
          <input type="number" className="text-input narrow" placeholder="Wt" min={1} step={1} value={edgeWeight} onChange={(e) => setEdgeWeight(e.target.value)} />
        </div>
        <button className="btn-primary full-width mt-4" onClick={handleAddEdge}>Add Edge</button>
      </div>
      <div className="field-group">
        <label className="field-label">Presets</label>
        <PresetGrid presets={setupPresets} />
      </div>
      <div className="field-group">
        <label className="field-label">Special Formations</label>
        <select className="select-input" value={specialKey} onChange={(e) => handleSpecialKeyChange(e.target.value)}>
          {Object.entries(SPECIAL_GRAPHS).map(([key, spec]) => (
            <option key={key} value={key}>{spec.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {SPECIAL_GRAPHS[specialKey]?.params.map((param) => (
            <div key={param.id} style={{ flex: 1 }}>
              <label style={{ fontSize: 11, marginBottom: 3, display: 'block', color: '#64748b' }}>{param.label}</label>
              <input
                type={param.type || 'number'}
                className="text-input"
                value={specialParams[param.id] ?? param.default}
                onChange={(e) => setSpecialParams((p) => ({ ...p, [param.id]: e.target.value }))}
                style={{ width: '100%', padding: '4px 8px' }}
                min={param.type !== 'text' ? 1 : undefined}
                max={param.type !== 'text' ? 50 : undefined}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(124,106,247,0.07)', border: '1px solid rgba(124,106,247,0.18)', borderRadius: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontSize: 12, fontWeight: 600, color: '#334155' }}>
            <label className="toggle-switch" style={{ flexShrink: 0 }}>
              <input type="checkbox" checked={randomizeWeights} onChange={(e) => { setRandomizeWeights(e.target.checked); if (!e.target.checked) setTriangleIneq(false); }} />
              <span className="toggle-track" />
            </label>
            Randomize Edge Weights
          </label>
          {randomizeWeights && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Min</label>
                  <input type="number" className="text-input" value={weightMin} min={1} max={999} onChange={(e) => setWeightMin(Number(e.target.value))} style={{ width: '100%', padding: '4px 8px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Max</label>
                  <input type="number" className="text-input" value={weightMax} min={1} max={999} onChange={(e) => setWeightMax(Number(e.target.value))} style={{ width: '100%', padding: '4px 8px' }} />
                </div>
              </div>
              <div style={{ width: '100%', borderTop: '1px solid rgba(124,106,247,0.2)', marginTop: 8, paddingTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <label className="toggle-switch" style={{ flexShrink: 0, marginTop: 1 }}>
                    <input type="checkbox" checked={triangleIneq} onChange={(e) => setTriangleIneq(e.target.checked)} />
                    <span className="toggle-track" />
                  </label>
                  <span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block' }}>Ensure Triangle Inequality</span>
                    <span style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4, display: 'block', marginTop: 2 }}>
                      Derives weights from Euclidean distances, then scales to [min, max]. Guarantees w(A,C) &le; w(A,B)+w(B,C).
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
        <button className="btn-primary full-width mt-4" onClick={handleGenerate}>Generate Graph</button>
      </div>
      <div className="field-group">
        <label className="field-label">Node Guide</label>
        <p className="hint-text">
          Click on canvas to place a node. Shift&#8209;click two nodes in order to draw an edge. Right&#8209;click a node to delete it. Drag nodes to rearrange.
        </p>
      </div>
    </div>
  );
}