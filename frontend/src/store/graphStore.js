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
}));