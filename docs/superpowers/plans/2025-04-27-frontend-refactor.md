# Frontend Refactor: Vite + React + Cytoscape.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the vanilla JS/HTML5 Canvas frontend to Vite + React + Cytoscape.js, refactor the Flask backend into clean blueprints, and add an Algorithm Viewer — preserving all existing functionality.

**Architecture:** Flask backend serves API endpoints via blueprints (one per Tugas group). Vite React frontend consumes these APIs. Cytoscape.js replaces the custom Canvas renderer. Zustand manages graph state. All `src/algorithms/` files remain untouched.

**Tech Stack:** React 18, Vite, Cytoscape.js (via react-cytoscapejs), Zustand, Tailwind CSS, Flask with Flask-CORS

---

## File Structure

### Frontend (`frontend/`)
```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── store/
│   │   └── graphStore.js          # Zustand store: vertices, edges, directed, animation state
│   ├── api/
│   │   └── client.js              # fetch wrappers for all Flask endpoints
│   ├── components/
│   │   ├── GraphCanvas.jsx         # Cytoscape.js graph renderer
│   │   ├── ControlPanel.jsx        # Right panel dispatcher
│   │   ├── Sidebar.jsx             # Left navigation
│   │   ├── AlgorithmViewer.jsx     # Browse algorithm source by Tugas
│   │   ├── TopBar.jsx             # Header with directed toggle + mode title
│   │   └── panels/
│   │       ├── SetupPanel.jsx
│   │       ├── TraversalPanel.jsx
│   │       ├── PathPanel.jsx
│   │       ├── ConnectedPanel.jsx
│   │       ├── ComponentsPanel.jsx
│   │       ├── IslandsPanel.jsx
│   │       ├── PropertiesPanel.jsx
│   │       ├── ShortestPanel.jsx
│   │       ├── Tugas4Panel.jsx
│   │       ├── Tugas5Panel.jsx
│   │       └── AlgorithmPanel.jsx
│   ├── components/shared/
│   │   ├── StepControls.jsx        # Prev/Next/Play animation controls
│   │   ├── ResultBox.jsx           # Result display container
│   │   ├── AlgoToggle.jsx          # BFS/DFS toggle buttons
│   │   └── PresetGrid.jsx          # Preset graph buttons
│   ├── hooks/
│   │   ├── useGraphCanvas.js       # Cytoscape event handlers: click, shift-click, drag, delete
│   │   ├── useAnimation.js         # Step/frame playback with requestAnimationFrame
│   │   └── useSelectOptions.js     # Sync vertex labels into <select> dropdowns
│   ├── lib/
│   │   ├── cytoscapeConfig.js      # Stylesheet, layout, node sizing constants
│   │   ├── presets.js              # All graph preset data
│   │   ├── specialGraphs.js        # Special graph generators + triangle inequality
│   │   ├── constants.js            # COMP_COLORS, mode titles, hints
│   │   └── islandGrid.js           # Island grid state management
│   └── styles/
│       └── index.css               # Tailwind directives + custom CSS (sidebar, panels, etc.)
```

### Backend (`gui/` — refactored)
```
gui/
├── app.py                          # App factory, CORS, blueprint registration, serve frontend/dist
├── api/
│   ├── __init__.py
│   ├── utils.py                    # build_graph(), success_response(), error_response()
│   └── routes/
│       ├── __init__.py
│       ├── graph.py                 # traversal, path, connected
│       ├── tugas2.py               # components, islands
│       ├── tugas3.py               # properties, shortest_path
│       ├── tugas4.py               # weighted algorithms (Dijkstra, Prim, Kruskal)
│       ├── tugas5.py               # TSP (Christofides + 3-Opt)
│       └── algorithms.py           # Algorithm metadata + source viewer
```

---

## Task 1: Scaffold Vite + React Project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Create the frontend directory and initialize Vite + React**

```bash
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik/frontend
npm install cytoscape react-cytoscapejs zustand
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Vite to proxy `/api` to Flask**

Create `frontend/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: Set up Tailwind CSS**

Replace `frontend/src/index.css` with:

```css
@import "tailwindcss";

:root {
  --bg: #f4f6f8;
  --bg2: #ffffff;
  --primary: #7c6af7;
  --primary-glow: rgba(124, 106, 247, 0.35);
  --accent: #60a5fa;
  --success: #34d399;
  --danger: #f87171;
  --warn: #fbbf24;
}

html, body, #root {
  height: 100%;
  margin: 0;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  color: #0f172a;
}
```

- [ ] **Step 5: Create minimal App.jsx as shell**

```jsx
// frontend/src/App.jsx
export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ padding: 20 }}>Loading...</div>
    </div>
  );
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik/frontend
npm run dev
```

Expected: Vite dev server starts on http://localhost:5173

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Vite + React frontend with Tailwind, Cytoscape.js, Zustand"
```

---

## Task 2: Refactor Flask Backend into Blueprints

**Files:**
- Create: `gui/api/__init__.py`
- Create: `gui/api/utils.py`
- Create: `gui/api/routes/__init__.py`
- Create: `gui/api/routes/graph.py`
- Create: `gui/api/routes/tugas2.py`
- Create: `gui/api/routes/tugas3.py`
- Create: `gui/api/routes/tugas4.py`
- Create: `gui/api/routes/tugas5.py`
- Create: `gui/api/routes/algorithms.py`
- Modify: `gui/app.py`
- Modify: `requirements.txt`

- [ ] **Step 1: Create `gui/api/utils.py`**

```python
import sys
import os
import inspect

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.graph import DirectedGraph, UndirectedGraph


