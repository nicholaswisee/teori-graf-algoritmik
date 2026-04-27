from flask import Blueprint, request, jsonify
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas1 import Tugas1

tugas1 = Tugas1()
graph_bp = Blueprint("graph", __name__, url_prefix="/api")


@graph_bp.route("/traversal", methods=["POST"])
def api_traversal():
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")
    algo = data.get("algo", "bfs")

    if start not in g.get_vertices():
        return jsonify({"error": f"Start vertex '{start}' not in graph"}), 400

    if algo == "bfs":
        order = g.bfs(start)
    else:
        order = g.dfs(start)

    return jsonify({"order": order, "algo": algo})


@graph_bp.route("/path", methods=["POST"])
def api_path():
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")
    end = data.get("end")
    algo = data.get("algo", "bfs")

    if algo == "bfs":
        path = tugas1.find_path_bfs(g, start, end)
    else:
        path = tugas1.find_path_dfs(g, start, end)

    return jsonify({"path": path, "algo": algo, "found": path is not None})


@graph_bp.route("/connected", methods=["POST"])
def api_connected():
    data = request.get_json()
    g = build_graph(data)
    algo = data.get("algo", "bfs")

    if algo == "bfs":
        result = tugas1.is_connected_bfs(g)
    else:
        result = tugas1.is_connected_dfs(g)

    return jsonify({"connected": result, "algo": algo})