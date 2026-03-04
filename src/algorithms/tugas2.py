from collections import deque

from src.graph import Graph


class Tugas2:
    def components_count(self, graph: Graph):
        """
        Menghitung jumlah komponen terhubung dalam graf.
        """
        all_vertices = set(graph.get_vertices())
        components = 0

        while all_vertices:
            start_node = next(iter(all_vertices))

            visited_in_this_run = set()
            queue = deque([start_node])
            visited_in_this_run.add(start_node)

            while queue:
                current = queue.popleft()
                for neighbor, _ in graph.get_neighbors(current):
                    if neighbor in all_vertices and neighbor not in visited_in_this_run:
                        visited_in_this_run.add(neighbor)
                        queue.append(neighbor)

            all_vertices -= visited_in_this_run

            components += 1

        return components

    def explore_size(self, graph, vertex, visited_set):
        if vertex in visited_set:
            return 0

        visited_set.add(vertex)
        size = 1

        for neighbor, _ in graph.get_neighbors(vertex):
            size += self.explore_size(graph, neighbor, visited_set)

        return size

    def largest_component(self, graph):
        largest = 0
        global_visited = set()

        for vertex in graph.get_vertices():
            if vertex not in global_visited:
                size = self.explore_size(graph, vertex, global_visited)

                if size > largest:
                    largest = size

        return largest

    def island_count(self, grid):
        visited = set()
        count = 0

        for r in range(len(grid)):
            for c in range(len(grid[0])):
                if self.explore(grid, r, c, visited):
                    count += 1

        return count

    def explore(self, grid, r, c, visited):
        row_inbounds = 0 <= r < len(grid)
        col_inbounds = 0 <= c < len(grid[0])

        if not row_inbounds or not col_inbounds:
            return False

        if grid[r][c] == "W":
            return False

        pos = (r, c)
        if pos in visited:
            return False

        visited.add(pos)

        self.explore(grid, r - 1, c, visited)
        self.explore(grid, r + 1, c, visited)
        self.explore(grid, r, c - 1, visited)
        self.explore(grid, r, c + 1, visited)

        return True
