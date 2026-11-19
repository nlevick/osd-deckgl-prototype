type Rgb = [number, number, number];

const palette: Rgb[] = [
  [255, 74, 119],
  [40, 231, 255],
  [255, 201, 51],
  [122, 104, 255],
  [70, 255, 150],
  [255, 133, 66],
];

export type ConfettiPath = {
  id: string;
  positions: number[];
  color: Rgb;
};

function reflect(value: number, limit: number) {
  if (value < 0) return -value;
  return value > limit ? 2 * limit - value : value;
}

export function generateConfetti(seed: number, count: number, width: number, height: number): ConfettiPath[] {
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
    return randomState / 2 ** 32;
  };
  const shortSide = Math.min(width, height);

  return Array.from({ length: count }, (_, index) => {
    let x = random() * width;
    let y = random() * height;
    const positions = [x, y];
    const segments = 1 + Math.floor(random() * 5);
    for (let segment = 0; segment < segments; segment++) {
      const angle = random() * 2 * Math.PI;
      const length = shortSide * (0.003 + random() * 0.008);
      x = reflect(x + Math.cos(angle) * length, width);
      y = reflect(y + Math.sin(angle) * length, height);
      positions.push(x, y);
    }
    return {
      id: `${seed}:${index}`,
      positions,
      color: palette[Math.floor(random() * palette.length)],
    };
  });
}
