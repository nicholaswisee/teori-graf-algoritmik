# Teori Graf Algoritmik

Proyek ini disusun untuk kelas **Teori Graf Algoritmik** Anda. Proyek ini menyediakan implementasi dasar dari struktur data Graph, yang dirancang agar dapat diperluas untuk algoritma yang lebih kompleks nantinya.

## Struktur Proyek

```text
.
├── main.py                # Skrip utama untuk menguji dan menjalankan kode graph Anda
├── src/                   # Folder kode sumber
│   ├── graph.py           # Struktur data kelas Graph (Adjacency List)
│   └── algorithms/        # Folder untuk menyimpan algoritma spesifik di masa mendatang
│       └── __init__.py    # (misalnya shortest_path.py, mst.py, matching.py)
└── README.md              # Dokumentasi
```

## Getting Started

### Prasyarat

Install [Python 3](https://www.python.org/downloads/) terlebih dahulu.

- Untuk memeriksa apakah Python sudah terinstal, jalankan:
  ```bash
  python --version
  # atau
  python3 --version
  ```

### Menjalankan Kode

Untuk menjalankan tes dasar yang disediakan di `main.py`:

```bash
# Jalankan skrip entri utama
python main.py
# Jika perintah di atas tidak berfungsi, gunakan python3
python3 main.py
```

Ini akan menginisialisasi contoh graph dasar dan menampilkan strukturnya untuk membuktikan bahwa kodenya berfungsi.

## Menambahkan algoritma di masa mendatang

Ketika Anda ditugaskan algoritma baru (seperti lintasan terpendek / shortest path):

1. Buat file baru di folder `src/algorithms/` (misalnya, `dijkstra.py`).
2. Tulis sebuah fungsi yang menerima instance `Graph` sebagai argumen.
3. Impor fungsi tersebut ke dalam `main.py` untuk mengujinya.
