from collections import deque

from flask import Blueprint, request, jsonify
from gui.api.utils import build_graph, error_response
from src.algorithms.tugas2 import Tugas2

tugas2 = Tugas2()
tugas2_bp = Blueprint("tugas2", __name__, url_prefix="/api")


@tugas2_bp.route("/components", methods=["POST"])
def api_components():
    data = request.get_json()
    g = build_graph(data)

    count = tugas2.components_count(g)
    largest = tugas2.largest_component(g)

    vertex_component = {}
    comp_id = 0
    all_vertices = set(g.get_vertices())
    while all_vertices:
        start = next(iter(all_vertices))
        queue = deque([start])
        visited = {start}
        while queue:
            cur = queue.popleft()
            vertex_component[cur] = comp_id
            for nb, _ in g.get_neighbors(cur):
                if nb in all_vertices and nb not in visited:
                    visited.add(nb)
                    queue.append(nb)
        all_vertices -= visited
        comp_id += 1

    return jsonify(
        {
            "count": count,
            "largest": largest,
            "vertex_component": vertex_component,
        }
    )


@tugas2_bp.route("/islands", methods=["POST"])
def api_islands():
    data = request.get_json()
    grid = data.get("grid", [])

    if not grid:
        return jsonify({"count": 0, "islands": []})

    rows = len(grid)
    cols = len(grid[0])
    visited = set()
    islands = []

    def explore(r, c, cells):
        if not (0 <= r < rows and 0 <= c < cols):
            return
        if grid[r][c] == "W":
            return
        if (r, c) in visited:
            return
        visited.add((r, c))
        cells.append([r, c])
        explore(r - 1, c, cells)
        explore(r + 1, c, cells)
        explore(r, c - 1, cells)
        explore(r, c + 1, cells)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "L" and (r, c) not in visited:
                cells = []
                explore(r, c, cells)
                islands.append(cells)

    return jsonify({"count": len(islands), "islands": islands})