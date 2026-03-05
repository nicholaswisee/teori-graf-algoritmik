// ─── State ───────────────────────────────────────────────
const state = {
  vertices: {},      // { label: { x, y } }
  edges: [],         // [{ from, to }]
  directed: false,
  mode: 'setup',
  dragging: null,
  shiftFirst: null,  // first node clicked while shift held (for edge creation)
  traversalAlgo: 'bfs',
  pathAlgo: 'bfs',
  connectedAlgo: 'bfs',
  // animation
  animSteps: [],
  animStep: 0,
  animTimer: null,
  isPlaying: false,
  lastStepTime: 0,
  stepInterval: 700,   // ms between auto-play steps
  pulseNode: null,     // label of node being pulsed (the "current" one)
  rafId: null,
  // highlight state
  highlightedNodes: new Set(),
  pathNodes: [],
  pathEdges: new Set(),
  componentMap: {},       // { label: comp_id }
  numComponents: 0,
};

const COMP_COLORS = [
  '#7c6af7','#60a5fa','#34d399','#fbbf24','#f87171',
  '#a78bfa','#38bdf8','#4ade80','#fb923c','#e879f9',
];

const NODE_R = 22;
const EDGE_COL = 'rgba(255,255,255,0.18)';
const NODE_DEFAULT = '#1e1e30';
const NODE_STROKE = '#7c6af7';
const NODE_HIGHLIGHT = 'rgba(124,106,247,0.6)';
const NODE_PATH = 'rgba(251,191,36,0.75)';
const NODE_VISITED = 'rgba(52,211,153,0.55)';

// ─── Canvas setup ─────────────────────────────────────────
const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  const wrapper = canvas.parentElement;
  canvas.width = wrapper.clientWidth * window.devicePixelRatio;
  canvas.height = wrapper.clientHeight * window.devicePixelRatio;
  canvas.style.width = wrapper.clientWidth + 'px';
  canvas.style.height = wrapper.clientHeight + 'px';
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  draw();
}
window.addEventListener('resize', resize);

// ─── Drawing ──────────────────────────────────────────────
function canvasW() { return canvas.clientWidth; }
function canvasH() { return canvas.clientHeight; }

// ─── rAF render loop ──────────────────────────────────────
function startRenderLoop() {
  function loop(ts) {
    // Auto-play: advance step every stepInterval ms
    if (state.isPlaying && state.animSteps.length > 0) {
      if (ts - state.lastStepTime > state.stepInterval) {
        state.lastStepTime = ts;
        if (state.animStep < state.animSteps.length) {
          state.animStep++;
          state.pulseNode = state.animSteps[state.animStep - 1];
          updateStepCounter();
        } else {
          // Finished
          state.isPlaying = false;
          state.pulseNode = null;
        }
      }
    }
    draw(ts);
    state.rafId = requestAnimationFrame(loop);
  }
  state.rafId = requestAnimationFrame(loop);
}

function draw(ts = 0) {
  ctx.clearRect(0, 0, canvasW(), canvasH());

  // Draw edges
  for (const e of state.edges) {
    const a = state.vertices[e.from];
    const b = state.vertices[e.to];
    if (!a || !b) continue;
    const edgeKey = `${e.from}→${e.to}`;
    const isPath = state.pathEdges.has(edgeKey);
    drawEdge(a, b, state.directed, isPath);
  }

  // Draw nodes
  for (const [label, pos] of Object.entries(state.vertices)) {
    let fill = NODE_DEFAULT;
    let stroke = NODE_STROKE;
    let textColor = '#e2e2f0';

    if (state.componentMap[label] !== undefined) {
      const ci = state.componentMap[label];
      fill = COMP_COLORS[ci % COMP_COLORS.length] + '55';
      stroke = COMP_COLORS[ci % COMP_COLORS.length];
    }

    const stepIdx = state.animSteps.indexOf(label);
    if (stepIdx !== -1 && stepIdx < state.animStep) {
      fill = NODE_VISITED;
      stroke = '#34d399';
    }
    if (state.pathNodes.includes(label)) {
      fill = NODE_PATH;
      stroke = '#fbbf24';
      textColor = '#000';
    }
    if (state.shiftFirst === label) {
      stroke = '#60a5fa';
      fill = 'rgba(96,165,250,0.25)';
    }
    drawNode(pos.x, pos.y, label, fill, stroke, textColor);

    // Pulse ring on currently visiting node
    if (label === state.pulseNode) {
      drawPulse(pos.x, pos.y, ts);
    }
  }
}

