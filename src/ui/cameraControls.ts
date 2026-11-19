import type OpenSeadragon from 'openseadragon';

export function connectCameraControls(controls: HTMLFieldSetElement, viewer: OpenSeadragon.Viewer) {
  const button = (id: string) => controls.querySelector<HTMLButtonElement>(`#${id}`)!;
  const { viewport } = viewer;
  const flip = button('flip');

  button('zoom-in').addEventListener('click', () => viewport.zoomBy(1.5).applyConstraints());
  button('zoom-out').addEventListener('click', () => viewport.zoomBy(1 / 1.5).applyConstraints());
  function rotate(degrees: number) {
    const delta = viewport.getFlip() ? -degrees : degrees;
    viewport.rotateBy(delta, undefined, true).applyConstraints(true);
  }

  button('rotate-left').addEventListener('click', () => rotate(-90));
  button('rotate-right').addEventListener('click', () => rotate(90));
  flip.addEventListener('click', () => viewport.toggleFlip());
  button('home').addEventListener('click', () => {
    viewport.setRotation(0, true);
    viewport.setFlip(false);
    viewport.goHome();
  });

  viewer.addHandler('flip', ({ flipped }) => flip.setAttribute('aria-pressed', String(flipped)));
  viewer.addHandler('open', () => { controls.disabled = false; });
  viewer.addHandler('close', () => { controls.disabled = true; });
}
