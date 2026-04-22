import sys
import os

# Allow importing from the project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, render_template, request

from src.algorithms.tugas1 import Tugas1
from src.algorithms.tugas2 import Tugas2
from src.algorithms.tugas3 import Tugas3
from src.algorithms.tugas4 import Tugas4
from src.graph import DirectedGraph, UndirectedGraph
from src.algorithms.tugas5 import Tugas5

app = Flask(__name__)

tugas1 = Tugas1()
tugas2 = Tugas2()


def build_graph(data):
    """Build a Graph object from JSON payload {directed, vertices, edges}."""
    directed = data.get("directed", False)
    g = DirectedGraph() if directed else UndirectedGraph()
    for v in data.get("vertices", []):
        g.add_vertex(v)
    for e in data.get("edges", []):
        g.add_edge(e["from"], e["to"], e.get("weight", 1))
    return g


# ──────────────────────────────────────────
# Routes
# ──────────────────────────────────────────


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/traversal", methods=["POST"])
def api_traversal():
    """Run BFS or DFS traversal from a start vertex.
    Returns the ordered visit list and a step-by-step log.
    """
    data = request.get_json()
    g = build_graph(data)
    start = data.get("start")
    algo = data.get("algo", "bfs")  # "bfs" | "dfs"

    if start not in g.get_vertices():
        return jsonify({"error": f"Start vertex '{start}' not in graph"}), 400

    if algo == "bfs":
        order = g.bfs(start)
    else:
        order = g.dfs(start)

    return jsonify({"order": order, "algo": algo})


@app.route("/api/path", methods=["POST"])
def api_path():
    """Find a path between two vertices using BFS or DFS."""
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


@app.route("/api/connected", methods=["POST"])
def api_connected():
    """Check if the graph is connected (BFS or DFS)."""
    data = request.get_json()
    g = build_graph(data)
    algo = data.get("algo", "bfs")

    if algo == "bfs":
        result = tugas1.is_connected_bfs(g)
    else:
        result = tugas1.is_connected_dfs(g)

    return jsonify({"connected": result, "algo": algo})


@app.route("/api/components", methods=["POST"])
def api_components():
    """Return component count, largest component size, and per-vertex component assignment."""
    data = request.get_json()
    g = build_graph(data)

    count = tugas2.components_count(g)
    largest = tugas2.largest_component(g)

    # Assign a component ID to each vertex so the frontend can colour them
    from collections import deque

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


@app.route("/api/islands", methods=["POST"])
def api_islands():
    """Count islands in a grid and return visited cells per island."""
    data = request.get_json()
    grid = data.get("grid", [])

    if not grid:
        return jsonify({"count": 0, "islands": []})

    rows = len(grid)
    cols = len(grid[0])
    visited = set()
    islands = []  # list of lists of [r, c] per island

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


@app.route("/api/tugas3/properties", methods=["POST"])
def api_tugas3_properties():
    """Calculate and return Bipartite, Cycle, Diameter, and Girth properties."""
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


@app.route("/api/tugas3/shortest_path", methods=["POST"])
def api_tugas3_shortest_path():
    """Calculate the shortest path distance between two nodes."""
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


@app.route("/api/tugas4/run", methods=["POST"])
def api_tugas4_run():
    """Run one of the weighted Tugas 4 algorithms and return trace data."""
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


@app.route("/api/tugas5/tsp", methods=["POST"])
def api_tugas5_tsp():
    """Run Nearest Neighbor TSP algorithm."""
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
