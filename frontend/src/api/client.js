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
  const seen = new Set();
  const cleanEdges = [];
  for (const e of state.edges) {
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