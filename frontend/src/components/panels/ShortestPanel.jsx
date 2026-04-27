import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useSelectOptions } from '../../hooks/useSelectOptions';
import { api, graphPayload } from '../../api/client';
import ResultBox from '../shared/ResultBox';

export default function ShortestPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const options = useSelectOptions();

  async function handleRun() {
    if (!from || !to) return;
    const state = useGraphStore.getState();
    try {
      const data = await api.tugas3Shortest(graphPayload(state, { start: from, end: to }));
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Shortest Distance (Tugas 3)</h3>
      <p className="hint-text">Find the shortest distance between two nodes.</p>
      <div className="field-group mt-4">
        <label className="field-label">From</label>
        <select className="select-input" value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className="field-group">
        <label className="field-label">To</label>
        <select className="select-input" value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <button className="btn-run mt-4" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Find Shortest Distance
      </button>
      {showResult && result && (
        <ResultBox label="">
          <div className="result-row">
            <span className="result-label">Distance</span>
            <span className="result-num">{result.distance === -1 ? 'Unreachable' : result.distance}</span>
          </div>
        </ResultBox>
      )}
    </div>
  );
}