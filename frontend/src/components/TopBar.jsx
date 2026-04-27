import { useGraphStore } from '../store/graphStore';
import { MODE_TITLES } from '../lib/constants';

export default function TopBar() {
  const mode = useGraphStore((s) => s.mode);
  const directed = useGraphStore((s) => s.directed);
  const setDirected = useGraphStore((s) => s.setDirected);
  const clearGraph = useGraphStore((s) => s.clearGraph);

  if (mode === 'islands') {
    return (
      <header className="topbar">
        <div className="topbar-title">Island Count</div>
        <div />
      </header>
    );
  }

  return (
    <header className="topbar">
      <div className="topbar-title">{MODE_TITLES[mode] || mode}</div>
      <div className="topbar-actions">
        <label className="toggle-label">
          <span>Directed</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={directed}
              onChange={(e) => setDirected(e.target.checked)}
            />
            <span className="toggle-track" />
          </label>
        </label>
        <button className="btn-ghost" onClick={clearGraph}>Clear Graph</button>
      </div>
    </header>
  );
}