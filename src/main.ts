import './styles.css';
import type OpenSeadragon from 'openseadragon';
import { generateConfetti } from './data/confetti';
import { createConfettiLayer } from './layers/confettiLayer';
import { viewerState } from './state';
import { connectDataControls } from './ui/dataControls';
import { connectCameraControls } from './ui/cameraControls';
import { DeckOverlay } from './viewer/DeckOverlay';
import { createViewer } from './viewer/createViewer';
import { highsmithDzi } from './viewer/imageSource';

const imageStatus = document.querySelector<HTMLElement>('#image-status')!;
const retry = document.querySelector<HTMLButtonElement>('#image-retry')!;
const scene = document.querySelector<HTMLElement>('#scene')!;
const viewer = createViewer(document.querySelector<HTMLElement>('#image-viewer')!);

let overlay: DeckOverlay | undefined;
viewer.addHandler('close', () => { overlay = undefined; });
let dataset: { key: string; layer: ReturnType<typeof createConfettiLayer> } | undefined;

function renderConfetti(image: OpenSeadragon.TiledImage) {
  const { x: width, y: height } = image.getContentSize();
  const { count, seed, overlayVisible } = viewerState;
  const key = `${seed}:${count}:${width}:${height}`;
  if (dataset?.key !== key) {
    dataset = { key, layer: createConfettiLayer(generateConfetti(seed, count, width, height)) };
  }

  const layers = [dataset.layer.clone({ visible: overlayVisible })];
  if (overlay) {
    overlay.setLayers(layers);
  } else {
    overlay = new DeckOverlay(scene, viewer, image, layers);
  }
}

function showImageStatus(message: string, canRetry = false) {
  imageStatus.textContent = message;
  retry.hidden = !canRetry;
}

function openImage() {
  showImageStatus('Loading Highsmith…');
  viewer.open({ tileSource: highsmithDzi });
}

viewer.addHandler('open', () => {
  const image = viewer.world.getItemAt(0);
  image.whenFullyLoaded(() => {
    if (viewer.world.getItemAt(0) === image && retry.hidden) showImageStatus('');
  });
  const { x: width, y: height } = image.getContentSize();
  showImageStatus(`Loading Highsmith tiles (${width} × ${height})…`);

  renderConfetti(image);
});
viewer.addHandler('open-failed', () => showImageStatus('Could not open the Highsmith image.', true));
viewer.addHandler('tile-load-failed', ({ tiledImage }) => {
  if (viewer.world.getItemAt(0) === tiledImage) {
    showImageStatus('Some Highsmith tiles could not load.', true);
  }
});
retry.addEventListener('click', openImage);

connectCameraControls(document.querySelector<HTMLFieldSetElement>('#camera-controls')!, viewer);
connectDataControls(document.querySelector<HTMLFieldSetElement>('#data-controls')!, () => {
  const image = viewer.world.getItemAt(0);
  if (image) renderConfetti(image);
});
openImage();
