import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { api, graphPayload } from '../../api/client';
import AlgoToggle from '../shared/AlgoToggle';
import ResultBox from '../shared/ResultBox';

export default function ConnectedPanel() {
  const connectedAlgo = useGraphStore((s) => s.connectedAlgo);
  const setConnectedAlgo = useGraphStore((s) => s.setConnectedAlgo);
  const directed = useGraphStore((s) => s.directed);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  async function handleRun() {
    const state = useGraphStore.getState();
    try {
      const data = await api.connected(graphPayload(state, { algo: connectedAlgo }));
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Connectivity</h3>
      <AlgoToggle
        value={connectedAlgo}
        onChange={setConnectedAlgo}
        options={[{ label: 'BFS', value: 'bfs' }, { label: 'DFS', value: 'dfs' }]}
      />
      <button className="btn-run mt-8" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Check Connectivity
      </button>
      {showResult && result && (
        <ResultBox
          label="Result"
          meta={`Algorithm: ${result.algo.toUpperCase()} \u00b7 ${directed ? 'Strongly connected check' : 'Undirected connectivity'}`}
        >
          <div className={`result-badge ${result.connected ? 'connected' : 'disconnected'}`}>
            {result.connected ? '\u2713 Connected' : '\u2717 Disconnected'}
          </div>
        </ResultBox>
      )}
    </div>
  );
}