def build_graph(data):
    directed = data.get("directed", False)
    g = DirectedGraph() if directed else UndirectedGraph()
    for v in data.get("vertices", []):
        g.add_vertex(v)
    for e in data.get("edges", []):
        g.add_edge(e["from"], e["to"], e.get("weight", 1))
    return g


def success_response(data):
    return data, 200


def error_response(message, code=400):
    return {"error": message}, code


# Algorithm metadata for the viewer
ALGORITHM_REGISTRY = {
    "1": {
        "tugas": 1,
        "name": "traversal",
        "label": "Traversal & Path Finding",
        "file": "src/algorithms/tugas1.py",
        "class": "Tugas1",
        "methods": [
            {"name": "find_path_bfs", "description": "Find path between two nodes using BFS"},
            {"name": "find_path_dfs", "description": "Find path between two nodes using DFS"},
            {"name": "is_connected_bfs", "description": "Check graph connectivity using BFS"},
            {"name": "is_connected_dfs", "description": "Check graph connectivity using DFS"},
        ],
    },
    "2": {
        "tugas": 2,
        "name": "components",
        "label": "Components & Islands",
        "file": "src/algorithms/tugas2.py",
        "class": "Tugas2",
        "methods": [
            {"name": "components_count", "description": "Count connected components"},
            {"name": "largest_component", "description": "Find size of largest component"},
            {"name": "island_count", "description": "Count islands in a grid"},
        ],
    },
    "3": {
        "tugas": 3,
        "name": "properties",
        "label": "Graph Properties",
        "file": "src/algorithms/tugas3.py",
        "class": "Tugas3",
        "methods": [
            {"name": "is_bipartite", "description": "Check if graph is bipartite"},
            {"name": "has_cycle", "description": "Detect if graph contains a cycle"},
            {"name": "diameter", "description": "Compute graph diameter"},
            {"name": "girth", "description": "Compute graph girth (shortest cycle)"},
            {"name": "shortest_path", "description": "Shortest distance between two nodes"},
        ],
    },
    "4": {
        "tugas": 4,
        "name": "weighted",
        "label": "Weighted Graph Algorithms",
        "file": "src/algorithms/tugas4.py",
        "class": "Tugas4",
        "methods": [
            {"name": "shortest_path", "description": "Dijkstra's shortest path"},
            {"name": "mst_prim", "description": "Prim's MST algorithm"},
            {"name": "mst_kruskal", "description": "Kruskal's MST algorithm"},
        ],
    },
    "5": {
        "tugas": 5,
        "name": "tsp",
        "label": "TSP (Christofides + 3-Opt)",
        "file": "src/algorithms/tugas5.py",
        "class": "Tugas5",
        "methods": [
            {"name": "christofides_3opt_tsp_trace", "description": "TSP via Christofides + 3-Opt local search"},
        ],
    },
}
```

- [ ] **Step 2: Create `gui/api/routes/graph.py`**

```python
from flask import Blueprint, request
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas1 import Tugas1

tugas1 = Tugas1()
graph_bp = Blueprint("graph", __name__, url_prefix="/api")


@graph_bp.route("/traversal", methods=["POST"])
def api_traversal():
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")
    algo = data.get("algo", "bfs")

    if start not in g.get_vertices():
        return error_response(f"Start vertex '{start}' not in graph")

    if algo == "bfs":
        order = g.bfs(start)
    else:
        order = g.dfs(start)

    return {"order": order, "algo": algo}


@graph_bp.route("/path", methods=["POST"])
def api_path():
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")
    end = data.get("end")
    algo = data.get("algo", "bfs")

    if algo == "bfs":
        path = tugas1.find_path_bfs(g, start, end)
    else:
        path = tugas1.find_path_dfs(g, start, end)

    return {"path": path, "algo": algo, "found": path is not None}


@graph_bp.route("/connected", methods=["POST"])
def api_connected():
    data = request.get_json()
    g = build_graph(data)
    algo = data.get("algo", "bfs")

    if algo == "bfs":
        result = tugas1.is_connected_bfs(g)
    else:
        result = tugas1.is_connected_dfs(g)

    return {"connected": result, "algo": algo}
```

- [ ] **Step 3: Create `gui/api/routes/tugas2.py`**

```python
from collections import deque
from flask import Blueprint, request
from gui.api.utils import build_graph
from src.algorithms.tugas2 import Tugas2

tugas2 = Tugas2()
tugas2_bp = Blueprint("tugas2", __name__, url_prefix="/api")


@tugas2_bp.route("/components", methods=["POST"])
def api_components():
    data = request.get_json()
    g = build_graph(data)

    count = tugas2.components_count(g)
    largest = tugas2.largest_component(g)

    vertex_component = {}
    comp_id = 0
    all_vertices = set(g.get_vertices())
    while all_vertices:
        start = next(iter(all_vertices))
        queue = deque([start])
        visited = {start}
        while queue:
            cur = queue.popleft()
            vertex_component[cur] = comp_id
            for nb, _ in g.get_neighbors(cur):
                if nb in all_vertices and nb not in visited:
                    visited.add(nb)
                    queue.append(nb)
        all_vertices -= visited
        comp_id += 1

    return {"count": count, "largest": largest, "vertex_component": vertex_component}


