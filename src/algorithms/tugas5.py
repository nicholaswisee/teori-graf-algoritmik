import time
from enum import Enum

import networkx as nx

from src.graph import Graph


class OptCase(Enum):
    OPT_CASE_1 = 1
    OPT_CASE_2 = 2
    OPT_CASE_3 = 3
    OPT_CASE_4 = 4
    OPT_CASE_5 = 5
    OPT_CASE_6 = 6
    OPT_CASE_7 = 7
    OPT_CASE_8 = 8


def possible_segments(n):
    return (
        (i, j, k)
        for i in range(n)
        for j in range(i + 2, n - 1)
        for k in range(j + 2, n - 1 + (i > 0))
    )


def get_solution_cost_change(dist_matrix, route, case, i, j, k):
    A, B = route[i - 1], route[i]
    C, D = route[j - 1], route[j]
    E, F = route[k - 1], route[k % len(route)]

    if case == OptCase.OPT_CASE_1:
        return 0
    elif case == OptCase.OPT_CASE_2:
        return (
            dist_matrix[A][B]
            + dist_matrix[E][F]
            - (dist_matrix[B][F] + dist_matrix[A][E])
        )
    elif case == OptCase.OPT_CASE_3:
        return (
            dist_matrix[C][D]
            + dist_matrix[E][F]
            - (dist_matrix[D][F] + dist_matrix[C][E])
        )
    elif case == OptCase.OPT_CASE_4:
        return (
            dist_matrix[A][B]
            + dist_matrix[C][D]
            + dist_matrix[E][F]
            - (dist_matrix[A][D] + dist_matrix[B][F] + dist_matrix[E][C])
        )
    elif case == OptCase.OPT_CASE_5:
        return (
            dist_matrix[A][B]
            + dist_matrix[C][D]
            + dist_matrix[E][F]
            - (dist_matrix[C][F] + dist_matrix[B][D] + dist_matrix[E][A])
        )
    elif case == OptCase.OPT_CASE_6:
        return (
            dist_matrix[B][A]
            + dist_matrix[D][C]
            - (dist_matrix[C][A] + dist_matrix[B][D])
        )
    elif case == OptCase.OPT_CASE_7:
        return (
            dist_matrix[A][B]
            + dist_matrix[C][D]
            + dist_matrix[E][F]
            - (dist_matrix[B][E] + dist_matrix[D][F] + dist_matrix[C][A])
        )
    elif case == OptCase.OPT_CASE_8:
        return (
            dist_matrix[A][B]
            + dist_matrix[C][D]
            + dist_matrix[E][F]
            - (dist_matrix[A][D] + dist_matrix[C][F] + dist_matrix[B][E])
        )


def reverse_segments(route, case, i, j, k):
    n = len(route)
    if (i - 1) < (k % n):
        first_segment = route[k % n :] + route[:i]
    else:
        first_segment = route[k % n : i]

    second_segment = route[i:j]
    third_segment = route[j:k]

    if case == OptCase.OPT_CASE_1:
        return route
    elif case == OptCase.OPT_CASE_2:
        return list(reversed(first_segment)) + second_segment + third_segment
    elif case == OptCase.OPT_CASE_3:
        return first_segment + second_segment + list(reversed(third_segment))
    elif case == OptCase.OPT_CASE_4:
        return (
            list(reversed(first_segment))
            + second_segment
            + list(reversed(third_segment))
        )
    elif case == OptCase.OPT_CASE_5:
        return (
            list(reversed(first_segment))
            + list(reversed(second_segment))
            + third_segment
        )
    elif case == OptCase.OPT_CASE_6:
        return first_segment + list(reversed(second_segment)) + third_segment
    elif case == OptCase.OPT_CASE_7:
        return (
            first_segment
            + list(reversed(second_segment))
            + list(reversed(third_segment))
        )
    elif case == OptCase.OPT_CASE_8:
        return (
            list(reversed(first_segment))
            + list(reversed(second_segment))
            + list(reversed(third_segment))
        )


