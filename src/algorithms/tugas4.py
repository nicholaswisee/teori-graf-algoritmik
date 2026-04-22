from src.graph import Graph, UndirectedGraph

"""
TUGAS 4
Menentukan lintasan terpendek dari satu titik ke titik lain
Membangun pohon pembangun minimal dari graf
"""


class Tugas4:
    @staticmethod
    def shortest_path(graph: Graph, start, end):
        path, _, _, _ = Tugas4.shortest_path_trace(graph, start, end)
        return path

    @staticmethod
    def shortest_path_trace(graph: Graph, start, end):
        vertices = graph.get_vertices()
        if start not in vertices or end not in vertices:
            return [], -1, [], []

        distances = {vertex: float("inf") for vertex in vertices}
        previous = {vertex: None for vertex in vertices}
        unvisited = set(vertices)
        steps = [f"Mulai dari {start}."]
        frames = [{"node": start, "text": f"Mulai dari {start}"}]

        distances[start] = 0

        while unvisited:
            current = min(unvisited, key=lambda vertex: distances[vertex])
            current_distance = distances[current]

            if current_distance == float("inf"):
                steps.append("Sisa simpul tidak terjangkau, proses dihentikan.")
                frames.append({"node": None, "text": "Sisa simpul tidak terjangkau"})
                break

            unvisited.remove(current)
            steps.append(f"Kunjungi {current} dengan jarak {current_distance}.")
            frames.append(
                {
                    "node": current,
                    "text": f"Kunjungi {current} dengan jarak {current_distance}",
                }
            )

            if current == end:
                break

            for neighbor, weight in graph.get_neighbors(current):
                if neighbor not in unvisited:
                    continue

                new_distance = current_distance + weight
                if new_distance < distances[neighbor]:
                    old_distance = distances[neighbor]
                    distances[neighbor] = new_distance
                    previous[neighbor] = current
                    steps.append(
                        f"Perbarui {neighbor}: {old_distance if old_distance != float('inf') else '∞'} → {new_distance} melalui {current} (bobot {weight})."
                    )
                    frames.append(
                        {
                            "node": neighbor,
                            "edge": [current, neighbor],
                            "text": f"Perbarui {neighbor} melalui {current} (bobot {weight})",
                        }
                    )

        if distances[end] == float("inf"):
            steps.append(f"Tidak ada lintasan dari {start} ke {end}.")
            return [], -1, steps, frames

        path = []
        current = end
        while current is not None:
            path.append(current)
            current = previous[current]
        path.reverse()

        steps.append(
            f"Lintasan terpendek: {' → '.join(path)} dengan total jarak {distances[end]}."
        )
        frames.append(
            {
                "node": path[-1],
                "text": f"Lintasan terpendek ditemukan: {' → '.join(path)}",
            }
        )

        return path, distances[end], steps, frames

    @staticmethod
    def mst_prim(graph: Graph):
        mst_graph, _, _, _, _ = Tugas4.mst_prim_trace(graph)
        return mst_graph

    @staticmethod
    def mst_prim_trace(graph: Graph):
        mst_graph = UndirectedGraph()
        vertices = graph.get_vertices()

        if not vertices:
            return mst_graph, [], 0, [], []

        start_vertex = vertices[0]
        visited = {start_vertex}
        unvisited = set(vertices)
        unvisited.remove(start_vertex)
        selected_edges = []
        steps = [f"Mulai dari {start_vertex}."]
        frames = [{"node": start_vertex, "text": f"Mulai dari {start_vertex}"}]

        while unvisited:
            min_edge = None
            min_weight = float("inf")

            for u in visited:
                for v, weight in graph.get_neighbors(u):
                    if v in unvisited and weight < min_weight:
                        min_weight = weight
                        min_edge = (u, v, weight)

            if not min_edge:
                steps.append(
                    "Graf terputus, Prim berhenti sebelum semua simpul masuk MST."
                )
                break

            u, v, weight = min_edge
            mst_graph.add_edge(u, v, weight)
            visited.add(v)
            unvisited.remove(v)
            selected_edges.append({"from": u, "to": v, "weight": weight})
            steps.append(f"Pilih sisi {u} - {v} dengan bobot {weight}.")
            frames.append(
                {
                    "node": v,
                    "edge": [u, v],
                    "text": f"Pilih sisi {u} - {v} dengan bobot {weight}",
                }
            )

        total_weight = sum(edge["weight"] for edge in selected_edges)
        steps.append(f"Total bobot MST Prim: {total_weight}.")
        return mst_graph, selected_edges, total_weight, steps, frames

    @staticmethod
    def mst_kruskal(graph: Graph):
        """Return only the MST graph for compatibility."""
        mst_graph, _, _, _, _ = Tugas4.mst_kruskal_trace(graph)
        return mst_graph

    @staticmethod
    def mst_kruskal_trace(graph: Graph):
        """Run Kruskal's algorithm and return the MST graph, selected edges, total weight, steps, and frames."""
        mst_graph = UndirectedGraph()
        vertices = graph.get_vertices()

        if not vertices:
            return mst_graph, [], 0, [], []

        edges = []
        seen_edges = set()
        for u in vertices:
            for v, weight in graph.get_neighbors(u):
                edge_tuple = tuple(sorted([u, v]))
                if edge_tuple not in seen_edges:
                    seen_edges.add(edge_tuple)
                    edges.append((weight, u, v))

        edges.sort(key=lambda item: item[0])
        parent = {vertex: vertex for vertex in vertices}

        def find(node):
            if parent[node] == node:
                return node
            parent[node] = find(parent[node])
            return parent[node]

        def union(first, second):
            root_first = find(first)
            root_second = find(second)
            if root_first != root_second:
                parent[root_first] = root_second

        selected_edges = []
        steps = ["Urutkan semua sisi dari bobot terkecil ke terbesar."]
        frames = []
        target_edges = len(vertices) - 1

        for weight, u, v in edges:
            if len(selected_edges) >= target_edges:
                break

            steps.append(f"Periksa sisi {u} - {v} dengan bobot {weight}.")
            frames.append(
                {
                    "edge": [u, v],
                    "text": f"Periksa sisi {u} - {v} dengan bobot {weight}",
                }
            )

            if find(u) != find(v):
                union(u, v)
                mst_graph.add_edge(u, v, weight)
                selected_edges.append({"from": u, "to": v, "weight": weight})
                steps.append(f"Terima sisi {u} - {v}; sisi ini tidak membentuk siklus.")
                frames.append(
                    {
                        "node": v,
                        "edge": [u, v],
                        "text": f"Terima sisi {u} - {v}",
                    }
                )
            else:
                steps.append(f"Tolak sisi {u} - {v}; sisi ini membentuk siklus.")

        total_weight = sum(edge["weight"] for edge in selected_edges)
        steps.append(f"Total bobot MST Kruskal: {total_weight}.")
        return mst_graph, selected_edges, total_weight, steps, frames


