export const pathCounts = [10_000, 50_000, 200_000] as const;
type PathCount = (typeof pathCounts)[number];

type ViewerState = Readonly<{
  seed: number;
  count: PathCount;
  overlayVisible: boolean;
}>;

export let viewerState: ViewerState = {
  seed: 37,
  count: 10_000,
  overlayVisible: true,
};

export function setPathCount(count: PathCount) {
  viewerState = { ...viewerState, count };
}

export function setOverlayVisible(overlayVisible: boolean) {
  viewerState = { ...viewerState, overlayVisible };
}