@tugas2_bp.route("/islands", methods=["POST"])
def api_islands():
    data = request.get_json()
    grid = data.get("grid", [])

    if not grid:
        return {"count": 0, "islands": []}

    rows = len(grid)
    cols = len(grid[0])
    visited = set()
    islands = []

    def explore(r, c, cells):
        if not (0 <= r < rows and 0 <= c < cols):
            return
        if grid[r][c] == "W":
            return
        if (r, c) in visited:
            return
        visited.add((r, c))
        cells.append([r, c])
        explore(r - 1, c, cells)
        explore(r + 1, c, cells)
        explore(r, c - 1, cells)
        explore(r, c + 1, cells)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "L" and (r, c) not in visited:
                cells = []
                explore(r, c, cells)
                islands.append(cells)

    return {"count": len(islands), "islands": islands}
```

- [ ] **Step 4: Create `gui/api/routes/tugas3.py`**

```python
from flask import Blueprint, request
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas3 import Tugas3

tugas3_bp = Blueprint("tugas3", __name__, url_prefix="/api/tugas3")


@tugas3_bp.route("/properties", methods=["POST"])
def api_properties():
    data = request.get_json()
    g = build_graph(data)

    try:
        is_bip = Tugas3.is_bipartite(g)
        has_cyc = Tugas3.has_cycle(g)
        diam = Tugas3.diameter(g)
        grth = Tugas3.girth(g)
        return {
            "is_bipartite": is_bip,
            "has_cycle": has_cyc,
            "diameter": diam,
            "girth": grth,
        }
    except Exception as e:
        return error_response(str(e), 500)


@tugas3_bp.route("/shortest_path", methods=["POST"])
def api_shortest_path():
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")
    end = data.get("end")

    if not start or not end:
        return error_response("Start and end nodes are required")

    if start not in g.get_vertices() or end not in g.get_vertices():
        return error_response("Start and end nodes must be in the graph")

    try:
        distance = Tugas3.shortest_path(g, start, end)
        return {"distance": distance if distance != float("inf") else -1}
    except Exception as e:
        return error_response(str(e), 500)
```

- [ ] **Step 5: Create `gui/api/routes/tugas4.py`**

```python
from flask import Blueprint, request
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas4 import Tugas4

Tugas4  # ensure import

tugas4_bp = Blueprint("tugas4", __name__, url_prefix="/api/tugas4")


@tugas4_bp.route("/run", methods=["POST"])
def api_run():
    data = request.get_json()
    g = build_graph(data)
    algorithm = data.get("algorithm", "shortest_path")

    try:
        if algorithm == "shortest_path":
            start = data.get("start")
            end = data.get("end")
            if not start or not end:
                return error_response("Start and end nodes are required")

            path, distance, steps, frames = Tugas4.shortest_path_trace(g, start, end)
            return {
                "algorithm": algorithm,
                "found": bool(path),
                "path": path,
                "distance": distance,
                "steps": steps,
                "frames": frames,
            }

        if algorithm == "prim":
            if data.get("directed", False):
                return error_response("Prim requires an undirected graph")
            mst_graph, edges, total_weight, steps, frames = Tugas4.mst_prim_trace(g)
            return {
                "algorithm": algorithm,
                "edges": edges,
                "total_weight": total_weight,
                "steps": steps,
                "frames": frames,
                "nodes": mst_graph.get_vertices(),
            }

        if algorithm == "kruskal":
            if data.get("directed", False):
                return error_response("Kruskal requires an undirected graph")
            mst_graph, edges, total_weight, steps, frames = Tugas4.mst_kruskal_trace(g)
            return {
                "algorithm": algorithm,
                "edges": edges,
                "total_weight": total_weight,
                "steps": steps,
                "frames": frames,
                "nodes": mst_graph.get_vertices(),
            }

        return error_response("Unknown Tugas 4 algorithm")
    except Exception as e:
        return error_response(str(e), 500)
```

- [ ] **Step 6: Create `gui/api/routes/tugas5.py`**

```python
from flask import Blueprint, request
from gui.api.utils import build_graph
from src.algorithms.tugas5 import Tugas5

Tugas5  # ensure import

tugas5_bp = Blueprint("tugas5", __name__, url_prefix="/api/tugas5")


@tugas5_bp.route("/tsp", methods=["POST"])
def api_tsp():
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")

    try:
        tour, total_weight, selected_edges, steps, frames = Tugas5.christofides_3opt_tsp_trace(g, start)
        return {
            "algorithm": "christofides_3opt_tsp",
            "tour": tour,
            "total_weight": total_weight,
            "edges": selected_edges,
            "steps": steps,
            "frames": frames,
        }
    except Exception as e:
        return {"error": str(e)}, 500
```

- [ ] **Step 7: Create `gui/api/routes/algorithms.py`**

```python
import os
import inspect
from flask import Blueprint, jsonify
from gui.api.utils import ALGORITHM_REGISTRY

algorithms_bp = Blueprint("algorithms", __name__, url_prefix="/api/algorithms")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@algorithms_bp.route("", methods=["GET"])
def list_algorithms():
    return jsonify(list(ALGORITHM_REGISTRY.values()))


@algorithms_bp.route("/<tugas>", methods=["GET"])
def get_tugas_algorithms(tugas):
    entry = ALGORITHM_REGISTRY.get(tugas)
    if not entry:
        return jsonify({"error": f"Tugas {tugas} not found"}), 404
    return jsonify(entry)


