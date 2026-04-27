# Graph Algorithm Visualizer — Frontend Refactor Design

**Date:** 2025-04-27
**Scope:** Port vanilla JS/HTML5 Canvas frontend to Vite + React + Cytoscape.js. Refactor Flask backend for readability. Preserve all existing functionality.

---

## 1. Goals

1. Replace the vanilla JS/HTML5 Canvas frontend with a modern Vite + React + Cytoscape.js stack.
2. Improve graph visualization quality: directed edges, weighted labels, animations, step highlighting.
3. Refactor Flask backend into a clean, modular blueprint structure without touching `src/algorithms/`.
4. Add a new **Algorithm Viewer** feature to browse algorithm source code by Tugas.
5. Preserve every existing feature: all 10 modes, presets, special graph generation, island grid, step-by-step animations, TSP 3-Opt visualization.

---

## 2. Architecture

### 2.1 Frontend (`frontend/`)

**Tech Stack:**
- Vite (build tool)
- React 18
- Cytoscape.js + react-cytoscapejs
- Zustand (state management)
- Tailwind CSS (styling)
- PrismJS or react-syntax-highlighter (algorithm source viewing)

**Directory Structure:**
```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx                    # Sidebar + Main layout
│   ├── store/
│   │   └── graphStore.js          # Zustand: vertices, edges, directed, animation state
│   ├── components/
│   │   ├── GraphCanvas.jsx        # Cytoscape.js renderer
│   │   ├── ControlPanel.jsx       # Right panel dispatcher
│   │   ├── Sidebar.jsx            # Left navigation
│   │   ├── AlgorithmViewer.jsx    # NEW: Browse algorithms by Tugas
│   │   ├── panels/
│   │   │   ├── SetupPanel.jsx
│   │   │   ├── TraversalPanel.jsx
│   │   │   ├── PathPanel.jsx
│   │   │   ├── ConnectedPanel.jsx
│   │   │   ├── ComponentsPanel.jsx
│   │   │   ├── IslandsPanel.jsx
│   │   │   ├── PropertiesPanel.jsx
│   │   │   ├── ShortestPanel.jsx
│   │   │   ├── Tugas4Panel.jsx
│   │   │   └── Tugas5Panel.jsx
│   │   └── shared/
│   │       ├── StepControls.jsx
│   │       ├── ResultBox.jsx
│   │       ├── AlgoToggle.jsx
│   │       └── PresetGrid.jsx
│   ├── hooks/
│   │   ├── useGraphCanvas.js      # Cytoscape interaction: click, drag, shift-click, delete
│   │   ├── useAnimation.js        # Step/frame playback logic
│   │   └── useApi.js              # API fetch wrappers
│   ├── lib/
│   │   ├── cytoscapeConfig.js     # Stylesheet, layout defaults
│   │   ├── presets.js             # All graph presets (triangle, chain, t4_mst, t5_k4, etc.)
│   │   ├── specialGraphs.js       # Special graph generators (random, grid, complete, etc.)
│   │   └── constants.js           # Colors, NODE_R, etc.
│   └── styles/
│       └── index.css              # Tailwind directives + custom properties
```

**GraphCanvas (Cytoscape.js) Behavior:**
- **Click canvas** → add node (auto-label A-Z)
- **Shift+click two nodes** → add edge
- **Drag node** → reposition
- **Right-click node** → delete node (and incident edges)
- **Directed toggle** → shows arrowheads on edges
- **Weight labels** → displayed on edge midpoint with white background pill
- **Animations** → `cy.animate()` for smooth transitions; frame-based highlighting via `cy.elements().style()`

