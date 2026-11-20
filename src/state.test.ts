import { describe, expect, it } from 'vitest';
import type { ConfettiPath } from './data/confetti';
import { ViewerState } from './state';

const selectedPath: ConfettiPath = { id: '37:1', positions: [0, 0, 1, 1], color: [255, 0, 0] };

describe('interaction when changing overlay settings', () => {
  it('clears selection and hover even when the paths exist at the new count', () => {
    const state = new ViewerState();
    state.selected = selectedPath;
    state.hovered = { ...selectedPath, id: '37:2' };

    state.setSettings({ ...state.settings, count: 50_000 });

    expect(state.settings.count).toBe(50_000);
    expect(state.selected).toBeNull();
    expect(state.hovered).toBeNull();
  });

  it.each([false, true])('clears selection when overlay visibility changes to %s', (visible) => {
    const state = new ViewerState();
    state.setSettings({ ...state.settings, visible: !visible });
    state.selected = selectedPath;

    state.setSettings({ ...state.settings, visible });

    expect(state.settings.visible).toBe(visible);
    expect(state.selected).toBeNull();
  });
});
