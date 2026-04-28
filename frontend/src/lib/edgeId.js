export function edgeId(from, to, directed) {
  return directed ? `${from}->${to}` : [from, to].sort().join('--');
}