if __name__ == "__main__":
    graph1 = UndirectedGraph()

    graph1.add_edge("A", "B", 1)
    graph1.add_edge("B", "C", 1)
    graph1.add_edge("A", "C", 4)
    graph1.add_edge("B", "D", 2)
    graph1.add_edge("C", "D", 5)

    print("1. DIJKSTRA")
    rute, jarak, langkah, _ = Tugas4.shortest_path_trace(graph1, "A", "C")
    print(f"Rute terpendek dari A ke C: {' -> '.join(rute)}")
    print(f"Jarak total: {jarak}")
    for langkah_item in langkah:
        print(f"- {langkah_item}")

    print("\n2. TES PRIM'S ALGORITHM")
    mst_p, edges_prim, biaya_prim, langkah_prim, _ = Tugas4.mst_prim_trace(graph1)
    print("Edge pada MST (Prim):")
    for edge in edges_prim:
        print(f"  {edge['from']} - {edge['to']} : {edge['weight']}")
    print(f"Total Biaya Prim: {biaya_prim}")
    for langkah_item in langkah_prim:
        print(f"- {langkah_item}")

    print("\n3. TES KRUSKAL'S ALGORITHM")
    mst_k, edges_kruskal, biaya_kruskal, langkah_kruskal, _ = Tugas4.mst_kruskal_trace(
        graph1
    )
    print("Edge pada MST (Kruskal):")
    for edge in edges_kruskal:
        print(f"  {edge['from']} - {edge['to']} : {edge['weight']}")
    print(f"Total Biaya Kruskal: {biaya_kruskal}")
    for langkah_item in langkah_kruskal:
        print(f"- {langkah_item}")
