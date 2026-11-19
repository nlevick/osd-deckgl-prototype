import { Deck, OrthographicView, type Layer } from '@deck.gl/core';
import type OpenSeadragon from 'openseadragon';
import type { ConfettiPath } from '../data/confetti';
import { createHover, type PointerPosition } from './hover';
import { getOsdTransform } from './osdTransform';

export type OverlayLayers = [Layer, ...Layer[]];

type InteractionCallbacks = {
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onDestroy: () => void;
};

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
  private gestureMoved = false;
  private flipPending = false;
  private animating = false;
  private rendered = false;
  private destroyed = false;

  constructor(
    parent: HTMLElement,
    private readonly viewer: OpenSeadragon.Viewer,
    private readonly image: OpenSeadragon.TiledImage,
    private layers: OverlayLayers,
    private readonly callbacks: InteractionCallbacks,
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
      onAfterRender: () => {
        if (this.rendered) return;
        this.rendered = true;
        this.hover.refresh();
      },
      onResize: this.redraw,
      viewState,
      layers: this.orientedLayers(),
    });

    const { signal } = this.pointerEvents;
    viewer.canvas.addEventListener('pointermove', this.onPointerMove, { signal });
    viewer.canvas.addEventListener('pointerleave', this.hover.leave, { signal });
    viewer.canvas.addEventListener('pointercancel', this.onPointerCancel, { signal });
    viewer.addHandler('canvas-press', this.onPress);
    viewer.addHandler('canvas-click', this.onClick);
    viewer.addHandler('canvas-drag', this.onDrag);
    viewer.addHandler('canvas-drag-end', this.onDragEnd);
    viewer.addHandler('canvas-pinch', this.onPinch);
    viewer.addHandler('animation-start', this.onAnimationStart);
    viewer.addHandler('animation-finish', this.onAnimationFinish);
    viewer.addHandler('flip', this.onFlip);
    viewer.addHandler('update-viewport', this.sync);
    viewer.addHandler('close', this.destroy);
    viewer.addHandler('before-destroy', this.destroy);
  }

  setLayers(layers: OverlayLayers) {
    if (this.destroyed) return;
    const [base] = layers;
    const [previous] = this.layers;
    const dataChanged = base.props.data !== previous.props.data;
    const visibilityChanged = base.props.visible !== previous.props.visible;
    if (dataChanged || visibilityChanged) this.rendered = false;
    this.layers = layers;
    this.deck.setProps({ layers: this.orientedLayers() });
    if (dataChanged || (visibilityChanged && !base.props.visible)) this.hover.leave();
  }

  private get canPick() {
    return this.rendered && this.layers[0].props.visible;
  }

  private pickPath({ x, y }: PointerPosition): ConfettiPath | null {
    if (!this.canPick) return null;
    const bounds = this.host.getBoundingClientRect();
    const localX = x - bounds.left;
    const localY = y - bounds.top;
    if (localX < 0 || localY < 0 || localX >= bounds.width || localY >= bounds.height) return null;
    return this.deck.pickObject({ x: localX, y: localY, radius: 2 })?.object ?? null;
  }

  private setHovered(path: ConfettiPath | null) {
    this.viewer.canvas.classList.toggle('has-hovered-path', path !== null);
    this.callbacks.onHover(path?.id ?? null);
  }

  private readonly onClick = ({ quick, position }: OpenSeadragon.CanvasClickEvent) => {
    if (!quick || this.gestureMoved || this.flipPending || !this.canPick) return;
    const { left, top } = this.viewer.canvas.getBoundingClientRect();
    const { viewport } = this.viewer;
    // OSD reflects the click position for navigation before emitting canvas-click.
    const x = viewport.getFlip() ? viewport.getContainerSize().x - position.x : position.x;
    const picked = this.pickPath({ x: left + x, y: top + position.y });
    this.callbacks.onSelect(picked?.id ?? null);
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' && this.layers[0].props.visible) {
      this.hover.move({ x: event.clientX, y: event.clientY });
    }
  };

  private readonly onPointerCancel = () => {
    this.hover.leave();
    this.onDragEnd();
  };

  private readonly onPress = ({ pointerType }: OpenSeadragon.CanvasPressEvent) => {
    this.gestureMoved = false;
    if (pointerType === 'touch') this.hover.leave();
  };

  private readonly onPinch = () => { this.gestureMoved = true; };

  private readonly onDrag = ({ delta }: OpenSeadragon.CanvasDragEvent) => {
    if (delta.x === 0 && delta.y === 0) return;
    this.gestureMoved = true;
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

  private readonly onFlip = () => {
    this.flipPending = true;
    this.updateHoverBlock();
  };

  private updateHoverBlock() {
    this.hover.setBlocked(this.dragging || this.animating || this.flipPending);
  }

  private orientedLayers() {
    return this.layers.map((layer) => layer.clone({ modelMatrix: this.modelMatrix }));
  }

  private readonly redraw = () => {
    if (this.rendered) this.deck.redraw();
  };

  private readonly sync = () => {
    const { viewport } = this.viewer;
    const { x: width, y: height } = viewport.getContainerSize();
    const { modelMatrix, viewState } = getOsdTransform(viewport, this.image);
    if (modelMatrix.some((value, index) => value !== this.modelMatrix[index])) {
      // Deck applies replacement layers in its render loop before the pick buffer can use them.
      this.rendered = false;
      this.modelMatrix = modelMatrix;
      const layers = this.orientedLayers();
      this.deck.setProps({ width, height, viewState, layers });
    } else {
      this.deck.setProps({ width, height, viewState });
      if (this.deck.width === width && this.deck.height === height) this.redraw();
    }
    if (this.flipPending) {
      this.flipPending = false;
      this.updateHoverBlock();
    }
  };

  readonly destroy = () => {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pointerEvents.abort();
    this.hover.leave();
    this.viewer.removeHandler('canvas-press', this.onPress);
    this.viewer.removeHandler('canvas-click', this.onClick);
    this.viewer.removeHandler('canvas-drag', this.onDrag);
    this.viewer.removeHandler('canvas-drag-end', this.onDragEnd);
    this.viewer.removeHandler('canvas-pinch', this.onPinch);
    this.viewer.removeHandler('animation-start', this.onAnimationStart);
    this.viewer.removeHandler('animation-finish', this.onAnimationFinish);
    this.viewer.removeHandler('flip', this.onFlip);
    this.viewer.removeHandler('update-viewport', this.sync);
    this.viewer.removeHandler('close', this.destroy);
    this.viewer.removeHandler('before-destroy', this.destroy);
    const context = this.deck.getCanvasContext();
    this.deck.finalize();
    context?.destroy();
    this.host.remove();
    this.callbacks.onDestroy();
  };
}
