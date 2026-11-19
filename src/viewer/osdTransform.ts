import type { OrthographicViewState } from '@deck.gl/core';
import type OpenSeadragon from 'openseadragon';

export function getOsdViewState(viewport: OpenSeadragon.Viewport, image: OpenSeadragon.TiledImage): OrthographicViewState {
  const center = viewport.getCenter(true);
  const { x, y } = image.viewportToImageCoordinates(center, true);
  const scale = image.viewportToImageZoom(viewport.getZoom(true));

  return { target: [x, y, 0], zoom: Math.log2(scale) };
}
