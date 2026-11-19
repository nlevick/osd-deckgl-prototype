import { Deck, OrthographicView, type Layer } from '@deck.gl/core';
import type OpenSeadragon from 'openseadragon';
import { getOsdViewState } from './osdTransform';

export class DeckOverlay {
  private readonly host = document.createElement('div');
  private readonly deck: Deck<OrthographicView>;
  private destroyed = false;

  constructor(
    parent: HTMLElement,
    private readonly viewer: OpenSeadragon.Viewer,
    private readonly image: OpenSeadragon.TiledImage,
    layers: Layer[],
  ) {
    this.host.className = 'deck-overlay';
    parent.append(this.host);
    const { x: width, y: height } = viewer.viewport.getContainerSize();
    this.deck = new Deck({
      parent: this.host,
      deviceProps: {
        // A device created after finalize can still observe its detached canvas.
        onVisibilityChange: (context) => {
          if (this.destroyed) context.destroy();
        },
      },
      views: new OrthographicView({ controller: false }),
      width,
      height,
      viewState: getOsdViewState(viewer.viewport, image),
      layers,
    });

    viewer.addHandler('update-viewport', this.sync);
    viewer.addHandler('close', this.destroy);
    viewer.addHandler('before-destroy', this.destroy);
  }

  private readonly sync = () => {
    const { viewport } = this.viewer;
    const { x: width, y: height } = viewport.getContainerSize();
    this.deck.setProps({ width, height, viewState: getOsdViewState(viewport, this.image) });
    this.deck.redraw();
  };

  readonly destroy = () => {
    if (this.destroyed) return;
    this.destroyed = true;
    this.viewer.removeHandler('update-viewport', this.sync);
    this.viewer.removeHandler('close', this.destroy);
    this.viewer.removeHandler('before-destroy', this.destroy);
    const context = this.deck.getCanvasContext();
    this.deck.finalize();
    context?.destroy();
    this.host.remove();
  };
}
