import { Deck, OrthographicView, type Layer } from '@deck.gl/core';
import type OpenSeadragon from 'openseadragon';
import type { ConfettiPath } from '../data/confetti';
import { createHover, type PointerPosition } from './hover';
import { getOsdTransform } from './osdTransform';

export class DeckOverlay {
  private readonly host = document.createElement('div');
  private readonly deck: Deck<OrthographicView>;
  private readonly pointerEvents = new AbortController();
  private readonly hover = createHover(
    (position) => this.setHovered(this.pickPath(position)),
    () => this.setHovered(null),
  );
  private modelMatrix: Float64Array;
  private dragging = false;
  private animating = false;
  private destroyed = false;

  constructor(
    parent: HTMLElement,
    private readonly viewer: OpenSeadragon.Viewer,
    private readonly image: OpenSeadragon.TiledImage,
    private layers: Layer[],
    private readonly onHover: (id: string | null) => void,
    private readonly onSelect: (id: string | null) => void,
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
      onLoad: () => this.hover.refresh(),
      onResize: () => this.deck.redraw(),
      viewState,
      layers: this.orientedLayers(),
    });

    const { signal } = this.pointerEvents;
    viewer.canvas.addEventListener('pointermove', this.onPointerMove, { signal });
    viewer.canvas.addEventListener('pointerleave', this.hover.leave, { signal });
    viewer.canvas.addEventListener('pointercancel', this.onPointerCancel, { signal });
    viewer.addHandler('canvas-click', this.onClick);
    viewer.addHandler('canvas-drag', this.onDrag);
    viewer.addHandler('canvas-drag-end', this.onDragEnd);
    viewer.addHandler('animation-start', this.onAnimationStart);
    viewer.addHandler('animation-finish', this.onAnimationFinish);
    viewer.addHandler('update-viewport', this.sync);
    viewer.addHandler('close', this.destroy);
    viewer.addHandler('before-destroy', this.destroy);
  }

  setLayers(layers: Layer[]) {
    if (this.destroyed) return;
    this.layers = layers;
    this.deck.setProps({ layers: this.orientedLayers() });
  }

  private pickPath({ x, y }: PointerPosition): ConfettiPath | null {
    if (!this.deck.isInitialized) return null;
    const bounds = this.host.getBoundingClientRect();
    const localX = x - bounds.left;
    const localY = y - bounds.top;
    if (localX < 0 || localY < 0 || localX >= bounds.width || localY >= bounds.height) return null;
    return this.deck.pickObject({ x: localX, y: localY, radius: 2 })?.object ?? null;
  }

  private setHovered(path: ConfettiPath | null) {
    this.viewer.canvas.classList.toggle('has-hovered-path', path !== null);
    this.onHover(path?.id ?? null);
  }

  private readonly onClick = ({ quick, position }: OpenSeadragon.CanvasClickEvent) => {
    if (!quick || !this.deck.isInitialized) return;
    const { left, top } = this.viewer.canvas.getBoundingClientRect();
    const { viewport } = this.viewer;
    // OSD reflects the click position for navigation before emitting canvas-click.
    const x = viewport.getFlip() ? viewport.getContainerSize().x - position.x : position.x;
    const picked = this.pickPath({ x: left + x, y: top + position.y });
    this.onSelect(picked?.id ?? null);
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') this.hover.move({ x: event.clientX, y: event.clientY });
  };

  private readonly onPointerCancel = () => {
    this.hover.leave();
    this.onDragEnd();
  };

  private readonly onDrag = () => {
    this.dragging = true;
    this.updateHoverBlock();
  };

  private readonly onDragEnd = () => {
    this.dragging = false;
    this.updateHoverBlock();
  };

  private readonly onAnimationStart = () => {
    this.animating = true;
    this.updateHoverBlock();
  };

  private readonly onAnimationFinish = () => {
    this.animating = false;
    this.updateHoverBlock();
  };

  private updateHoverBlock() {
    this.hover.setBlocked(this.dragging || this.animating);
  }

  private orientedLayers() {
    return this.layers.map((layer) => layer.clone({ modelMatrix: this.modelMatrix }));
  }

  private readonly sync = () => {
    const { viewport } = this.viewer;
    const { x: width, y: height } = viewport.getContainerSize();
    const { modelMatrix, viewState } = getOsdTransform(viewport, this.image);
    if (modelMatrix.some((value, index) => value !== this.modelMatrix[index])) {
      this.modelMatrix = modelMatrix;
      const layers = this.orientedLayers();
      this.deck.setProps({ width, height, viewState, layers });
      this.hover.refresh();
    } else {
      this.deck.setProps({ width, height, viewState });
      if (this.deck.width === width && this.deck.height === height) this.deck.redraw();
    }
  };

  readonly destroy = () => {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pointerEvents.abort();
    this.hover.leave();
    this.viewer.removeHandler('canvas-click', this.onClick);
    this.viewer.removeHandler('canvas-drag', this.onDrag);
    this.viewer.removeHandler('canvas-drag-end', this.onDragEnd);
    this.viewer.removeHandler('animation-start', this.onAnimationStart);
    this.viewer.removeHandler('animation-finish', this.onAnimationFinish);
    this.viewer.removeHandler('update-viewport', this.sync);
    this.viewer.removeHandler('close', this.destroy);
    this.viewer.removeHandler('before-destroy', this.destroy);
    const context = this.deck.getCanvasContext();
    this.deck.finalize();
    context?.destroy();
    this.host.remove();
  };
}
