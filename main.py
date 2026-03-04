from src.algorithms.tugas1 import Tugas1
from src.algorithms.tugas2 import Tugas2
from src.graph import UndirectedGraph

"""
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
"""


def main():
    g1 = UndirectedGraph()

    for titik in ["A", "B", "C"]:
        g1.add_vertex(titik)

    g1.add_edge("A", "B")
    g1.add_edge("B", "C")
    g1.add_edge("C", "A")

    tugas1 = Tugas1()
    tugas2 = Tugas2()
    status1 = tugas1.is_connected(g1)
    jumlah_pulau1 = tugas2.components_count(g1)

    print(f"Apakah terhubung? : {status1}")
    print(f"Jumlah komponen   : {jumlah_pulau1}")
    print("\n")

    g2 = UndirectedGraph()

    for titik in ["A", "B", "C", "D"]:
        g2.add_vertex(titik)

    g2.add_edge("A", "B")  # Pulau 1
    g2.add_edge("C", "D")  # Pulau 2

    status2 = tugas1.is_connected(g2)
    jumlah_pulau2 = tugas2.components_count(g2)

    print(f"Apakah terhubung? : {status2}")
    print(f"Jumlah komponen   : {jumlah_pulau2}")
    print("\n")

    print(tugas2.largest_component(g1))
    print(tugas2.largest_component(g2))

    grid1 = [
        ["W", "L", "W", "W", "W"],
        ["W", "L", "W", "W", "W"],
        ["W", "W", "W", "L", "W"],
        ["W", "W", "L", "L", "W"],
        ["L", "W", "W", "L", "L"],
        ["L", "L", "W", "W", "W"],
    ]

    print(tugas2.island_count(grid1))


if __name__ == "__main__":
    main()
