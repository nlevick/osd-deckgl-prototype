import type OpenSeadragon from 'openseadragon';
import { generateConfetti, type ConfettiPath } from './data/confetti';
import { createConfettiLayer } from './layers/confettiLayer';
import { ViewerState, type OverlaySettings } from './state';
import { connectDataControls } from './ui/dataControls';
import { connectCameraControls } from './ui/cameraControls';
import { connectSelectionReadout } from './ui/selectionReadout';
import { DeckOverlay, type OverlayLayers } from './viewer/DeckOverlay';
import { createViewer } from './viewer/createViewer';
import { createEmphasisLayers } from './viewer/emphasis';
import { highsmithDzi } from './viewer/imageSource';

const imageStatus = document.querySelector<HTMLElement>('#image-status')!;
const graphicsStatus = document.querySelector<HTMLElement>('#graphics-status')!;
const retry = document.querySelector<HTMLButtonElement>('#image-retry')!;
const scene = document.querySelector<HTMLElement>('#scene')!;
const dataControls = document.querySelector<HTMLFieldSetElement>('#data-controls')!;
const imageViewer = document.querySelector<HTMLElement>('#image-viewer')!;
const viewer = createViewer(imageViewer);
const controls = new AbortController();
const state = new ViewerState();
const seed = 37;

type Dataset = {
  key: string;
  layer: ReturnType<typeof createConfettiLayer>;
};
let dataset: Dataset | undefined;
let overlay: DeckOverlay | undefined;

viewer.addHandler('before-destroy', () => {
  controls.abort();
  dataset = undefined;
});

const showSelection = connectSelectionReadout(
  dataControls,
  () => selectPath(null),
  controls.signal,
);

function getLayers({ layer }: Dataset): OverlayLayers {
  if (!state.settings.visible) return [layer.clone({ visible: false })];
  return [layer, ...createEmphasisLayers(layer, state.hovered, state.selected)];
}

function updateLayers() {
  if (overlay && dataset) overlay.setLayers(getLayers(dataset));
}

function updateSelectionReadout() {
  showSelection(state.selected?.id ?? null);
}

function hoverPath(path: ConfettiPath | null) {
  if (state.hovered === path) return;
  state.hovered = path;
  updateLayers();
}

function selectPath(path: ConfettiPath | null) {
  if (state.selected === path) return;
  state.selected = path;
  updateSelectionReadout();
  updateLayers();
}

function resetInteraction() {
  overlay = undefined;
  selectPath(null);
}

function updateSettings(settings: OverlaySettings) {
  if (!state.setSettings(settings)) return;
  updateSelectionReadout();
  const image = viewer.world.getItemAt(0);
  if (image) renderConfetti(image);
}

function renderConfetti(image: OpenSeadragon.TiledImage) {
  if (dataControls.hidden) return;
  const { x: width, y: height } = image.getContentSize();
  const { count } = state.settings;
  const key = `${count}:${width}:${height}`;
  if (dataset?.key !== key) {
    dataset = {
      key,
      layer: createConfettiLayer(generateConfetti(seed, count, width, height)),
    };
  }

  const layers = getLayers(dataset);
  if (overlay) {
    overlay.setLayers(layers);
  } else {
    try {
      overlay = new DeckOverlay(scene, viewer, image, layers, {
        onHover: hoverPath,
        onSelect: selectPath,
        onDestroy: resetInteraction,
        onError: showGraphicsError,
      });
    } catch (error) {
      showGraphicsError(error);
    }
  }
}

function showGraphicsError(error: unknown) {
  console.error('The WebGL overlay is unavailable', error);
  dataControls.hidden = true;
  graphicsStatus.textContent = 'The WebGL overlay is unavailable';
}

function showImageStatus(message: string, imageUnavailable = false) {
  if (imageStatus.textContent !== message) imageStatus.textContent = message;
  imageViewer.style.visibility = imageUnavailable ? 'hidden' : '';
  retry.hidden = message === '';
}

function openImage() {
  showImageStatus('');
  graphicsStatus.textContent = '';
  dataControls.hidden = false;
  viewer.open({ tileSource: highsmithDzi });
}

viewer.addHandler('open', () => {
  renderConfetti(viewer.world.getItemAt(0));
});
viewer.addHandler('open-failed', () => {
  showImageStatus('Unable to open image.', true);
});
viewer.addHandler('tile-load-failed', ({ tiledImage }) => {
  if (viewer.world.getItemAt(0) === tiledImage) {
    showImageStatus('Some Highsmith tiles could not load.');
  }
});
retry.addEventListener('click', openImage, { signal: controls.signal });

connectCameraControls(document.querySelector<HTMLFieldSetElement>('#camera-controls')!, viewer, controls.signal);
connectDataControls(
  dataControls,
  state.settings,
  (count) => updateSettings({ ...state.settings, count }),
  () => {
    const visible = !state.settings.visible;
    updateSettings({ ...state.settings, visible });
    return visible;
  },
  controls.signal,
);
openImage();