class Tugas5:
    @staticmethod
    def christofides_3opt_tsp_trace(graph: Graph, start_node=None):
        vertices = graph.get_vertices()
        if not vertices:
            return [], 0, [], [], []

        if start_node is None or start_node not in vertices:
            start_node = vertices[0]

        steps = []
        frames = []

        # 1. Build nx.Graph
        nx_graph = nx.Graph()
        for v in vertices:
            nx_graph.add_node(v)

        # Collect edges to build the distance matrix (with metric closure if incomplete)
        # Using a very large cost for missing edges
        MAX_COST = 1000000
        dist_matrix = {}
        for u in vertices:
            dist_matrix[u] = {}
            for v in vertices:
                if u == v:
                    dist_matrix[u][v] = 0
                else:
                    dist_matrix[u][v] = MAX_COST

        for u in vertices:
            for v, w in graph.get_neighbors(u):
                dist_matrix[u][v] = w
                dist_matrix[v][u] = w
                nx_graph.add_edge(u, v, weight=w)

        # Compute Floyd Warshall to find shortest paths for disconnected or missing edges
        fw_dist = dict(nx.floyd_warshall(nx_graph, weight="weight"))
        complete_nx = nx.Graph()
        for u in vertices:
            for v in vertices:
                if u != v:
                    # Metric closure distances:
                    w = fw_dist[u][v] if fw_dist[u][v] != float("inf") else MAX_COST
                    dist_matrix[u][v] = w
                    complete_nx.add_edge(u, v, weight=w)

        steps.append("Mencari rute inisial menggunakan algoritma Christofides.")
        try:
            # 2. Get initial route (Christofides) using complete metric closure graph
            initial_full_route = nx.algorithms.approximation.traveling_salesman_problem(
                complete_nx, cycle=True, method=nx.algorithms.approximation.christofides
            )
        except Exception as e:
            steps.append(f"Christofides gagal ({str(e)}), fallback ke rute default.")
            initial_full_route = vertices + [vertices[0]]

        # Ensure it starts with `start_node`
        if initial_full_route[0] != start_node:
            idx = initial_full_route[:-1].index(start_node)
            initial_full_route = (
                initial_full_route[idx:-1] + initial_full_route[:idx] + [start_node]
            )

        route = initial_full_route[:-1]

        steps.append(f"Rute Inisial: {' -> '.join(map(str, initial_full_route))}")
        frames.append(
            {"node": start_node, "text": "Rute Inisial (Christofides) Ditemukan"}
        )

        # 3. 3-Opt Iteration
        max_runtime = 10  # limit to 10 seconds for vercel compatibility
        start_time = time.time()

        best_route = list(route)
        improved = True
        iterasi = 1

        # To avoid infinite loops or taking too long, we use standard heuristics bounds
        while improved and (time.time() - start_time) < max_runtime:
            improved = False
            moves_cost = {opt_case: 0 for opt_case in OptCase}

            for i, j, k in possible_segments(len(best_route)):
                if (time.time() - start_time) > max_runtime:
                    break

                for opt_case in OptCase:
                    moves_cost[opt_case] = get_solution_cost_change(
                        dist_matrix, best_route, opt_case, i, j, k
                    )

                best_return = max(moves_cost, key=moves_cost.get)

                if moves_cost[best_return] > 0:
                    weight_saved = moves_cost[best_return]
                    steps.append(
                        f"[Iterasi {iterasi}] 3-Opt swap berhasil ({best_return.name})! Menghemat bobot: {weight_saved}"
                    )
                    best_route = reverse_segments(best_route, best_return, i, j, k)

                    frames.append(
                        {
                            "node": best_route[0],
                            "text": f"Iterasi {iterasi}: Update Rute (Hemat {weight_saved})",
                        }
                    )

                    improved = True
                    iterasi += 1
                    break

        best_full_route = best_route + [best_route[0]]

        # Make sure it still starts at the requested start_node
        if best_full_route[0] != start_node:
            idx = best_full_route[:-1].index(start_node)
            best_route = best_full_route[idx:-1] + best_full_route[:idx]
            best_full_route = best_route + [best_route[0]]

        # Compute final properties, identifying missing edges correctly
        total_weight = 0
        selected_edges = []
        for idx in range(len(best_full_route) - 1):
            u, v = best_full_route[idx], best_full_route[idx + 1]
            w = dist_matrix[u][v]

            # Identify if it was an artificial edge / metric closure edge
            actual_w = w
            if w >= MAX_COST / 2:
                actual_w = 0  # Not a real edge!

            total_weight += actual_w
            selected_edges.append(
                {
                    "from": u,
                    "to": v,
                    "weight": actual_w if actual_w < MAX_COST / 2 else "Inf",
                }
            )

        steps.append(f"Selesai! Total iterasi 3-Opt: {iterasi - 1}")
        steps.append(f"Rute Final: {' -> '.join(map(str, best_full_route))}")
        steps.append(f"Total bobot TSP: {total_weight}")

        return best_full_route, total_weight, selected_edges, steps, frames
