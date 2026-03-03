from src.algorithms.tugas1 import Tugas1
from src.graph import UndirectedGraph


def main():
    g = UndirectedGraph()

    g.add_edge("A", "B")
    g.add_edge("A", "C")
    g.add_edge("B", "D")
    g.add_edge("C", "D")
    g.add_edge("D", "E")

    print("Daftar Ketetanggaan (Adjacency List) Graph:")
    print(g)

    print(g.bfs("A"))
    print(g.dfs("A"))

    print("\n[Tugas 1] Menguji Algoritma Graph...")
    tugas = Tugas1()

    path = tugas.find_path_bfs(g, "A", "D")
    print(f"Jalur dari A ke E: {' -> '.join(path) if path else 'Tidak ditemukan'}")
    print(path)

    terhubung = tugas.is_connected(g)
    print(
        f"Apakah graph terhubung secara keseluruhan? {'Ya' if terhubung else 'Tidak'}"
    )

    g.add_vertex("F")
    g.add_edge("E", "F")
    terhubung_sekarang = tugas.is_connected(g)
    print(
        f"Apakah graph terhubung setelah menambahkan node F terisolasi? {'Ya' if terhubung_sekarang else 'Tidak'}"
    )


if __name__ == "__main__":
    main()
