import type { OrthographicViewState } from '@deck.gl/core';
import type OpenSeadragon from 'openseadragon';

export function getOsdTransform(viewport: OpenSeadragon.Viewport, image: OpenSeadragon.TiledImage) {
  const center = viewport.getCenter(true);
  const { x, y } = image.viewportToImageCoordinates(center, true);
  const scale = image.viewportToImageZoom(viewport.getZoom(true));
  const radians = (viewport.getRotation(true) % 360) * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const flip = viewport.getFlip() ? -1 : 1;
  const screenXFromX = flip * cos;
  const screenXFromY = -flip * sin;

  // OSD's canvas drawer reflects the already-rotated scene across the screen's vertical axis.
  const modelMatrix = new Float64Array([
    screenXFromX, sin, 0, 0,
    screenXFromY, cos, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
  const viewState: OrthographicViewState = {
    target: [screenXFromX * x + screenXFromY * y, sin * x + cos * y, 0],
    zoom: Math.log2(scale),
  };
  return { modelMatrix, viewState };
}
