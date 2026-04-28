import { SPECIAL_GRAPHS } from "./constants";

export function getRandomEdgeWeight(min = 1, max = 20) {
  const lo = Math.max(1, min);
  const hi = Math.max(lo, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

export function applyTriangleInequalityWeights(vertices, edges) {
  const nodes = Object.keys(vertices);
  const n = nodes.length;
  if (n === 0) return edges;

  const idx = {};
  nodes.forEach((v, i) => (idx[v] = i));

  const INF = Infinity;
  const D = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => (i === j ? 0 : INF))
  );

  const seen = new Set();
  for (const e of edges) {
    const u = idx[e.from],
      v = idx[e.to];
    if (u === undefined || v === undefined) continue;
    const pair = [e.from, e.to].sort().join("|");
    if (!seen.has(pair)) {
      seen.add(pair);
      if (e.weight < D[u][v]) {
        D[u][v] = e.weight;
        D[v][u] = e.weight;
      }
    }
  }

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      if (D[i][k] === INF) continue;
      for (let j = 0; j < n; j++) {
        if (D[i][k] + D[k][j] < D[i][j]) {
          D[i][j] = D[i][k] + D[k][j];
        }
      }
    }
  }

  const result = edges.map((e) => {
    const u = idx[e.from],
      v = idx[e.to];
    if (u === undefined || v === undefined) return e;
    const sp = D[u][v];
    if (sp !== INF) {
      return { ...e, weight: Math.max(1, sp) };
    }
    return e;
  });
  return result;
}

