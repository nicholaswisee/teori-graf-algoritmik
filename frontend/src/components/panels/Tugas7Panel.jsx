import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAnimation } from '../../hooks/useAnimation';
import { api, graphPayload } from '../../api/client';
import { PRESETS } from '../../lib/presets';
import PresetGrid from '../shared/PresetGrid';
import ResultBox from '../shared/ResultBox';
import StepControls from '../shared/StepControls';

export default function Tugas7Panel() {
  const animation = useGraphStore((s) => s.animation);
  const applyRcmLabels = useGraphStore((s) => s.applyRcmLabels);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
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
      edges.push({ from: to, to: from, weight });
    }
    state.loadGraphData({ vertices: verts, edges, directed: false });
  }

  async function handleRun() {
    const state = useGraphStore.getState();
    const payload = graphPayload(state);

    if (state.directed) {
      alert('Bandwidth reduction is designed for undirected graphs. Please switch to undirected mode.');
      return;
    }

    if (Object.keys(state.vertices).length === 0) {
      alert('Please add some vertices to the graph first.');
      return;
    }

    setLoading(true);
    setApplied(false);
    try {
      const data = await api.tugas7Bandwidth(payload);
      startFrameAnimation(data.frames || []);
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleApplyLabels() {
    if (!result?.labeling) return;
    applyRcmLabels(result.labeling);
    setApplied(true);
  }

  const t7Presets = [
    { label: 'Star Graph', onClick: () => loadPreset('t7_star') },
    { label: 'Binary Tree', onClick: () => loadPreset('t7_binary_tree') },
    { label: 'Path + Chords', onClick: () => loadPreset('t7_path_chords') },
    { label: 'Two Clusters', onClick: () => loadPreset('t7_two_clusters') },
  ];

  return (
    <div className="panel-section">
      <h3 className="panel-title">Bandwidth Reduction (Tugas 7)</h3>
      <p className="hint-text">
        Compute graph bandwidth and reduce it using the Reverse Cuthill-McKee (RCM) heuristic.
      </p>

      <div className="field-group mt-4">
        <label className="field-label">Demo Graphs</label>
        <PresetGrid presets={t7Presets} fullWidth />
      </div>

      <button className="btn-run mt-6" onClick={handleRun} disabled={loading}>
        {loading ? (
          <span>Computing...</span>
        ) : (
          <>
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3 2l10 6-10 6V2z" fill="currentColor" />
            </svg>
            Compute RCM Bandwidth
          </>
        )}
      </button>

      <StepControls type="frames" />

      {showResult && result && (
        <ResultBox label="Result">
          <div className="result-badge connected">
            &#10003; RCM Bandwidth Reduction
          </div>

          {/* Bandwidth Comparison */}
          <div className="result-content mt-3">
            <div className="result-label">Original Bandwidth</div>
            <div className="result-value">{result.original_bandwidth}</div>
            {result.worst_edge_original && (
              <div className="text-xs text-muted mt-1">
                Worst edge: {result.worst_edge_original.join(' — ')}
              </div>
            )}
          </div>

          <div className="result-content mt-2">
            <div className="result-label">RCM Bandwidth</div>
            <div className="result-value" style={{ color: '#34d399' }}>{result.rcm_bandwidth}</div>
            {result.worst_edge_rcm && (
              <div className="text-xs text-muted mt-1">
                Worst edge: {result.worst_edge_rcm.join(' — ')}
              </div>
            )}
          </div>

          {result.original_bandwidth > 0 && (
            <div className="result-content mt-2">
              <div className="result-label">Improvement</div>
              <div className="result-value">
                {result.original_bandwidth - result.rcm_bandwidth} (
                {((result.original_bandwidth - result.rcm_bandwidth) / result.original_bandwidth * 100).toFixed(1)}%)
              </div>
            </div>
          )}

          {/* Peripheral Vertex */}
          <div className="result-content mt-3">
            <div className="result-label">Peripheral Vertex (BFS Start)</div>
            <div className="result-value">{result.peripheral_vertex}</div>
          </div>

          {/* BFS Level Sets */}
          <div className="result-content mt-3">
            <div className="result-label">BFS Level Sets</div>
            <div className="font-mono text-sm mt-1">
              {result.level_sets.map((level, i) => (
                <div key={i} className="level-row">
                  <span className="level-badge">L{i}</span>
                  <span>[{level.join(', ')}]</span>
                </div>
              ))}
            </div>
          </div>

          {/* RCM Ordering */}
          <div className="result-content mt-3">
            <div className="result-label">RCM Ordering (Positions 1..n)</div>
            <div className="font-mono text-sm mt-1" style={{ lineHeight: 1.8 }}>
              {result.rcm_ordering.map((v, i) => (
                <span key={v}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{v}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({i + 1})</span>
                  {i < result.rcm_ordering.length - 1 && (
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Labeling Table */}
          <div className="result-content mt-3">
            <div className="result-label">New Labels (Renaming)</div>
            <div className="labeling-table mt-1">
              <div className="labeling-header">
                <span>Vertex</span>
                <span>Old Pos</span>
                <span style={{ color: 'var(--success)' }}>New Pos</span>
              </div>
              {result.rcm_ordering.map((v) => (
                <div key={v} className="labeling-row">
                  <span className="font-mono">{v}</span>
                  <span className="font-mono text-muted">{result.original_labeling[v]}</span>
                  <span className="font-mono" style={{ color: 'var(--success)', fontWeight: 700 }}>
                    {result.labeling[v]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Labels Button */}
          <button
            className="btn-run mt-4"
            onClick={handleApplyLabels}
            disabled={applied}
            style={{
              background: applied
                ? 'linear-gradient(135deg, #34d399, #10b981)'
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            }}
          >
            <svg viewBox="0 0 16 16" fill="none">
              {applied ? (
                <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none" />
              ) : (
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" />
              )}
            </svg>
            {applied ? 'RCM Labels Applied!' : 'Apply RCM Labels to Graph'}
          </button>
          {applied && (
            <p className="text-xs mt-2" style={{ color: 'var(--success)' }}>
              Graph vertices have been renamed according to the RCM labeling.
            </p>
          )}

          {/* Steps */}
          {result.steps && result.steps.length > 0 && (
            <>
              <div className="result-label mt-4">Algorithm Steps</div>
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