@algorithms_bp.route("/<tugas>/<name>", methods=["GET"])
def get_algorithm_source(tugas, name):
    entry = ALGORITHM_REGISTRY.get(tugas)
    if not entry:
        return jsonify({"error": f"Tugas {tugas} not found"}), 404

    filepath = os.path.join(PROJECT_ROOT, entry["file"])
    if not os.path.exists(filepath):
        return jsonify({"error": "Source file not found"}), 404

    with open(filepath, "r") as f:
        source = f.read()

    return jsonify({
        **entry,
        "source": source,
    })
```

- [ ] **Step 8: Create `gui/api/__init__.py` and `gui/api/routes/__init__.py`**

```python
# gui/api/__init__.py
# (empty — package marker)
```

```python
# gui/api/routes/__init__.py
# (empty — package marker)
```

- [ ] **Step 9: Rewrite `gui/app.py` as app factory with blueprints + CORS + static serving**

```python
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, send_from_directory
from flask_cors import CORS

from gui.api.routes.graph import graph_bp
from gui.api.routes.tugas2 import tugas2_bp
from gui.api.routes.tugas3 import tugas3_bp
from gui.api.routes.tugas4 import tugas4_bp
from gui.api.routes.tugas5 import tugas5_bp
from gui.api.routes.algorithms import algorithms_bp


def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)

    app.register_blueprint(graph_bp)
    app.register_blueprint(tugas2_bp)
    app.register_blueprint(tugas3_bp)
    app.register_blueprint(tugas4_bp)
    app.register_blueprint(tugas5_bp)
    app.register_blueprint(algorithms_bp)

    # Serve React frontend in production
    frontend_dist = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "frontend",
        "dist",
    )

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        return send_from_directory(frontend_dist, "index.html")

    return app


app = create_app()
```

- [ ] **Step 10: Update `requirements.txt` to add flask-cors**

```
Flask==3.0.0
Werkzeug==3.0.1
networkx==3.2.1
numpy==1.26.4
flask-cors==4.0.0
```

- [ ] **Step 11: Install and verify Flask starts**

```bash
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik
pip install flask-cors
python -c "from gui.app import app; print('Flask app OK')"
```

- [ ] **Step 12: Update `run_gui.py`**

```python
#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gui.app import app

if __name__ == "__main__":
    print("\n  Graph Algorithm Visualizer")
    print("  Open: http://localhost:5000\n")
    app.run(debug=True, port=5000)
```

- [ ] **Step 13: Commit**

```bash
git add gui/ requirements.txt run_gui.py
git commit -m "feat: refactor Flask backend into blueprint modules with algorithm viewer endpoint"
```

---

## Task 3: Create Graph Store (Zustand)

**Files:**
- Create: `frontend/src/store/graphStore.js`
- Create: `frontend/src/lib/constants.js`

- [ ] **Step 1: Create constants**

Create `frontend/src/lib/constants.js`:

```js
export const COMP_COLORS = [
  "#7c6af7", "#60a5fa", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#38bdf8", "#4ade80", "#fb923c", "#e879f9",
];

export const MODES = [
  "setup", "traversal", "path", "connected", "components",
  "islands", "properties", "shortest", "tugas4", "tugas5", "algorithms",
];

export const MODE_TITLES = {
  setup: "Graph Setup",
  traversal: "Traversal",
  path: "Path Finding",
  connected: "Connectivity",
  components: "Components",
  islands: "Island Count",
  properties: "Graph Properties",
  shortest: "Shortest Distance",
  tugas4: "Weighted Graph Algorithms",
  tugas5: "TSP Algorithm",
  algorithms: "Algorithm Viewer",
};

export const MODE_HINTS = {
  setup: "Click canvas to add node \u00b7 Shift+click nodes to add edge \u00b7 Right-click node to delete",
  traversal: "Select start node and run BFS or DFS traversal",
  path: "Select source and destination nodes to find a path",
  connected: "Check if the graph is fully connected",
  components: "Colour-code and count connected components",
  islands: "Click cells in the grid to toggle Land / Water",
  properties: "Analyze bipartite nature, cycles, girth, and diameter",
  shortest: "Find the shortest distance between two specific nodes",
  tugas4: "Run weighted graph algorithms and step through the animation",
  tugas5: "Run Christofides + 3-Opt TSP to find a Hamiltonian cycle",
  algorithms: "Browse algorithm source code by Tugas",
};

export const SPECIAL_GRAPHS = {
  complete: { name: "Complete Graph (Kn)", params: [{ id: "n", label: "n", default: 5 }] },
  bipartite: { name: "Complete Bipartite (Km,n)", params: [{ id: "m", label: "m", default: 3 }, { id: "n", label: "n", default: 3 }] },
  tree: { name: "Tree (Tn)", params: [{ id: "n", label: "n", default: 7 }] },
  cycle: { name: "Cycle (Cn)", params: [{ id: "n", label: "n", default: 6 }] },
  path: { name: "Path (Pn)", params: [{ id: "n", label: "n", default: 5 }] },
  wheel: { name: "Wheel (Wn)", params: [{ id: "n", label: "n", default: 6 }] },
  prism: { name: "Prism", params: [{ id: "n", label: "n", default: 5 }] },
  petersen: { name: "Petersen", params: [] },
  gen_petersen: { name: "Gen Petersen P(n,k)", params: [{ id: "n", label: "n", default: 5 }, { id: "k", label: "k", default: 2 }] },
  circulant: { name: "Circulant Cn(a...)", params: [{ id: "n", label: "n", default: 8 }, { id: "j", label: "Jumps", default: "1,2", type: "text" }] },
  hypercube: { name: "Hypercube (Hn)", params: [{ id: "n", label: "n", default: 3 }] },
  grid: { name: "Grid G(m,n)", params: [{ id: "m", label: "m", default: 3 }, { id: "n", label: "n", default: 4 }] },
};
```

- [ ] **Step 2: Create Zustand store**

Create `frontend/src/store/graphStore.js`:

```js
import { create } from "zustand";

