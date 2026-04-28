# Teori Graf Algoritmik

Proyek ini disusun untuk kelas **Teori Graf Algoritmik** Anda. Proyek ini menyediakan implementasi dasar dari struktur data Graph, yang dirancang agar dapat diperluas untuk algoritma yang lebih kompleks nantinya.

## Struktur Proyek

```text
.
├── main.py                # Skrip utama untuk menguji dan menjalankan kode graph Anda
├── run_gui.py             # Entry point untuk menjalankan Flask GUI server
├── src/                   # Folder kode sumber
│   ├── graph.py           # Struktur data kelas DirectedGraph & UndirectedGraph (Adjacency List)
│   └── algorithms/        # Folder algoritma (tugas1-5)
├── gui/                   # Flask backend (API blueprints)
│   ├── app.py             # App factory + blueprint registration
│   └── api/routes/        # API endpoints per tugas
└── frontend/              # Vite + React + Cytoscape.js frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── store/         # Zustand state management
    │   ├── hooks/         # Custom React hooks
    │   ├── lib/           # Cytoscape config, presets, API client
    │   └── api/           # API client
    └── vite.config.js
```

## Getting Started

### Prasyarat

- [Python 3](https://www.python.org/downloads/) dan [uv](https://docs.astral.sh/uv/)
- [Bun](https://bun.sh/)

### Setup dengan uv

```bash
uv venv
source .venv/bin/activate   # Linux/macOS
# or
.venv\Scripts\activate      # Windows

uv pip install -r requirements.txt
```

### Setup Frontend

```bash
cd frontend
bun install
```

### Running Backend (Flask)

```bash
# Aktifkan venv terlebih dahulu
source .venv/bin/activate
python run_gui.py
```

Server berjalan di `http://localhost:5000`

### Running Frontend (Development)

```bash
cd frontend
bun run dev
```

Vite dev server berjalan di `http://localhost:5173` dan mem-proxy `/api` ke Flask.

### Production Build

```bash
cd frontend
bun run build
```

Flask akan menyajikan `frontend/dist/` sebagai static files di production. Cukup jalankan `python run_gui.py` dan buka `http://localhost:5000`.

### Menjalankan Kode CLI

Untuk menjalankan tes dasar yang disediakan di `main.py`:

```bash
python main.py
```
