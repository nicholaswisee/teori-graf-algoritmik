from collections import deque

from src.graph import DirectedGraph, Graph, UndirectedGraph


class Tugas1:
    @staticmethod
    def find_path(graph: Graph, start, end):
        """
        Mencari jalur (path) antara dua simpul menggunakan Breadth-First Search (BFS).
        Berfungsi untuk mencari jalur terpendek (dalam jumlah edge).
        Mengembalikan list simpul dari start ke end jika jalur ditemukan, atau None jika tidak ada.
        """
        if start not in graph.get_vertices() or end not in graph.get_vertices():
            return None

        # Queue menyimpan tuple (simpul_saat_ini, path_sementara)
        queue = deque([(start, [start])])
        visited = {start}

        while queue:
            current, path = queue.popleft()

            if current == end:
                return path

            for neighbor, _ in graph.get_neighbors(current):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return None

    @staticmethod
    def is_connected(graph: Graph):
        """
        Menentukan apakah graph terhubung (connected).
        - Untuk UndirectedGraph: memeriksa apakah semua simpul berada dalam satu Connected Component.
        - Untuk DirectedGraph: memeriksa Strongly Connected (setiap simpul dapat mencapai semua simpul lainnya).
        """
        vertices = graph.get_vertices()
        if not vertices:
            return True  # Graph kosong dianggap terhubung

        if isinstance(graph, UndirectedGraph):
            # Cukup BFS dari satu simpul, jika bisa mencapai semua simpul maka terhubung
            start_vertex = vertices[0]
            visited = set()
            queue = deque([start_vertex])
            visited.add(start_vertex)

            while queue:
                current = queue.popleft()
                for neighbor, _ in graph.get_neighbors(current):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)

            return len(visited) == len(vertices)

        elif isinstance(graph, DirectedGraph):
            # Cek strongly connected: dari setiap simpul harus bisa mengunjungi semua simpul lainnya
            for start_vertex in vertices:
                visited = set()
                queue = deque([start_vertex])
                visited.add(start_vertex)

                while queue:
                    current = queue.popleft()
                    for neighbor, _ in graph.get_neighbors(current):
                        if neighbor not in visited:
                            visited.add(neighbor)
                            queue.append(neighbor)

                if len(visited) != len(vertices):
                    return False
            return True

        else:
            # Fallback untuk kelas graph dasar
            return False
