import { useCallback } from 'react';
import { useGraphStore } from '../store/graphStore';
import { edgeId } from '../lib/edgeId';

function _stopAnimation() {
  useGraphStore.getState().setAnimation({ isPlaying: false });
}

function _stopFrameAnimation() {
  useGraphStore.getState().setAnimation({ isPlayingFrames: false });
}

export function useAnimation() {
  const startStepAnimation = useCallback((steps) => {
    _stopAnimation();
    const setAnimation = useGraphStore.getState().setAnimation;
    setAnimation({ steps, stepIndex: 0, isPlaying: false, pulseNode: null });
  }, []);

  const playSteps = useCallback(() => {
    const { animation, setAnimation } = useGraphStore.getState();
    if (animation.steps.length === 0) return;
    setAnimation({ isPlaying: true });
  }, []);

  const stepForward = useCallback(() => {
    const { animation, setAnimation } = useGraphStore.getState();
    if (animation.stepIndex < animation.steps.length) {
      const newIndex = animation.stepIndex + 1;
      setAnimation({
        stepIndex: newIndex,
        pulseNode: animation.steps[newIndex - 1] || null,
      });
    }
  }, []);

  const stepBack = useCallback(() => {
    const { animation, setAnimation } = useGraphStore.getState();
    if (animation.stepIndex > 0) {
      const newIndex = animation.stepIndex - 1;
      setAnimation({
        stepIndex: newIndex,
        pulseNode: animation.steps[newIndex - 1] || null,
      });
    }
  }, []);

  const startFrameAnimation = useCallback((frames) => {
    _stopFrameAnimation();
    const setAnimation = useGraphStore.getState().setAnimation;
    setAnimation({ frames, frameIndex: 0, isPlayingFrames: false });
  }, []);

  const playFrames = useCallback(() => {
    const { animation, setAnimation } = useGraphStore.getState();
    if (animation.frames.length === 0) return;
    setAnimation({ isPlayingFrames: true, frameIndex: 0 });
  }, []);

  const frameStepForward = useCallback(() => {
    const { animation, setAnimation } = useGraphStore.getState();
    const directed = useGraphStore.getState().directed;
    if (animation.frameIndex < animation.frames.length) {
      const newIndex = animation.frameIndex + 1;
      const frame = animation.frames[newIndex - 1];
      const updates = {
        frameIndex: newIndex,
        pulseNode: frame?.node ?? null,
        activePathEdge: frame?.edge ? edgeId(frame.edge[0], frame.edge[1], directed) : null,
      };
      if (frame?.path_edges) {
        updates.pathEdges = new Set(frame.path_edges.flatMap(([u, v]) => [edgeId(u, v, directed), edgeId(v, u, directed)]));
      }
      if (frame?.cut_edges) {
        updates.cutEdges = new Set(frame.cut_edges.flatMap(([u, v]) => [edgeId(u, v, directed), edgeId(v, u, directed)]));
      }
      if (frame?.swap_edges) {
        updates.swapEdges = new Set(frame.swap_edges.flatMap(([u, v]) => [edgeId(u, v, directed), edgeId(v, u, directed)]));
      }
      setAnimation(updates);
    }
  }, []);

  const frameStepBack = useCallback(() => {
    const { animation, setAnimation } = useGraphStore.getState();
    const directed = useGraphStore.getState().directed;
    if (animation.frameIndex > 0) {
      const newIndex = animation.frameIndex - 1;
      if (newIndex === 0) {
        setAnimation({ frameIndex: 0, pulseNode: null, activePathEdge: null, cutEdges: new Set(), swapEdges: new Set(), pathEdges: animation.finalPathEdges || animation.pathEdges || new Set() });
      } else {
        const frame = animation.frames[newIndex - 1];
        setAnimation({
          frameIndex: newIndex,
          pulseNode: frame?.node ?? null,
          activePathEdge: frame?.edge ? edgeId(frame.edge[0], frame.edge[1], directed) : null,
        });
      }
    }
  }, []);

  const stopAnimation = useCallback(() => {
    _stopAnimation();
  }, []);

  const stopFrameAnimation = useCallback(() => {
    _stopFrameAnimation();
  }, []);

  return {
    startStepAnimation,
    playSteps,
    stepForward,
    stepBack,
    startFrameAnimation,
    playFrames,
    frameStepForward,
    frameStepBack,
    stopAnimation,
    stopFrameAnimation,
  };
}