**Cytoscape.js Style Classes (mapped from current visual):**
| Class | Effect |
|-------|--------|
| `.node-default` | White fill, purple stroke (#7c6af7) |
| `.node-visited` | Green fill (#34d399) |
| `.node-path` | Gold fill (#fbbf24) |
| `.node-pulse` | Animated green ring |
| `.edge-default` | Dark (#111122), 1.5px |
| `.edge-path` | Gold (#fbbf24), 3px |
| `.edge-active` | Blue (#4aa3ff), 4px |
| `.edge-cut` | Red (#ef4444), dashed |
| `.edge-swap` | Green (#22c55e) |
| `.edge-weight` | White pill label |
| `.component-N` | Fill/stroke mapped from COMP_COLORS[N] |

### 2.2 Backend (Flask — Refactored)

**New Structure:**
```
gui/
├── app.py              # App factory, CORS, blueprint registration, static file serving
├── api/
│   ├── __init__.py
│   ├── utils.py        # build_graph(), response helpers (success_response, error_response)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── graph.py    # traversal, path, connected
│   │   ├── tugas2.py   # components, islands
│   │   ├── tugas3.py   # properties, shortest
│   │   ├── tugas4.py   # weighted algorithms (Dijkstra, Prim, Kruskal)
│   │   ├── tugas5.py   # TSP (Christofides + 3-Opt)
│   │   └── algorithms.py  # NEW: list/view algorithm source
│   └── services/
│       └── graph_service.py  # (optional) shared logic like component coloring
```

**API Endpoints (all preserved):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/traversal` | POST | BFS/DFS traversal |
| `/api/path` | POST | BFS/DFS path finding |
| `/api/connected` | POST | Connectivity check |
| `/api/components` | POST | Component analysis |
| `/api/islands` | POST | Island count |
| `/api/tugas3/properties` | POST | Bipartite, cycle, diameter, girth |
| `/api/tugas3/shortest_path` | POST | Shortest distance |
| `/api/tugas4/run` | POST | Dijkstra/Prim/Kruskal with trace frames |
| `/api/tugas5/tsp` | POST | TSP with trace frames |
| `/api/algorithms` | GET | List all algorithm metadata |
| `/api/algorithms/<tugas>` | GET | List algorithms in a Tugas |
| `/api/algorithms/<tugas>/<name>` | GET | Source code + docstring |

**Refactoring Rules:**
- `src/algorithms/tugas*.py` files are **NOT modified**.
- Each blueprint file handles validation, calls existing algorithm classes, and returns JSON.
- `build_graph()` helper centralized in `api/utils.py`.
- `app.py` serves `frontend/dist` in production; proxies in dev handled by Vite.

### 2.3 Algorithm Viewer (NEW Feature)

A new mode in the sidebar: **Algorithms**.
- Lists all Tugas (1-5) as collapsible sections.
- Clicking an algorithm shows its source code with syntax highlighting.
- Reads from the new `/api/algorithms/*` endpoints.
- This satisfies the requirement to "view the algorithms separately" while keeping them in the current Tugas format.

---

## 3. Data Flow

### Graph State (Zustand)
```
{
  vertices: { label: { x, y } },
  edges: [{ from, to, weight }],
  directed: boolean,
  mode: string,           // current sidebar mode
  animation: {
    steps: [],            // node labels for traversal
    stepIndex: 0,
    isPlaying: false,
    frames: [],           // for Tugas 4/5
    frameIndex: 0,
    highlightedNodes: Set(),
    highlightedEdges: Set(),
    pathNodes: [],
    pathEdges: Set(),
    componentMap: {},
    cutEdges: Set(),      // TSP 3-Opt
    swapEdges: Set(),
  }
}
```

### API Flow
1. User clicks **Run** in a panel.
2. Panel component reads graph state from Zustand.
3. POST to Flask API with `{ directed, vertices, edges, ...params }`.
4. Backend builds Graph object, runs algorithm, returns JSON.
5. Frontend updates Zustand animation state.
6. `GraphCanvas` subscribes to animation state and applies Cytoscape.js styles.

---

## 4. Feature Preservation Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Click to add node | Preserved | Cytoscape.js `tap` on background |
| Shift+click edge | Preserved | Cytoscape.js `tap` with shiftKey |
| Drag nodes | Preserved | Cytoscape.js built-in pan/grab |
| Right-click delete | Preserved | Cytoscape.js `cxttap` |
| Directed toggle | Preserved | Cytoscape.js `target-arrow-shape` |
| Weight labels | Preserved | Cytoscape.js edge labels with `content` |
| Presets (triangle, chain, etc.) | Preserved | `lib/presets.js` |
| Special graph generation | Preserved | `lib/specialGraphs.js` |
| Randomize weights | Preserved | Same logic, moved to frontend |
| Triangle inequality option | Preserved | Same logic, moved to frontend |
| BFS/DFS traversal + animation | Preserved | Step-by-step via Zustand + Cytoscape styles |
| Path finding | Preserved | |
| Connectivity check | Preserved | |
| Components + coloring | Preserved | Component colors via Cytoscape classes |
| Island grid | Preserved | Separate React component, not Cytoscape |
| Graph properties | Preserved | |
| Shortest distance | Preserved | |
| Dijkstra/Prim/Kruskal + frames | Preserved | Frame system mapped to Cytoscape styles |
| TSP + 3-Opt animation | Preserved | Cut/swap/final path edges styled |
| Hamiltonian edge animation | Preserved | Frame-based active edge cycling |
| Auto-play / Step controls | Preserved | `useAnimation` hook with `requestAnimationFrame` |
| Dark purple aesthetic | Preserved | Tailwind + Cytoscape stylesheet |

---

## 5. Development & Deployment

### Dev Workflow
```bash
# Terminal 1: Flask backend
python run_gui.py        # Runs on :5000

# Terminal 2: Vite frontend
cd frontend
npm run dev              # Runs on :5173, proxies /api to :5000
```

### Production Build
```bash
cd frontend
npm run build            # Outputs to frontend/dist
cd ..
python run_gui.py        # Flask serves frontend/dist/index.html at /
```

### Vercel Deployment
- `vercel.json` updated to use the new `gui/app.py` structure.
- Vite build runs before Python deployment.

---

## 6. Testing Plan

1. **Smoke test**: App loads, sidebar modes switch.
2. **Graph setup**: Add nodes, edges, drag, delete, toggle directed.
3. **Each Tugas**: Run every algorithm, verify results and animations.
4. **Presets**: Load every preset, verify graph structure.
5. **Special graphs**: Generate random, complete, grid, etc.
6. **Island grid**: Toggle cells, count islands, verify colors.
7. **Algorithm Viewer**: Browse Tugas, view source, syntax highlighting.
8. **Production build**: Build frontend, run Flask, verify no 404s.

---

## 7. Open Questions

None at this time. Design approved.
