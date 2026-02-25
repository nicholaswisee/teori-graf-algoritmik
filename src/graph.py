from collections import deque


class Graph:
    def __init__(self, directed: bool = False):
        """
        Menginisialisasi objek graph.
        :param directed: Boolean yang menunjukkan apakah graph berarah (directed).
        """
        self.directed = directed
        self.adj_list = {}

    def add_vertex(self, vertex):
        """Menambahkan simpul (vertex) ke dalam graph."""
        if vertex not in self.adj_list:
            self.adj_list[vertex] = []

    def add_edge(self, u, v, weight=1):
        """
        Menambahkan sisi (edge) ke dalam graph.
        Jika simpul (vertices) belum ada, akan ditambahkan secara otomatis.
        """
        self.add_vertex(u)
        self.add_vertex(v)

        self.adj_list[u].append((v, weight))
        if not self.directed:
            self.adj_list[v].append((u, weight))

    def get_vertices(self):
        """Mengembalikan daftar semua simpul (vertices) dalam graph."""
        return list(self.adj_list.keys())

    def get_neighbors(self, vertex):
        """Mengembalikan tetangga (neighbors) dari simpul (vertex) yang diberikan."""
        return self.adj_list.get(vertex, [])

    def dfs(self, start_vertex):
        """Implementasi Depth-First Search menggunakan Stack"""

        visited = set()
        stack = deque([start_vertex])
        visited.add(start_vertex)
        order = []

        while stack:
            vertex = stack.pop()

            if vertex not in visited:
                visited.add(vertex)
                order.append(vertex)

                for neighbor, _ in self.adj_list.get(vertex, []):
                    if neighbor not in visited:
                        stack.append(neighbor)

        return order

    def bfs(self, start_vertex):
        """Implementasi Breadth-First Search menggunakan Queue"""
        visited = set()
        queue = deque([start_vertex])
        visited.add(start_vertex)
        order = []

        while queue:
            vertex = queue.popleft()
            order.append(vertex)

            for neighbor, _ in self.adj_list.get(vertex, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        return order

    def __str__(self):
        """Representasi string dari graph."""
        result = []
        for vertex in self.adj_list:
            neighbors = [f"{n}(w={w})" for n, w in self.adj_list[vertex]]
            result.append(f"{vertex}: {', '.join(neighbors)}")
        return "\n".join(result)
