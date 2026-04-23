// ─── State ───────────────────────────────────────────────
const state = {
    vertices: {}, // { label: { x, y } }
    edges: [], // [{ from, to }]
    directed: false,
    mode: "setup",
    dragging: null,
    shiftFirst: null, // first node clicked while shift held (for edge creation)
    traversalAlgo: "bfs",
    pathAlgo: "bfs",
    connectedAlgo: "bfs",
    // animation
    animSteps: [],
    animStep: 0,
    animTimer: null,
    isPlaying: false,
    lastStepTime: 0,
    stepInterval: 700, // ms between auto-play steps
    pulseNode: null, // label of node being pulsed (the "current" one)
    hamiltonianAnimating: false,
    hamiltonianEdgeIndex: -1,
    hamiltonianInterval: 550,
    lastHamiltonianTime: 0,
    activePathEdge: null,
    rafId: null,
    t4Algorithm: "shortest_path",
    t4Frames: [],
    t4FrameIndex: 0,
    t4Playing: false,
    // TSP-specific highlight sets
    t5CutEdges: new Set(),   // red dashed — edges being severed in 3-opt
    t5SwapEdges: new Set(),  // green — newly reconnected edges in 3-opt
    t5FinalPathEdges: new Set(), // final tour edges (restored on step=0)
    t4LastStepTime: 0,
    t4StepInterval: 850,
    // highlight state
    highlightedNodes: new Set(),
    pathNodes: [],
    pathEdges: new Set(),
    componentMap: {}, // { label: comp_id }
    numComponents: 0,
};

const COMP_COLORS = [
    "#7c6af7",
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f87171",
    "#a78bfa",
    "#38bdf8",
    "#4ade80",
    "#fb923c",
    "#e879f9",
];

const NODE_R = 22;
const EDGE_COL = "#111122";
const NODE_DEFAULT = "#ffffff";
const NODE_STROKE = "#7c6af7";
const NODE_HIGHLIGHT = "rgba(124,106,247,0.6)";
const NODE_PATH = "rgba(251,191,36,0.75)";
const NODE_VISITED = "rgba(52,211,153,0.55)";
const NODE_TEXT = "#000000";

// ─── Canvas setup ─────────────────────────────────────────
const canvas = document.getElementById("graph-canvas");
const ctx = canvas.getContext("2d");

function resize() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth * window.devicePixelRatio;
    canvas.height = wrapper.clientHeight * window.devicePixelRatio;
    canvas.style.width = wrapper.clientWidth + "px";
    canvas.style.height = wrapper.clientHeight + "px";
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    draw();
}
window.addEventListener("resize", resize);