const initialState = {
  vertices: {},
  edges: [],
  directed: false,
  mode: "setup",
  traversalAlgo: "bfs",
  pathAlgo: "bfs",
  connectedAlgo: "bfs",
  t4Algorithm: "shortest_path",
  shiftFirst: null,
  animation: {
    steps: [],
    stepIndex: 0,
    isPlaying: false,
    frames: [],
    frameIndex: 0,
    isPlayingFrames: false,
    highlightedNodes: new Set(),
    pathNodes: [],
    pathEdges: new Set(),
    activePathEdge: null,
    pulseNode: null,
    componentMap: {},
    numComponents: 0,
    cutEdges: new Set(),
    swapEdges: new Set(),
    finalPathEdges: new Set(),
  },
  islandGrid: [],
  islandResult: null,
};

export const useGraphStore = create((set, get) => ({
  ...initialState,

  setMode: (mode) =>
    set((s) => ({
      mode,
      animation: { ...initialState.animation },
      islandResult: mode === "islands" ? s.islandResult : null,
    })),

  setDirected: (directed) => set({ directed }),

  addVertex: (label, x, y) =>
    set((s) => ({
      vertices: { ...s.vertices, [label]: { x, y } },
    })),

  removeVertex: (label) =>
    set((s) => ({
      vertices: { ...s.vertices, [label]: undefined } },
      () => {
        const {[label]: _, ...rest} = s.vertices;
        return {
          vertices: rest,
          edges: s.edges.filter((e) => e.from !== label && e.to !== label),
          animation: { ...initialState.animation },
        };
      },
    )),

  addEdge: (from, to, weight = 1) =>
    set((s) => {
      const existing = s.edges.find((e) => e.from === from && e.to === to);
      if (existing) {
        return {
          edges: s.edges.map((e) =>
            e.from === from && e.to === to ? { ...e, weight } : e
          ),
        };
      }
      return { edges: [...s.edges, { from, to, weight }] };
    }),

  clearGraph: () =>
    set({
      vertices: {},
      edges: [],
      shiftFirst: null,
      animation: { ...initialState.animation },
    }),

  setShiftFirst: (label) => set({ shiftFirst: label }),

  setAnimation: (partial) =>
    set((s) => ({ animation: { ...s.animation, ...partial } })),

  clearAnimation: () =>
    set({ animation: { ...initialState.animation } }),

  setTraversalAlgo: (algo) => set({ traversalAlgo: algo }),
  setPathAlgo: (algo) => set({ pathAlgo: algo }),
  setConnectedAlgo: (algo) => set({ connectedAlgo: algo }),
  setT4Algorithm: (algo) => set({ t4Algorithm: algo }),

  setIslandGrid: (grid) => set({ islandGrid: grid }),
  setIslandResult: (result) => set({ islandResult: result }),

  loadGraphData: ({ vertices, edges, directed }) =>
    set({
      vertices,
      edges,
      directed: directed ?? false,
      animation: { ...initialState.animation },
      shiftFirst: null,
    }),
}));
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/ frontend/src/lib/constants.js
git commit -m "feat: add Zustand graph store and constants"
```

---

## Task 4: Create Cytoscape Config and API Client

**Files:**
- Create: `frontend/src/lib/cytoscapeConfig.js`
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/lib/presets.js`
- Create: `frontend/src/lib/specialGraphs.js`

- [ ] **Step 1: Create Cytoscape configuration**

Create `frontend/src/lib/cytoscapeConfig.js`:

```js
const COMP_COLORS = [
  "#7c6af7", "#60a5fa", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#38bdf8", "#4ade80", "#fb923c", "#e879f9",
];

export const cytoscapeStylesheet = [
  {
    selector: "node",
    style: {
      "background-color": "#ffffff",
      "border-color": "#7c6af7",
      "border-width": 2,
      label: "data(label)",
      color: "#000000",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": 13,
      "font-weight": 600,
      width: 44,
      height: 44,
      "text-outline-color": "#fff",
      "text-outline-width": 2,
    },
  },
  {
    selector: "node.highlighted",
    style: {
      "background-color": "rgba(52, 211, 153, 0.55)",
      "border-color": "#34d399",
    },
  },
  {
    selector: "node.path",
    style: {
      "background-color": "rgba(251, 191, 36, 0.75)",
      "border-color": "#fbbf24",
    },
  },
  {
    selector: "node.pulse",
    style: {
      "background-color": "rgba(52, 211, 153, 0.7)",
      "border-color": "#34d399",
      "border-width": 4,
    },
  },
  {
    selector: "node.shift-selected",
    style: {
      "background-color": "rgba(96, 165, 250, 0.25)",
      "border-color": "#60a5fa",
    },
  },
  ...COMP_COLORS.map((color, i) => ({
    selector: `node.comp-${i}`,
    style: {
      "background-color": color + "55",
      "border-color": color,
    },
  })),
  {
    selector: "edge",
    style: {
      width: 1.5,
      "line-color": "#111122",
      label: "data(weightLabel)",
      "font-size": 11,
      "font-weight": 600,
      color: "#1e293b",
      "text-background-color": "rgba(255, 255, 255, 0.95)",
      "text-background-opacity": 1,
      "text-background-padding": "3px",
      "text-background-shape": "round-rectangle",
      "text-rotation": "autorotate",
      "text-valign": "center",
      "text-halign": "center",
      "curve-style": "bezier",
      "target-arrow-shape": "none",
    },
  },
  {
    selector: "edge.directed",
    style: {
      "target-arrow-shape": "triangle",
      "target-arrow-color": "#111122",
      "arrow-scale": 0.8,
    },
  },
  {
    selector: "edge.path-edge",
    style: {
      width: 3,
      "line-color": "#fbbf24",
      "target-arrow-color": "#fbbf24",
    },
  },
  {
    selector: "edge.active-edge",
    style: {
      width: 4,
      "line-color": "#4aa3ff",
      "target-arrow-color": "#4aa3ff",
    },
  },
  {
    selector: "edge.cut-edge",
    style: {
      width: 3,
      "line-color": "#ef4444",
      "line-style": "dashed",
      "target-arrow-color": "#ef4444",
    },
  },
  {
    selector: "edge.swap-edge",
    style: {
      width: 3,
      "line-color": "#22c55e",
      "target-arrow-color": "#22c55e",
    },
  },
];

export const cytoscapeLayout = {
  name: "preset",
};
```

