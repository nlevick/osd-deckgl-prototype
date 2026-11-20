import { pathCounts, type OverlaySettings, type PathCount } from '../state';

export function connectDataControls(
  controls: HTMLFieldSetElement,
  settings: OverlaySettings,
  onCountChange: (count: PathCount) => void,
  onToggleVisibility: () => boolean,
  signal: AbortSignal,
) {
  const presets = controls.querySelector<HTMLSelectElement>('#path-count')!;
  const visibility = controls.querySelector<HTMLButtonElement>('#overlay-visible')!;

  presets.replaceChildren(...pathCounts.map(count => new Option(`${count / 1_000}k`, String(count))));
  presets.value = String(settings.count);
  visibility.setAttribute('aria-pressed', String(settings.visible));

  presets.addEventListener('change', () => {
    const count = pathCounts.find((preset) => String(preset) === presets.value);
    if (count !== undefined) onCountChange(count);
  }, { signal });
  visibility.addEventListener('click', () => {
    visibility.setAttribute('aria-pressed', String(onToggleVisibility()));
  }, { signal });
}
