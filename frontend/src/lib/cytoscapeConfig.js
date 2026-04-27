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

export const cytoscapeLayout = { name: "preset" };