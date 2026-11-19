export const pathCounts = [10_000, 50_000, 200_000] as const;
type PathCount = (typeof pathCounts)[number];

type ViewerState = Readonly<{
  seed: number;
  count: PathCount;
  overlayVisible: boolean;
  hoveredId: string | null;
  selectedId: string | null;
}>;

export let viewerState: ViewerState = {
  seed: 37,
  count: 10_000,
  overlayVisible: true,
  hoveredId: null,
  selectedId: null,
};

export function setPathCount(count: PathCount) {
  if (count === viewerState.count) return false;
  viewerState = { ...viewerState, count, selectedId: null };
  return true;
}

export function setOverlayVisible(overlayVisible: boolean) {
  if (overlayVisible === viewerState.overlayVisible) return false;
  viewerState = { ...viewerState, overlayVisible, selectedId: null };
  return true;
}

export function setHoveredId(hoveredId: string | null) {
  if (hoveredId === viewerState.hoveredId) return false;
  viewerState = { ...viewerState, hoveredId };
  return true;
}

export function setSelectedId(selectedId: string | null) {
  if (selectedId === viewerState.selectedId) return false;
  viewerState = { ...viewerState, selectedId };
  return true;
}
