import OpenSeadragon from 'openseadragon';

export function createViewer(element: HTMLElement) {
  return OpenSeadragon({
    element,
    drawer: 'canvas',
    showNavigationControl: false,
    crossOriginPolicy: 'Anonymous',
  });
}