function drawNode(x, y, label, fill, stroke, textColor) {
  ctx.save();
  // Glow
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Label
  ctx.fillStyle = textColor || '#e2e2f0';
  ctx.font = `600 13px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawPulse(x, y, ts) {
  // Two expanding rings that fade out
  for (let i = 0; i < 2; i++) {
    const phase = ((ts / 700) + i * 0.5) % 1;   // 0..1, offset per ring
    const r = NODE_R + 6 + phase * 22;
    const alpha = (1 - phase) * 0.7;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
    ctx.lineWidth = 2.5 - phase * 1.5;
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();
  }
}

function drawEdge(a, b, directed, isPath) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;
  const ux = dx / dist, uy = dy / dist;

  const sx = a.x + ux * NODE_R;
  const sy = a.y + uy * NODE_R;
  const ex = b.x - ux * NODE_R;
  const ey = b.y - uy * NODE_R;

  ctx.save();
  ctx.strokeStyle = isPath ? '#fbbf24' : EDGE_COL;
  ctx.lineWidth = isPath ? 2.5 : 1.5;
  ctx.shadowColor = isPath ? '#fbbf24' : 'transparent';
  ctx.shadowBlur = isPath ? 8 : 0;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  if (directed) {
    const head = 10, angle = 0.5;
    ctx.fillStyle = isPath ? '#fbbf24' : 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(
      ex - head * Math.cos(Math.atan2(ey - sy, ex - sx) - angle),
      ey - head * Math.sin(Math.atan2(ey - sy, ex - sx) - angle)
    );
    ctx.lineTo(
      ex - head * Math.cos(Math.atan2(ey - sy, ex - sx) + angle),
      ey - head * Math.sin(Math.atan2(ey - sy, ex - sx) + angle)
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ─── Canvas interaction ───────────────────────────────────
canvas.addEventListener('mousedown', (e) => {
  if (state.mode === 'islands') return;
  const pos = canvasPos(e);
  const hit = nodeAt(pos.x, pos.y);

  if (e.shiftKey) {
    if (!hit) return;
    if (!state.shiftFirst) {
      state.shiftFirst = hit;
      draw();
    } else if (state.shiftFirst !== hit) {
      addEdge(state.shiftFirst, hit);
      state.shiftFirst = null;
      draw();
    }
    return;
  }

  state.shiftFirst = null;

  if (hit) {
    state.dragging = { label: hit, ox: pos.x - state.vertices[hit].x, oy: pos.y - state.vertices[hit].y };
  } else {
    // Place new node
    const label = nextLabel();
    state.vertices[label] = { x: pos.x, y: pos.y };
    refreshSelects();
    draw();
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!state.dragging) return;
  const pos = canvasPos(e);
  state.vertices[state.dragging.label].x = pos.x - state.dragging.ox;
  state.vertices[state.dragging.label].y = pos.y - state.dragging.oy;
  draw();
});

canvas.addEventListener('mouseup', () => { state.dragging = null; });
canvas.addEventListener('mouseleave', () => { state.dragging = null; });

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function nodeAt(x, y) {
  for (const [label, pos] of Object.entries(state.vertices)) {
    if (Math.hypot(x - pos.x, y - pos.y) <= NODE_R) return label;
  }
  return null;
}

function nextLabel() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const l of letters) {
    if (!(l in state.vertices)) return l;
  }
  return String(Object.keys(state.vertices).length);
}

// ─── Graph management ─────────────────────────────────────
function addEdge(from, to) {
  const dupe = state.edges.some(e => e.from === from && e.to === to);
  if (!dupe) state.edges.push({ from, to });
}

function addVertexFromInput() {
  const input = document.getElementById('add-vertex-input');
  const label = input.value.trim().toUpperCase();
  if (!label) return;
  if (label in state.vertices) { input.value = ''; return; }
  // Place in a circle around centre
  const w = canvasW(), h = canvasH();
  const angle = (Object.keys(state.vertices).length / 8) * Math.PI * 2;
  const r = Math.min(w, h) * 0.3;
  state.vertices[label] = { x: w / 2 + r * Math.cos(angle), y: h / 2 + r * Math.sin(angle) };
  input.value = '';
  refreshSelects();
  draw();
}

function addEdgeFromInput() {
  const from = document.getElementById('edge-from').value.trim().toUpperCase();
  const to = document.getElementById('edge-to').value.trim().toUpperCase();
  if (!from || !to) return;
  if (!(from in state.vertices)) {
    const w = canvasW(), h = canvasH();
    state.vertices[from] = { x: w * 0.3, y: h * 0.5 };
  }
  if (!(to in state.vertices)) {
    const w = canvasW(), h = canvasH();
    state.vertices[to] = { x: w * 0.7, y: h * 0.5 };
  }
  addEdge(from, to);
  if (!state.directed) addEdge(to, from);
  document.getElementById('edge-from').value = '';
  document.getElementById('edge-to').value = '';
  refreshSelects();
  draw();
}

function clearGraph() {
  state.vertices = {};
  state.edges = [];
  state.animSteps = [];
  state.animStep = 0;
  state.pathNodes = [];
  state.pathEdges = new Set();
  state.componentMap = {};
  state.shiftFirst = null;
  refreshSelects();
  clearResults();
  draw();
}

function onDirectedChange() {
  state.directed = document.getElementById('directed-toggle').checked;
}

// ─── Presets ──────────────────────────────────────────────
function loadPreset(name) {
  clearGraph();
  const w = canvasW(), h = canvasH();
  const cx = w / 2, cy = h / 2;

  const presets = {
    triangle: {
      v: { A: [-150,-90], B: [150,-90], C: [0,110] },
      e: [['A','B'],['B','C'],['C','A']],
    },
    chain: {
      v: { A: [-220,0], B: [-110,0], C: [0,0], D: [110,0], E: [220,0] },
      e: [['A','B'],['B','C'],['C','D'],['D','E']],
    },
    disconnected: {
      v: { A: [-200,-80], B: [-80,-80], C: [80,-80], D: [200,-80], E: [-140,80], F: [140,80] },
      e: [['A','B'],['E','A'],['C','D'],['F','D']],
    },
    complete4: {
      v: { A: [0,-130], B: [130,60], C: [-130,60], D: [0,130] },
      e: [['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
    },
  };

  const p = presets[name];
  if (!p) return;
  for (const [label, [dx, dy]] of Object.entries(p.v)) {
    state.vertices[label] = { x: cx + dx, y: cy + dy };
  }
  for (const [from, to] of p.e) {
    addEdge(from, to);
    if (!state.directed) addEdge(to, from);
  }
  refreshSelects();
  draw();
}

// ─── API helpers ──────────────────────────────────────────
function graphPayload(extra = {}) {
  const vertices = Object.keys(state.vertices);
  const edges = [...new Set(state.edges.map(e => JSON.stringify(e)))]
    .map(s => JSON.parse(s));
  // deduplicate and only send one direction for undirected
  const seen = new Set();
  const cleanEdges = [];
  for (const e of edges) {
    const key = state.directed ? `${e.from}->${e.to}` : [e.from, e.to].sort().join('-');
    if (!seen.has(key)) { seen.add(key); cleanEdges.push(e); }
  }
  return { vertices, edges: cleanEdges, directed: state.directed, ...extra };
}

async function apiPost(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'API error'); }
  return res.json();
}

// ─── Traversal ────────────────────────────────────────────
function setTraversalAlgo(algo) {
  state.traversalAlgo = algo;
  document.getElementById('t-bfs-btn').classList.toggle('active', algo === 'bfs');
  document.getElementById('t-dfs-btn').classList.toggle('active', algo === 'dfs');
}

async function runTraversal() {
  clearAnimation();
  const start = document.getElementById('traversal-start').value;
  if (!start) return;
  try {
    const data = await apiPost('/api/traversal', graphPayload({ start, algo: state.traversalAlgo }));
    state.animSteps = data.order;
    state.animStep = 0;
    document.getElementById('traversal-order').textContent = data.order.join(' → ');
    document.getElementById('traversal-result').classList.remove('hidden');
    document.getElementById('traversal-steps').classList.remove('hidden');
    updateStepCounter();
    draw();
  } catch(err) { alert(err.message); }
}

function stepForward() {
  if (state.animStep < state.animSteps.length) {
    state.animStep++;
    state.pulseNode = state.animSteps[state.animStep - 1];
    updateStepCounter();
  }
}
function stepBack() {
  if (state.animStep > 0) {
    state.animStep--;
    state.pulseNode = state.animStep > 0 ? state.animSteps[state.animStep - 1] : null;
    updateStepCounter();
  }
}
function updateStepCounter() {
  document.getElementById('step-counter').textContent = `${state.animStep} / ${state.animSteps.length}`;
  document.getElementById('step-back-btn').disabled = state.animStep === 0;
  document.getElementById('step-fwd-btn').disabled = state.animStep === state.animSteps.length;
}
function playAnimation() {
  if (state.animSteps.length === 0) return;
  state.animStep = 0;
  state.pulseNode = null;
  state.isPlaying = true;
  state.lastStepTime = performance.now();
}
function clearAnimation() {
  state.isPlaying = false;
  state.pulseNode = null;
  state.animSteps = [];
  state.animStep = 0;
  state.pathNodes = [];
  state.pathEdges = new Set();
  state.componentMap = {};
}

// ─── Path finding ─────────────────────────────────────────
function setPathAlgo(algo) {
  state.pathAlgo = algo;
  document.getElementById('p-bfs-btn').classList.toggle('active', algo === 'bfs');
  document.getElementById('p-dfs-btn').classList.toggle('active', algo === 'dfs');
}

async function runPathFind() {
  clearAnimation();
  const start = document.getElementById('path-start').value;
  const end = document.getElementById('path-end').value;
  if (!start || !end) return;
  try {
    const data = await apiPost('/api/path', graphPayload({ start, end, algo: state.pathAlgo }));
    const box = document.getElementById('path-result');
    const display = document.getElementById('path-display');
    const meta = document.getElementById('path-meta');
    box.classList.remove('hidden');
    if (data.found) {
      state.pathNodes = data.path;
      // Build edge set for highlighting
      state.pathEdges = new Set();
      for (let i = 0; i < data.path.length - 1; i++) {
        state.pathEdges.add(`${data.path[i]}→${data.path[i+1]}`);
        if (!state.directed) state.pathEdges.add(`${data.path[i+1]}→${data.path[i]}`);
      }
      display.textContent = data.path.join(' → ');
      meta.textContent = `Length: ${data.path.length - 1} edge(s) · Algorithm: ${data.algo.toUpperCase()}`;
    } else {
      display.textContent = 'No path found';
      meta.textContent = '';
    }
    draw();
  } catch(err) { alert(err.message); }
}

// ─── Connectivity ─────────────────────────────────────────
function setConnectedAlgo(algo) {
  state.connectedAlgo = algo;
  document.getElementById('c-bfs-btn').classList.toggle('active', algo === 'bfs');
  document.getElementById('c-dfs-btn').classList.toggle('active', algo === 'dfs');
}

async function runConnected() {
  clearAnimation();
  try {
    const data = await apiPost('/api/connected', graphPayload({ algo: state.connectedAlgo }));
    const box = document.getElementById('connected-result');
    const badge = document.getElementById('connected-badge');
    const meta = document.getElementById('connected-meta');
    box.classList.remove('hidden');
    badge.textContent = data.connected ? '✓ Connected' : '✗ Disconnected';
    badge.className = 'result-badge ' + (data.connected ? 'connected' : 'disconnected');
    meta.textContent = `Algorithm: ${data.algo.toUpperCase()} · ${state.directed ? 'Strongly connected check' : 'Undirected connectivity'}`;
    draw();
  } catch(err) { alert(err.message); }
}

// ─── Components ───────────────────────────────────────────
async function runComponents() {
  clearAnimation();
  try {
    const data = await apiPost('/api/components', graphPayload());
    state.componentMap = data.vertex_component;
    state.numComponents = data.count;
    document.getElementById('comp-count').textContent = data.count;
    document.getElementById('comp-largest').textContent = data.largest;
    document.getElementById('components-result').classList.remove('hidden');
    // Build legend
    const legend = document.getElementById('comp-legend');
    legend.innerHTML = '';
    const groups = {};
    for (const [v, ci] of Object.entries(data.vertex_component)) {
      if (!groups[ci]) groups[ci] = [];
      groups[ci].push(v);
    }
    for (const [ci, verts] of Object.entries(groups)) {
      const col = COMP_COLORS[parseInt(ci) % COMP_COLORS.length];
      const row = document.createElement('div');
      row.className = 'comp-legend-item';
      row.innerHTML = `<span class="comp-color-dot" style="background:${col}"></span>Component ${parseInt(ci)+1}: ${verts.join(', ')}`;
      legend.appendChild(row);
    }
    draw();
  } catch(err) { alert(err.message); }
}

// ─── Mode switching ───────────────────────────────────────
const MODES = ['setup','traversal','path','connected','components','islands'];
const TITLES = {
  setup: 'Graph Setup',
  traversal: 'Traversal',
  path: 'Path Finding',
  connected: 'Connectivity',
  components: 'Components',
  islands: 'Island Count',
};
const HINTS = {
  setup: 'Click canvas to add a node · Shift+click two nodes to add an edge',
  traversal: 'Select start node and run BFS or DFS traversal',
  path: 'Select source and destination nodes to find a path',
  connected: 'Check if the graph is fully connected',
  components: 'Colour-code and count connected components',
  islands: 'Click cells in the grid to toggle Land / Water',
};

function switchMode(mode) {
  state.mode = mode;
  clearAnimation();
  MODES.forEach(m => {
    document.getElementById(`nav-${m}`).classList.toggle('active', m === mode);
    document.getElementById(`panel-${m}`).classList.toggle('hidden', m !== mode);
  });
  document.getElementById('topbar-title').textContent = TITLES[mode];
  document.getElementById('canvas-hint').textContent = HINTS[mode];
  const isIsland = mode === 'islands';
  document.getElementById('canvas-wrapper').querySelector('canvas').style.display = isIsland ? 'none' : 'block';
  document.getElementById('island-wrapper').classList.toggle('hidden', !isIsland);
  document.getElementById('topbar-actions').classList.toggle('hidden', isIsland);
  if (isIsland) initIslands();
  draw();
}

// ─── Selects refresh ──────────────────────────────────────
function refreshSelects() {
  const labels = Object.keys(state.vertices);
  ['traversal-start','path-start','path-end'].forEach(id => {
    const sel = document.getElementById(id);
    const val = sel.value;
    sel.innerHTML = labels.map(l => `<option value="${l}">${l}</option>`).join('');
    if (labels.includes(val)) sel.value = val;
  });
}

function clearResults() {
  ['traversal-result','path-result','connected-result','components-result','islands-result']
    .forEach(id => document.getElementById(id).classList.add('hidden'));
  ['traversal-steps'].forEach(id => document.getElementById(id).classList.add('hidden'));
}

// ─── Init ─────────────────────────────────────────────────
resize();
loadPreset('triangle');
startRenderLoop();