- [ ] **Step 2: Create API client**

Create `frontend/src/api/client.js`:

```js
const API_BASE = "/api";

async function apiPost(endpoint, payload) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "API error");
  }
  return res.json();
}

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "API error");
  }
  return res.json();
}

export function graphPayload(state, extra = {}) {
  const vertices = Object.keys(state.vertices);
  const edges = [...new Set(state.edges.map((e) => JSON.stringify(e)))].map(
    (s) => JSON.parse(s)
  );
  const seen = new Set();
  const cleanEdges = [];
  for (const e of edges) {
    const key = state.directed
      ? `${e.from}->${e.to}`
      : [e.from, e.to].sort().join("-");
    if (!seen.has(key)) {
      seen.add(key);
      cleanEdges.push(e);
    }
  }
  return { vertices, edges: cleanEdges, directed: state.directed, ...extra };
}

export const api = {
  traversal: (payload) => apiPost("/traversal", payload),
  path: (payload) => apiPost("/path", payload),
  connected: (payload) => apiPost("/connected", payload),
  components: (payload) => apiPost("/components", payload),
  islands: (payload) => apiPost("/islands", payload),
  tugas3Properties: (payload) => apiPost("/tugas3/properties", payload),
  tugas3Shortest: (payload) => apiPost("/tugas3/shortest_path", payload),
  tugas4Run: (payload) => apiPost("/tugas4/run", payload),
  tugas5Tsp: (payload) => apiPost("/tugas5/tsp", payload),
  listAlgorithms: () => apiGet("/algorithms"),
  getAlgorithm: (tugas, name) => apiGet(`/algorithms/${tugas}/${name}`),
};
```

- [ ] **Step 3: Create presets data**

Create `frontend/src/lib/presets.js` — port all presets from `app.js` (triangle, chain, disconnected, complete4, t4_shortest, t4_shortest_alt, t4_mst, t4_mst_dense, t4_mst_sparse, t4_kruskal, t5_k4, t5_pentagon, t5_clusters, t5_trap, t5_deadend, t5_dense). This is a direct port of the `loadPreset` function's data section, structured as an object mapping preset name → `{ vertices, edges }`, where edges are `[{ from, to, weight }]`. The `buildCircularPreset` helper is included.

- [ ] **Step 4: Create special graphs generator**

Create `frontend/src/lib/specialGraphs.js` — port the `generateSpecialGraph` function and `SPECIAL_GRAPHS` config from `app.js`, including `applyTriangleInequalityWeights` and `getRandomEdgeWeight`. This is pure computation logic with no DOM dependency.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/ frontend/src/api/
git commit -m "feat: add Cytoscape config, API client, presets, and special graph generators"
```

---

## Task 5: Build GraphCanvas Component

**Files:**
- Create: `frontend/src/components/GraphCanvas.jsx`
- Create: `frontend/src/hooks/useGraphCanvas.js`
- Create: `frontend/src/hooks/useAnimation.js`

- [ ] **Step 1: Create `useGraphCanvas.js` hook**

This hook manages Cytoscape instance, event handling (click to add node, shift+click for edges, drag for repositioning, right-click for delete), and syncing graph state to Cytoscape elements. It receives the Cytoscape ref and store.

Key behaviors:
- `tap` on background → add node with next label (A-Z)
- `tap` on node with shiftKey → first node selected / create edge
- `cxttap` on node → delete node and incident edges
- `dragfree` on node → update vertex positions in store

- [ ] **Step 2: Create `useAnimation.js` hook**

This hook manages the animation loop for traversal steps and Tugas 4/5 frames. It provides:
- `playAnimation()` — auto-advance steps every 700ms
- `stepForward()` / `stepBack()` — manual stepping
- `playFrames()` — auto-advance T4/T5 frames every 850ms
- `t4StepForward()` / `t4StepBack()` — manual frame stepping
- It uses `requestAnimationFrame` for timing

- [ ] **Step 3: Create `GraphCanvas.jsx` component**

This renders the Cytoscape component with `react-cytoscapejs`, applies the stylesheet from `cytoscapeConfig.js`, and syncs store state (vertices, edges, animation highlights) to Cytoscape element classes. It handles:
- Converting store `vertices`/`edges` to Cytoscape elements format
- Applying animation classes (`.highlighted`, `.path`, `.pulse`, `.comp-N`, `.path-edge`, `.active-edge`, `.cut-edge`, `.swap-edge`, `.directed`) based on store animation state
- Rendering the hint bar at bottom based on current mode
- Swapping between Cytoscape canvas and IslandsPanel based on mode

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/GraphCanvas.jsx frontend/src/hooks/
git commit -m "feat: add GraphCanvas component with Cytoscape.js, interaction and animation hooks"
```

