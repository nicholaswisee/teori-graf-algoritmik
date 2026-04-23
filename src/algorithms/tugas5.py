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


def _route_edge_list(route):
    """Convert a route list to a list of [u, v] pairs for visualization."""
    n = len(route)
    return [[route[i], route[(i + 1) % n]] for i in range(n)]


class TSPInitialRouteBuilder:
    """Builds the metric closure graph and generates the initial Christofides route."""
    MAX_COST = 1_000_000

    @staticmethod
    def build_distance_matrix_and_closure(graph: Graph, vertices: list, steps: list, frames: list):
        nx_graph = nx.Graph()
        for v in vertices:
            nx_graph.add_node(v)

        dist_matrix = {}
        raw_edges = []
        for u in vertices:
            dist_matrix[u] = {
                v: (0 if u == v else TSPInitialRouteBuilder.MAX_COST)
                for v in vertices
            }

        for u in vertices:
            for v, w in graph.get_neighbors(u):
                dist_matrix[u][v] = w
                dist_matrix[v][u] = w
                nx_graph.add_edge(u, v, weight=w)
                raw_edges.append([u, v])

        # Step 1 — Distance matrix initialization
        steps.append(
            "Langkah 1: Membangun matriks jarak dari semua edge yang ada di graf. "
            "Pasangan vertex yang tidak terhubung langsung diberi bobot tak hingga (∞)."
        )
        frames.append({
            "node": vertices[0],
            "text": "Langkah 1 — Inisialisasi Matriks Jarak",
            "path_edges": raw_edges,
            "cut_edges": [],
            "swap_edges": [],
        })

        # Floyd-Warshall + metric closure
        fw_dist = dict(nx.floyd_warshall(nx_graph, weight="weight"))
        complete_nx = nx.Graph()
        closure_edges = []
        for u in vertices:
            for v in vertices:
                if u != v:
                    w = fw_dist[u][v] if fw_dist[u][v] != float("inf") else TSPInitialRouteBuilder.MAX_COST
                    dist_matrix[u][v] = w
                    complete_nx.add_edge(u, v, weight=w)
                    if w < TSPInitialRouteBuilder.MAX_COST:
                        closure_key = tuple(sorted([u, v]))
                        if [list(closure_key)] not in [[list(e)] for e in closure_edges]:
                            closure_edges.append([u, v])

        # Step 2 — Metric closure
        steps.append(
            "Langkah 2: Menjalankan Floyd-Warshall untuk menghitung jarak terpendek antar semua pasang vertex. "
            "Hasilnya membentuk Metric Closure — graf lengkap yang memenuhi triangle inequality "
            "(dist(A,C) ≤ dist(A,B)+dist(B,C)), syarat wajib untuk algoritma Christofides."
        )
        frames.append({
            "node": vertices[0],
            "text": "Langkah 2 — Metric Closure via Floyd-Warshall",
            "path_edges": closure_edges,
            "cut_edges": [],
            "swap_edges": [],
        })

        return dist_matrix, complete_nx

    @staticmethod
    def get_christofides_route(
        complete_nx: nx.Graph,
        vertices: list,
        start_node: str,
        steps: list,
        frames: list,
    ):
        # Step 3 — Minimum Spanning Tree
        mst = nx.minimum_spanning_tree(complete_nx)
        mst_edges = [[u, v] for u, v in mst.edges()]
        steps.append(
            "Langkah 3 (Christofides): Membangun Minimum Spanning Tree (MST) dari metric closure. "
            "MST menghubungkan semua vertex dengan total bobot minimum tanpa membentuk siklus. "
            f"Sisi MST: {', '.join(f'{u}-{v}' for u, v in mst_edges)}."
        )
        frames.append({
            "node": start_node,
            "text": "Langkah 3 — Christofides: Membangun MST",
            "path_edges": mst_edges,
            "cut_edges": [],
            "swap_edges": [],
        })

        # Step 4 — Odd-degree perfect matching
        odd_nodes = [v for v in mst.nodes() if mst.degree(v) % 2 == 1]
        odd_matching_shown = []
        if len(odd_nodes) >= 2:
            for idx in range(0, len(odd_nodes) - 1, 2):
                odd_matching_shown.append([odd_nodes[idx], odd_nodes[idx + 1]])

        steps.append(
            f"Langkah 4 (Christofides): Menemukan {len(odd_nodes)} vertex berderajat ganjil di MST: {odd_nodes}. "
            "Menghitung Perfect Matching bobot minimum di antara vertex ganjil tersebut "
            "agar setiap vertex berderajat genap (syarat Eulerian Circuit)."
        )
        frames.append({
            "node": start_node,
            "text": f"Langkah 4 — Christofides: Odd-Degree Matching ({len(odd_nodes)} vertex ganjil)",
            "path_edges": mst_edges,
            "cut_edges": [],
            "swap_edges": odd_matching_shown,
        })

        # Step 5 — Eulerian multigraph
        multigraph_edges = mst_edges + odd_matching_shown
        steps.append(
            "Langkah 5 (Christofides): Menggabungkan sisi MST dan sisi Perfect Matching menjadi multigraph. "
            "Setiap vertex kini berderajat genap, sehingga Eulerian Circuit dapat ditelusuri "
            "(setiap sisi dilalui tepat satu kali)."
        )
        frames.append({
            "node": start_node,
            "text": "Langkah 5 — Christofides: Multigraph Eulerian Terbentuk",
            "path_edges": multigraph_edges,
            "cut_edges": [],
            "swap_edges": [],
        })

        # Step 6 — Shortcut Eulerian → Hamiltonian
        try:
            initial_full_route = nx.algorithms.approximation.traveling_salesman_problem(
                complete_nx, cycle=True, method=nx.algorithms.approximation.christofides
            )
        except Exception as e:
            steps.append(f"Christofides gagal ({str(e)}), menggunakan rute default berurutan.")
            initial_full_route = vertices + [vertices[0]]

        if initial_full_route[0] != start_node:
            idx = initial_full_route[:-1].index(start_node)
            initial_full_route = (
                initial_full_route[idx:-1] + initial_full_route[:idx] + [start_node]
            )

        route = initial_full_route[:-1]
        route_edges = _route_edge_list(route)
        steps.append(
            "Langkah 6 (Christofides): Menelusuri Eulerian Circuit lalu memotong (shortcut) vertex "
            "yang sudah pernah dikunjungi untuk membentuk Rute Hamiltonian awal "
            f"(setiap vertex dikunjungi tepat sekali): {' → '.join(map(str, initial_full_route))}."
        )
        frames.append({
            "node": start_node,
            "text": f"Langkah 6 — Rute Inisial Christofides",
            "path_edges": route_edges,
            "cut_edges": [],
            "swap_edges": [],
        })

        return route


