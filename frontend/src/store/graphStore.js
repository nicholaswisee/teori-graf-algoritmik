import { create } from "zustand";

const initialAnimation = {
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
};

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
  animation: { ...initialAnimation },
  islandGrid: [],
  islandResult: null,
};

export const useGraphStore = create((set, get) => ({
  ...initialState,

  setMode: (mode) =>
    set({ mode, animation: { ...initialAnimation }, islandResult: mode === "islands" ? get().islandResult : null }),

  setDirected: (directed) => set({ directed }),

  addVertex: (label, x, y) =>
    set((s) => ({ vertices: { ...s.vertices, [label]: { x, y } } })),

  removeVertex: (label) =>
    set((s) => {
      // eslint-disable-next-line no-unused-vars
      const { [label]: _removed, ...restVertices } = s.vertices;
      return {
        vertices: restVertices,
        edges: s.edges.filter((e) => e.from !== label && e.to !== label),
        animation: { ...initialAnimation },
      };
    }),

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

  removeEdge: (from, to) =>
    set((s) => ({
      edges: s.edges.filter((e) => !(e.from === from && e.to === to)),
    })),

  clearGraph: () =>
    set({
      vertices: {},
      edges: [],
      shiftFirst: null,
      animation: { ...initialAnimation },
    }),

  setShiftFirst: (label) => set({ shiftFirst: label }),

  updateVertexPosition: (label, x, y) =>
    set((s) => ({
      vertices: { ...s.vertices, [label]: { ...s.vertices[label], x, y } },
    })),

  loadGraphData: ({ vertices, edges, directed }) =>
    set({
      vertices,
      edges,
      directed: directed ?? false,
      animation: { ...initialAnimation },
      shiftFirst: null,
    }),

  setAnimation: (partial) =>
    set((s) => ({ animation: { ...s.animation, ...partial } })),

  clearAnimation: () =>
    set({ animation: { ...initialAnimation } }),

  setTraversalAlgo: (algo) => set({ traversalAlgo: algo }),
  setPathAlgo: (algo) => set({ pathAlgo: algo }),
  setConnectedAlgo: (algo) => set({ connectedAlgo: algo }),
  setT4Algorithm: (algo) => set({ t4Algorithm: algo }),

  setIslandGrid: (grid) => set({ islandGrid: grid }),
  setIslandResult: (result) => set({ islandResult: result }),

  applyRcmLabels: (labeling) =>
    set((s) => {
      // labeling: dict {oldLabel: newLabel}
      // Rename vertices and update all edge references
      const newVertices = {};
      for (const [oldLabel, pos] of Object.entries(labeling)) {
        if (s.vertices[oldLabel]) {
          newVertices[String(pos)] = { ...s.vertices[oldLabel] };
        }
      }

      const newEdges = [];
      const seen = new Set();
      for (const e of s.edges) {
        const newFrom = String(labeling[e.from] ?? e.from);
        const newTo = String(labeling[e.to] ?? e.to);
        const key = s.directed
          ? `${newFrom}->${newTo}`
          : [newFrom, newTo].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          newEdges.push({ ...e, from: newFrom, to: newTo });
        }
      }

      return {
        vertices: newVertices,
        edges: newEdges,
        animation: { ...initialAnimation },
        shiftFirst: null,
      };
    }),

  autoPositionRcm: (labeling) =>
    set((s) => {
      // labeling: dict {vertexName: positionNumber}
      // Position vertices horizontally in a line according to RCM labels.
      const n = Object.keys(labeling).length;
      if (n === 0) return {};

      const el =
        document.querySelector('.canvas-wrapper') ||
        document.querySelector('[data-canvas]');
      const canvasW = el ? el.clientWidth || 600 : 600;
      const canvasH = el ? el.clientHeight || 400 : 400;

      const margin = 80;
      const usableW = Math.max(canvasW - margin * 2, 100);
      const spacing = usableW / (n + 1);
      const cy = canvasH / 2;

      const newVertices = {};
      for (const [label, pos] of Object.entries(labeling)) {
        if (s.vertices[label]) {
          newVertices[label] = {
            x: margin + pos * spacing,
            y: cy,
          };
        }
      }

      return {
        vertices: { ...s.vertices, ...newVertices },
        animation: { ...initialAnimation },
      };
    }),

  autoPositionCircular: () =>
    set((s) => {
      const labels = Object.keys(s.vertices);
      const n = labels.length;
      if (n === 0) return {};

      const el =
        document.querySelector('.canvas-wrapper') ||
        document.querySelector('[data-canvas]');
      const canvasW = el ? el.clientWidth || 600 : 600;
      const canvasH = el ? el.clientHeight || 400 : 400;

      const cx = canvasW / 2;
      const cy = canvasH / 2;
      const baseR = Math.min(canvasW, canvasH) * 0.35;
      const r = Math.max(baseR, n * 18);

      const newVertices = {};
      for (let i = 0; i < n; i++) {
        const label = labels[i];
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        newVertices[label] = {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        };
      }

      return {
        vertices: { ...s.vertices, ...newVertices },
        animation: { ...initialAnimation },
      };
    }),

  autoPositionForceDirected: () =>
    set((s) => {
      const labels = Object.keys(s.vertices);
      const n = labels.length;
      if (n === 0) return {};

      const el =
        document.querySelector('.canvas-wrapper') ||
        document.querySelector('[data-canvas]');
      const canvasW = el ? el.clientWidth || 600 : 600;
      const canvasH = el ? el.clientHeight || 400 : 400;

      // Initialize positions (random or keep current)
      const positions = {};
      for (const label of labels) {
        const existing = s.vertices[label];
        if (existing && existing.x != null && existing.y != null) {
          positions[label] = { x: existing.x, y: existing.y };
        } else {
          positions[label] = {
            x: canvasW / 2 + (Math.random() - 0.5) * canvasW * 0.5,
            y: canvasH / 2 + (Math.random() - 0.5) * canvasH * 0.5,
          };
        }
      }

      // Build adjacency set for quick lookup
      const adj = {};
      for (const e of s.edges) {
        if (!adj[e.from]) adj[e.from] = new Set();
        if (!adj[e.to]) adj[e.to] = new Set();
        adj[e.from].add(e.to);
        adj[e.to].add(e.from);
      }

      // Force-directed simulation parameters
      const iterations = 300;
      const k = Math.sqrt((canvasW * canvasH) / n) * 0.8; // ideal edge length
      const repulsion = 8000; // Coulomb constant
      const attraction = 0.05; // spring constant
      const damping = 0.85; // velocity damping
      const maxDisp = canvasW / 10; // max displacement per iteration
      const centerGravity = 0.03; // pull toward center

      const velocities = {};
      for (const label of labels) {
        velocities[label] = { x: 0, y: 0 };
      }

      for (let iter = 0; iter < iterations; iter++) {
        // Repulsive forces (all pairs)
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const u = labels[i];
            const v = labels[j];
            const dx = positions[v].x - positions[u].x;
            const dy = positions[v].y - positions[u].y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.01) dist = 0.01;

            const force = repulsion / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            velocities[u].x -= fx;
            velocities[u].y -= fy;
            velocities[v].x += fx;
            velocities[v].y += fy;
          }
        }

        // Attractive forces (edges)
        const seenPairs = new Set();
        for (const e of s.edges) {
          const pairKey = [e.from, e.to].sort().join('-');
          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          const u = e.from;
          const v = e.to;
          const dx = positions[v].x - positions[u].x;
          const dy = positions[v].y - positions[u].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

          const force = attraction * (dist - k);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          velocities[u].x += fx;
          velocities[u].y += fy;
          velocities[v].x -= fx;
          velocities[v].y -= fy;
        }

        // Center gravity (keep graph in view)
        const cx = canvasW / 2;
        const cy = canvasH / 2;
        for (const label of labels) {
          const dx = cx - positions[label].x;
          const dy = cy - positions[label].y;
          velocities[label].x += dx * centerGravity;
          velocities[label].y += dy * centerGravity;
        }

        // Apply velocities with damping and bounds
        for (const label of labels) {
          velocities[label].x *= damping;
          velocities[label].y *= damping;

          const disp = Math.sqrt(velocities[label].x ** 2 + velocities[label].y ** 2);
          const scale = disp > maxDisp ? maxDisp / disp : 1;

          positions[label].x += velocities[label].x * scale;
          positions[label].y += velocities[label].y * scale;

          // Keep within canvas bounds with margin
          const margin = 40;
          positions[label].x = Math.max(margin, Math.min(canvasW - margin, positions[label].x));
          positions[label].y = Math.max(margin, Math.min(canvasH - margin, positions[label].y));
        }
      }

      const newVertices = {};
      for (const label of labels) {
        newVertices[label] = {
          x: positions[label].x,
          y: positions[label].y,
        };
      }

      return {
        vertices: newVertices,
        animation: { ...initialAnimation },
      };
    }),
}));