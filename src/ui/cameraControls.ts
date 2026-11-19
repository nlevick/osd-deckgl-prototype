import type OpenSeadragon from 'openseadragon';

export function connectCameraControls(
  controls: HTMLFieldSetElement,
  viewer: OpenSeadragon.Viewer,
  signal: AbortSignal,
) {
  const button = (id: string) => controls.querySelector<HTMLButtonElement>(`#${id}`)!;
  const { viewport } = viewer;
  const flip = button('flip');

  button('zoom-in').addEventListener('click', () => viewport.zoomBy(1.5).applyConstraints(), { signal });
  button('zoom-out').addEventListener('click', () => viewport.zoomBy(1 / 1.5).applyConstraints(), { signal });
  function rotate(degrees: number) {
    const delta = viewport.getFlip() ? -degrees : degrees;
    viewport.rotateBy(delta, undefined, true).applyConstraints(true);
  }

  button('rotate-left').addEventListener('click', () => rotate(-90), { signal });
  button('rotate-right').addEventListener('click', () => rotate(90), { signal });
  flip.addEventListener('click', () => viewport.toggleFlip(), { signal });
  button('home').addEventListener('click', () => {
    viewport.setRotation(0, true);
    viewport.setFlip(false);
    viewport.goHome();
  }, { signal });

  viewer.addHandler('flip', ({ flipped }) => flip.setAttribute('aria-pressed', String(flipped)));
  viewer.addHandler('open', () => { controls.disabled = false; });
  viewer.addHandler('close', () => { controls.disabled = true; });
}
