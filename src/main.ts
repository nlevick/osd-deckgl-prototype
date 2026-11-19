import './styles.css';
import { PathLayer } from '@deck.gl/layers';
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

  // Centers in full-resolution Highsmith pixels: central upper window,
  // apex of the center doorway, and the left circular floor inlay.
  const landmarks = [[3398, 850], [3438, 5648], [1526, 7680]];
  const paths = landmarks.flatMap(([x, y]) => [
    [[x - 105, y], [x + 105, y]],
    [[x, y - 105], [x, y + 105]],
  ]);
  new DeckOverlay(scene, viewer, image, [
    new PathLayer({
      id: 'landmarks',
      data: paths,
      getPath: (path) => path,
      getColor: [0, 240, 255],
      getWidth: 2,
      widthUnits: 'pixels',
    }),
  ]);
});
viewer.addHandler('open-failed', () => showImageStatus('Could not open the Highsmith image.', true));
viewer.addHandler('tile-load-failed', ({ tiledImage }) => {
  if (viewer.world.getItemAt(0) === tiledImage) {
    showImageStatus('Some Highsmith tiles could not load.', true);
  }
});
retry.addEventListener('click', openImage);

openImage();
