export function buildCircularPreset(labels, edges, canvasWidth, canvasHeight) {
  const radius = Math.min(canvasWidth, canvasHeight) * 0.36;
  const v = {};
  labels.forEach((label, idx) => {
    const angle = -Math.PI / 2 + (idx / labels.length) * Math.PI * 2;
    v[label] = [radius * Math.cos(angle), radius * Math.sin(angle)];
  });
  return { v, e: edges };
}

export const PRESETS = {
  triangle: {
    v: { A: [-150, -90], B: [150, -90], C: [0, 110] },
    e: [["A", "B"], ["B", "C"], ["C", "A"]],
  },
  chain: {
    v: { A: [-220, 0], B: [-110, 0], C: [0, 0], D: [110, 0], E: [220, 0] },
    e: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]],
  },
  disconnected: {
    v: {
      A: [-200, -80], B: [-80, -80], C: [80, -80], D: [200, -80],
      E: [-140, 80], F: [140, 80],
    },
    e: [["A", "B"], ["E", "A"], ["C", "D"], ["F", "D"]],
  },
  complete4: {
    v: { A: [0, -130], B: [130, 60], C: [-130, 60], D: [0, 130] },
    e: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "C"], ["B", "D"], ["C", "D"]],
  },
  t4_shortest: {
    directedOverride: true,
    algoOverride: "shortest_path",
    startOverride: "A",
    endOverride: "F",
    build: (w, h) => buildCircularPreset(
      ["A", "B", "C", "D", "E", "F"],
      [
        ["A", "B", 2], ["A", "C", 5], ["B", "C", 1], ["B", "D", 4],
        ["C", "D", 1], ["C", "E", 7], ["D", "E", 3], ["D", "F", 6], ["E", "F", 2],
      ],
      w, h,
    ),
  },
  t4_shortest_alt: {
    directedOverride: true,
    algoOverride: "shortest_path",
    startOverride: "A",
    endOverride: "G",
    build: (w, h) => buildCircularPreset(
      ["A", "B", "C", "D", "E", "F", "G"],
      [
        ["A", "B", 3], ["A", "C", 1], ["B", "D", 6], ["C", "D", 2],
        ["C", "E", 4], ["D", "F", 2], ["E", "F", 3], ["E", "G", 7], ["F", "G", 1],
      ],
      w, h,
    ),
  },
  t4_mst: {
    algoOverride: "prim",
    build: (w, h) => buildCircularPreset(
      ["A", "B", "C", "D", "E", "F"],
      [
        ["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5],
        ["C", "D", 8], ["C", "E", 10], ["D", "E", 2], ["D", "F", 6], ["E", "F", 3],
      ],
      w, h,
    ),
  },
  t4_mst_dense: {
    algoOverride: "prim",
    build: (w, h) => buildCircularPreset(
      ["A", "B", "C", "D", "E", "F", "G"],
      [
        ["A", "B", 4], ["A", "C", 3], ["A", "D", 7], ["B", "C", 1],
        ["B", "E", 5], ["C", "D", 2], ["C", "F", 6], ["D", "E", 4],
        ["D", "G", 8], ["E", "F", 2], ["E", "G", 3], ["F", "G", 1],
      ],
      w, h,
    ),
  },
  t4_mst_sparse: {
    algoOverride: "prim",
    build: (w, h) => buildCircularPreset(
      ["A", "B", "C", "D", "E", "F"],
      [
        ["A", "B", 2], ["B", "C", 3], ["C", "D", 1],
        ["D", "E", 4], ["E", "F", 2], ["A", "F", 9],
      ],
      w, h,
    ),
  },
  t4_kruskal: {
    algoOverride: "kruskal",
    build: (w, h) => buildCircularPreset(
      ["A", "B", "C", "D", "E", "F"],
      [
        ["A", "B", 6], ["A", "C", 5], ["B", "C", 1], ["B", "D", 4],
        ["C", "D", 2], ["C", "E", 8], ["D", "E", 3], ["D", "F", 7], ["E", "F", 4],
      ],
      w, h,
    ),
  },
  t5_k4: {
    v: { A: [-100, -100], B: [100, -100], C: [100, 100], D: [-100, 100] },
    e: [
      ["A", "B", 10], ["A", "C", 15], ["A", "D", 20],
      ["B", "C", 10], ["B", "D", 25], ["C", "D", 10],
    ],
  },
  t5_pentagon: {
    build: (w, h) => buildCircularPreset(
      ["A", "B", "C", "D", "E"],
      [
        ["A", "B", 5], ["B", "C", 5], ["C", "D", 5], ["D", "E", 5], ["E", "A", 5],
        ["A", "C", 15], ["A", "D", 15], ["B", "D", 15], ["B", "E", 15], ["C", "E", 15],
      ],
      w, h,
    ),
  },
  t5_clusters: {
    v: {
      A: [-220, -50], B: [-260, 60], C: [-140, 40],
      D: [140, -40], E: [260, -60], F: [200, 60],
    },
    e: [
      ["A", "B", 2], ["B", "C", 2], ["A", "C", 2],
      ["D", "E", 2], ["E", "F", 2], ["D", "F", 2],
      ["A", "D", 20], ["A", "E", 25], ["A", "F", 22],
      ["B", "D", 25], ["B", "E", 30], ["B", "F", 28],
      ["C", "D", 15], ["C", "E", 20], ["C", "F", 18],
    ],
  },
  t5_trap: {
    v: { A: [-100, -50], B: [0, -120], C: [100, -50], D: [80, 80], E: [-80, 80] },
    e: [
      ["A", "B", 5], ["A", "C", 1], ["A", "D", 10], ["A", "E", 10],
      ["B", "C", 5], ["B", "D", 10], ["B", "E", 100],
      ["C", "D", 2], ["C", "E", 10], ["D", "E", 5],
    ],
  },
  t5_deadend: {
    v: { A: [-140, 0], B: [0, -120], C: [0, 0], D: [120, -50], E: [120, 50] },
    e: [
      ["A", "C", 5], ["A", "E", 15], ["C", "B", 1],
      ["C", "D", 8], ["C", "E", 10], ["D", "E", 3],
    ],
  },
  t5_dense: {
    build: (w, h) => buildCircularPreset(
      ["A", "B", "C", "D", "E", "F"],
      [
        ["A", "B", 12], ["A", "C", 5], ["A", "D", 18], ["A", "E", 9], ["A", "F", 21],
        ["B", "C", 14], ["B", "D", 6], ["B", "E", 25], ["B", "F", 11],
        ["C", "D", 22], ["C", "E", 8], ["C", "F", 16],
        ["D", "E", 15], ["D", "F", 3], ["E", "F", 10],
      ],
      w, h,
    ),
  },
};