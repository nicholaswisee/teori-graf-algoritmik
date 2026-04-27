import { useGraphStore } from '../store/graphStore';

export function useSelectOptions() {
  const vertices = useGraphStore((s) => s.vertices);
  return Object.keys(vertices).sort();
}