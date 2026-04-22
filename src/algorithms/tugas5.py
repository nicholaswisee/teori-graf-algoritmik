import random

from src.graph import Graph

"""
TUGAS 5
Mengimplementasikan Algoritma Sederhana dalam Memecahkan TSP
"""


class Tugas5:
    @staticmethod
    def generate_complete_graph(num_nodes, weight_range=(1, 100)):
        """Menghasilkan graf lengkap (semua node saling terhubung) dengan bobot acak."""
        import networkx as nx

        G = nx.complete_graph(num_nodes)
        for u, v in G.edges():
            G.edges[u, v]["weight"] = random.randint(*weight_range)
        return G

    @staticmethod
    def plot_graph_step(G, tour, current_node, pos):
        """Fungsi pembantu untuk memvisualisasikan pergerakan TSP langkah demi langkah."""
        import matplotlib.pyplot as plt
        import networkx as nx

        plt.clf()  # Bersihkan frame sebelumnya
        nx.draw(G, pos, with_labels=True, node_color="lightblue", node_size=500)

        # Gambar rute yang sudah dilewati sejauh ini dengan warna merah
        path_edges = list(zip(tour, tour[1:]))
        nx.draw_networkx_edges(G, pos, edgelist=path_edges, edge_color="red", width=2)

        # Tandai posisi node saat ini dengan warna hijau
        nx.draw_networkx_nodes(
            G, pos, nodelist=[current_node], node_color="green", node_size=500
        )

        # Tampilkan label bobot pada setiap edge
        edge_labels = nx.get_edge_attributes(G, name="weight")
        nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels)

        plt.pause(0.5)  # Jeda setengah detik untuk efek animasi

    @staticmethod
    def nearest_neighbor_tsp_trace(graph: Graph, start_node=None):
        vertices = graph.get_vertices()
        if not vertices:
            return [], 0, [], [], []

        if start_node is None or start_node not in vertices:
            start_node = list(vertices)[0]

        unvisited = set(vertices)
        unvisited.remove(start_node)

        tour = [start_node]
        current_node = start_node

        steps = [f"Mulai dari {start_node}."]
        frames = [{"node": start_node, "text": f"Mulai dari {start_node}"}]
        selected_edges = []
        total_weight = 0

        while unvisited:
            next_node = None
            min_weight = float("inf")

            for neighbor, weight in graph.get_neighbors(current_node):
                if neighbor in unvisited and weight < min_weight:
                    min_weight = weight
                    next_node = neighbor

            if next_node is None:
                steps.append(f"Jalan buntu di simpul {current_node}.")
                break

            unvisited.remove(next_node)
            tour.append(next_node)
            total_weight += min_weight

            selected_edges.append(
                {"from": current_node, "to": next_node, "weight": min_weight}
            )
            steps.append(
                f"Kunjungi {next_node} dari {current_node} dengan bobot {min_weight}."
            )
            frames.append(
                {
                    "node": next_node,
                    "edge": [current_node, next_node],
                    "text": f"Kunjungi {next_node} (bobot {min_weight})",
                }
            )

            current_node = next_node

        return_weight = None
        for neighbor, weight in graph.get_neighbors(current_node):
            if neighbor == start_node:
                return_weight = weight
                break

        if return_weight is not None:
            tour.append(start_node)
            total_weight += return_weight
            selected_edges.append(
                {"from": current_node, "to": start_node, "weight": return_weight}
            )
            steps.append(
                f"Kembali ke simpul awal {start_node} dengan bobot {return_weight}."
            )
            frames.append(
                {
                    "node": start_node,
                    "edge": [current_node, start_node],
                    "text": f"Kembali ke {start_node} (bobot {return_weight})",
                }
            )
        else:
            steps.append(f"Tidak dapat kembali ke simpul awal {start_node}.")

        if unvisited:
            steps.append(
                f"GAGAL: Algoritma Greedy terjebak! Simpul yang gagal dikunjungi: {', '.join(unvisited)}."
            )

        steps.append(f"Total bobot TSP: {total_weight}.")
        return tour, total_weight, selected_edges, steps, frames

    @staticmethod
    def calculate_tour_cost(G, tour):
        """Menghitung total bobot dari rute (tour) yang diberikan."""
        return sum(G[tour[i]][tour[i + 1]]["weight"] for i in range(len(tour) - 1))

    @staticmethod
    def nearest_neighbor_tsp(G, start_node=None):
        """Implementasi Algoritma Nearest Neighbor untuk TSP."""
        import matplotlib.pyplot as plt
        import networkx as nx

        if start_node is None:
            start_node = random.choice(list(G.nodes))

        pos = nx.spring_layout(G)
        plt.ion()  # Mode interaktif on untuk animasi
        plt.show()

        unvisited = set(G.nodes)
        unvisited.remove(start_node)

        tour = [start_node]
        current_node = start_node

        Tugas5.plot_graph_step(G, tour, current_node, pos)

        # Looping mencari tetangga terdekat yang belum dikunjungi
        while unvisited:
            # Cari node berikutnya dengan bobot paling kecil dari node saat ini
            next_node = min(unvisited, key=lambda node: G[current_node][node]["weight"])

            unvisited.remove(next_node)
            tour.append(next_node)
            current_node = next_node

            Tugas5.plot_graph_step(G, tour, current_node, pos)

        # Kembali ke kota awal untuk menyelesaikan siklus TSP
        tour.append(start_node)
        Tugas5.plot_graph_step(G, tour, current_node, pos)

        # Cetak hasil dari Nearest Neighbor
        print("Tour (Nearest Neighbor):", tour)
        tour_cost = Tugas5.calculate_tour_cost(G, tour)
        print(f"Construction Heuristic Tour Cost: {tour_cost}")

        plt.ioff()  # Matikan mode interaktif
        plt.show()  # Tampilkan hasil akhir

        return tour


if __name__ == "__main__":
    from networkx.algorithms.approximation import traveling_salesman_problem

    # Buat graf komplit dengan 5 node (kota)
    G = Tugas5.generate_complete_graph(5)

    print("=== Perbandingan TSP ===")

    # 1. Menggunakan algoritma bawaan dari library networkx (sebagai pembanding optimal)
    approx_tour = traveling_salesman_problem(G, cycle=True)
    approx_tour_cost = Tugas5.calculate_tour_cost(G, approx_tour)

    print("Tour (NetworkX Approximation):", approx_tour)
    print("Cost (NetworkX Approximation):", approx_tour_cost)
    print("-" * 25)

    # 2. Menggunakan algoritma Nearest Neighbor buatan sendiri
    Tugas5.nearest_neighbor_tsp(G, start_node=0)
