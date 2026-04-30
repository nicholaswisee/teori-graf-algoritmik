export const COMP_COLORS = [
  "#7c6af7", "#60a5fa", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#38bdf8", "#4ade80", "#fb923c", "#e879f9",
];

export const MODES = [
  "setup", "traversal", "path", "connected", "components",
  "islands", "properties", "shortest", "tugas4", "tugas5", "tugas6_matching", "tugas6_timetable", "algorithms",
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
  tugas6_matching: "Maximum Matching",
  tugas6_timetable: "Timetabling",
  algorithms: "Algorithm Viewer",
};

export const MODE_HINTS = {
  setup: "Click canvas to add node · Shift+click nodes to add edge · Right-click node to delete",
  traversal: "Select start node and run BFS or DFS traversal",
  path: "Select source and destination nodes to find a path",
  connected: "Check if the graph is fully connected",
  components: "Colour-code and count connected components",
  islands: "Click cells in the grid to toggle Land / Water",
  properties: "Analyze bipartite nature, cycles, girth, and diameter",
  shortest: "Find the shortest distance between two specific nodes",
  tugas4: "Run weighted graph algorithms and step through the animation",
  tugas5: "Run Christofides + 3-Opt TSP to find a Hamiltonian cycle",
  tugas6_matching: "Find maximum matching in a bipartite graph using Hopcroft-Karp",
  tugas6_timetable: "Build a conflict-free timetable using graph coloring",
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