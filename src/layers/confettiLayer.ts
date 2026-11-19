import { PathLayer } from '@deck.gl/layers';
import type { ConfettiPath } from '../data/confetti';

export function createConfettiLayer(data: ConfettiPath[]) {
  return new PathLayer<ConfettiPath>({
    id: 'confetti',
    data,
    positionFormat: 'XY',
    getPath: (path) => path.positions,
    getColor: (path) => path.color,
    getWidth: 1.25,
    widthUnits: 'pixels',
    opacity: 0.65,
  });
}
