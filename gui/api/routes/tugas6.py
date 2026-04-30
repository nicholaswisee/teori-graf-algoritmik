from flask import Blueprint, request, jsonify
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas6 import Tugas6

tugas6_bp = Blueprint("tugas6", __name__, url_prefix="/api/tugas6")


@tugas6_bp.route("/matching", methods=["POST"])
def api_tugas6_matching():
    data = request.get_json()
    g = build_graph(data)

    try:
        # Extract bipartite structure from edges
        U_nodes = set()
        V_nodes = set()
        adj = {}

        for e in data.get("edges", []):
            u, v = e.get("from"), e.get("to")
            if not u or not v:
                continue
            U_nodes.add(u)
            V_nodes.add(v)
            if u not in adj:
                adj[u] = []
            if v not in adj[u]:
                adj[u].append(v)

        hk = Tugas6(U_nodes, V_nodes, adj)
        match_count, matches = hk.search_max_matching()
        is_perfect = match_count == len(U_nodes) and match_count == len(V_nodes)

        # Build matched edge list for highlighting
        matched_edges = []
        for u, v in matches.items():
            if v is not None:
                matched_edges.append({"from": u, "to": v})

        # Build animation frames — each frame adds one matched pair
        frames = []
        for i in range(len(matched_edges) + 1):
            frame_edges = [[e["from"], e["to"]] for e in matched_edges[:i]]
            frames.append({
                "path_edges": frame_edges,
                "description": f"Matched pair {i}: {matched_edges[i - 1]['from']} \u2192 {matched_edges[i - 1]['to']}" if i > 0 else "Starting with empty matching",
            })

        return jsonify({
            "algorithm": "hopcroft_karp",
            "match_count": match_count,
            "is_perfect": is_perfect,
            "matches": matches,
            "matched_edges": matched_edges,
            "u_nodes": list(U_nodes),
            "v_nodes": list(V_nodes),
            "frames": frames,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tugas6_bp.route("/timetable", methods=["POST"])
def api_tugas6_timetable():
    data = request.get_json()

    try:
        # Build dataset_edges from graph edges
        dataset_edges = []
        seen = set()
        for e in data.get("edges", []):
            u, v = e.get("from"), e.get("to")
            if not u or not v:
                continue
            key = tuple(sorted([u, v]))
            if key not in seen:
                seen.add(key)
                dataset_edges.append((u, v))

        if not dataset_edges:
            return jsonify({"error": "No edges provided"}), 400

        tugas = Tugas6(dataset_edges=dataset_edges)
        num_sessions, sessions = tugas.search_coloring_timetabling()

        return jsonify({
            "algorithm": "graph_coloring_timetabling",
            "num_sessions": num_sessions,
            "sessions": sessions,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
