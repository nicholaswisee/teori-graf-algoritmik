import { useEffect, useRef, useCallback, useMemo } from 'react';
import Cytoscape from 'react-cytoscapejs';
import { useGraphStore } from '../store/graphStore';
import { useGraphCanvas } from '../hooks/useGraphCanvas';
import { cytoscapeStylesheet } from '../lib/cytoscapeConfig';
import { COMP_COLORS, MODE_HINTS } from '../lib/constants';
import { edgeId } from '../lib/edgeId';

export default function GraphCanvas() {
  const cyRef = useRef(null);
  const cyInitRef = useRef(false);
  const vertices = useGraphStore((s) => s.vertices);
  const edges = useGraphStore((s) => s.edges);
  const directed = useGraphStore((s) => s.directed);
  const animation = useGraphStore((s) => s.animation);
  const mode = useGraphStore((s) => s.mode);

  useGraphCanvas(cyRef);

  const elements = useMemo(() => {
    const nodes = Object.entries(vertices).map(([label, pos]) => ({
      data: { id: label, label },
      position: { x: pos.x, y: pos.y },
    }));

    const seen = new Set();
    const edgeElements = [];
    for (const e of edges) {
      const key = edgeId(e.from, e.to, directed);
      if (seen.has(key)) continue;
      seen.add(key);
      edgeElements.push({
        data: {
          id: key,
          source: e.from,
          target: e.to,
          weightLabel: e.weight > 1 ? String(e.weight) : '',
        },
      });
    }

    return [...nodes, ...edgeElements];
  }, [vertices, edges, directed]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass('highlighted path pulse shift-selected comp-0 comp-1 comp-2 comp-3 comp-4 comp-5 comp-6 comp-7 comp-8 comp-9');
    cy.edges().removeClass('path-edge active-edge cut-edge swap-edge directed');

    if (directed) {
      cy.edges().addClass('directed');
    }

    if (animation.steps.length > 0) {
      for (let i = 0; i < animation.stepIndex; i++) {
        const label = animation.steps[i];
        const node = cy.getElementById(label);
        if (node.length) node.addClass('highlighted');
      }
    }

    if (animation.pulseNode) {
      const node = cy.getElementById(animation.pulseNode);
      if (node.length) node.addClass('pulse');
    }

    if (animation.pathNodes.length > 0) {
      for (const label of animation.pathNodes) {
        const node = cy.getElementById(label);
        if (node.length) node.addClass('path');
      }
    }

    if (Object.keys(animation.componentMap).length > 0) {
      for (const [label, ci] of Object.entries(animation.componentMap)) {
        const node = cy.getElementById(label);
        if (node.length) node.addClass(`comp-${ci % COMP_COLORS.length}`);
      }
    }

    if (animation.pathEdges.size > 0) {
      for (const edgeKey of animation.pathEdges) {
        const edge = cy.getElementById(edgeKey);
        if (edge.length) edge.addClass('path-edge');
      }
    }

    if (animation.activePathEdge) {
      const edge = cy.getElementById(animation.activePathEdge);
      if (edge.length) edge.addClass('active-edge');
    }

    if (animation.cutEdges.size > 0) {
      for (const edgeKey of animation.cutEdges) {
        const edge = cy.getElementById(edgeKey);
        if (edge.length) edge.addClass('cut-edge');
      }
    }

    if (animation.swapEdges.size > 0) {
      for (const edgeKey of animation.swapEdges) {
        const edge = cy.getElementById(edgeKey);
        if (edge.length) edge.addClass('swap-edge');
      }
    }
  }, [elements, animation, directed]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (cy.nodes().length > 0) {
      cy.fit(undefined, 50);
    }
  }, [elements]);

  const cyCallback = useCallback((cy) => {
    cyRef.current = cy;
    if (!cyInitRef.current) {
      cyInitRef.current = true;
    }
  }, []);

  if (mode === 'islands') return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Cytoscape
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={cytoscapeStylesheet}
        layout={{ name: 'preset' }}
        cy={cyCallback}
      />
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.85)',
        padding: '6px 16px',
        borderRadius: 8,
        fontSize: 12,
        color: '#64748b',
        pointerEvents: 'none',
        fontFamily: 'Inter, sans-serif',
      }}>
        {MODE_HINTS[mode] || ''}
      </div>
    </div>
  );
}