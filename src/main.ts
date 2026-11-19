import type OpenSeadragon from 'openseadragon';
import { generateConfetti, type ConfettiPath } from './data/confetti';
import { createConfettiLayer } from './layers/confettiLayer';
import { setHoveredId, setSelectedId, viewerState } from './state';
import { connectDataControls } from './ui/dataControls';
import { connectCameraControls } from './ui/cameraControls';
import { connectSelectionReadout } from './ui/selectionReadout';
import { DeckOverlay, type OverlayLayers } from './viewer/DeckOverlay';
import { createViewer } from './viewer/createViewer';
import { createEmphasisLayers } from './viewer/emphasis';
import { highsmithDzi } from './viewer/imageSource';

const imageStatus = document.querySelector<HTMLElement>('#image-status')!;
const imageStatusPanel = imageStatus.parentElement!;
const retry = document.querySelector<HTMLButtonElement>('#image-retry')!;
const scene = document.querySelector<HTMLElement>('#scene')!;
const viewer = createViewer(document.querySelector<HTMLElement>('#image-viewer')!);
const controls = new AbortController();
viewer.addHandler('before-destroy', () => controls.abort());

let overlay: DeckOverlay | undefined;
type Dataset = {
  key: string;
  layer: ReturnType<typeof createConfettiLayer>;
  pathsById: Map<string, ConfettiPath>;
};
let dataset: Dataset | undefined;

const showSelection = connectSelectionReadout(
  document.querySelector<HTMLFieldSetElement>('#data-controls')!,
  () => selectPath(null),
  controls.signal,
);

function getLayers({ layer, pathsById }: Dataset): OverlayLayers {
  const { overlayVisible, hoveredId, selectedId } = viewerState;
  if (!overlayVisible) return [layer.clone({ visible: false })];
  const hovered = hoveredId === null ? undefined : pathsById.get(hoveredId);
  const selected = selectedId === null ? undefined : pathsById.get(selectedId);
  return [layer, ...createEmphasisLayers(layer, hovered, selected)];
}

function hoverPath(id: string | null) {
  if (setHoveredId(id) && overlay && dataset) overlay.setLayers(getLayers(dataset));
}

function selectPath(id: string | null) {
  if (setSelectedId(id)) {
    showSelection(id);
    if (overlay && dataset) overlay.setLayers(getLayers(dataset));
  }
}

function resetInteraction() {
  overlay = undefined;
  selectPath(null);
}

function renderConfetti(image: OpenSeadragon.TiledImage) {
  const { x: width, y: height } = image.getContentSize();
  const { count, seed } = viewerState;
  const key = `${seed}:${count}:${width}:${height}`;
  if (dataset?.key !== key) {
    const paths = generateConfetti(seed, count, width, height);
    dataset = {
      key,
      layer: createConfettiLayer(paths),
      pathsById: new Map(paths.map(path => [path.id, path])),
    };
    setHoveredId(null);
  }

  if (!viewerState.overlayVisible) setHoveredId(null);
  const layers = getLayers(dataset);
  if (overlay) {
    overlay.setLayers(layers);
  } else {
    overlay = new DeckOverlay(scene, viewer, image, layers, {
      onHover: hoverPath,
      onSelect: selectPath,
      onDestroy: resetInteraction,
    });
  }
}

function showImageStatus(message: string) {
  if (imageStatus.textContent === message) return;
  imageStatus.textContent = message;
  retry.hidden = message === '';
}

function openImage() {
  showImageStatus('');
  retry.hidden = true;
  imageStatusPanel.append(retry);
  viewer.open({ tileSource: highsmithDzi });
}

viewer.addHandler('open', () => {
  renderConfetti(viewer.world.getItemAt(0));
});
viewer.addHandler('open-failed', () => {
  // OpenSeadragon creates its centered failure message before app handlers run.
  const message = viewer.container.querySelector('.openseadragon-message > div > div > div');
  if (message) {
    showImageStatus('');
    message.append(retry);
    retry.hidden = false;
  } else {
    showImageStatus('Unable to open the Highsmith image.');
  }
});
viewer.addHandler('tile-load-failed', ({ tiledImage }) => {
  if (viewer.world.getItemAt(0) === tiledImage) {
    showImageStatus('Some Highsmith tiles could not load.');
  }
});
retry.addEventListener('click', openImage);

connectCameraControls(document.querySelector<HTMLFieldSetElement>('#camera-controls')!, viewer);
connectDataControls(document.querySelector<HTMLFieldSetElement>('#data-controls')!, () => {
  showSelection(null);
  const image = viewer.world.getItemAt(0);
  if (image) renderConfetti(image);
}, controls.signal);
openImage();
