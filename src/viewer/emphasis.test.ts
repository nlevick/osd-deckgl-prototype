import { describe, expect, it } from 'vitest';
import { generateConfetti } from '../data/confetti';
import { createConfettiLayer } from '../layers/confettiLayer';
import { createEmphasisLayers } from './emphasis';

describe('T12 · independent path emphasis', () => {
  const data = generateConfetti(37, 2, 7026, 9221);
  const base = createConfettiLayer(data);
  const [selected, hovered] = data;

  it('draws one hovered path and one selected path with selection last', () => {
    const originalData = structuredClone(data);
    const layers = createEmphasisLayers(base, hovered, selected);

    expect(layers.map(layer => layer.props.data)).toEqual([[hovered], [selected]]);
    expect(layers.map(layer => layer.props.pickable)).toEqual([false, false]);
    expect(layers.at(-1)?.props.opacity).toBe(1);
    expect(base.props.data).toBe(data);
    expect(data).toEqual(originalData);
  });

  it('draws only selection when the same path is hovered', () => {
    const layers = createEmphasisLayers(base, selected, selected);
    expect(layers.map(layer => layer.props.data)).toEqual([[selected]]);
    expect(layers[0].props.opacity).toBe(1);
    expect(layers[0].props.pickable).toBe(false);
  });
});
