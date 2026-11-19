import './styles.css';
import { createViewer } from './viewer/createViewer';
import { highsmithDzi } from './viewer/imageSource';

const imageStatus = document.querySelector<HTMLElement>('#image-status')!;
const retry = document.querySelector<HTMLButtonElement>('#image-retry')!;
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
  const { x: width, y: height } = viewer.world.getItemAt(0).getContentSize();
  showImageStatus(`Loading Highsmith tiles (${width} × ${height})…`);
});
viewer.addHandler('open-failed', () => showImageStatus('Could not open the Highsmith image.', true));
viewer.addHandler('tile-load-failed', ({ tiledImage }) => {
  if (viewer.world.getItemAt(0) === tiledImage) {
    showImageStatus('Some Highsmith tiles could not load.', true);
  }
});
viewer.addHandler('open', () => {
  const image = viewer.world.getItemAt(0);
  image.whenFullyLoaded(() => {
    if (viewer.world.getItemAt(0) === image && retry.hidden) showImageStatus('');
  });
});
retry.addEventListener('click', openImage);

openImage();