class ThreeOptSolver:
    """3-Opt local search heuristic to optimize the initial TSP route."""

    @staticmethod
    def possible_segments(n):
        return (
            (i, j, k)
            for i in range(n)
            for j in range(i + 2, n - 1)
            for k in range(j + 2, n - 1 + (i > 0))
        )

    @staticmethod
    def get_solution_cost_change(dist_matrix, route, case, i, j, k):
        A, B = route[i - 1], route[i]
        C, D = route[j - 1], route[j]
        E, F = route[k - 1], route[k % len(route)]

        if case == OptCase.OPT_CASE_1:
            return 0
        elif case == OptCase.OPT_CASE_2:
            return dist_matrix[A][B] + dist_matrix[E][F] - (dist_matrix[B][F] + dist_matrix[A][E])
        elif case == OptCase.OPT_CASE_3:
            return dist_matrix[C][D] + dist_matrix[E][F] - (dist_matrix[D][F] + dist_matrix[C][E])
        elif case == OptCase.OPT_CASE_4:
            return dist_matrix[A][B] + dist_matrix[C][D] + dist_matrix[E][F] - (dist_matrix[A][D] + dist_matrix[B][F] + dist_matrix[E][C])
        elif case == OptCase.OPT_CASE_5:
            return dist_matrix[A][B] + dist_matrix[C][D] + dist_matrix[E][F] - (dist_matrix[C][F] + dist_matrix[B][D] + dist_matrix[E][A])
        elif case == OptCase.OPT_CASE_6:
            return dist_matrix[B][A] + dist_matrix[D][C] - (dist_matrix[C][A] + dist_matrix[B][D])
        elif case == OptCase.OPT_CASE_7:
            return dist_matrix[A][B] + dist_matrix[C][D] + dist_matrix[E][F] - (dist_matrix[B][E] + dist_matrix[D][F] + dist_matrix[C][A])
        elif case == OptCase.OPT_CASE_8:
            return dist_matrix[A][B] + dist_matrix[C][D] + dist_matrix[E][F] - (dist_matrix[A][D] + dist_matrix[C][F] + dist_matrix[B][E])

    @staticmethod
    def reverse_segments(route, case, i, j, k):
        n = len(route)
        if (i - 1) < (k % n):
            first_segment = route[k % n:] + route[:i]
        else:
            first_segment = route[k % n:i]

        second_segment = route[i:j]
        third_segment = route[j:k]

        if case == OptCase.OPT_CASE_1:
            return route
        elif case == OptCase.OPT_CASE_2:
            return list(reversed(first_segment)) + second_segment + third_segment
        elif case == OptCase.OPT_CASE_3:
            return first_segment + second_segment + list(reversed(third_segment))
        elif case == OptCase.OPT_CASE_4:
            return list(reversed(first_segment)) + second_segment + list(reversed(third_segment))
        elif case == OptCase.OPT_CASE_5:
            return list(reversed(first_segment)) + list(reversed(second_segment)) + third_segment
        elif case == OptCase.OPT_CASE_6:
            return first_segment + list(reversed(second_segment)) + third_segment
        elif case == OptCase.OPT_CASE_7:
            return first_segment + list(reversed(second_segment)) + list(reversed(third_segment))
        elif case == OptCase.OPT_CASE_8:
            return list(reversed(first_segment)) + list(reversed(second_segment)) + list(reversed(third_segment))

    @staticmethod
    def optimize(dist_matrix, route, max_runtime, steps, frames):
        start_time = time.time()
        best_route = list(route)
        improved = True
        iterasi = 1

        # Step 7 — Begin 3-Opt iterations
        steps.append(
            "Langkah 7: Memulai 3-Opt Local Search. Algoritma memilih tiga posisi potong (i, j, k) "
            "dalam rute dan mencoba 8 cara berbeda merekoneksi tiga segmen hasil potongan. "
            "Jika ada cara yang menghemat bobot, swap dilakukan dan proses diulang."
        )
        frames.append({
            "node": best_route[0],
            "text": "Langkah 7 — Memulai 3-Opt Local Search",
            "path_edges": _route_edge_list(best_route),
            "cut_edges": [],
            "swap_edges": [],
        })

        while improved and (time.time() - start_time) < max_runtime:
            improved = False

            for i, j, k in ThreeOptSolver.possible_segments(len(best_route)):
                if (time.time() - start_time) > max_runtime:
                    break

                moves_cost = {}
                for opt_case in OptCase:
                    moves_cost[opt_case] = ThreeOptSolver.get_solution_cost_change(
                        dist_matrix, best_route, opt_case, i, j, k
                    )

                best_return = max(moves_cost, key=moves_cost.get)

                if moves_cost[best_return] > 0:
                    weight_saved = moves_cost[best_return]
                    n = len(best_route)

                    # Identify the 3 edges being cut
                    A, B = best_route[i - 1], best_route[i]
                    C, D = best_route[j - 1], best_route[j]
                    E, F = best_route[(k - 1) % n], best_route[k % n]
                    cut_edges = [[A, B], [C, D], [E, F]]

                    # Build old edge set to diff against new route
                    old_edge_set = set()
                    for idx in range(n):
                        u, v = best_route[idx], best_route[(idx + 1) % n]
                        old_edge_set.add((min(u, v), max(u, v)))

                    # Apply the swap
                    new_route = ThreeOptSolver.reverse_segments(best_route, best_return, i, j, k)
                    new_n = len(new_route)

                    # The 3 new connection edges (edges in new route that weren't in old route)
                    swap_edges = []
                    for idx in range(new_n):
                        u, v = new_route[idx], new_route[(idx + 1) % new_n]
                        if (min(u, v), max(u, v)) not in old_edge_set:
                            swap_edges.append([u, v])

                    best_route = new_route
                    new_route_edges = _route_edge_list(best_route)

                    steps.append(
                        f"Langkah 7 (Iterasi {iterasi}): Memotong sisi {A}–{B}, {C}–{D}, {E}–{F} "
                        f"dan merekoneksi dengan {best_return.name}. "
                        f"Penghematan: {weight_saved}. "
                        f"Rute baru: {' → '.join(map(str, best_route + [best_route[0]]))}."
                    )
                    frames.append({
                        "node": best_route[0],
                        "text": f"Iter {iterasi}: {best_return.name} — Hemat {weight_saved}",
                        "path_edges": new_route_edges,
                        "cut_edges": cut_edges,
                        "swap_edges": swap_edges,
                    })

                    improved = True
                    iterasi += 1
                    break

        # Step 8 — 3-Opt finished
        steps.append(
            f"Langkah 8: 3-Opt selesai setelah {iterasi - 1} iterasi. "
            "Tidak ada lagi kombinasi potongan dan rekoneksi yang menghasilkan penghematan. "
            "Rute telah mencapai local optimum."
        )
        frames.append({
            "node": best_route[0],
            "text": f"Langkah 8 — 3-Opt Selesai ({iterasi - 1} iterasi, local optimum)",
            "path_edges": _route_edge_list(best_route),
            "cut_edges": [],
            "swap_edges": [],
        })

        return best_route


