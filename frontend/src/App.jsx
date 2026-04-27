import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import GraphCanvas from './components/GraphCanvas';
import ControlPanel from './components/ControlPanel';
import IslandsPanel from './components/panels/IslandsPanel';
import { useGraphStore } from './store/graphStore';

export default function App() {
  const mode = useGraphStore((s) => s.mode);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateRows: '52px 1fr',
        gridTemplateColumns: '1fr 280px',
        gridTemplateAreas: '"topbar topbar" "canvas panel"',
        overflow: 'hidden',
      }}>
        <TopBar />
        <div style={{ gridArea: 'canvas', position: 'relative', overflow: 'hidden' }} className="canvas-wrapper">
          {mode === 'islands' ? <IslandsPanel /> : <GraphCanvas />}
        </div>
        <ControlPanel />
      </div>
    </div>
  );
}