// ─── Drawing ──────────────────────────────────────────────
function canvasW() {
    return canvas.clientWidth;
}
function canvasH() {
    return canvas.clientHeight;
}

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

        // Hamiltonian cycle animation
        if (state.hamiltonianAnimating && state.pathNodes.length > 1) {
            if (ts - state.lastHamiltonianTime > state.hamiltonianInterval) {
                state.lastHamiltonianTime = ts;
                const edgeCount = state.pathNodes.length - 1;
                state.hamiltonianEdgeIndex =
                    (state.hamiltonianEdgeIndex + 1) % edgeCount;
                const from = state.pathNodes[state.hamiltonianEdgeIndex];
                const to = state.pathNodes[state.hamiltonianEdgeIndex + 1];
                state.activePathEdge = `${from}→${to}`;
                state.pulseNode = to;
            }
        }

        if (state.t4Playing && state.t4Frames.length > 0) {
            if (ts - state.t4LastStepTime > state.t4StepInterval) {
                state.t4LastStepTime = ts;
                if (state.t4FrameIndex < state.t4Frames.length) {
                    state.t4FrameIndex++;
                    applyTugas4Frame();
                } else {
                    state.t4Playing = false;
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
    const renderedWeightLabels = new Set();
    if (state.directed) {
        for (const e of state.edges) {
            const a = state.vertices[e.from];
            const b = state.vertices[e.to];
            if (!a || !b) continue;
            const edgeKey = `${e.from}→${e.to}`;
            const isPath = state.pathEdges.has(edgeKey);
            const isActive = state.activePathEdge === edgeKey;
            const showWeight = !renderedWeightLabels.has(edgeKey);
            renderedWeightLabels.add(edgeKey);
            drawEdge(
                a,
                b,
                true,
                isPath,
                isActive,
                e.weight ?? 1,
                showWeight,
            );
        }
    } else {
        const undirectedEdges = new Map();
        for (const e of state.edges) {
            const pairKey = [e.from, e.to].sort().join("↔");
            if (!undirectedEdges.has(pairKey)) {
                undirectedEdges.set(pairKey, e);
            }
        }

        for (const [pairKey, e] of undirectedEdges.entries()) {
            const a = state.vertices[e.from];
            const b = state.vertices[e.to];
            if (!a || !b) continue;

            const pairEdges = state.edges.filter(
                (edge) => [edge.from, edge.to].sort().join("↔") === pairKey,
            );
            const isActive = pairEdges.some(
                (edge) => state.activePathEdge === `${edge.from}→${edge.to}`,
            );
            const isPath = !isActive && pairEdges.some((edge) => {
                const edgeKey = `${edge.from}→${edge.to}`;
                return state.pathEdges.has(edgeKey);
            });
            const isCut = state.t5CutEdges.has(`${e.from}→${e.to}`) || state.t5CutEdges.has(`${e.to}→${e.from}`);
            const isSwap = state.t5SwapEdges.has(`${e.from}→${e.to}`) || state.t5SwapEdges.has(`${e.to}→${e.from}`);
            const showWeight = !renderedWeightLabels.has(pairKey);
            renderedWeightLabels.add(pairKey);
            drawEdge(
                a,
                b,
                false,
                isPath,
                isActive,
                e.weight ?? 1,
                showWeight,
                isCut,
                isSwap,
            );
        }
    }

    // Draw nodes
    for (const [label, pos] of Object.entries(state.vertices)) {
        let fill = NODE_DEFAULT;
        let stroke = NODE_STROKE;
        let textColor = NODE_TEXT;

        if (state.componentMap[label] !== undefined) {
            const ci = state.componentMap[label];
            fill = COMP_COLORS[ci % COMP_COLORS.length] + "55";
            stroke = COMP_COLORS[ci % COMP_COLORS.length];
        }

        const stepIdx = state.animSteps.indexOf(label);
        if (stepIdx !== -1 && stepIdx < state.animStep) {
            fill = NODE_VISITED;
            stroke = "#34d399";
        }
        if (state.pathNodes.includes(label)) {
            fill = NODE_PATH;
            stroke = "#fbbf24";
            textColor = "#000";
        }
        if (state.shiftFirst === label) {
            stroke = "#60a5fa";
            fill = "rgba(96,165,250,0.25)";
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
    ctx.fillStyle = textColor;
    ctx.font = `600 13px 'JetBrains Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y);
    ctx.restore();
}

function drawPulse(x, y, ts) {
    // Two expanding rings that fade out
    for (let i = 0; i < 2; i++) {
        const phase = (ts / 700 + i * 0.5) % 1; // 0..1, offset per ring
        const r = NODE_R + 6 + phase * 22;
        const alpha = (1 - phase) * 0.7;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
        ctx.lineWidth = 2.5 - phase * 1.5;
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
    }
}

function drawEdge(
    a,
    b,
    directed,
    isPath,
    isActive = false,
    weight = 1,
    showWeight = true,
    isCut = false,
    isSwap = false,
) {
    const dx = b.x - a.x,
        dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const ux = dx / dist,
        uy = dy / dist;

    const sx = a.x + ux * NODE_R;
    const sy = a.y + uy * NODE_R;
    const ex = b.x - ux * NODE_R;
    const ey = b.y - uy * NODE_R;

    ctx.save();
    const pathHighlight = isPath && !isActive && !isCut && !isSwap;
    const edgeColor = isActive ? "#4aa3ff"
        : isSwap ? "#22c55e"
        : isCut ? "#ef4444"
        : pathHighlight ? "#fbbf24"
        : EDGE_COL;
    const outlineColor = (isActive || isSwap || isCut || pathHighlight) ? "#fff" : "transparent";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Dashed style for cut edges
    if (isCut) {
        ctx.setLineDash([7, 5]);
    } else {
        ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    if (isActive || pathHighlight || isCut || isSwap) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = isActive ? 8 : isSwap ? 7 : isCut ? 7 : 6;
        ctx.stroke();
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = isActive ? 4 : isSwap ? 3.5 : isCut ? 3 : 3;
        ctx.stroke();
    } else {
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    ctx.setLineDash([]);

    if (directed) {
        const head = 10,
            angle = 0.5;
        const arrowColor = isActive
            ? "#4aa3ff"
            : pathHighlight
              ? "#fbbf24"
              : "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
            ex - head * Math.cos(Math.atan2(ey - sy, ex - sx) - angle),
            ey - head * Math.sin(Math.atan2(ey - sy, ex - sx) - angle),
        );
        ctx.lineTo(
            ex - head * Math.cos(Math.atan2(ey - sy, ex - sx) + angle),
            ey - head * Math.sin(Math.atan2(ey - sy, ex - sx) + angle),
        );
        ctx.closePath();
        ctx.fillStyle = outlineColor;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
            ex - (head - 2) * Math.cos(Math.atan2(ey - sy, ex - sx) - angle),
            ey - (head - 2) * Math.sin(Math.atan2(ey - sy, ex - sx) - angle),
        );
        ctx.lineTo(
            ex - (head - 2) * Math.cos(Math.atan2(ey - sy, ex - sx) + angle),
            ey - (head - 2) * Math.sin(Math.atan2(ey - sy, ex - sx) + angle),
        );
        ctx.closePath();
        ctx.fillStyle = arrowColor;
        ctx.fill();
    }

    if (showWeight) {
        const labelX = (sx + ex) / 2;
        const labelY = (sy + ey) / 2;
        ctx.save();
        ctx.font = `600 11px 'JetBrains Mono', monospace`;
        const label = String(weight);
        const paddingX = 6;
        const paddingY = 3;
        const metrics = ctx.measureText(label);
        const boxWidth = metrics.width + paddingX * 2;
        const boxHeight = 16;
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.strokeStyle = isActive
                        ? "#4aa3ff"
                        : pathHighlight
                            ? "#fbbf24"
                            : "rgba(0,0,0,0.2)";
        ctx.lineWidth = 1;
        roundRect(
            ctx,
            labelX - boxWidth / 2,
            labelY - boxHeight / 2,
            boxWidth,
            boxHeight,
            6,
        );
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isActive ? "#4aa3ff" : pathHighlight ? "#fbbf24" : "#1e293b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, labelX, labelY + 0.5);
        ctx.restore();
    }
    ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
    const right = x + width;
    const bottom = y + height;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(right - radius, y);
    ctx.quadraticCurveTo(right, y, right, y + radius);
    ctx.lineTo(right, bottom - radius);
    ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
    ctx.lineTo(x + radius, bottom);
    ctx.quadraticCurveTo(x, bottom, x, bottom - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// ─── Canvas interaction ───────────────────────────────────
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("mousedown", (e) => {
    if (state.mode === "islands") return;
    const pos = canvasPos(e);
    const hit = nodeAt(pos.x, pos.y);

    if (e.button === 2) {
        // Right click
        if (hit) deleteNode(hit);
        return;
    }

    if (e.button !== 0) return; // Only process left click for other actions

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
        state.dragging = {
            label: hit,
            ox: pos.x - state.vertices[hit].x,
            oy: pos.y - state.vertices[hit].y,
        };
    } else {
        // Place new node
        const label = nextLabel();
        state.vertices[label] = { x: pos.x, y: pos.y };
        refreshSelects();
        draw();
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!state.dragging) return;
    const pos = canvasPos(e);
    state.vertices[state.dragging.label].x = pos.x - state.dragging.ox;
    state.vertices[state.dragging.label].y = pos.y - state.dragging.oy;
    draw();
});

canvas.addEventListener("mouseup", () => {
    state.dragging = null;
});
canvas.addEventListener("mouseleave", () => {
    state.dragging = null;
});

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
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (const l of letters) {
        if (!(l in state.vertices)) return l;
    }
    return String(Object.keys(state.vertices).length);
}

// ─── Graph management ─────────────────────────────────────
function deleteNode(label) {
    delete state.vertices[label];
    state.edges = state.edges.filter((e) => e.from !== label && e.to !== label);
    if (state.shiftFirst === label) state.shiftFirst = null;
    clearAnimation();
    clearResults();
    refreshSelects();
    draw();
}

function addEdge(from, to, weight = null) {
    const weightInput = document.getElementById("edge-weight");
    const rawWeight = weight ?? (weightInput ? Number(weightInput.value) : 1);
    const normalizedWeight =
        Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;
    const existing = state.edges.find((e) => e.from === from && e.to === to);
    if (existing) {
        existing.weight = normalizedWeight;
        return;
    }
    state.edges.push({ from, to, weight: normalizedWeight });
}

function addVertexFromInput() {
    const input = document.getElementById("add-vertex-input");
    const label = input.value.trim().toUpperCase();
    if (!label) return;
    if (label in state.vertices) {
        input.value = "";
        return;
    }
    // Place in a circle around centre
    const w = canvasW(),
        h = canvasH();
    const angle = (Object.keys(state.vertices).length / 8) * Math.PI * 2;
    const r = Math.min(w, h) * 0.3;
    state.vertices[label] = {
        x: w / 2 + r * Math.cos(angle),
        y: h / 2 + r * Math.sin(angle),
    };
    input.value = "";
    refreshSelects();
    draw();
}

function addEdgeFromInput() {
    const from = document
        .getElementById("edge-from")
        .value.trim()
        .toUpperCase();
    const to = document.getElementById("edge-to").value.trim().toUpperCase();
    const weightField = document.getElementById("edge-weight");
    if (!from || !to) return;
    const parsedWeight = weightField ? Number(weightField.value) : 1;
    const weight =
        Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 1;
    if (!(from in state.vertices)) {
        const w = canvasW(),
            h = canvasH();
        state.vertices[from] = { x: w * 0.3, y: h * 0.5 };
    }
    if (!(to in state.vertices)) {
        const w = canvasW(),
            h = canvasH();
        state.vertices[to] = { x: w * 0.7, y: h * 0.5 };
    }
    addEdge(from, to, weight);
    if (!state.directed) addEdge(to, from, weight);
    document.getElementById("edge-from").value = "";
    document.getElementById("edge-to").value = "";
    if (weightField) weightField.value = "1";
    refreshSelects();
    draw();
}

function clearGraph() {
    state.vertices = {};
    state.edges = [];
    clearAnimation();
    state.componentMap = {};
    state.shiftFirst = null;
    const weightField = document.getElementById("edge-weight");
    if (weightField) weightField.value = "1";
    refreshSelects();
    clearResults();
    draw();
}

function onDirectedChange() {
    state.directed = document.getElementById("directed-toggle").checked;
}

// ─── Presets ──────────────────────────────────────────────
function loadPreset(name) {
    clearGraph();
    const w = canvasW(),
        h = canvasH();
    const cx = w / 2,
        cy = h / 2;

    const buildCircularPreset = (labels, edges) => {
        const v = {};
        const radius = Math.min(w, h) * 0.36;
        labels.forEach((label, idx) => {
            const angle = -Math.PI / 2 + (idx / labels.length) * Math.PI * 2;
            v[label] = [radius * Math.cos(angle), radius * Math.sin(angle)];
        });
        return { v, e: edges };
    };

    const tugas4Labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    const presets = {
        triangle: {
            v: { A: [-150, -90], B: [150, -90], C: [0, 110] },
            e: [
                ["A", "B"],
                ["B", "C"],
                ["C", "A"],
            ],
        },
        chain: {
            v: {
                A: [-220, 0],
                B: [-110, 0],
                C: [0, 0],
                D: [110, 0],
                E: [220, 0],
            },
            e: [
                ["A", "B"],
                ["B", "C"],
                ["C", "D"],
                ["D", "E"],
            ],
        },
        disconnected: {
            v: {
                A: [-200, -80],
                B: [-80, -80],
                C: [80, -80],
                D: [200, -80],
                E: [-140, 80],
                F: [140, 80],
            },
            e: [
                ["A", "B"],
                ["E", "A"],
                ["C", "D"],
                ["F", "D"],
            ],
        },
        complete4: {
            v: { A: [0, -130], B: [130, 60], C: [-130, 60], D: [0, 130] },
            e: [
                ["A", "B"],
                ["A", "C"],
                ["A", "D"],
                ["B", "C"],
                ["B", "D"],
                ["C", "D"],
            ],
        },
        t4_shortest: buildCircularPreset(
            ["A", "B", "C", "D", "E", "F"],
            [
                ["A", "B", 2],
                ["A", "C", 5],
                ["B", "C", 1],
                ["B", "D", 4],
                ["C", "D", 1],
                ["C", "E", 7],
                ["D", "E", 3],
                ["D", "F", 6],
                ["E", "F", 2],
            ],
        ),
        t4_shortest_alt: buildCircularPreset(
            ["A", "B", "C", "D", "E", "F", "G"],
            [
                ["A", "B", 3],
                ["A", "C", 1],
                ["B", "D", 6],
                ["C", "D", 2],
                ["C", "E", 4],
                ["D", "F", 2],
                ["E", "F", 3],
                ["E", "G", 7],
                ["F", "G", 1],
            ],
        ),
        t4_mst: buildCircularPreset(
            ["A", "B", "C", "D", "E", "F"],
            [
                ["A", "B", 4],
                ["A", "C", 2],
                ["B", "C", 1],
                ["B", "D", 5],
                ["C", "D", 8],
                ["C", "E", 10],
                ["D", "E", 2],
                ["D", "F", 6],
                ["E", "F", 3],
            ],
        ),
        t4_mst_dense: buildCircularPreset(
            ["A", "B", "C", "D", "E", "F", "G"],
            [
                ["A", "B", 4],
                ["A", "C", 3],
                ["A", "D", 7],
                ["B", "C", 1],
                ["B", "E", 5],
                ["C", "D", 2],
                ["C", "F", 6],
                ["D", "E", 4],
                ["D", "G", 8],
                ["E", "F", 2],
                ["E", "G", 3],
                ["F", "G", 1],
            ],
        ),
        t4_mst_sparse: buildCircularPreset(
            ["A", "B", "C", "D", "E", "F"],
            [
                ["A", "B", 2],
                ["B", "C", 3],
                ["C", "D", 1],
                ["D", "E", 4],
                ["E", "F", 2],
                ["A", "F", 9],
            ],
        ),
        t4_kruskal: buildCircularPreset(
            ["A", "B", "C", "D", "E", "F"],
            [
                ["A", "B", 6],
                ["A", "C", 5],
                ["B", "C", 1],
                ["B", "D", 4],
                ["C", "D", 2],
                ["C", "E", 8],
                ["D", "E", 3],
                ["D", "F", 7],
                ["E", "F", 4],
            ],
        ),
        t5_k4: {
            v: { A: [-100, -100], B: [100, -100], C: [100, 100], D: [-100, 100] },
            e: [
                ["A", "B", 10], ["A", "C", 15], ["A", "D", 20],
                ["B", "C", 10], ["B", "D", 25],
                ["C", "D", 10]
            ]
        },
        t5_pentagon: buildCircularPreset(
            ["A", "B", "C", "D", "E"],
            [
                ["A", "B", 5], ["B", "C", 5], ["C", "D", 5], ["D", "E", 5], ["E", "A", 5],
                ["A", "C", 15], ["A", "D", 15], ["B", "D", 15], ["B", "E", 15], ["C", "E", 15]
            ]
        ),
        t5_clusters: {
            v: {
                A: [-220, -50], B: [-260, 60], C: [-140, 40],
                D: [140, -40], E: [260, -60], F: [200, 60]
            },
            e: [
                ["A", "B", 2], ["B", "C", 2], ["A", "C", 2],
                ["D", "E", 2], ["E", "F", 2], ["D", "F", 2],
                ["A", "D", 20], ["A", "E", 25], ["A", "F", 22],
                ["B", "D", 25], ["B", "E", 30], ["B", "F", 28],
                ["C", "D", 15], ["C", "E", 20], ["C", "F", 18]
            ]
        },
        t5_trap: {
            v: { A: [-100, -50], B: [0, -120], C: [100, -50], D: [80, 80], E: [-80, 80] },
            e: [
                ["A", "B", 5], ["A", "C", 1], ["A", "D", 10], ["A", "E", 10],
                ["B", "C", 5], ["B", "D", 10], ["B", "E", 100],
                ["C", "D", 2], ["C", "E", 10],
                ["D", "E", 5]
            ]
        },
        t5_deadend: {
            v: { A: [-140, 0], B: [0, -120], C: [0, 0], D: [120, -50], E: [120, 50] },
            e: [
                ["A", "C", 5],
                ["A", "E", 15],
                ["C", "B", 1],
                ["C", "D", 8],
                ["C", "E", 10],
                ["D", "E", 3],
            ]
        },
        t5_dense: buildCircularPreset(
            ["A", "B", "C", "D", "E", "F"],
            [
                ["A", "B", 12], ["A", "C", 5], ["A", "D", 18], ["A", "E", 9], ["A", "F", 21],
                ["B", "C", 14], ["B", "D", 6], ["B", "E", 25], ["B", "F", 11],
                ["C", "D", 22], ["C", "E", 8], ["C", "F", 16],
                ["D", "E", 15], ["D", "F", 3],
                ["E", "F", 10]
            ]
        )
    };

    const p = presets[name];
    if (!p) return;
    for (const [label, [dx, dy]] of Object.entries(p.v)) {
        state.vertices[label] = { x: cx + dx, y: cy + dy };
    }
    for (const edge of p.e) {
        const [from, to, weight = 1] = edge;
        addEdge(from, to, weight);
        if (!state.directed) addEdge(to, from, weight);
    }
    refreshSelects();
    if (name.startsWith("t4_shortest")) {
        state.t4Algorithm = "shortest_path";
        const algoSelect = document.getElementById("t4-algo");
        if (algoSelect) algoSelect.value = "shortest_path";
        const startSelect = document.getElementById("t4-shortest-start");
        const endSelect = document.getElementById("t4-shortest-end");
        if (startSelect && endSelect) {
            startSelect.value = "A";
            endSelect.value = name === "t4_shortest_alt" ? "G" : "F";
        }
        setTugas4Algo("shortest_path");
    }
    if (name === "t4_mst" || name === "t4_mst_dense" || name === "t4_mst_sparse") {
        state.t4Algorithm = "prim";
        const algoSelect = document.getElementById("t4-algo");
        if (algoSelect) algoSelect.value = "prim";
        setTugas4Algo("prim");
    }
    if (name === "t4_kruskal") {
        state.t4Algorithm = "kruskal";
        const algoSelect = document.getElementById("t4-algo");
        if (algoSelect) algoSelect.value = "kruskal";
        setTugas4Algo("kruskal");
    }
    if (name.startsWith("t5_")) {
        // Switch to t5 if possible
    }
    draw();
}

// ─── Special Formations ───────────────────────────────────
const SPECIAL_GRAPHS = {
    complete: { name: "Graf Lengkap (Kn)", params: [{ id: "n", label: "n", default: 5 }] },
    bipartite: { name: "Bipartit Lengkap (Km,n)", params: [{ id: "m", label: "m", default: 3 }, { id: "n", label: "n", default: 3 }] },
    tree: { name: "Pohon (Tn)", params: [{ id: "n", label: "n", default: 7 }] },
    cycle: { name: "Siklus (Cn)", params: [{ id: "n", label: "n", default: 6 }] },
    path: { name: "Lintasan (Pn)", params: [{ id: "n", label: "n", default: 5 }] },
    wheel: { name: "Graf Roda (Wn)", params: [{ id: "n", label: "n", default: 6 }] },
    prism: { name: "Graf Prisma", params: [{ id: "n", label: "n", default: 5 }] },
    petersen: { name: "Petersen", params: [] },
    gen_petersen: { name: "Gen Petersen P(n,k)", params: [{ id: "n", label: "n", default: 5 }, { id: "k", label: "k", default: 2 }] },
    circulant: { name: "Sirkulan Cn(a...)", params: [{ id: "n", label: "n", default: 8 }, { id: "j", label: "Jumps", default: "1,2", type: "text" }] },
    hypercube: { name: "Hypercube (Hn)", params: [{ id: "n", label: "n", default: 3 }] },
    grid: { name: "Grid G(m,n)", params: [{ id: "m", label: "m", default: 3 }, { id: "n", label: "n", default: 4 }] }
};

function initSpecialGraphs() {
    const sel = document.getElementById("special-graph-select");
    if (!sel) return;
    sel.innerHTML = Object.entries(SPECIAL_GRAPHS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join("");
    onSpecialGraphChange();
}

function onRandomizeWeightsChange() {
    const cb = document.getElementById("sg-randomize-weights");
    const rangeDiv = document.getElementById("sg-weight-range");
    if (!cb || !rangeDiv) return;
    rangeDiv.style.display = cb.checked ? "flex" : "none";
}

function getRandomEdgeWeight() {
    const cb = document.getElementById("sg-randomize-weights");
    if (!cb || !cb.checked) return 1;
    const minVal = Math.max(1, parseInt(document.getElementById("sg-weight-min")?.value) || 1);
    const maxVal = Math.max(minVal, parseInt(document.getElementById("sg-weight-max")?.value) || 20);
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
}

function onSpecialGraphChange() {
    const sel = document.getElementById("special-graph-select");
    const container = document.getElementById("special-graph-params");
    if (!sel || !container) return;
    const key = sel.value;
    const spec = SPECIAL_GRAPHS[key];
    if (!spec) return;
    
    container.innerHTML = spec.params.map(p => `
        <div style="flex:1">
            <label style="font-size:11px; margin-bottom:2px; display:block; color:var(--text-dim)">${p.label}</label>
            <input type="${p.type || 'number'}" id="sg-${p.id}" class="text-input" value="${p.default}" ${p.type !== 'text' ? 'min="1" max="50"' : ''} style="width:100%; padding:4px 8px;">
        </div>
    `).join("");
}

function generateSpecialGraph() {
    const sel = document.getElementById("special-graph-select");
    if (!sel) return;
    const key = sel.value;
    const spec = SPECIAL_GRAPHS[key];
    
    // Read params
    const p = {};
    spec.params.forEach(param => {
        const input = document.getElementById(`sg-${param.id}`);
        if(param.type === 'text') p[param.id] = input.value;
        else p[param.id] = parseInt(input.value) || param.default;
    });

    clearGraph();
    const w = canvasW(), h = canvasH();
    const cx = w / 2, cy = h / 2;
    const baseR = Math.min(w, h) * 0.35;
    
    // Auto-set undirected for all standard special graphs typically
    const directedToggle = document.getElementById("directed-toggle");
    if (directedToggle) {
        directedToggle.checked = false;
        onDirectedChange();
    }

    function addV(id, x, y) { state.vertices[String(id)] = { x, y }; }
    function addE(u, v, w) {
        const weight = (w !== undefined && w !== null) ? w : getRandomEdgeWeight();
        addEdge(String(u), String(v), weight);
        addEdge(String(v), String(u), weight);
    }

    if (key === "complete") {
        const n = p.n;
        for (let i = 0; i < n; i++) {
            const a = -Math.PI/2 + (i/n) * Math.PI*2;
            addV(i, cx + Math.cos(a)*baseR, cy + Math.sin(a)*baseR);
        }
        for (let i = 0; i < n; i++) {
            for (let j = i+1; j < n; j++) addE(i, j);
        }
    }
    else if (key === "bipartite") {
        const m = p.m, n = p.n;
        const spacingX = Math.min(w * 0.8 / Math.max(m, n), 80);
        const startX_m = cx - ((m-1)*spacingX)/2;
        const startX_n = cx - ((n-1)*spacingX)/2;
        for(let i=0; i<m; i++) addV("U"+i, startX_m + i*spacingX, cy - 80);
        for(let j=0; j<n; j++) addV("V"+j, startX_n + j*spacingX, cy + 80);
        for(let i=0; i<m; i++) {
            for(let j=0; j<n; j++) addE("U"+i, "V"+j);
        }
    }
    else if (key === "tree") {
        const n = Math.max(1, p.n);
        addV(0, cx, cy - baseR + 20);
        const layers = {0: 0};
        for(let i=1; i<n; i++) {
            const parent = Math.floor(Math.random() * i);
            addE(parent, i);
            layers[i] = layers[parent] + 1;
        }
        const depthCount = {}, depthIndex = {};
        for(let i=0; i<n; i++) {
            depthCount[layers[i]] = (depthCount[layers[i]] || 0) + 1;
            depthIndex[i] = (depthCount[layers[i]] - 1);
        }
        const maxD = Math.max(...Object.values(layers));
        const spacingY = maxD > 0 ? (baseR * 2 - 40) / maxD : 0;
        for(let i=0; i<n; i++) {
            const d = layers[i];
            const cnt = depthCount[d];
            const spacingX = Math.min(w * 0.8 / cnt, 100);
            const sx = cx - ((cnt-1)*spacingX)/2;
            addV(i, sx + depthIndex[i]*spacingX, cy - baseR + 20 + d*spacingY);
        }
    }
    else if (key === "cycle") {
        const n = p.n;
        for (let i = 0; i < n; i++) {
            const a = -Math.PI/2 + (i/n) * Math.PI*2;
            addV(i, cx + Math.cos(a)*baseR, cy + Math.sin(a)*baseR);
        }
        for (let i = 0; i < n; i++) addE(i, (i+1)%n);
    }
    else if (key === "path") {
        const n = p.n;
        const spacing = Math.min(w * 0.8 / n, 80);
        const startX = cx - ((n-1)*spacing)/2;
        for (let i = 0; i < n; i++) {
            const yOffset = (i%2===0) ? -20 : 20;
            addV(i, startX + i*spacing, cy + yOffset);
        }
        for (let i = 0; i < n-1; i++) addE(i, i+1);
    }
    else if (key === "wheel") {
        const n = Math.max(3, p.n); 
        addV("C", cx, cy);
        for (let i = 0; i < n; i++) {
            const a = -Math.PI/2 + (i/n) * Math.PI*2;
            addV(i, cx + Math.cos(a)*baseR, cy + Math.sin(a)*baseR);
            addE("C", i);
            addE(i, (i+1)%n);
        }
    }
    else if (key === "prism") {
        const n = Math.max(3, p.n);
        const inR = baseR * 0.4;
        for (let i = 0; i < n; i++) {
            const a = -Math.PI/2 + (i/n) * Math.PI*2;
            addV("I"+i, cx + Math.cos(a)*inR, cy + Math.sin(a)*inR);
            addV("O"+i, cx + Math.cos(a)*baseR, cy + Math.sin(a)*baseR);
            addE("I"+i, "I"+((i+1)%n)); 
            addE("O"+i, "O"+((i+1)%n)); 
            addE("I"+i, "O"+i);
        }
    }
    else if (key === "petersen") {
        const inR = baseR * 0.4;
        for (let i = 0; i < 5; i++) {
            const aOuter = -Math.PI/2 + (i/5) * Math.PI*2;
            addV("O"+i, cx + Math.cos(aOuter)*baseR, cy + Math.sin(aOuter)*baseR);
            addV("I"+i, cx + Math.cos(aOuter)*inR, cy + Math.sin(aOuter)*inR);
            addE("O"+i, "I"+i);
            addE("O"+i, "O"+((i+1)%5));
            addE("I"+i, "I"+((i+2)%5)); 
        }
    }
    else if (key === "gen_petersen") {
        const n = Math.max(3, p.n), k = p.k;
        const inR = baseR * 0.4;
        for (let i = 0; i < n; i++) {
            const a = -Math.PI/2 + (i/n) * Math.PI*2;
            addV("O"+i, cx + Math.cos(a)*baseR, cy + Math.sin(a)*baseR);
            addV("I"+i, cx + Math.cos(a)*inR, cy + Math.sin(a)*inR);
            addE("O"+i, "O"+((i+1)%n));
            addE("O"+i, "I"+i);
            addE("I"+i, "I"+((i+k)%n));
        }
    }
    else if (key === "circulant") {
        const n = Math.max(3, p.n);
        const jumps = p.j.split(",").map(s => parseInt(s.trim())).filter(x => !isNaN(x));
        for (let i = 0; i < n; i++) {
            const a = -Math.PI/2 + (i/n) * Math.PI*2;
            addV(i, cx + Math.cos(a)*baseR, cy + Math.sin(a)*baseR);
        }
        for (let i = 0; i < n; i++) {
            jumps.forEach(j => {
                addE(i, (i+j)%n);
            });
        }
    }
    else if (key === "hypercube") {
        const n = Math.min(5, Math.max(1, p.n));
        const total = 1 << n;
        for(let i=0; i<total; i++) {
            let setBits = 0;
            for(let b=0; b<n; b++) if((i & (1<<b))) setBits++;
            const a = (i/total) * Math.PI * 2;
            const rOffset = (n === 1) ? 1 : (n===2 ? 0.8 : (setBits/n));
            addV(i, cx + Math.cos(a)*baseR*(0.3 + rOffset*0.7), cy + Math.sin(a)*baseR*(0.3 + rOffset*0.7));
            for(let b=0; b<n; b++) {
                if((i & (1<<b)) === 0) addE(i, i | (1<<b)); 
            }
        }
    }
    else if (key === "grid") {
        const m = Math.max(1, p.m), n = Math.max(1, p.n);
        const spacingX = Math.min(w * 0.8 / m, 70);
        const spacingY = Math.min(h * 0.7 / n, 70);
        const startX = cx - ((m-1)*spacingX)/2;
        const startY = cy - ((n-1)*spacingY)/2;
        
        for(let i=0; i<m; i++) {
            for(let j=0; j<n; j++) {
                const id = `${i}_${j}`;
                addV(id, startX + i*spacingX, startY + j*spacingY);
                if (i > 0) addE(id, `${i-1}_${j}`);
                if (j > 0) addE(id, `${i}_${j-1}`);
            }
        }
    }

    refreshSelects();
    draw();
}

// ─── API helpers ──────────────────────────────────────────
function graphPayload(extra = {}) {
    const vertices = Object.keys(state.vertices);
    const edges = [...new Set(state.edges.map((e) => JSON.stringify(e)))].map(
        (s) => JSON.parse(s),
    );
    // deduplicate and only send one direction for undirected
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

async function apiPost(endpoint, payload) {
    const res = await fetch(endpoint, {
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

// ─── Traversal ────────────────────────────────────────────
function setTraversalAlgo(algo) {
    state.traversalAlgo = algo;
    document
        .getElementById("t-bfs-btn")
        .classList.toggle("active", algo === "bfs");
    document
        .getElementById("t-dfs-btn")
        .classList.toggle("active", algo === "dfs");
}

async function runTraversal() {
    clearAnimation();
    const start = document.getElementById("traversal-start").value;
    if (!start) return;
    try {
        const data = await apiPost(
            "/api/traversal",
            graphPayload({ start, algo: state.traversalAlgo }),
        );
        state.animSteps = data.order;
        state.animStep = 0;
        document.getElementById("traversal-order").textContent =
            data.order.join(" → ");
        document.getElementById("traversal-result").classList.remove("hidden");
        document.getElementById("traversal-steps").classList.remove("hidden");
        updateStepCounter();
        draw();
    } catch (err) {
        alert(err.message);
    }
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
        state.pulseNode =
            state.animStep > 0 ? state.animSteps[state.animStep - 1] : null;
        updateStepCounter();
    }
}
function updateStepCounter() {
    document.getElementById("step-counter").textContent =
        `${state.animStep} / ${state.animSteps.length}`;
    document.getElementById("step-back-btn").disabled = state.animStep === 0;
    document.getElementById("step-fwd-btn").disabled =
        state.animStep === state.animSteps.length;
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
    state.activePathEdge = null;
    state.hamiltonianAnimating = false;
    state.hamiltonianEdgeIndex = -1;
    state.lastHamiltonianTime = 0;
    state.componentMap = {};
    state.t4Frames = [];
    state.t4FrameIndex = 0;
    state.t4Playing = false;
    state.t4LastStepTime = 0;
    state.t5CutEdges = new Set();
    state.t5SwapEdges = new Set();
    state.t5FinalPathEdges = new Set();
}

// ─── Path finding ─────────────────────────────────────────
function setPathAlgo(algo) {
    state.pathAlgo = algo;
    document
        .getElementById("p-bfs-btn")
        .classList.toggle("active", algo === "bfs");
    document
        .getElementById("p-dfs-btn")
        .classList.toggle("active", algo === "dfs");
}

async function runPathFind() {
    clearAnimation();
    const start = document.getElementById("path-start").value;
    const end = document.getElementById("path-end").value;
    if (!start || !end) return;
    try {
        const data = await apiPost(
            "/api/path",
            graphPayload({ start, end, algo: state.pathAlgo }),
        );
        const box = document.getElementById("path-result");
        const display = document.getElementById("path-display");
        const meta = document.getElementById("path-meta");
        box.classList.remove("hidden");
        if (data.found) {
            state.pathNodes = data.path;
            // Build edge set for highlighting
            state.pathEdges = new Set();
            for (let i = 0; i < data.path.length - 1; i++) {
                state.pathEdges.add(`${data.path[i]}→${data.path[i + 1]}`);
                if (!state.directed)
                    state.pathEdges.add(`${data.path[i + 1]}→${data.path[i]}`);
            }
            display.textContent = data.path.join(" → ");
            meta.textContent = `Length: ${data.path.length - 1} edge(s) · Algorithm: ${data.algo.toUpperCase()}`;
        } else {
            display.textContent = "No path found";
            meta.textContent = "";
        }
        draw();
    } catch (err) {
        alert(err.message);
    }
}

// ─── Connectivity ─────────────────────────────────────────
function setConnectedAlgo(algo) {
    state.connectedAlgo = algo;
    document
        .getElementById("c-bfs-btn")
        .classList.toggle("active", algo === "bfs");
    document
        .getElementById("c-dfs-btn")
        .classList.toggle("active", algo === "dfs");
}

async function runConnected() {
    clearAnimation();
    try {
        const data = await apiPost(
            "/api/connected",
            graphPayload({ algo: state.connectedAlgo }),
        );
        const box = document.getElementById("connected-result");
        const badge = document.getElementById("connected-badge");
        const meta = document.getElementById("connected-meta");
        box.classList.remove("hidden");
        badge.textContent = data.connected ? "✓ Connected" : "✗ Disconnected";
        badge.className =
            "result-badge " + (data.connected ? "connected" : "disconnected");
        meta.textContent = `Algorithm: ${data.algo.toUpperCase()} · ${state.directed ? "Strongly connected check" : "Undirected connectivity"}`;
        draw();
    } catch (err) {
        alert(err.message);
    }
}

// ─── Components ───────────────────────────────────────────
async function runComponents() {
    clearAnimation();
    try {
        const data = await apiPost("/api/components", graphPayload());
        state.componentMap = data.vertex_component;
        state.numComponents = data.count;
        document.getElementById("comp-count").textContent = data.count;
        document.getElementById("comp-largest").textContent = data.largest;
        document.getElementById("components-result").classList.remove("hidden");
        // Build legend
        const legend = document.getElementById("comp-legend");
        legend.innerHTML = "";
        const groups = {};
        for (const [v, ci] of Object.entries(data.vertex_component)) {
            if (!groups[ci]) groups[ci] = [];
            groups[ci].push(v);
        }
        for (const [ci, verts] of Object.entries(groups)) {
            const col = COMP_COLORS[parseInt(ci) % COMP_COLORS.length];
            const row = document.createElement("div");
            row.className = "comp-legend-item";
            row.innerHTML = `<span class="comp-color-dot" style="background:${col}"></span>Component ${parseInt(ci) + 1}: ${verts.join(", ")}`;
            legend.appendChild(row);
        }
        draw();
    } catch (err) {
        alert(err.message);
    }
}

// ─── Tugas 3: Properties ──────────────────────────────────
async function runProperties() {
    clearAnimation();
    try {
        const data = await apiPost("/api/tugas3/properties", graphPayload());
        document.getElementById("prop-bipartite").textContent =
            data.is_bipartite ? "Yes" : "No";
        document.getElementById("prop-cycle").textContent = data.has_cycle
            ? "Yes"
            : "No";
        document.getElementById("prop-diameter").textContent = data.diameter;
        document.getElementById("prop-girth").textContent =
            data.girth === -1 ? "∞" : data.girth;
        document.getElementById("properties-result").classList.remove("hidden");
        draw();
    } catch (err) {
        alert(err.message);
    }
}

// ─── Tugas 3: Shortest Distance ───────────────────────────
async function runShortest() {
    clearAnimation();
    const start = document.getElementById("shortest-start").value;
    const end = document.getElementById("shortest-end").value;
    if (!start || !end) return;
    try {
        const data = await apiPost(
            "/api/tugas3/shortest_path",
            graphPayload({ start, end }),
        );
        const valSpan = document.getElementById("shortest-val");
        valSpan.textContent =
            data.distance === -1 ? "Unreachable" : data.distance;
        document.getElementById("shortest-result").classList.remove("hidden");
        draw();
    } catch (err) {
        alert(err.message);
    }
}

// ─── Tugas 4: Weighted Graph Algorithms ──────────────────
function setTugas4Algo(algo) {
    state.t4Algorithm = algo;
    const algoSelect = document.getElementById("t4-algo");
    if (algoSelect && algoSelect.value !== algo) {
        algoSelect.value = algo;
    }
    const shortestInputs = document.getElementById("t4-shortest-inputs");
    if (shortestInputs) {
        shortestInputs.classList.toggle("hidden", algo !== "shortest_path");
    }
}

function renderTugas4Steps(steps) {
    const listId = state.mode === 'tugas5' ? 't5-step-list' : 't4-step-list';
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = steps
        .map((step, index) => `<li data-step-index="${index}">${step}</li>`)
        .join("");
    updateTugas4StepCounter();
}

function updateTugas4StepCounter() {
    const counterId = state.mode === 'tugas5' ? 't5-step-counter' : 't4-step-counter';
    const listId = state.mode === 'tugas5' ? 't5-step-list' : 't4-step-list';
    const counter = document.getElementById(counterId);
    if (counter) {
        counter.textContent = `${state.t4FrameIndex} / ${state.t4Frames.length}`;
    }

    const stepItems = document.querySelectorAll(`#${listId} li`);
    stepItems.forEach((item, index) => {
        if (state.mode === 'tugas5') {
            // 1:1 step-frame sync: highlight ONLY the current step
            item.classList.toggle("active", index === state.t4FrameIndex - 1);
        } else {
            // T4 behaviour: highlight all steps up to current frame
            item.classList.toggle("active", index < state.t4FrameIndex);
        }
    });

    // Auto-scroll the active step into view
    const activeItem = document.querySelector(`#${listId} li.active`);
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function applyTugas4Frame() {
    const frame = state.t4Frames[state.t4FrameIndex - 1] || null;
    state.pulseNode = frame?.node ?? null;
    state.activePathEdge = frame?.edge
        ? `${frame.edge[0]}→${frame.edge[1]}`
        : null;

    // TSP mode: update per-frame edge highlights
    if (state.mode === 'tugas5' && frame) {
        // Update current route (gold)
        if (frame.path_edges && frame.path_edges.length > 0) {
            state.pathEdges = new Set();
            for (const [u, v] of frame.path_edges) {
                state.pathEdges.add(`${u}→${v}`);
                state.pathEdges.add(`${v}→${u}`);
            }
        }
        // Update cut edges (red dashed)
        state.t5CutEdges = new Set();
        for (const [u, v] of (frame.cut_edges || [])) {
            state.t5CutEdges.add(`${u}→${v}`);
            state.t5CutEdges.add(`${v}→${u}`);
        }
        // Update swap edges (green — new connections)
        state.t5SwapEdges = new Set();
        for (const [u, v] of (frame.swap_edges || [])) {
            state.t5SwapEdges.add(`${u}→${v}`);
            state.t5SwapEdges.add(`${v}→${u}`);
        }
    }

    updateTugas4StepCounter();
    draw();
}

function t4StepForward() {
    if (state.t4FrameIndex >= state.t4Frames.length) return;
    state.t4FrameIndex += 1;
    state.t4Playing = false;
    applyTugas4Frame();
}

function t4StepBack() {
    if (state.t4FrameIndex <= 0) return;
    state.t4FrameIndex -= 1;
    state.t4Playing = false;
    if (state.t4FrameIndex === 0) {
        state.pulseNode = null;
        state.activePathEdge = null;
        // In TSP mode, restore the final tour when stepping back to start
        if (state.mode === 'tugas5') {
            state.pathEdges = new Set(state.t5FinalPathEdges);
            state.t5CutEdges = new Set();
            state.t5SwapEdges = new Set();
        }
        updateTugas4StepCounter();
        draw();
        return;
    }
    applyTugas4Frame();
}

function playTugas4Animation() {
    if (state.t4Frames.length === 0) return;
    state.t4FrameIndex = 0;
    state.pulseNode = null;
    state.activePathEdge = null;
    state.t4Playing = true;
    state.t4LastStepTime = performance.now();
    updateTugas4StepCounter();
}

async function runTugas4() {
    clearAnimation();
    const algorithm =
        state.t4Algorithm || document.getElementById("t4-algo").value;
    state.t4Algorithm = algorithm;
    const payload = graphPayload({ algorithm });

    if (algorithm === "shortest_path") {
        const start = document.getElementById("t4-shortest-start").value;
        const end = document.getElementById("t4-shortest-end").value;
        if (!start || !end) return;
        payload.start = start;
        payload.end = end;
    }

    try {
        const data = await apiPost("/api/tugas4/run", payload);
        const box = document.getElementById("t4-result");
        const badge = document.getElementById("t4-badge");
        const summary = document.getElementById("t4-summary");
        const meta = document.getElementById("t4-meta");
        const controls = document.getElementById("t4-step-controls");

        box.classList.remove("hidden");
        controls.classList.remove("hidden");
        state.t4Frames = data.frames || [];
        state.t4FrameIndex = 0;
        state.t4Playing = false;
        state.pathNodes = [];
        state.pathEdges = new Set();
        state.activePathEdge = null;
        state.pulseNode = null;

        if (data.algorithm === "shortest_path") {
            if (data.found) {
                badge.textContent = "✓ Shortest path found";
                badge.className = "result-badge connected";
                state.pathNodes = data.path || [];
                state.pathEdges = new Set();
                for (let i = 0; i < data.path.length - 1; i++) {
                    state.pathEdges.add(`${data.path[i]}→${data.path[i + 1]}`);
                    if (!state.directed) {
                        state.pathEdges.add(
                            `${data.path[i + 1]}→${data.path[i]}`,
                        );
                    }
                }
                summary.textContent = `Path: ${data.path.join(" → ")}`;
                meta.textContent = `Total distance: ${data.distance} · Algorithm: Dijkstra`;
            } else {
                badge.textContent = "✗ No path";
                badge.className = "result-badge disconnected";
                summary.textContent =
                    "No weighted path found between the selected nodes.";
                meta.textContent = "";
            }
        } else {
            badge.textContent = `✓ MST total weight ${data.total_weight}`;
            badge.className = "result-badge connected";
            state.pathEdges = new Set();
            for (const edge of data.edges || []) {
                state.pathEdges.add(`${edge.from}→${edge.to}`);
                if (!state.directed) {
                    state.pathEdges.add(`${edge.to}→${edge.from}`);
                }
            }
            summary.textContent = `Selected edges: ${(data.edges || [])
                .map((edge) => `${edge.from} - ${edge.to} (${edge.weight})`)
                .join(" · ")}`;
            meta.textContent = `Algorithm: ${data.algorithm === "prim" ? "Prim" : "Kruskal"} · Total weight: ${data.total_weight}`;
        }

        renderTugas4Steps(data.steps || []);
        updateTugas4StepCounter();
        draw();
    } catch (err) {
        alert(err.message);
    }
}

async function runTugas5() {
    clearAnimation();
    const start = document.getElementById("t5-start").value;
    if (!start) return;

    try {
        const data = await apiPost("/api/tugas5/tsp", graphPayload({ start }));
        const box = document.getElementById("t5-result");
        const badge = document.getElementById("t5-badge");
        const summary = document.getElementById("t5-summary");
        const meta = document.getElementById("t5-meta");
        const controls = document.getElementById("t5-step-controls");

        box.classList.remove("hidden");
        controls.classList.remove("hidden");

        state.t4Frames = data.frames || [];
        state.t4FrameIndex = 0;
        state.t4Playing = false;
        state.pathNodes = [];
        state.activePathEdge = null;
        state.pulseNode = null;
        state.t5CutEdges = new Set();
        state.t5SwapEdges = new Set();

        const expectedLen = Object.keys(state.vertices).length + 1;
        const completeTour = data.tour && data.tour.length === expectedLen && data.tour[0] === data.tour[data.tour.length - 1];

        if (completeTour) {
            badge.textContent = `✓ TSP Tour Found`;
            badge.className = "result-badge connected";
        } else {
            badge.textContent = `✗ Incomplete Tour (Dead End)`;
            badge.className = "result-badge disconnected";
        }

        // Build final tour edges and store as the persistent reference
        state.pathEdges = new Set();
        for (const edge of data.edges || []) {
            state.pathEdges.add(`${edge.from}→${edge.to}`);
            if (!state.directed) {
                state.pathEdges.add(`${edge.to}→${edge.from}`);
            }
        }
        // Store final tour so we can restore it when stepping back to index 0
        state.t5FinalPathEdges = new Set(state.pathEdges);

        summary.textContent = `Tour: ${(data.tour || []).join(" → ")}`;
        meta.textContent = `Total weight: ${data.total_weight}`;

        renderTugas4Steps(data.steps || []);
        updateTugas4StepCounter();
        draw();
    } catch (err) {
        alert(err.message);
    }
}

// ─── Mode switching ───────────────────────────────────────
const MODES = [
    "setup",
    "traversal",
    "path",
    "connected",
    "components",
    "islands",
    "properties",
    "shortest",
    "tugas4",
    "tugas5",
];
const TITLES = {
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
};
const HINTS = {
    setup: "Click canvas to add node · Shift+click nodes to add edge · Right-click node to delete",
    traversal: "Select start node and run BFS or DFS traversal",
    path: "Select source and destination nodes to find a path",
    connected: "Check if the graph is fully connected",
    components: "Colour-code and count connected components",
    islands: "Click cells in the grid to toggle Land / Water",
    properties: "Analyze bipartite nature, cycles, girth, and diameter",
    shortest: "Find the shortest distance between two specific nodes",
    tugas4: "Run weighted graph algorithms and step through the animation",
    tugas5: "Run Nearest Neighbor TSP to find a Hamiltonian cycle",
};

function switchMode(mode) {
    state.mode = mode;
    clearAnimation();
    MODES.forEach((m) => {
        document
            .getElementById(`nav-${m}`)
            .classList.toggle("active", m === mode);
        document
            .getElementById(`panel-${m}`)
            .classList.toggle("hidden", m !== mode);
    });
    document.getElementById("topbar-title").textContent = TITLES[mode];
    document.getElementById("canvas-hint").textContent = HINTS[mode];
    const isIsland = mode === "islands";
    document
        .getElementById("canvas-wrapper")
        .querySelector("canvas").style.display = isIsland ? "none" : "block";
    document
        .getElementById("island-wrapper")
        .classList.toggle("hidden", !isIsland);
    document
        .getElementById("topbar-actions")
        .classList.toggle("hidden", isIsland);
    if (isIsland) initIslands();
    if (mode === "tugas4") {
        const algoSelect = document.getElementById("t4-algo");
        if (algoSelect) {
            setTugas4Algo(algoSelect.value || state.t4Algorithm);
        }
    }
    draw();
}

// ─── Selects refresh ──────────────────────────────────────
function refreshSelects() {
    const labels = Object.keys(state.vertices);
    [
        "traversal-start",
        "path-start",
        "path-end",
        "shortest-start",
        "shortest-end",
        "t4-shortest-start",
        "t4-shortest-end",
        "t5-start"
    ].forEach((id) => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const val = sel.value;
        sel.innerHTML = labels
            .map((l) => `<option value="${l}">${l}</option>`)
            .join("");
        if (labels.includes(val)) sel.value = val;
    });
}

function clearResults() {
    [
        "traversal-result",
        "path-result",
        "connected-result",
        "components-result",
        "islands-result",
        "properties-result",
        "shortest-result",
        "t4-result",
        "t5-result",
    ].forEach((id) => document.getElementById(id).classList.add("hidden"));
    ["traversal-steps", "t4-step-controls", "t5-step-controls"].forEach((id) =>
        document.getElementById(id).classList.add("hidden"),
    );
}

// ─── Init ─────────────────────────────────────────────────
resize();
initSpecialGraphs();
loadPreset("triangle");
startRenderLoop();
