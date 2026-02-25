from src.graph import UndirectedGraph, DirectedGraph
from src.algorithms.tugas1 import Tugas1


def main():
    print("=== Teori Graf Algoritmik ===")

    # 1. Menginisialisasi graph tak berarah (undirected graph)
    g = UndirectedGraph()

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

    # 4. Uji coba metode-metode Tugas 1
    print("\n[Tugas 1] Menguji Algoritma Graph...")
    tugas = Tugas1()
    
    # Path finding
    path = tugas.find_path(g, "A", "E")
    print(f"Jalur dari A ke E: {' -> '.join(path) if path else 'Tidak ditemukan'}")

    # Connectivity Check
    terhubung = tugas.is_connected(g)
    print(f"Apakah graph terhubung secara keseluruhan? {'Ya' if terhubung else 'Tidak'}")
    
    # Menambahkan node terisolasi
    g.add_vertex("F")
    terhubung_sekarang = tugas.is_connected(g)
    print(f"Apakah graph terhubung setelah menambahkan node F terisolasi? {'Ya' if terhubung_sekarang else 'Tidak'}")


if __name__ == "__main__":
    main()
