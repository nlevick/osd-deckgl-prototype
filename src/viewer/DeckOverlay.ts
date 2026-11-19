import { Deck, OrthographicView, type Layer } from '@deck.gl/core';
import type OpenSeadragon from 'openseadragon';
import { getOsdTransform } from './osdTransform';

export class DeckOverlay {
  private readonly host = document.createElement('div');
  private readonly deck: Deck<OrthographicView>;
  private modelMatrix: Float64Array;
  private destroyed = false;

  constructor(
    parent: HTMLElement,
    private readonly viewer: OpenSeadragon.Viewer,
    private readonly image: OpenSeadragon.TiledImage,
    private layers: Layer[],
  ) {
    this.host.className = 'deck-overlay';
    parent.append(this.host);
    const { x: width, y: height } = viewer.viewport.getContainerSize();
    const { modelMatrix, viewState } = getOsdTransform(viewer.viewport, image);
    this.modelMatrix = modelMatrix;
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
      onResize: () => this.deck.redraw(),
      viewState,
      layers: this.layers.map((layer) => layer.clone({ modelMatrix })),
    });

    viewer.addHandler('update-viewport', this.sync);
    viewer.addHandler('close', this.destroy);
    viewer.addHandler('before-destroy', this.destroy);
  }

  private readonly sync = () => {
    const { viewport } = this.viewer;
    const { x: width, y: height } = viewport.getContainerSize();
    const { modelMatrix, viewState } = getOsdTransform(viewport, this.image);
    if (modelMatrix.some((value, index) => value !== this.modelMatrix[index])) {
      this.modelMatrix = modelMatrix;
      const layers = this.layers.map((layer) => layer.clone({ modelMatrix }));
      this.deck.setProps({ width, height, viewState, layers });
    } else {
      this.deck.setProps({ width, height, viewState });
      if (this.deck.width === width && this.deck.height === height) this.deck.redraw();
    }
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
