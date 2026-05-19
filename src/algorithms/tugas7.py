from collections import deque

from src.graph import Graph


class Tugas7:
    """
    Tugas 7: Graph Bandwidth Reduction menggunakan Reverse Cuthill-McKee (RCM).

    Definisi Bandwidth:
        Diberikan graph G = (V, E) dengan |V| = n.
        Sebuah labeling (penomoran) adalah fungsi f: V → {1, 2, ..., n} yang bijektif.
        Bandwidth dari labeling f adalah:
            B(f) = max |f(u) - f(v)| untuk semua edge (u, v) ∈ E
        Tujuan: temukan labeling f yang meminimalkan B(f).

    Reverse Cuthill-McKee (RCM) adalah heuristic untuk mengurangi bandwidth:
    1. Temukan vertex "perifer" (ujung graph, derajat rendah, jarak jauh ke pusat)
    2. BFS dari vertex perifer untuk membentuk level sets (lapisan-lapisan)
    3. Dalam setiap level, urutkan vertex berdasarkan derajat (ascending)
    4. Gabungkan semua level → Cuthill-McKee ordering
    5. Balik urutan total → Reverse Cuthill-McKee ordering
    6. Vertex di urutan ke-i mendapat label (posisi) ke-i

    Mengapa reverse? Karena vertex dengan derajat tinggi (hub) sebaiknya diletakkan
    di tengah ordering, sehingga semua edge-nya "lokal" (jarak label kecil).
    """

    @staticmethod
    def _compute_bandwidth(graph: Graph, labeling: dict):
        """
        Hitung bandwidth untuk suatu labeling.
        labeling: dict {vertex: position_number}
        """
        bandwidth = 0
        worst_edge = None
        seen = set()
        for u in graph.get_vertices():
            for v, _ in graph.get_neighbors(u):
                key = tuple(sorted([str(u), str(v)]))
                if key in seen:
                    continue
                seen.add(key)
                diff = abs(labeling[u] - labeling[v])
                if diff > bandwidth:
                    bandwidth = diff
                    worst_edge = (u, v)
        return bandwidth, worst_edge

    @staticmethod
    def _find_peripheral_vertex(graph: Graph):
        """
        Temukan pseudo-peripheral vertex menggunakan algoritma George-Liu:
        1. Pilih vertex dengan derajat minimum (kemungkinan besar di ujung graph)
        2. BFS dari vertex tersebut, temukan vertex terjauh
        3. Ulangi BFS dari vertex terjauh — hasilnya adalah approximasi vertex perifer

        Intuisi: vertex perifer berada di "ujung" graph, jadi BFS darinya akan
        menghasilkan level sets yang simetris dan dalam — ideal untuk RCM.
        """
        vertices = graph.get_vertices()
        if not vertices:
            return None

        # Pilih vertex dengan derajat minimum (kemungkinan besar di ujung)
        min_deg = float("inf")
        start = vertices[0]
        for v in vertices:
            deg = len(graph.get_neighbors(v))
            if deg < min_deg:
                min_deg = deg
                start = v

        def bfs_farthest(start_v):
            """BFS untuk menemukan vertex terjauh dari start_v."""
            visited = {start_v: 0}
            queue = deque([start_v])
            farthest = start_v
            max_dist = 0
            while queue:
                u = queue.popleft()
                for v, _ in graph.get_neighbors(u):
                    if v not in visited:
                        visited[v] = visited[u] + 1
                        queue.append(v)
                        if visited[v] > max_dist:
                            max_dist = visited[v]
                            farthest = v
            return farthest, max_dist

        # Iterasi 1: dari vertex derajat min → temukan vertex terjauh
        v1, d1 = bfs_farthest(start)
        # Iterasi 2: dari vertex terjauh → temukan yang lebih jauh lagi
        v2, d2 = bfs_farthest(v1)

        return v2

    @staticmethod
    def rcm_bandwidth(graph: Graph):
        """
        Jalankan Reverse Cuthill-McKee untuk mengurangi bandwidth.

        Returns dict dengan keys:
            labeling:           dict {original_vertex: new_position_label}
            original_labeling:  dict {original_vertex: original_position_label}
            rcm_ordering:       list vertex dalam urutan RCM (posisi 1..n)
            cm_ordering:        list vertex dalam urutan CM
            original_bandwidth: bandwidth dengan urutan asli (vertices.keys())
            rcm_bandwidth:      bandwidth dengan urutan RCM
            steps:              list langkah penjelasan (educational)
            frames:             list frame untuk animasi
            level_sets:         list of lists, BFS level sets
            peripheral_vertex:  vertex perifer yang dipilih
            worst_edge_original: edge dengan span terbesar (original labeling)
            worst_edge_rcm:      edge dengan span terbesar (RCM labeling)
        """
        vertices = graph.get_vertices()
        if not vertices:
            return {
                "labeling": {},
                "original_labeling": {},
                "rcm_ordering": [],
                "cm_ordering": [],
                "original_bandwidth": 0,
                "rcm_bandwidth": 0,
                "steps": [],
                "frames": [],
                "level_sets": [],
                "peripheral_vertex": None,
                "worst_edge_original": None,
                "worst_edge_rcm": None,
            }

        # ============================================
        # Langkah 1: Temukan vertex pseudo-peripheral
        # ============================================
        peripheral = Tugas7._find_peripheral_vertex(graph)
        peripheral_deg = len(graph.get_neighbors(peripheral))

        # ============================================
        # Langkah 2: BFS untuk membentuk level sets
        # ============================================
        levels = []
        bfs_dist = {peripheral: 0}
        visited = set()
        queue = deque([peripheral])
        visited.add(peripheral)

        while queue:
            level_size = len(queue)
            current_level = []
            for _ in range(level_size):
                u = queue.popleft()
                current_level.append(u)
                for v, _ in graph.get_neighbors(u):
                    if v not in visited:
                        visited.add(v)
                        bfs_dist[v] = bfs_dist[u] + 1
                        queue.append(v)
            levels.append(current_level)

        # ============================================
        # Langkah 3: Cuthill-McKee (CM) ordering
        # ============================================
        # Dalam setiap level, urutkan vertex berdasarkan derajat (ascending).
        # Vertex dengan derajat rendah didahulukan agar tidak "menarik" edge
        # ke arah yang memperlebar bandwidth.
        cm_ordering = []
        for level in levels:
            level_sorted = sorted(level, key=lambda v: len(graph.get_neighbors(v)))
            cm_ordering.extend(level_sorted)

        # ============================================
        # Langkah 4: Reverse untuk RCM ordering
        # ============================================
        # Balik urutan CM. Mengapa? Karena CM menempatkan vertex derajat rendah
        # di awal. Jika dibalik, vertex derajat tinggi (hub) berada di tengah
        # ordering, membuat semua edge-nya "lokal" (jarak label kecil).
        rcm_ordering = list(reversed(cm_ordering))

        # ============================================
        # Langkah 5: Buat labeling (penomoran)
        # ============================================
        # Original labeling: sesuai urutan vertices (dict keys order)
        original_labeling = {v: i + 1 for i, v in enumerate(vertices)}

        # RCM labeling: sesuai urutan rcm_ordering
        rcm_labeling = {v: i + 1 for i, v in enumerate(rcm_ordering)}

        # ============================================
        # Langkah 6: Hitung bandwidth
        # ============================================
        original_bw, worst_orig = Tugas7._compute_bandwidth(graph, original_labeling)
        rcm_bw, worst_rcm = Tugas7._compute_bandwidth(graph, rcm_labeling)

        # ============================================
        # Bangun langkah-langkah (educational)
        # ============================================
        steps = []

        steps.append(
            f"Langkah 1 — Temukan Vertex Perifer: Dipilih {peripheral} (derajat {peripheral_deg}). "
            f"Vertex ini berada di 'ujung' graph, sehingga BFS darinya akan menghasilkan "
            f"level sets (lapisan-lapisan) yang dalam dan simetris — ideal untuk RCM."
        )

        steps.append(
            f"Langkah 2 — BFS Level Sets: Dari {peripheral}, BFS membentuk {len(levels)} level. "
            f"Setiap level berisi vertex yang memiliki jarak (jumlah edge) sama dari {peripheral}."
        )
        for i, level in enumerate(levels):
            level_str = ", ".join(f"{v}(d={len(graph.get_neighbors(v))})" for v in level)
            steps.append(f"  Level {i}: [{level_str}]")

        steps.append(
            f"Langkah 3 — Cuthill-McKee Ordering: Dalam setiap level, vertex diurutkan "
            f"berdasarkan derajat (ascending). Vertex dengan derajat rendah didahulukan "
            f"agar tidak 'menarik' edge ke arah yang memperlebar bandwidth."
        )
        cm_with_labels = " → ".join(f"{v}({i+1})" for i, v in enumerate(cm_ordering))
        steps.append(f"  CM Ordering: {cm_with_labels}")

        steps.append(
            f"Langkah 4 — Reverse Cuthill-McKee: Balik urutan CM. Sekarang vertex derajat tinggi "
            f"(hub) berada di tengah ordering, sehingga semua edge-nya menjadi 'lokal' "
            f"(jarak antar label kecil)."
        )
        rcm_with_labels = " → ".join(f"{v}({i+1})" for i, v in enumerate(rcm_ordering))
        steps.append(f"  RCM Ordering: {rcm_with_labels}")

        steps.append(
            f"Langkah 5 — Labeling & Bandwidth: Setiap vertex di urutan ke-i mendapat label ke-i. "
            f"Bandwidth = max |label(u) − label(v)| untuk semua edge (u, v)."
        )

        # Tampilkan edge terburuk
        if worst_orig:
            u, v = worst_orig
            steps.append(
                f"  Original: Bandwidth = {original_bw}, edge terburuk: {u}—{v} "
                f"(selisih label = |{original_labeling[u]} − {original_labeling[v]}| = {abs(original_labeling[u] - original_labeling[v])})."
            )
        if worst_rcm:
            u, v = worst_rcm
            steps.append(
                f"  RCM:      Bandwidth = {rcm_bw}, edge terburuk: {u}—{v} "
                f"(selisih label = |{rcm_labeling[u]} − {rcm_labeling[v]}| = {abs(rcm_labeling[u] - rcm_labeling[v])})."
            )

        if original_bw > 0:
            improvement = original_bw - rcm_bw
            improvement_pct = (improvement / original_bw * 100)
            steps.append(
                f"  Hasil: Pengurangan bandwidth sebesar {improvement} ({improvement_pct:.1f}%)."
            )
        else:
            steps.append(f"  Hasil: Bandwidth asli = {original_bw}, RCM = {rcm_bw}.")

        # ============================================
        # Bangun frames untuk animasi
        # ============================================
        frames = []

        # Frame 1: Highlight vertex peripheral
        frames.append({
            "node": peripheral,
            "text": f"Langkah 1 — Vertex perifer: {peripheral} (derajat {peripheral_deg})",
            "path_edges": [],
            "cut_edges": [],
            "swap_edges": [],
        })

        # Frames 2+: BFS level by level
        bfs_tree_edges = []
        for i, level in enumerate(levels):
            for u in level:
                for v, _ in graph.get_neighbors(u):
                    if bfs_dist.get(v, -1) == bfs_dist.get(u, -1) - 1:
                        edge = [u, v]
                        if edge not in bfs_tree_edges and [v, u] not in bfs_tree_edges:
                            bfs_tree_edges.append(edge)

            frames.append({
                "node": level[0] if level else None,
                "text": f"Langkah 2 — BFS Level {i}: {', '.join(str(v) for v in level)}",
                "path_edges": list(bfs_tree_edges),
                "cut_edges": [],
                "swap_edges": [],
            })

        # Frame: CM ordering
        frames.append({
            "node": cm_ordering[0] if cm_ordering else None,
            "text": f"Langkah 3 — CM Ordering: {cm_with_labels}",
            "path_edges": [],
            "cut_edges": [],
            "swap_edges": [],
        })

        # Frame: RCM ordering
        frames.append({
            "node": rcm_ordering[0] if rcm_ordering else None,
            "text": f"Langkah 4 — RCM Ordering: {rcm_with_labels}",
            "path_edges": [],
            "cut_edges": [],
            "swap_edges": [],
        })

        # Frame: Final result
        improvement = original_bw - rcm_bw
        improvement_pct = (improvement / original_bw * 100) if original_bw > 0 else 0
        frames.append({
            "node": None,
            "text": f"Langkah 5 — Bandwidth: {original_bw} → {rcm_bw} (hemat {improvement}, {improvement_pct:.1f}%)",
            "path_edges": [],
            "cut_edges": [],
            "swap_edges": [],
        })

        return {
            "labeling": rcm_labeling,
            "original_labeling": original_labeling,
            "rcm_ordering": rcm_ordering,
            "cm_ordering": cm_ordering,
            "original_bandwidth": original_bw,
            "rcm_bandwidth": rcm_bw,
            "steps": steps,
            "frames": frames,
            "level_sets": levels,
            "peripheral_vertex": peripheral,
            "worst_edge_original": list(worst_orig) if worst_orig else None,
            "worst_edge_rcm": list(worst_rcm) if worst_rcm else None,
        }


