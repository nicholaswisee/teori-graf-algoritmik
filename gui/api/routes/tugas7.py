from flask import Blueprint, request, jsonify
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas7 import Tugas7

tugas7_bp = Blueprint("tugas7", __name__, url_prefix="/api/tugas7")


@tugas7_bp.route("/bandwidth", methods=["POST"])
def api_tugas7_bandwidth():
    data = request.get_json()
    g = build_graph(data)

    try:
        result = Tugas7.rcm_bandwidth(g)
        return jsonify({
            "algorithm": "reverse_cuthill_mckee",
            "labeling": result["labeling"],
            "original_labeling": result["original_labeling"],
            "rcm_ordering": result["rcm_ordering"],
            "cm_ordering": result["cm_ordering"],
            "original_bandwidth": result["original_bandwidth"],
            "rcm_bandwidth": result["rcm_bandwidth"],
            "steps": result["steps"],
            "frames": result["frames"],
            "level_sets": result["level_sets"],
            "peripheral_vertex": result["peripheral_vertex"],
            "worst_edge_original": result["worst_edge_original"],
            "worst_edge_rcm": result["worst_edge_rcm"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