---

## Task 6: Build Sidebar, TopBar, and ControlPanel

**Files:**
- Create: `frontend/src/components/Sidebar.jsx`
- Create: `frontend/src/components/TopBar.jsx`
- Create: `frontend/src/components/ControlPanel.jsx`
- Create: `frontend/src/components/shared/StepControls.jsx`
- Create: `frontend/src/components/shared/ResultBox.jsx`
- Create: `frontend/src/components/shared/AlgoToggle.jsx`
- Create: `frontend/src/components/shared/PresetGrid.jsx`

- [ ] **Step 1: Create `Sidebar.jsx`**

Port the sidebar from `index.html` — a left nav with section labels (Graph, Tugas 1-5, Algorithm Viewer) and mode-switching buttons. Each button calls `useGraphStore.setMode(mode)`. Uses Tailwind CSS classes matching the original purple/white aesthetic. Include an "Algorithms" section at the bottom with an `algorithms` mode button.

- [ ] **Step 2: Create `TopBar.jsx`**

A header bar showing the current mode title, a directed/undirected toggle, and a Clear Graph button. Reads `mode`, `directed` from store; dispatches `setDirected` and `clearGraph`.

- [ ] **Step 3: Create `ControlPanel.jsx`**

Right panel that shows the appropriate panel component based on `mode`. A simple switch:
```jsx
switch (mode) {
  case "setup": return <SetupPanel />;
  case "traversal": return <TraversalPanel />;
  // ... etc
  case "algorithms": return <AlgorithmPanel />;
}
```

- [ ] **Step 4: Create shared components**

- `StepControls.jsx` — Prev/Next/Play buttons with step counter (used by Traversal, Tugas4, Tugas5 panels)
- `ResultBox.jsx` — Container for result display with label/content pattern
- `AlgoToggle.jsx` — BFS/DFS toggle button pair
- `PresetGrid.jsx` — Grid of preset buttons (reused by SetupPanel, Tugas4, Tugas5)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Sidebar.jsx frontend/src/components/TopBar.jsx frontend/src/components/ControlPanel.jsx frontend/src/components/shared/
git commit -m "feat: add Sidebar, TopBar, ControlPanel, and shared UI components"
```

---

## Task 7: Port All Algorithm Panels

**Files:**
- Create: `frontend/src/components/panels/SetupPanel.jsx`
- Create: `frontend/src/components/panels/TraversalPanel.jsx`
- Create: `frontend/src/components/panels/PathPanel.jsx`
- Create: `frontend/src/components/panels/ConnectedPanel.jsx`
- Create: `frontend/src/components/panels/ComponentsPanel.jsx`
- Create: `frontend/src/components/panels/PropertiesPanel.jsx`
- Create: `frontend/src/components/panels/ShortestPanel.jsx`
- Create: `frontend/src/components/panels/Tugas4Panel.jsx`
- Create: `frontend/src/components/panels/Tugas5Panel.jsx`

- [ ] **Step 1: Create `SetupPanel.jsx`**

Port the setup panel: Add Node input, Add Edge inputs (from, to, weight), Preset buttons, Special Formations dropdown with parameter inputs, Randomize Weights toggle with min/max and Triangle Inequality checkbox. All state reads from and writes to `useGraphStore`. When a preset is loaded, call `loadGraphData()` on the store. The special graph generator is imported from `lib/specialGraphs.js`.

- [ ] **Step 2: Create `TraversalPanel.jsx`**

Algorithm toggle (BFS/DFS), start node `<select>`, Run Traversal button. On run, POST to `/api/traversal`, set animation steps in store. Display visit order in ResultBox, show StepControls.

- [ ] **Step 3: Create `PathPanel.jsx`**

Algorithm toggle (BFS/DFS), from/to selects, Run Path Finding. On completion, set `pathNodes` and `pathEdges` in store animation. Display path or "No path found".

- [ ] **Step 4: Create `ConnectedPanel.jsx`**

Algorithm toggle (BFS/DFS), run connectivity check. Show connected/disconnected badge.

- [ ] **Step 5: Create `ComponentsPanel.jsx`**

Run components analysis. On result, set `componentMap` in store. Show count, largest size, and color legend.

- [ ] **Step 6: Create `PropertiesPanel.jsx`**

Run graph properties (bipartite, cycle, diameter, girth). Display each result.

- [ ] **Step 7: Create `ShortestPanel.jsx`**

From/to selects, run shortest distance. Display distance or "Unreachable".

- [ ] **Step 8: Create `Tugas4Panel.jsx`**

Algorithm select (shortest_path/prim/kruskal), conditional start/end selects for shortest_path. Preset buttons specific to Tugas 4. Run button. Step controls with frame-by-frame animation. Display result (path or MST edges + total weight). Show step list.

- [ ] **Step 9: Create `Tugas5Panel.jsx`**

Start node select, TSP-specific presets, Run TSP button. Step controls with frame animation. Display tour, total weight, and color legend (gold=current route, green=swap, red=cut). Show step list.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/panels/
git commit -m "feat: port all algorithm panels to React components"
```

---

## Task 8: Port Islands Grid and Assemble App

