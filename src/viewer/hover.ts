export type PointerPosition = { x: number; y: number };

export function createHover(pick: (position: PointerPosition) => void, clear: () => void) {
  let position: PointerPosition | undefined;
  let frame: number | undefined;
  let blocked = false;

  function refresh() {
    if (blocked || !position || frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      if (position) pick(position);
    });
  }

  function cancel() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    clear();
  }

  return {
    move(next: PointerPosition) {
      position = next;
      refresh();
    },
    leave() {
      position = undefined;
      cancel();
    },
    setBlocked(next: boolean) {
      if (blocked === next) return;
      blocked = next;
      if (blocked) cancel();
      else refresh();
    },
    refresh,
  };
}
