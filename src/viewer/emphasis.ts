import type { createConfettiLayer } from '../layers/confettiLayer';
import type { ConfettiPath } from '../data/confetti';

export function createEmphasisLayers(
  base: ReturnType<typeof createConfettiLayer>,
  hovered: ConfettiPath | undefined,
  selected: ConfettiPath | undefined,
) {
  const layers: typeof base[] = [];
  if (hovered && hovered.id !== selected?.id) {
    layers.push(base.clone({
      id: 'hovered-path', data: [hovered], getWidth: 3, pickable: false,
    }));
  }
  if (selected) {
    layers.push(base.clone({
      id: 'selected-path', data: [selected], getWidth: 4, opacity: 1, pickable: false,
    }));
  }
  return layers;
}
