import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.graph import DirectedGraph, UndirectedGraph


def build_graph(data):
    directed = data.get("directed", False)
    g = DirectedGraph() if directed else UndirectedGraph()
    for v in data.get("vertices", []):
        g.add_vertex(v)
    for e in data.get("edges", []):
        g.add_edge(e["from"], e["to"], e.get("weight", 1))
    return g


def error_response(message, code=400):
    return {"error": message}, code


ALGORITHM_REGISTRY = {
    "1": {
        "tugas": 1,
        "name": "traversal",
        "label": "Traversal & Path Finding",
        "file": "src/algorithms/tugas1.py",
        "class": "Tugas1",
        "methods": [
            {"name": "find_path_bfs", "description": "Find path between two nodes using BFS"},
            {"name": "find_path_dfs", "description": "Find path between two nodes using DFS"},
            {"name": "is_connected_bfs", "description": "Check graph connectivity using BFS"},
            {"name": "is_connected_dfs", "description": "Check graph connectivity using DFS"},
        ],
    },
    "2": {
        "tugas": 2,
        "name": "components",
        "label": "Components & Islands",
        "file": "src/algorithms/tugas2.py",
        "class": "Tugas2",
        "methods": [
            {"name": "components_count", "description": "Count connected components"},
            {"name": "largest_component", "description": "Find size of largest component"},
            {"name": "island_count", "description": "Count islands in a grid"},
        ],
    },
    "3": {
        "tugas": 3,
        "name": "properties",
        "label": "Graph Properties",
        "file": "src/algorithms/tugas3.py",
        "class": "Tugas3",
        "methods": [
            {"name": "is_bipartite", "description": "Check if graph is bipartite"},
            {"name": "has_cycle", "description": "Detect if graph contains a cycle"},
            {"name": "diameter", "description": "Compute graph diameter"},
            {"name": "girth", "description": "Compute graph girth (shortest cycle)"},
            {"name": "shortest_path", "description": "Shortest distance between two nodes"},
        ],
    },
    "4": {
        "tugas": 4,
        "name": "weighted",
        "label": "Weighted Graph Algorithms",
        "file": "src/algorithms/tugas4.py",
        "class": "Tugas4",
        "methods": [
            {"name": "shortest_path", "description": "Dijkstra's shortest path"},
            {"name": "mst_prim", "description": "Prim's MST algorithm"},
            {"name": "mst_kruskal", "description": "Kruskal's MST algorithm"},
        ],
    },
    "5": {
        "tugas": 5,
        "name": "tsp",
        "label": "TSP (Christofides + 3-Opt)",
        "file": "src/algorithms/tugas5.py",
        "class": "Tugas5",
        "methods": [
            {"name": "christofides_3opt_tsp_trace", "description": "TSP via Christofides + 3-Opt local search"},
        ],
    },
}