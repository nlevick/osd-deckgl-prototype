# Architecture

OpenSeadragon loads the tiled image and owns navigation. A transparent deck.gl canvas draws and picks paths over the same viewport. The overlay follows camera changes from OpenSeadragon.

## Code map

| Area | Responsibility | Start here |
| --- | --- | --- |
| Image and navigation | OpenSeadragon loads tiles and handles gestures and toolbar actions. | [Viewer setup](../src/viewer/createViewer.ts), [camera controls](../src/ui/cameraControls.ts) |
| Overlay | The adapter derives the deck.gl projection from the OpenSeadragon viewport and coordinates rendering and picking. | [Camera transform](../src/viewer/osdTransform.ts), [overlay adapter](../src/viewer/DeckOverlay.ts) |
| Geometry | Seeded paths supply the base layer. Small highlight layers draw hover and selection. | [Path generator](../src/data/confetti.ts), [base layer](../src/layers/confettiLayer.ts), [highlights](../src/viewer/emphasis.ts) |
| State and lifecycle | The app caches the current dataset, stores interaction state, and handles image loading and retry. | [App entry point](../src/main.ts), [viewer state](../src/state.ts) |

## Camera and alignment

1. Pointer gestures and toolbar actions update OpenSeadragon. The deck.gl controller is disabled, and `pointer-events: none` lets input reach the OpenSeadragon canvas.
2. On viewport updates, the adapter reads the current animated camera. It converts the center to full-resolution image pixels and computes deck.gl zoom as `log2(scale)`, where scale is CSS pixels per image pixel.
3. The adapter rotates the paths and camera target together, then reflects both horizontally when flipped. Both canvases use the current viewport size.

In flipped views the viewer adjusts the anchor points that OpenSeadragon uses for double-click and pinch zoom. [OpenSeadragon viewport API](https://openseadragon.github.io/docs/OpenSeadragon.Viewport.html) · [deck.gl OrthographicView](https://deck.gl/docs/api-reference/core/orthographic-view)

## Path data and layers

- **Coordinates.** Paths use full-resolution image pixels with the origin at the top left. Each path has a stable `seed:index` ID across presets.
- **Base layer.** A pickable `PathLayer` draws the dataset. Navigation, picking, and visibility changes reuse the current geometry.
- **Highlights.** Hover and selection each use a single-path layer with picking disabled. Selection draws last. Hovering the selected path shows only the selection stroke.

## Picking and selection

- **Picking.** The overlay converts pointer positions to canvas-local CSS pixels. Click picking reverses the reflected X coordinate OpenSeadragon reports when flipped.
- **Hover.** The scheduler picks at most once per animation frame. Leaving the viewer clears hover. Navigation pauses hover picking until the view settles. [Hover scheduler](../src/viewer/hover.ts)
- **Selection.** A quick click or tap selects a path. Selection survives navigation, resizing, and pointer exit. Clicking or tapping empty space, clearing, changing overlay settings, or reloading resets it. A live region reports selection changes.

## Loading and teardown

- **Image requests.** OpenSeadragon loads the descriptor and tiles from a public demo. If a request fails, **Retry image** reopens the image and rebuilds the overlay. [Image credit](../THIRD_PARTY_NOTICES.md)
- **Overlay cleanup.** Closing the image, destroying the viewer, or losing the graphics context cancels pending hover work, removes listeners, and disposes of the deck.gl canvas. The tiled image viewer remains available after an overlay failure.
