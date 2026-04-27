import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { api, graphPayload } from '../../api/client';
import { COMP_COLORS } from '../../lib/constants';
import ResultBox from '../shared/ResultBox';

export default function ComponentsPanel() {
  const setAnimation = useGraphStore((s) => s.setAnimation);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  async function handleRun() {
    const state = useGraphStore.getState();
    try {
      const data = await api.components(graphPayload(state));
      setAnimation({ componentMap: data.vertex_component, numComponents: data.count });
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  const groups = {};
  if (result) {
    for (const [v, ci] of Object.entries(result.vertex_component)) {
      if (!groups[ci]) groups[ci] = [];
      groups[ci].push(v);
    }
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Components (Tugas 2)</h3>
      <button className="btn-run mt-8" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Analyse Components
      </button>
      {showResult && result && (
        <ResultBox label="">
          <div className="result-row">
            <span className="result-label">Components</span>
            <span className="result-num">{result.count}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Largest Size</span>
            <span className="result-num">{result.largest}</span>
          </div>
          <div className="result-label mt-8">Colour Legend</div>
          <div className="comp-legend">
            {Object.entries(groups).map(([ci, verts]) => (
              <div key={ci} className="comp-legend-item">
                <span className="comp-color-dot" style={{ background: COMP_COLORS[ci % COMP_COLORS.length] }} />
                Component {Number(ci) + 1}: {verts.join(', ')}
              </div>
            ))}
          </div>
        </ResultBox>
      )}
    </div>
  );
}