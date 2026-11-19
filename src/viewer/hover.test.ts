import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHover } from './hover';

describe('T10 · hover scheduling', () => {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame: number;

  beforeEach(() => {
    frames.clear();
    nextFrame = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  });
  afterEach(() => vi.unstubAllGlobals());

  function runFrame() {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(0);
  }

  it('picks once per frame at the latest pointer position', () => {
    const pick = vi.fn();
    const hover = createHover(pick, vi.fn());

    hover.move({ x: 1, y: 2 });
    hover.move({ x: 3, y: 4 });
    hover.move({ x: 5, y: 6 });
    expect(pick).not.toHaveBeenCalled();
    expect(frames.size).toBe(1);
    runFrame();

    expect(pick).toHaveBeenCalledExactlyOnceWith({ x: 5, y: 6 });
  });

  it('cancels during drag or animation and refreshes once after settling', () => {
    const pick = vi.fn();
    const clear = vi.fn();
    const hover = createHover(pick, clear);

    hover.move({ x: 1, y: 2 });
    hover.setBlocked(true);
    expect(frames.size).toBe(0);
    expect(clear).toHaveBeenCalledOnce();
    hover.move({ x: 3, y: 4 });
    hover.refresh();
    runFrame();
    expect(pick).not.toHaveBeenCalled();

    hover.setBlocked(false);
    runFrame();
    runFrame();
    expect(pick).toHaveBeenCalledExactlyOnceWith({ x: 3, y: 4 });
  });

  it('clears hover and cancels queued picking on exit', () => {
    const pick = vi.fn();
    const clear = vi.fn();
    const hover = createHover(pick, clear);

    hover.move({ x: 1, y: 2 });
    hover.leave();
    hover.refresh();
    expect(frames.size).toBe(0);
    runFrame();
    expect(pick).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalledOnce();
  });
});
