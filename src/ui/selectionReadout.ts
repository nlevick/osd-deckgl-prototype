export function connectSelectionReadout(controls: HTMLElement, onClear: () => void) {
  const status = controls.querySelector<HTMLElement>('#selection-status')!;
  const clear = controls.querySelector<HTMLButtonElement>('#clear-selection')!;

  clear.addEventListener('click', onClear);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') onClear();
  });

  return (id: string | null) => {
    const message = id === null ? 'No path selected' : `Selected path ${id}`;
    if (status.textContent !== message) status.textContent = message;
  };
}
