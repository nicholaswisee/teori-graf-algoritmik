from src.graph import Graph


def main():
    print("=== Teori Graf Algoritmik ===")

    # 1. Menginisialisasi graph tak berarah (undirected graph)
    g = Graph(directed=False)

    # 2. Menambahkan beberapa sisi (simpul akan ditambahkan secara otomatis)
    print("\nMenambahkan sisi untuk membuat graph sederhana...")
    g.add_edge("A", "B")
    g.add_edge("A", "C")
    g.add_edge("B", "D")
    g.add_edge("C", "D")
    g.add_edge("D", "E")

    # 3. Mencetak struktur graph
    print("Daftar Ketetanggaan (Adjacency List) Graph:")
    print(g)


if __name__ == "__main__":
    main()
