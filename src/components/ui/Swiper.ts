export function initSwiper(container: HTMLElement): () => void {

  const onScrollCapture = (e: Event) => {
    const swipe = e.target as HTMLElement;
    if (!swipe.matches?.('[data-swipe]')) return;
    const details = swipe.querySelector<HTMLDetailsElement>('[data-details]');
    if (!details) return;
    const max = swipe.scrollWidth - swipe.clientWidth;
    details.open = swipe.scrollLeft > max / 2;
  };


  const onToggleCapture = (e: Event) => {
    const details = e.target as HTMLDetailsElement;
    if (!details.matches?.('[data-details]')) return;
    const swipe = details.closest<HTMLElement>('[data-swipe]');
    if (!swipe) return;
    const max = swipe.scrollWidth - swipe.clientWidth;
    swipe.scrollTo({ left: details.open ? max : 0, behavior: 'instant' });
  };

  const onOutsidePointerDown = (e: PointerEvent) => {
    if (container.contains(e.target as Node)) return;
    container.querySelectorAll<HTMLDetailsElement>('[data-details][open]').forEach((d) => {
      d.open = false;
    });
  };

  container.addEventListener('scroll', onScrollCapture, true);
  container.addEventListener('toggle', onToggleCapture, true);
  document.addEventListener('pointerdown', onOutsidePointerDown);

  return () => {
    container.removeEventListener('scroll', onScrollCapture, true);
    container.removeEventListener('toggle', onToggleCapture, true);
    document.removeEventListener('pointerdown', onOutsidePointerDown);
  };
}