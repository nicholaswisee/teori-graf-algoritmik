import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { createGrid, toggleCell, resetGrid as resetGridFn } from '../../lib/islandGrid';
import { api } from '../../api/client';
import { COMP_COLORS } from '../../lib/constants';
import ResultBox from '../shared/ResultBox';

export default function IslandsPanel() {
  const islandGrid = useGraphStore((s) => s.islandGrid);
  const setIslandGrid = useGraphStore((s) => s.setIslandGrid);
  const islandResult = useGraphStore((s) => s.islandResult);
  const setIslandResult = useGraphStore((s) => s.setIslandResult);
  const mode = useGraphStore((s) => s.mode);

  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(5);

  const currentGrid = islandGrid.length > 0 ? islandGrid : createGrid(rows, cols);

  function handleCellClick(r, c) {
    const newGrid = toggleCell(currentGrid, r, c);
    setIslandGrid(newGrid);
    setIslandResult(null);
  }

  function handleReset() {
    const newGrid = resetGridFn(rows, cols);
    setIslandGrid(newGrid);
    setIslandResult(null);
  }

  async function handleRun() {
    try {
      const data = await api.islands({ grid: currentGrid });
      setIslandResult(data);
    } catch (err) {
      alert(err.message);
    }
  }

  function getCellStyle(r, c) {
    if (!islandResult || !islandResult.islands) {
      return currentGrid[r]?.[c] === 'L' ? 'land' : 'water';
    }
    const cellVal = currentGrid[r]?.[c];
    if (cellVal === 'W') return 'water';
    const islandIdx = islandResult.islands.findIndex((island) =>
      island.some(([ir, ic]) => ir === r && ic === c)
    );
    if (islandIdx >= 0) return 'island-colored';
    return 'land';
  }

  function getCellBg(r, c) {
    if (!islandResult || !islandResult.islands) return undefined;
    const cellVal = currentGrid[r]?.[c];
    if (cellVal === 'W') return undefined;
    const islandIdx = islandResult.islands.findIndex((island) =>
      island.some(([ir, ic]) => ir === r && ic === c)
    );
    if (islandIdx >= 0) {
      const col = COMP_COLORS[islandIdx % COMP_COLORS.length];
      return { background: col + 'cc', borderColor: col, color: '#fff' };
    }
    return undefined;
  }

  if (mode !== 'islands') return null;

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20, background: 'var(--bg)',
      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(124, 106, 247, 0.03) 0%, transparent 70%), linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)`,
      backgroundSize: 'auto, 32px 32px, 32px 32px',
    }}>
      <div className="island-grid-container">
        {currentGrid.map((row, r) => (
          <div key={r} className="grid-row">
            {row.map((cell, c) => {
              const cls = getCellStyle(r, c);
              const style = getCellBg(r, c);
              return (
                <div
                  key={c}
                  className={`grid-cell ${cls}`}
                  style={style}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell === 'L' ? 'L' : 'W'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="grid-controls">
        <div className="grid-size-row">
          <label>Rows <input type="number" className="num-input" value={rows} min={2} max={15} onChange={(e) => { setRows(Number(e.target.value)); }} /></label>
          <label>Cols <input type="number" className="num-input" value={cols} min={2} max={15} onChange={(e) => { setCols(Number(e.target.value)); }} /></label>
        </div>
        <p className="island-legend">
          <span className="cell-l">L</span> = Land &nbsp;
          <span className="cell-w">W</span> = Water. Click cells to toggle.
        </p>
      </div>
      <button className="btn-run" onClick={handleRun}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor" /></svg>
        Count Islands
      </button>
      <button className="btn-ghost mt-4 full-width" onClick={handleReset} style={{ maxWidth: 300 }}>Reset Grid</button>
      {islandResult && (
        <ResultBox label="">
          <div className="result-row">
            <span className="result-label">Islands Found</span>
            <span className="result-num">{islandResult.count}</span>
          </div>
        </ResultBox>
      )}
    </div>
  );
}