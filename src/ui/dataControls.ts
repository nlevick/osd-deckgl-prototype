import { pathCounts, setOverlayVisible, setPathCount, viewerState } from '../state';

export function connectDataControls(controls: HTMLFieldSetElement, onChange: () => void) {
  const presets = controls.querySelector<HTMLSelectElement>('#path-count')!;
  const visibility = controls.querySelector<HTMLButtonElement>('#overlay-visible')!;

  for (const count of pathCounts) {
    presets.add(new Option(`${count / 1_000}k`, String(count)));
  }
  presets.value = String(viewerState.count);
  visibility.setAttribute('aria-pressed', String(viewerState.overlayVisible));

  presets.addEventListener('change', () => {
    const count = pathCounts.find((preset) => String(preset) === presets.value);
    if (count === undefined) return;
    setPathCount(count);
    onChange();
  });
  visibility.addEventListener('click', () => {
    setOverlayVisible(!viewerState.overlayVisible);
    visibility.setAttribute('aria-pressed', String(viewerState.overlayVisible));
    onChange();
  });
}
