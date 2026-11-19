import { describe, expect, it } from 'vitest';
import { setOverlayVisible, setPathCount, setSelectedId, viewerState } from './state';

describe('selection when changing overlay settings', () => {
  it('clears a selected ID even when it exists at the new path count', () => {
    setPathCount(10_000);
    setSelectedId('37:1');

    setPathCount(50_000);

    expect(viewerState.count).toBe(50_000);
    expect(viewerState.selectedId).toBeNull();
  });

  it.each([false, true])('clears selection when overlay visibility changes to %s', (visible) => {
    setOverlayVisible(!visible);
    setSelectedId('37:1');

    setOverlayVisible(visible);

    expect(viewerState.overlayVisible).toBe(visible);
    expect(viewerState.selectedId).toBeNull();
  });
});
