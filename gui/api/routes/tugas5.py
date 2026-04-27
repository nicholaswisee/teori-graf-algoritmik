from flask import Blueprint, request, jsonify
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas5 import Tugas5

tugas5_bp = Blueprint("tugas5", __name__, url_prefix="/api/tugas5")


@tugas5_bp.route("/tsp", methods=["POST"])
def api_tugas5_tsp():
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")

    try:
        tour, total_weight, selected_edges, steps, frames = Tugas5.christofides_3opt_tsp_trace(g, start)
        return jsonify({
            "algorithm": "christofides_3opt_tsp",
            "tour": tour,
            "total_weight": total_weight,
            "edges": selected_edges,
            "steps": steps,
            "frames": frames,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500