import os
from flask import Blueprint, jsonify
from gui.api.utils import ALGORITHM_REGISTRY

algorithms_bp = Blueprint("algorithms", __name__, url_prefix="/api/algorithms")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


@algorithms_bp.route("", methods=["GET"])
def list_algorithms():
    return jsonify(list(ALGORITHM_REGISTRY.values()))


@algorithms_bp.route("/<tugas>", methods=["GET"])
def get_tugas_algorithms(tugas):
    entry = ALGORITHM_REGISTRY.get(tugas)
    if not entry:
        return jsonify({"error": f"Tugas {tugas} not found"}), 404
    return jsonify(entry)


@algorithms_bp.route("/<tugas>/<name>", methods=["GET"])
def get_algorithm_source(tugas, name):
    entry = ALGORITHM_REGISTRY.get(tugas)
    if not entry:
        return jsonify({"error": f"Tugas {tugas} not found"}), 404

    filepath = os.path.join(PROJECT_ROOT, entry["file"])
    if not os.path.exists(filepath):
        return jsonify({"error": "Source file not found"}), 404

    with open(filepath, "r") as f:
        source = f.read()

    return jsonify({**entry, "source": source})