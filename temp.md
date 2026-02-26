print("\n[Tugas 1] Menguji Algoritma Graph...")
tugas = Tugas1()

path = tugas.find_path(g, "A", "E")
print(f"Jalur dari A ke E: {' -> '.join(path) if path else 'Tidak ditemukan'}")

terhubung = tugas.is_connected(g)
print(
f"Apakah graph terhubung secara keseluruhan? {'Ya' if terhubung else 'Tidak'}"
)

g.add_vertex("F")
terhubung_sekarang = tugas.is_connected(g)
print(
f"Apakah graph terhubung setelah menambahkan node F terisolasi? {'Ya' if terhubung_sekarang else 'Tidak'}"
)
