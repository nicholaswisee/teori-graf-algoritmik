import { useEffect } from 'react';
import { useAnimation } from '../../hooks/useAnimation';
import { useGraphStore } from '../../store/graphStore';

export default function StepControls({ type = 'steps' }) {
  const animation = useGraphStore((s) => s.animation);
  const { stepForward, stepBack, playSteps, frameStepForward, frameStepBack, playFrames, stopFrameAnimation } = useAnimation();

  useEffect(() => {
    if (!animation.isPlayingFrames) return;
    if (animation.frameIndex >= animation.frames.length) {
      stopFrameAnimation();
      return;
    }
    const id = setInterval(() => {
      const state = useGraphStore.getState();
      if (state.animation.frameIndex >= state.animation.frames.length) {
        clearInterval(id);
        stopFrameAnimation();
        return;
      }
      frameStepForward();
    }, 800);
    return () => clearInterval(id);
  }, [animation.isPlayingFrames, animation.frameIndex, animation.frames.length, frameStepForward, stopFrameAnimation]);

  if (type === 'frames') {
    if (animation.frames.length === 0) return null;
    return (
      <div className="step-controls">
        <button className="btn-ghost small" onClick={frameStepBack}>◀ Step</button>
        <button className="btn-ghost small" onClick={playFrames}>Play</button>
        <button className="btn-ghost small" onClick={frameStepForward}>Step ▶</button>
        <span className="step-counter">{animation.frameIndex} / {animation.frames.length}</span>
      </div>
    );
  }

  if (animation.steps.length === 0) return null;
  return (
    <div className="step-controls">
      <button className="btn-ghost small" onClick={stepBack} disabled={animation.stepIndex === 0}>◀ Prev</button>
      <span className="step-counter">{animation.stepIndex} / {animation.steps.length}</span>
      <button className="btn-ghost small" onClick={stepForward} disabled={animation.stepIndex === animation.steps.length}>Next ▶</button>
      <button className="btn-ghost small" onClick={playSteps}>▶ Play</button>
    </div>
  );
}