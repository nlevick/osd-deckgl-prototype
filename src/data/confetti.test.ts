import { describe, expect, it } from 'vitest';
import { generateConfetti } from './confetti';

describe('T7 · seeded confetti', () => {
  const seed = 37;
  const width = 7026;
  const height = 9221;

  it('reproduces geometry and preserves unique IDs across counts', () => {
    const initial = generateConfetti(seed, 100, width, height);
    const larger = generateConfetti(seed, 250, width, height);
    const ids = larger.map(({ id }) => id);

    expect(initial).toHaveLength(100);
    expect(larger).toHaveLength(250);
    expect(generateConfetti(seed, 100, width, height)).toEqual(initial);
    expect(ids.slice(0, initial.length)).toEqual(initial.map(({ id }) => id));
    expect(new Set(ids).size).toBe(larger.length);
  });

  it('builds open paths with one to five finite, bounded XY segments', () => {
    for (const { positions } of generateConfetti(seed, 250, width, height)) {
      const segments = positions.length / 2 - 1;
      expect(Number.isInteger(segments) && segments >= 1 && segments <= 5).toBe(true);
      expect(positions.slice(-2)).not.toEqual(positions.slice(0, 2));
      expect(positions.every((value, index) =>
        Number.isFinite(value) && value >= 0 && value <= (index % 2 === 0 ? width : height),
      )).toBe(true);
    }
  });
});
