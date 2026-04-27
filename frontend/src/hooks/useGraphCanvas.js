import { useEffect } from 'react';
import { useGraphStore } from '../store/graphStore';

export function useGraphCanvas(cyRef) {
  const addVertex = useGraphStore((s) => s.addVertex);
  const removeVertex = useGraphStore((s) => s.removeVertex);
  const addEdge = useGraphStore((s) => s.addEdge);
  const setShiftFirst = useGraphStore((s) => s.setShiftFirst);
  const directed = useGraphStore((s) => s.directed);
  const updateVertexPosition = useGraphStore((s) => s.updateVertexPosition);
  const mode = useGraphStore((s) => s.mode);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const handleBackgroundClick = (e) => {
      if (e.target !== cy) return;
      if (mode !== 'setup') return;
      const pos = e.position;
      const vertices = useGraphStore.getState().vertices;
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let label;
      for (const l of letters) {
        if (!(l in vertices)) { label = l; break; }
      }
      if (!label) label = String(Object.keys(vertices).length);
      addVertex(label, pos.x, pos.y);
    };

    const handleNodeClick = (e) => {
      const node = e.target;
      const label = node.id();
      if (e.originalEvent?.shiftKey) {
        const state = useGraphStore.getState();
        if (!state.shiftFirst) {
          setShiftFirst(label);
          node.addClass('shift-selected');
        } else if (state.shiftFirst !== label) {
          addEdge(state.shiftFirst, label, 1);
          if (!directed) addEdge(label, state.shiftFirst, 1);
          setShiftFirst(null);
          cy.nodes().removeClass('shift-selected');
        }
      } else if (useGraphStore.getState().shiftFirst) {
        const state = useGraphStore.getState();
        if (state.shiftFirst !== label) {
          addEdge(state.shiftFirst, label, 1);
          if (!directed) addEdge(label, state.shiftFirst, 1);
        }
        setShiftFirst(null);
        cy.nodes().removeClass('shift-selected');
      }
    };

    const handleNodeCxtTap = (e) => {
      const label = e.target.id();
      removeVertex(label);
    };

    const handleDragFree = (e) => {
      const node = e.target;
      const label = node.id();
      const pos = node.position();
      updateVertexPosition(label, pos.x, pos.y);
    };

    cy.on('tap', handleBackgroundClick);
    cy.on('tap', 'node', handleNodeClick);
    cy.on('cxttap', 'node', handleNodeCxtTap);
    cy.on('dragfree', 'node', handleDragFree);

    return () => {
      cy.off('tap', handleBackgroundClick);
      cy.off('tap', 'node', handleNodeClick);
      cy.off('cxttap', 'node', handleNodeCxtTap);
      cy.off('dragfree', 'node', handleDragFree);
    };
  }, [cyRef, addVertex, removeVertex, addEdge, setShiftFirst, directed, updateVertexPosition, mode]);
}