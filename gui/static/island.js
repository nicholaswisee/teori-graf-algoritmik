// Island grid state
let gridData = [];

function initIslands() {
  const rows = parseInt(document.getElementById('grid-rows').value);
  const cols = parseInt(document.getElementById('grid-cols').value);
  buildGrid(rows, cols, []);
}

function rebuildGrid() {
  const rows = parseInt(document.getElementById('grid-rows').value);
  const cols = parseInt(document.getElementById('grid-cols').value);
  buildGrid(rows, cols, gridData);
}

function buildGrid(rows, cols, prevData) {
  gridData = [];
  for (let r = 0; r < rows; r++) {
    gridData.push([]);
    for (let c = 0; c < cols; c++) {
      const prev = prevData[r] && prevData[r][c] !== undefined ? prevData[r][c] : 'W';
      gridData[r].push(prev);
    }
  }
  renderGrid(null);
}

function renderGrid(islandCells) {
  // islandCells: array of arrays of [r,c] per island, or null for default render
  const container = document.getElementById('island-grid-container');
  container.innerHTML = '';

  // colour map: islandIdx → hex colour
  const ISLAND_COLS = [
    '#7c6af7','#60a5fa','#f87171','#34d399','#fbbf24',
    '#a78bfa','#fb923c','#e879f9','#38bdf8','#4ade80',
  ];

  // Build lookup: (r,c) → island index
  const colourMap = {};
  if (islandCells) {
    islandCells.forEach((cells, idx) => {
      cells.forEach(([r, c]) => {
        colourMap[`${r},${c}`] = idx;
      });
    });
  }

  for (let r = 0; r < gridData.length; r++) {
    const row = document.createElement('div');
    row.className = 'grid-row';
    for (let c = 0; c < gridData[r].length; c++) {
      const cell = document.createElement('div');
      const islandIdx = colourMap[`${r},${c}`];
      if (islandIdx !== undefined) {
        const col = ISLAND_COLS[islandIdx % ISLAND_COLS.length];
        cell.className = 'grid-cell island-colored';
        cell.style.background = col + 'cc';
        cell.style.borderColor = col;
        cell.style.color = '#fff';
        cell.textContent = 'L';
      } else if (gridData[r][c] === 'L') {
        cell.className = 'grid-cell land';
        cell.textContent = 'L';
      } else {
        cell.className = 'grid-cell water';
        cell.textContent = 'W';
      }
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.addEventListener('click', toggleCell);
      row.appendChild(cell);
    }
    container.appendChild(row);
  }
}

function toggleCell(e) {
  const r = parseInt(e.currentTarget.dataset.r);
  const c = parseInt(e.currentTarget.dataset.c);
  gridData[r][c] = gridData[r][c] === 'W' ? 'L' : 'W';
  renderGrid(null);  // reset colours when editing
  document.getElementById('islands-result').classList.add('hidden');
}

async function runIslands() {
  try {
    const res = await fetch('/api/islands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: gridData }),
    });
    const data = await res.json();
    document.getElementById('island-count').textContent = data.count;
    document.getElementById('islands-result').classList.remove('hidden');
    renderGrid(data.islands);
  } catch(err) { alert('Error: ' + err.message); }
}

function resetGrid() {
  const rows = parseInt(document.getElementById('grid-rows').value);
  const cols = parseInt(document.getElementById('grid-cols').value);
  buildGrid(rows, cols, []);
  document.getElementById('islands-result').classList.add('hidden');
}

// Load a sample grid for demo
function loadSampleGrid() {
  gridData = [
    ['W','L','W','W','W'],
    ['W','L','W','W','W'],
    ['W','W','W','L','W'],
    ['W','W','L','L','W'],
    ['L','W','W','L','L'],
    ['L','L','W','W','W'],
  ];
  document.getElementById('grid-rows').value = 6;
  document.getElementById('grid-cols').value = 5;
  renderGrid(null);
  document.getElementById('islands-result').classList.add('hidden');
}
