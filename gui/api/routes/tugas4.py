from flask import Blueprint, request, jsonify
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas4 import Tugas4

tugas4_bp = Blueprint("tugas4", __name__, url_prefix="/api/tugas4")


@tugas4_bp.route("/run", methods=["POST"])
def api_tugas4_run():
    data = request.get_json()
    g = build_graph(data)
    algorithm = data.get("algorithm", "shortest_path")

    try:
        if algorithm == "shortest_path":
            start = data.get("start")
            end = data.get("end")
            if not start or not end:
                return jsonify({"error": "Start and end nodes are required"}), 400

            path, distance, steps, frames = Tugas4.shortest_path_trace(g, start, end)
            return jsonify(
                {
                    "algorithm": algorithm,
                    "found": bool(path),
                    "path": path,
                    "distance": distance,
                    "steps": steps,
                    "frames": frames,
                }
            )

        if algorithm == "prim":
            if data.get("directed", False):
                return jsonify({"error": "Prim requires an undirected graph"}), 400
            mst_graph, edges, total_weight, steps, frames = Tugas4.mst_prim_trace(g)
            return jsonify(
                {
                    "algorithm": algorithm,
                    "edges": edges,
                    "total_weight": total_weight,
                    "steps": steps,
                    "frames": frames,
                    "nodes": mst_graph.get_vertices(),
                }
            )

        if algorithm == "kruskal":
            if data.get("directed", False):
                return jsonify({"error": "Kruskal requires an undirected graph"}), 400
            mst_graph, edges, total_weight, steps, frames = Tugas4.mst_kruskal_trace(g)
            return jsonify(
                {
                    "algorithm": algorithm,
                    "edges": edges,
                    "total_weight": total_weight,
                    "steps": steps,
                    "frames": frames,
                    "nodes": mst_graph.get_vertices(),
                }
            )

        return jsonify({"error": "Unknown Tugas 4 algorithm"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500