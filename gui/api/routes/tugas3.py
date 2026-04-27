from flask import Blueprint, request, jsonify
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas3 import Tugas3

tugas3_bp = Blueprint("tugas3", __name__, url_prefix="/api/tugas3")


@tugas3_bp.route("/properties", methods=["POST"])
def api_tugas3_properties():
    data = request.get_json()
    g = build_graph(data)

    try:
        is_bip = Tugas3.is_bipartite(g)
        has_cyc = Tugas3.has_cycle(g)
        diam = Tugas3.diameter(g)
        grth = Tugas3.girth(g)
        return jsonify(
            {
                "is_bipartite": is_bip,
                "has_cycle": has_cyc,
                "diameter": diam,
                "girth": grth,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tugas3_bp.route("/shortest_path", methods=["POST"])
def api_tugas3_shortest_path():
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")
    end = data.get("end")

    if not start or not end:
        return jsonify({"error": "Start and end nodes are required"}), 400

    if start not in g.get_vertices() or end not in g.get_vertices():
        return jsonify({"error": "Start and end nodes must be in the graph"}), 400

    try:
        distance = Tugas3.shortest_path(g, start, end)
        return jsonify({"distance": distance if distance != float("inf") else -1})
    except Exception as e:
        return jsonify({"error": str(e)}), 500