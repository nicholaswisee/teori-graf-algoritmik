import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAnimation } from '../../hooks/useAnimation';
import { useSelectOptions } from '../../hooks/useSelectOptions';
import { api, graphPayload } from '../../api/client';
import AlgoToggle from '../shared/AlgoToggle';
import StepControls from '../shared/StepControls';
import ResultBox from '../shared/ResultBox';

export default function TraversalPanel() {
  const traversalAlgo = useGraphStore((s) => s.traversalAlgo);
  const setTraversalAlgo = useGraphStore((s) => s.setTraversalAlgo);
  const [start, setStart] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const options = useSelectOptions();
  const { startStepAnimation } = useAnimation();

  async function handleRun() {
    if (!start) return;
    const state = useGraphStore.getState();
    try {
      const data = await api.traversal(graphPayload(state, { start, algo: traversalAlgo }));
      startStepAnimation(data.order);
      setResult(data);
      setShowResult(true);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Traversal</h3>
      <AlgoToggle
        value={traversalAlgo}
        onChange={setTraversalAlgo}
        options={[{ label: 'BFS', value: 'bfs' }, { label: 'DFS', value: 'dfs' }]}
      />
      <div className="field-group">
        <label className="field-label">Start Node</label>
        <select className="select-input" value={start} onChange={(e) => setStart(e.target.value)}>
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <button className="btn-run" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Run Traversal
      </button>
      {showResult && result && (
        <ResultBox label="Visit Order">
          <div className="result-content">{result.order.join(' \u2192 ')}</div>
        </ResultBox>
      )}
      <StepControls type="steps" />
    </div>
  );
}