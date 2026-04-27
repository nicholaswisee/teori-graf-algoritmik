import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useSelectOptions } from '../../hooks/useSelectOptions';
import { api, graphPayload } from '../../api/client';
import AlgoToggle from '../shared/AlgoToggle';
import ResultBox from '../shared/ResultBox';

export default function PathPanel() {
  const pathAlgo = useGraphStore((s) => s.pathAlgo);
  const setPathAlgo = useGraphStore((s) => s.setPathAlgo);
  const directed = useGraphStore((s) => s.directed);
  const setAnimation = useGraphStore((s) => s.setAnimation);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const options = useSelectOptions();

  async function handleRun() {
    if (!from || !to) return;
    const state = useGraphStore.getState();
    try {
      const data = await api.path(graphPayload(state, { start: from, end: to, algo: pathAlgo }));
      if (data.found) {
        const pathEdges = new Set();
        for (let i = 0; i < data.path.length - 1; i++) {
          pathEdges.add(`${data.path[i]}\u2192${data.path[i + 1]}`);
          if (!directed) pathEdges.add(`${data.path[i + 1]}\u2192${data.path[i]}`);
        }
        setAnimation({ pathNodes: data.path, pathEdges });
      } else {
        setAnimation({ pathNodes: [], pathEdges: new Set() });
      }
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Path Finding</h3>
      <AlgoToggle
        value={pathAlgo}
        onChange={setPathAlgo}
        options={[{ label: 'BFS', value: 'bfs' }, { label: 'DFS', value: 'dfs' }]}
      />
      <div className="field-group">
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
      <button className="btn-run" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Find Path
      </button>
      {showResult && result && (
        <ResultBox
          label="Path"
          meta={result.found ? `Length: ${result.path.length - 1} edge(s) \u00b7 Algorithm: ${result.algo.toUpperCase()}` : ''}
        >
          <div className="result-content">
            {result.found ? result.path.join(' \u2192 ') : 'No path found'}
          </div>
        </ResultBox>
      )}
    </div>
  );
}