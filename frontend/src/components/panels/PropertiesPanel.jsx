import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { api, graphPayload } from '../../api/client';
import ResultBox from '../shared/ResultBox';

export default function PropertiesPanel() {
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  async function handleRun() {
    const state = useGraphStore.getState();
    try {
      const data = await api.tugas3Properties(graphPayload(state));
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Graph Properties (Tugas 3)</h3>
      <p className="hint-text">Check if the graph is bipartite, has cycles, its girth, and diameter.</p>
      <button className="btn-run mt-8" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Analyse Properties
      </button>
      {showResult && result && (
        <ResultBox label="">
          <div className="result-row">
            <span className="result-label">Is Bipartite?</span>
            <span className="result-num">{result.is_bipartite ? 'Yes' : 'No'}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Has Cycle?</span>
            <span className="result-num">{result.has_cycle ? 'Yes' : 'No'}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Diameter</span>
            <span className="result-num">{result.diameter}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Girth</span>
            <span className="result-num">{result.girth === -1 ? '\u221E' : result.girth}</span>
          </div>
        </ResultBox>
      )}
    </div>
  );
}