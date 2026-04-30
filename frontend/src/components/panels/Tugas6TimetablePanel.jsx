import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { api, graphPayload } from '../../api/client';
import ResultBox from '../shared/ResultBox';

export default function Tugas6TimetablePanel() {
  const [rows, setRows] = useState(['Course A', 'Course B', 'Course C']);
  const [cols, setCols] = useState(['Session 1', 'Session 2', 'Session 3']);
  const [active, setActive] = useState(() => {
    const m = {};
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        m[`${i},${j}`] = i === j;
      }
    }
    return m;
  });
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [graphBuilt, setGraphBuilt] = useState(false);

  const loadGraphData = useGraphStore((s) => s.loadGraphData);
  const clearGraph = useGraphStore((s) => s.clearGraph);
  const setDirected = useGraphStore((s) => s.setDirected);

  function getCanvasSize() {
    const el = document.querySelector('.canvas-wrapper') || document.querySelector('[data-canvas]');
    return el ? { w: el.clientWidth || 600, h: el.clientHeight || 400 } : { w: 600, h: 400 };
  }

  function toggleCell(i, j) {
    const key = `${i},${j}`;
    setActive((prev) => ({ ...prev, [key]: !prev[key] }));
    setGraphBuilt(false);
  }

  function addRow() {
    setRows((r) => [...r, `Course ${String.fromCharCode(65 + r.length)}`]);
    setGraphBuilt(false);
  }

  function addCol() {
    setCols((c) => [...c, `Session ${c.length + 1}`]);
    setGraphBuilt(false);
  }

  function removeRow() {
    if (rows.length <= 1) return;
    setRows((r) => r.slice(0, -1));
    setGraphBuilt(false);
  }

  function removeCol() {
    if (cols.length <= 1) return;
    setCols((c) => c.slice(0, -1));
    setGraphBuilt(false);
  }

  function updateRowName(i, val) {
    setRows((r) => {
      const copy = [...r];
      copy[i] = val;
      return copy;
    });
  }

  function updateColName(j, val) {
    setCols((c) => {
      const copy = [...c];
      copy[j] = val;
      return copy;
    });
  }

  function handleBuildGraph() {
    clearGraph();
    const { w, h } = getCanvasSize();
    const padding = 80;
    const rowYStep = rows.length > 1 ? (h - padding * 2) / (rows.length - 1) : 0;
    const colYStep = cols.length > 1 ? (h - padding * 2) / (cols.length - 1) : 0;

    const vertices = {};
    for (let i = 0; i < rows.length; i++) {
      vertices[rows[i]] = { x: padding, y: padding + i * rowYStep };
    }
    for (let j = 0; j < cols.length; j++) {
      vertices[cols[j]] = { x: w - padding, y: padding + j * colYStep };
    }

    const edges = [];
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        if (active[`${i},${j}`]) {
          edges.push({ from: rows[i], to: cols[j], weight: 1 });
          edges.push({ from: cols[j], to: rows[i], weight: 1 });
        }
      }
    }

    setDirected(false);
    loadGraphData({ vertices, edges, directed: false });
    setGraphBuilt(true);
    setShowResult(false);
  }

  async function handleRun() {
    const state = useGraphStore.getState();
    if (state.edges.length === 0) {
      alert('Please build the graph first.');
      return;
    }
    try {
      const payload = graphPayload(state);
      const data = await api.tugas6Timetable(payload);
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Timetabling (Tugas 6)</h3>
      <p className="hint-text">
        Define rows (courses) and columns (sessions). Toggle cells to schedule courses in sessions, then build the graph and determine the minimum rooms needed.
      </p>

      <div className="field-group mt-4">
        <label className="field-label">Table</label>
        <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${cols.length}, 1fr)`, gap: '4px', alignItems: 'center' }}>
          <div />
          {cols.map((c, j) => (
            <input
              key={`col-${j}`}
              type="text"
              className="text-input"
              value={c}
              onChange={(e) => updateColName(j, e.target.value)}
              style={{ padding: '4px 6px', fontSize: 11, textAlign: 'center' }}
            />
          ))}
          {rows.map((r, i) => (
            <div key={`row-${i}`} style={{ display: 'contents' }}>
              <input
                type="text"
                className="text-input"
                value={r}
                onChange={(e) => updateRowName(i, e.target.value)}
                style={{ padding: '4px 6px', fontSize: 11 }}
              />
              {cols.map((_, j) => (
                <button
                  key={`cell-${i}-${j}`}
                  onClick={() => toggleCell(i, j)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    background: active[`${i},${j}`] ? 'var(--primary)' : 'var(--bg3)',
                    color: active[`${i},${j}`] ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {active[`${i},${j}`] ? '\u2713' : ''}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <button className="btn-ghost small" onClick={addRow}>+ Row</button>
          <button className="btn-ghost small" onClick={addCol}>+ Col</button>
          <button className="btn-ghost small" onClick={removeRow}>- Row</button>
          <button className="btn-ghost small" onClick={removeCol}>- Col</button>
        </div>
      </div>

      <button className="btn-primary full-width mt-4" onClick={handleBuildGraph}>
        Build Graph
      </button>

      <button className="btn-run mt-8" onClick={handleRun} disabled={!graphBuilt} style={{ opacity: graphBuilt ? 1 : 0.5 }}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Generate Timetable
      </button>

      {showResult && result && (
        <ResultBox label="Timetable Result">
          <div className="result-badge connected">
            {'\u2713 '}{result.num_sessions} room{result.num_sessions > 1 ? 's' : ''} needed
          </div>
          {result.sessions && Object.entries(result.sessions).map(([sessionName, items], roomIdx) => (
            <div key={sessionName} style={{ marginTop: 12 }}>
              <div className="result-label">Room {roomIdx + 1}</div>
              <ol style={{ margin: '6px 0 0 18px', padding: 0, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', lineHeight: 1.7 }}>
                {items.map((item, idx) => {
                  const [k, v] = Object.entries(item)[0];
                  return (
                    <li key={idx}>
                      {k} → {v}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </ResultBox>
      )}
    </div>
  );
}
