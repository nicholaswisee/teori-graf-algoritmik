from collections import deque

from src.algorithms.tugas2 import Tugas2
from src.graph import DirectedGraph, Graph

"""
Menentukan apakah graf yang diberikan adalah bipartite atau bukan?
Menentukan diameter dari suatu graf
Mendeteksi adanya siklus dalam suatu graf
Menentukan sabuk (girth) dari graf. Girth adalah siklus terkecil dalam graf
"""


class Tugas3:
    @staticmethod
    def is_bipartite(graph: Graph):
        # 0 = belum dikunjungi/diwarnai, 1 = Warna A, -1 = Warna B
        odd = {vertex: 0 for vertex in graph.get_vertices()}

        def bfs(start_node):
            if odd[start_node] != 0:
                return True

            q = deque([start_node])
            odd[start_node] = -1

            while q:
                curr = q.popleft()
                for nei, _ in graph.get_neighbors(curr):
                    if odd[curr] == odd[nei]:
                        return False

                    elif odd[nei] == 0:
                        q.append(nei)
                        odd[nei] = -1 * odd[curr]
            return True

        for vertex in graph.get_vertices():
            if not bfs(vertex):
                return False

        return True

    @staticmethod
    def shortest_path(graph: Graph, node_a, node_b):

        queue = deque([(node_a, 0)])
        visited = set([node_a])

        while queue:
            node, distance = queue.popleft()

            if node == node_b:
                return distance

            for neighbor, _ in graph.get_neighbors(node):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, distance + 1))

        return float("inf")

    @staticmethod
    def diameter(graph: Graph):
        if Tugas2().components_count(graph) > 1:
            print(
                "Status graf tak terhubung. Mengembalikan nilai diameter dari komponen yang saling terhubung"
            )

        diameter = 0
        vertices = graph.get_vertices()

        for start_node in vertices:
            visited = {start_node}
            queue = deque([(start_node, 0)])
            max_dist = 0

            while queue:
                curr, dist = queue.popleft()
                if dist > max_dist:
                    max_dist = dist
                for neighbor, _ in graph.get_neighbors(curr):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, dist + 1))
            if max_dist > diameter:
                diameter = max_dist

        return diameter

    @staticmethod
    def girth(graph: Graph):
        is_directed = isinstance(graph, DirectedGraph)
        shortest_cycle = float("inf")
        vertices = graph.get_vertices()

        for start_node in vertices:
            distance = {v: float("inf") for v in vertices}
            parent = {v: None for v in vertices}

            distance[start_node] = 0
            q = deque([start_node])

            while q:
                curr = q.popleft()
                for neighbor, _ in graph.get_neighbors(curr):
                    if distance[neighbor] == float("inf"):
                        distance[neighbor] = 1 + distance[curr]
                        if not is_directed:
                            parent[neighbor] = curr
                        q.append(neighbor)
                    else:
                        if is_directed:
                            if neighbor == start_node:
                                cycle_len = distance[curr] + 1
                                shortest_cycle = min(shortest_cycle, cycle_len)
                        else:
                            if parent[curr] != neighbor:
                                cycle_len = distance[curr] + distance[neighbor] + 1
                                shortest_cycle = min(shortest_cycle, cycle_len)

        return shortest_cycle if shortest_cycle != float("inf") else -1

    @staticmethod
    def has_cycle(graph: Graph):
        is_directed = isinstance(graph, DirectedGraph)
        vertices = graph.get_vertices()

        if is_directed:
            state = {
                v: 0 for v in vertices
            }  # 0 = unvisited, 1 =  visiting, 2 = visited

            def dfs(node):
                if state[node] == 1:
                    return True
                if state[node] == 2:
                    return False

                state[node] = 1
                for neighbor, _ in graph.get_neighbors(node):
                    if dfs(neighbor):
                        return True

                state[node] = 2
                return False

            for start_node in vertices:
                if state[start_node] == 0:
                    if dfs(start_node):
                        return True
            return False

        else:
            global_visited = set()

            for start_node in vertices:
                if start_node in global_visited:
                    continue

                distance = {start_node: 0}
                parent = {start_node: None}
                q = deque([start_node])
                global_visited.add(start_node)

                while q:
                    curr = q.popleft()
                    for neighbor, _ in graph.get_neighbors(curr):
                        if neighbor not in distance:
                            distance[neighbor] = 1 + distance[curr]
                            parent[neighbor] = curr
                            global_visited.add(neighbor)
                            q.append(neighbor)
                        elif parent[curr] != neighbor:
                            return True
            return False