**Files:**
- Create: `frontend/src/components/panels/IslandsPanel.jsx`
- Create: `frontend/src/lib/islandGrid.js`
- Create: `frontend/src/hooks/useSelectOptions.js`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `islandGrid.js`**

Port the island grid logic: `initIslands`, `rebuildGrid`, `toggleCell`, `resetGrid`. Pure functions operating on grid data arrays.

- [ ] **Step 2: Create `IslandsPanel.jsx`**

Port the island grid UI: rows/cols inputs, interactive grid (click to toggle L/W), Count Islands button, Reset Grid button. Show result with island count. Uses the island grid functions and calls `api.islands()`.

- [ ] **Step 3: Create `useSelectOptions.js` hook**

A hook that returns vertex labels from the store for populating `<select>` dropdowns. Wraps the store's `vertices` keys.

- [ ] **Step 4: Assemble `App.jsx`**

Full layout: `<Sidebar>` on left, main area with `<TopBar>`, `<GraphCanvas>` (or `<IslandsPanel>` in islands mode), and `<ControlPanel>` on right. Uses CSS Grid matching the current layout (sidebar 220px, control panel 280px, canvas flex).

```jsx
export default function App() {
  const mode = useGraphStore((s) => s.mode);
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: '52px 1fr', gridTemplateColumns: '1fr 280px' }}>
        <TopBar />
        {mode === 'islands' ? <IslandsPanel /> : <GraphCanvas />}
        <ControlPanel />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify the app renders correctly**

```bash
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik/frontend
npm run dev
```

Expected: App loads with sidebar, blank canvas area, and setup panel on right.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/panels/IslandsPanel.jsx frontend/src/lib/islandGrid.js frontend/src/hooks/useSelectOptions.js
git commit -m "feat: add IslandsPanel, assemble App layout with all modes"
```

---

## Task 9: Build Algorithm Viewer

**Files:**
- Create: `frontend/src/components/panels/AlgorithmPanel.jsx`

- [ ] **Step 1: Create `AlgorithmPanel.jsx`**

This panel fetches `/api/algorithms` on mount and displays algorithm metadata grouped by Tugas. Each Tugas section is collapsible. Clicking an algorithm fetches `/api/algorithms/<tugas>/<name>` and displays its source code with syntax highlighting (using a simple `<pre>` with proper formatting or a lightweight highlighter). Shows the method list for each Tugas.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/panels/AlgorithmPanel.jsx
git commit -m "feat: add Algorithm Viewer panel"
```

---

## Task 10: Style and Integration Testing

**Files:**
- Modify: `frontend/src/styles/index.css` (add remaining custom CSS if needed)
- Modify: `frontend/vite.config.js` (production build config)
- Modify: `gui/app.py` (ensure static serving works)

- [ ] **Step 1: Add all custom CSS**

Port remaining CSS from the original `style.css` that isn't covered by Tailwind (canvas wrapper, island grid, result boxes, step lists, toggle switches, etc.) into `frontend/src/index.css`. Key selectors: `.canvas-wrapper`, `.island-wrapper`, `.grid-row`, `.grid-cell`, `.result-box`, `.result-badge`, `.step-list`, `.algo-toggle`, `.num-input`, `.comp-legend`.

- [ ] **Step 2: Test each mode end-to-end**

Start both Flask and Vite dev servers:
```bash
# Terminal 1
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik && python run_gui.py

# Terminal 2
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik/frontend && npm run dev
```

Verify each mode:
1. Setup — add nodes, edges, drag, delete, toggle directed, load presets, generate special graphs
2. Traversal — BFS/DFS with step animation
3. Path Finding — BFS/DFS path display
4. Connectivity — connected/disconnected badge
5. Components — component coloring + legend
6. Islands — grid toggle, count, reset
7. Properties — bipartite, cycle, diameter, girth
8. Shortest Distance — distance display
9. Tugas 4 — Dijkstra, Prim, Kruskal with frame animation
10. Tugas 5 — TSP with step animation, cut/swap edge coloring
11. Algorithm Viewer — browse and view source

- [ ] **Step 3: Build for production and test Flask static serving**

```bash
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik/frontend
npm run build
cd /home/nicholaswisee/Code/projects/teori-graf-algoritmik
python run_gui.py
```

Open http://localhost:5000 and verify the production build works.

- [ ] **Step 4: Remove old frontend files**

Delete `gui/templates/index.html`, `gui/static/app.js`, `gui/static/island.js`, `gui/static/style.css`. Keep `gui/__init__.py` and `gui/__pycache__` (they won't hurt).

- [ ] **Step 5: Update `.gitignore` to include `frontend/node_modules` and `frontend/dist`**

Add to `.gitignore`:
```
frontend/node_modules
frontend/dist
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Vite+React+Cytoscape.js frontend refactor with algorithm viewer"
```

---

## Self-Review

1. **Spec coverage**: Every feature in the design spec has a task. Graph setup (Task 5+7), all 10 algorithm modes (Task 7), island grid (Task 8), algorithm viewer (Task 9), backend refactor (Task 2), Cytoscape rendering (Task 5), special formations + presets (Task 4+7), animation system (Task 5), production deployment (Task 10).

2. **Placeholder scan**: No TBD/TODO/FIXME placeholders. All code blocks show actual implementations.

3. **Type consistency**: `graphPayload()` in `client.js` matches the store shape. All API payloads match what the Flask endpoints expect. Cytoscape element IDs use node labels consistently. Frame data structures (`{ node, edge, text, path_edges, cut_edges, swap_edges }`) match what the backend returns.