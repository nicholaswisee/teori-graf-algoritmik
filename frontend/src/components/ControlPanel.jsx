import { useGraphStore } from '../store/graphStore';
import SetupPanel from './panels/SetupPanel';
import TraversalPanel from './panels/TraversalPanel';
import PathPanel from './panels/PathPanel';
import ConnectedPanel from './panels/ConnectedPanel';
import ComponentsPanel from './panels/ComponentsPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import ShortestPanel from './panels/ShortestPanel';
import Tugas4Panel from './panels/Tugas4Panel';
import Tugas5Panel from './panels/Tugas5Panel';
import AlgorithmPanel from './panels/AlgorithmPanel';

export default function ControlPanel() {
  const mode = useGraphStore((s) => s.mode);

  const panels = {
    setup: SetupPanel,
    traversal: TraversalPanel,
    path: PathPanel,
    connected: ConnectedPanel,
    components: ComponentsPanel,
    properties: PropertiesPanel,
    shortest: ShortestPanel,
    tugas4: Tugas4Panel,
    tugas5: Tugas5Panel,
    algorithms: AlgorithmPanel,
  };

  const Panel = panels[mode];
  if (!Panel) return null;

  return (
    <aside className="control-panel">
      <Panel />
    </aside>
  );
}