import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function AlgorithmPanel() {
  const [algorithms, setAlgorithms] = useState(null);
  const [expandedTugas, setExpandedTugas] = useState(null);
  const [selectedAlgo, setSelectedAlgo] = useState(null);
  const [sourceCode, setSourceCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listAlgorithms().then(setAlgorithms).catch(() => {});
  }, []);

  async function handleAlgoClick(tugas, name) {
    setLoading(true);
    setSelectedAlgo(`${tugas}/${name}`);
    setSourceCode('');
    try {
      const data = await api.getAlgorithm(tugas, name);
      setSourceCode(data.source || data.code || JSON.stringify(data, null, 2));
    } catch (err) {
      setSourceCode('Error loading source code: ' + err.message);
    }
    setLoading(false);
  }

  if (!algorithms) {
    return (
      <div className="panel-section">
        <h3 className="panel-title">Algorithm Viewer</h3>
        <p className="hint-text">Loading algorithms...</p>
      </div>
    );
  }

  const tugasLabels = {
    tugas1: 'Tugas 1 - BFS/DFS',
    tugas2: 'Tugas 2 - Components/Islands',
    tugas3: 'Tugas 3 - Properties/Shortest Path',
    tugas4: 'Tugas 4 - Weighted Algorithms',
    tugas5: 'Tugas 5 - TSP',
  };

  return (
    <div className="panel-section">
      <h3 className="panel-title">Algorithm Viewer</h3>
      <p className="hint-text">Browse algorithm source code by Tugas.</p>
      <div className="mt-8">
        {Object.entries(algorithms).map(([tugas, algos]) => (
          <div key={tugas} style={{ marginBottom: 8 }}>
            <button
              className="algo-section-toggle"
              onClick={() => setExpandedTugas(expandedTugas === tugas ? null : tugas)}
            >
              <span>{tugasLabels[tugas] || tugas}</span>
              <span>{expandedTugas === tugas ? '\u25BC' : '\u25B8'}</span>
            </button>
            {expandedTugas === tugas && (
              <div className="algo-section-content">
                {Array.isArray(algos) ? algos.map((algo) => (
                  <button
                    key={algo.name || algo}
                    className="algo-item-btn"
                    onClick={() => handleAlgoClick(tugas, algo.name || algo)}
                  >
                    {algo.name || algo} {algo.description ? `- ${algo.description}` : ''}
                  </button>
                )) : typeof algos === 'object' ? Object.entries(algos).map(([name, desc]) => (
                  <button
                    key={name}
                    className="algo-item-btn"
                    onClick={() => handleAlgoClick(tugas, name)}
                  >
                    {name} {typeof desc === 'string' ? `- ${desc}` : ''}
                  </button>
                )) : null}
              </div>
            )}
          </div>
        ))}
      </div>
      {loading && <p className="hint-text mt-8">Loading source...</p>}
      {sourceCode && !loading && (
        <div className="result-box" style={{ marginTop: 14 }}>
          <div className="result-label">{selectedAlgo}</div>
          <pre style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            lineHeight: 1.5,
            overflow: 'auto',
            maxHeight: 400,
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}>{sourceCode}</pre>
        </div>
      )}
    </div>
  );
}