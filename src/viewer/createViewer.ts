import OpenSeadragon from 'openseadragon';

export function createViewer(element: HTMLElement) {
  const viewer = OpenSeadragon({
    element,
    drawer: 'canvas',
    showNavigationControl: false,
    crossOriginPolicy: 'Anonymous',
    gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
    gestureSettingsPen: { clickToZoom: false, dblClickToZoom: true },
  });

  function reflectZoomPoint(point: OpenSeadragon.Point) {
    const { viewport } = viewer;
    if (viewport.getFlip()) point.x = viewport.getContainerSize().x - point.x;
  }

  // OSD 6.1.1 uses these same event points in its default zoom handlers without reflecting them.
  viewer.addHandler('canvas-double-click', ({ position }) => reflectZoomPoint(position));
  viewer.addHandler('canvas-pinch', ({ center, lastCenter }) => {
    reflectZoomPoint(center);
    reflectZoomPoint(lastCenter);
    // OSD resolves the zoom anchor before panning by lastCenter minus center.
    const dx = lastCenter.x - center.x;
    const dy = lastCenter.y - center.y;
    center.x = lastCenter.x;
    center.y = lastCenter.y;
    lastCenter.x += dx;
    lastCenter.y += dy;
  });

  return viewer;
}