export function generateSpecialGraph(key, params, canvasWidth, canvasHeight, randomizeWeights = false, weightMin = 1, weightMax = 20, triangleInequality = false) {
  const spec = SPECIAL_GRAPHS[key];
  if (!spec) return { vertices: {}, edges: [] };

  const p = {};
  spec.params.forEach((param) => {
    if (param.type === "text") {
      p[param.id] = params[param.id] ?? param.default;
    } else {
      p[param.id] = parseInt(params[param.id]) || param.default;
    }
  });

  const w = canvasWidth;
  const h = canvasHeight;
  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.35;

  function getWeight() {
    if (!randomizeWeights) return 1;
    return getRandomEdgeWeight(weightMin, weightMax);
  }

  const vertices = {};
  const edges = [];

  function addV(id, x, y) {
    vertices[String(id)] = { x, y };
  }
  function addE(u, v, wt) {
    const weight = wt !== undefined && wt !== null ? wt : getWeight();
    edges.push({ from: String(u), to: String(v), weight });
  }

  if (key === "complete") {
    const n = p.n;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      addV(i, cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR);
    }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) addE(i, j);
    }
  } else if (key === "bipartite") {
    const m = p.m,
      n = p.n;
    const spacingX = Math.min((w * 0.8) / Math.max(m, n), 80);
    const startX_m = cx - ((m - 1) * spacingX) / 2;
    const startX_n = cx - ((n - 1) * spacingX) / 2;
    for (let i = 0; i < m; i++) addV("U" + i, startX_m + i * spacingX, cy - 80);
    for (let j = 0; j < n; j++) addV("V" + j, startX_n + j * spacingX, cy + 80);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) addE("U" + i, "V" + j);
    }
  } else if (key === "tree") {
    const n = Math.max(1, p.n);
    const layers = { 0: 0 };
    edges.length = 0;
    addV(0, cx, cy - baseR + 20);
    const tempEdges = [];
    for (let i = 1; i < n; i++) {
      const parent = Math.floor(Math.random() * i);
      tempEdges.push([parent, i]);
      layers[i] = layers[parent] + 1;
    }
    const depthCount = {},
      depthIndex = {};
    for (let i = 0; i < n; i++) {
      depthCount[layers[i]] = (depthCount[layers[i]] || 0) + 1;
      depthIndex[i] = depthCount[layers[i]] - 1;
    }
    const maxD = Math.max(...Object.values(layers));
    const spacingY = maxD > 0 ? (baseR * 2 - 40) / maxD : 0;
    for (let i = 0; i < n; i++) {
      const d = layers[i];
      const cnt = depthCount[d];
      const spacingX = Math.min((w * 0.8) / cnt, 100);
      const sx = cx - ((cnt - 1) * spacingX) / 2;
      addV(i, sx + depthIndex[i] * spacingX, cy - baseR + 20 + d * spacingY);
    }
    for (const [u, v] of tempEdges) {
      addE(u, v);
    }
  } else if (key === "cycle") {
    const n = p.n;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      addV(i, cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR);
    }
    for (let i = 0; i < n; i++) addE(i, (i + 1) % n);
  } else if (key === "path") {
    const n = p.n;
    const spacing = Math.min((w * 0.8) / n, 80);
    const startX = cx - ((n - 1) * spacing) / 2;
    for (let i = 0; i < n; i++) {
      const yOffset = i % 2 === 0 ? -20 : 20;
      addV(i, startX + i * spacing, cy + yOffset);
    }
    for (let i = 0; i < n - 1; i++) addE(i, i + 1);
  } else if (key === "wheel") {
    const n = Math.max(3, p.n);
    addV("C", cx, cy);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      addV(i, cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR);
      addE("C", i);
      addE(i, (i + 1) % n);
    }
  } else if (key === "prism") {
    const n = Math.max(3, p.n);
    const inR = baseR * 0.4;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      addV("I" + i, cx + Math.cos(a) * inR, cy + Math.sin(a) * inR);
      addV("O" + i, cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR);
      addE("I" + i, "I" + ((i + 1) % n));
      addE("O" + i, "O" + ((i + 1) % n));
      addE("I" + i, "O" + i);
    }
  } else if (key === "petersen") {
    const inR = baseR * 0.4;
    for (let i = 0; i < 5; i++) {
      const aOuter = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      addV("O" + i, cx + Math.cos(aOuter) * baseR, cy + Math.sin(aOuter) * baseR);
      addV("I" + i, cx + Math.cos(aOuter) * inR, cy + Math.sin(aOuter) * inR);
      addE("O" + i, "I" + i);
      addE("O" + i, "O" + ((i + 1) % 5));
      addE("I" + i, "I" + ((i + 2) % 5));
    }
  } else if (key === "gen_petersen") {
    const n = Math.max(3, p.n),
      k = p.k;
    const inR = baseR * 0.4;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      addV("O" + i, cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR);
      addV("I" + i, cx + Math.cos(a) * inR, cy + Math.sin(a) * inR);
      addE("O" + i, "O" + ((i + 1) % n));
      addE("O" + i, "I" + i);
      addE("I" + i, "I" + ((i + k) % n));
    }
  } else if (key === "circulant") {
    const n = Math.max(3, p.n);
    const jumps = p.j
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((x) => !isNaN(x));
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      addV(i, cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR);
    }
    for (let i = 0; i < n; i++) {
      jumps.forEach((j) => {
        addE(i, (i + j) % n);
      });
    }
  } else if (key === "hypercube") {
    const n = Math.min(5, Math.max(1, p.n));
    const total = 1 << n;

    if (n === 1) {
      // H1: just two points in a line
      const sp = Math.min(w * 0.6, 200);
      addV(0, cx - sp / 2, cy);
      addV(1, cx + sp / 2, cy);
      addE(0, 1);
    } else if (n === 2) {
      // H2: square
      const side = Math.min(w, h) * 0.45;
      addV('00', cx - side / 2, cy - side / 2);
      addV('01', cx + side / 2, cy - side / 2);
      addV('10', cx - side / 2, cy + side / 2);
      addV('11', cx + side / 2, cy + side / 2);
      addE('00', '01');
      addE('00', '10');
      addE('01', '11');
      addE('10', '11');
    } else if (n === 3) {
      // H3: cube - two squares offset
      const side = Math.min(w, h) * 0.28;
      const offset = 40;
      // front square
      addV('000', cx - side - offset / 2, cy - side + offset / 2);
      addV('001', cx + side - offset / 2, cy - side + offset / 2);
      addV('010', cx - side - offset / 2, cy + side + offset / 2);
      addV('011', cx + side - offset / 2, cy + side + offset / 2);
      // back square (shifted)
      addV('100', cx - side + offset / 2, cy - side - offset / 2);
      addV('101', cx + side + offset / 2, cy - side - offset / 2);
      addV('110', cx - side + offset / 2, cy + side - offset / 2);
      addV('111', cx + side + offset / 2, cy + side - offset / 2);
      // front face
      addE('000', '001'); addE('001', '011'); addE('011', '010'); addE('010', '000');
      // back face
      addE('100', '101'); addE('101', '111'); addE('111', '110'); addE('110', '100');
      // connecting edges
      addE('000', '100'); addE('001', '101'); addE('010', '110'); addE('011', '111');
    } else {
      // H4+ n-dimensional: concentric hyperspheres based on bit count
      const layers = {};
      for (let i = 0; i < total; i++) {
        let popcount = 0;
        for (let b = 0; b < n; b++) if (i & (1 << b)) popcount++;
        if (!layers[popcount]) layers[popcount] = [];
        layers[popcount].push(i);
      }
      const numLayers = Object.keys(layers).length;
      const layerSpacing = baseR * 2 / Math.max(numLayers - 1, 1);
      for (const [layer, nodes] of Object.entries(layers)) {
        const r = numLayers === 1 ? 0 : (parseFloat(layer) / (numLayers - 1)) * baseR * 1.6 - baseR * 0.8 + baseR * 0.3;
        nodes.forEach((node, idx) => {
          const angleOffset = layer % 2 === 0 ? 0 : Math.PI / nodes.length;
          const a = angleOffset + (idx / nodes.length) * Math.PI * 2;
          addV(node, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        });
      }
      for (let i = 0; i < total; i++) {
        for (let b = 0; b < n; b++) {
          if ((i & (1 << b)) === 0) addE(i, i | (1 << b));
        }
      }
    }
  } else if (key === "grid") {
    const m = Math.max(1, p.m),
      nn = Math.max(1, p.n);
    const spacingX = Math.min((w * 0.8) / m, 70);
    const spacingY = Math.min((h * 0.7) / nn, 70);
    const startX = cx - ((m - 1) * spacingX) / 2;
    const startY = cy - ((nn - 1) * spacingY) / 2;

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < nn; j++) {
        const id = i + "_" + j;
        addV(id, startX + i * spacingX, startY + j * spacingY);
        if (i > 0) addE(id, (i - 1) + "_" + j);
        if (j > 0) addE(id, i + "_" + (j - 1));
      }
    }
  }

  let finalEdges = edges;
  if (triangleInequality) {
    finalEdges = applyTriangleInequalityWeights(vertices, edges);
  }

  return { vertices, edges: finalEdges };
}