import type { ConfettiPath } from './data/confetti';

export const pathCounts = [10_000, 50_000, 200_000] as const;
export type PathCount = (typeof pathCounts)[number];

export type OverlaySettings = Readonly<{
  count: PathCount;
  visible: boolean;
}>;

export class ViewerState {
  settings: OverlaySettings = { count: pathCounts[0], visible: true };
  hovered: ConfettiPath | null = null;
  selected: ConfettiPath | null = null;

  setSettings(settings: OverlaySettings) {
    if (settings.count === this.settings.count && settings.visible === this.settings.visible) return false;
    this.settings = settings;
    this.hovered = null;
    this.selected = null;
    return true;
  }
}
