import './styles.css';
import { generateConfetti } from './data/confetti';
import { createConfettiLayer } from './layers/confettiLayer';
import { connectCameraControls } from './ui/cameraControls';
import { DeckOverlay } from './viewer/DeckOverlay';
import { createViewer } from './viewer/createViewer';
import { highsmithDzi } from './viewer/imageSource';

const imageStatus = document.querySelector<HTMLElement>('#image-status')!;
const retry = document.querySelector<HTMLButtonElement>('#image-retry')!;
const scene = document.querySelector<HTMLElement>('#scene')!;
const viewer = createViewer(document.querySelector<HTMLElement>('#image-viewer')!);

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

  const data = generateConfetti(37, 10_000, width, height);
  new DeckOverlay(scene, viewer, image, [createConfettiLayer(data)]);
});
viewer.addHandler('open-failed', () => showImageStatus('Could not open the Highsmith image.', true));
viewer.addHandler('tile-load-failed', ({ tiledImage }) => {
  if (viewer.world.getItemAt(0) === tiledImage) {
    showImageStatus('Some Highsmith tiles could not load.', true);
  }
});
retry.addEventListener('click', openImage);

connectCameraControls(document.querySelector<HTMLFieldSetElement>('#camera-controls')!, viewer);
openImage();