class Tugas5:
    @staticmethod
    def _finalize_route(dist_matrix, best_route, start_node, steps, frames):
        best_full_route = best_route + [best_route[0]]

        if best_full_route[0] != start_node:
            idx = best_full_route[:-1].index(start_node)
            best_route = best_full_route[idx:-1] + best_full_route[:idx]
            best_full_route = best_route + [best_route[0]]

        total_weight = 0
        selected_edges = []
        route_viz_edges = []
        for idx in range(len(best_full_route) - 1):
            u, v = best_full_route[idx], best_full_route[idx + 1]
            w = dist_matrix[u][v]
            actual_w = 0 if w >= TSPInitialRouteBuilder.MAX_COST / 2 else w
            total_weight += actual_w
            selected_edges.append({
                "from": u,
                "to": v,
                "weight": actual_w if actual_w < TSPInitialRouteBuilder.MAX_COST / 2 else "Inf",
            })
            route_viz_edges.append([u, v])

        # Step 9 — Final result
        steps.append(
            f"Langkah 9: Rute TSP final: {' → '.join(map(str, best_full_route))}. "
            f"Total bobot: {total_weight}. "
            "Sisi dengan label 'Inf' berarti rute melewati jalur tidak langsung (metric closure)."
        )
        frames.append({
            "node": start_node,
            "text": f"Langkah 9 — Rute Final (Total Bobot: {total_weight})",
            "path_edges": route_viz_edges,
            "cut_edges": [],
            "swap_edges": [],
        })

        return best_full_route, total_weight, selected_edges

    @staticmethod
    def christofides_3opt_tsp_trace(graph: Graph, start_node=None):
        vertices = graph.get_vertices()
        if not vertices:
            return [], 0, [], [], []

        if start_node is None or start_node not in vertices:
            start_node = vertices[0]

        steps = []
        frames = []

        # Steps 1-2: Build distance matrix and metric closure
        dist_matrix, complete_nx = TSPInitialRouteBuilder.build_distance_matrix_and_closure(
            graph, vertices, steps, frames
        )

        # Steps 3-6: Christofides initial route
        route = TSPInitialRouteBuilder.get_christofides_route(
            complete_nx, vertices, start_node, steps, frames
        )

        # Steps 7-8: 3-Opt optimization
        best_route = ThreeOptSolver.optimize(
            dist_matrix, route, 10, steps, frames
        )

        # Step 9: Finalize route
        best_full_route, total_weight, selected_edges = Tugas5._finalize_route(
            dist_matrix, best_route, start_node, steps, frames
        )

        return best_full_route, total_weight, selected_edges, steps, frames
