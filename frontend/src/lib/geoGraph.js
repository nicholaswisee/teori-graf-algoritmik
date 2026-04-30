export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function buildGeoGraph(nodes, maxDistKm, canvasWidth, canvasHeight, normalize = true) {
  const padding = 60;

  const lats = nodes.map((n) => n.lat);
  const lons = nodes.map((n) => n.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latRange = maxLat - minLat || 1;
  const lonRange = maxLon - minLon || 1;

  const usableW = canvasWidth - padding * 2;
  const usableH = canvasHeight - padding * 2;

  const scaleX = usableW / lonRange;
  const scaleY = usableH / latRange;
  const scale = Math.min(scaleX, scaleY);

  const projW = lonRange * scale;
  const projH = latRange * scale;
  const offsetX = padding + (usableW - projW) / 2;
  const offsetY = padding + (usableH - projH) / 2;

  const vertices = {};
  for (const n of nodes) {
    const x = offsetX + (n.lon - minLon) * scale;
    const y = offsetY + (maxLat - n.lat) * scale;
    vertices[n.id] = { x, y };
  }

  const edges = [];
  const distances = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = haversine(nodes[i].lat, nodes[i].lon, nodes[j].lat, nodes[j].lon);
      if (dist <= maxDistKm) {
        edges.push({ from: nodes[i].id, to: nodes[j].id, weight: dist });
        distances.push(dist);
      }
    }
  }

  if (edges.length === 0) {
    return null;
  }

  if (normalize) {
    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);
    const range = maxDist - minDist || 1;
    for (const e of edges) {
      e.weight = Math.round(100 * (e.weight - minDist) / range);
    }
  } else {
    for (const e of edges) {
      e.weight = Math.round(e.weight * 10) / 10;
    }
  }

  return { vertices, edges };
}
