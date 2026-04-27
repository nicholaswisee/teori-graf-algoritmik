export function createGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill('W'));
}

export function toggleCell(grid, r, c) {
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = newGrid[r][c] === 'W' ? 'L' : 'W';
  return newGrid;
}

export function resetGrid(rows, cols) {
  return createGrid(rows, cols);
}