if __name__ == "__main__":
    from src.graph import UndirectedGraph

    # Demo: Graph dengan bandwidth yang bisa dikurangi
    g = UndirectedGraph()

    # Buat graph: center node C dengan beberapa branches
    edges = [
        ("A", "B"), ("B", "C"), ("C", "D"), ("D", "E"),
        ("C", "F"), ("C", "G"), ("C", "H"),
        ("F", "I"), ("G", "J"), ("H", "K"),
    ]

    for u, v in edges:
        g.add_edge(u, v)

    result = Tugas7.rcm_bandwidth(g)

    print("=" * 60)
    print("TUGAS 7: GRAPH BANDWIDTH (Reverse Cuthill-McKee)")
    print("=" * 60)
    print(f"Vertex perifer: {result['peripheral_vertex']}")
    print(f"\nLevel sets:")
    for i, level in enumerate(result['level_sets']):
        print(f"  Level {i}: {level}")
    print(f"\nOriginal labeling: {result['original_labeling']}")
    print(f"CM ordering:  {' -> '.join(result['cm_ordering'])}")
    print(f"RCM ordering: {' -> '.join(result['rcm_ordering'])}")
    print(f"RCM labeling: {result['labeling']}")
    print(f"\nBandwidth asli: {result['original_bandwidth']}")
    print(f"Bandwidth RCM:  {result['rcm_bandwidth']}")
    if result['worst_edge_original']:
        print(f"Edge terburuk (original): {result['worst_edge_original']}")
    if result['worst_edge_rcm']:
        print(f"Edge terburuk (RCM):      {result['worst_edge_rcm']}")
    print()
    print("Langkah-langkah:")
    for step in result['steps']:
        print(f"  {step}")
