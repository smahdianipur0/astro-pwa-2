export function initDrawer(drawerId: string): () => void {
  const noop = () => {};

  const drawer = document.getElementById(drawerId);
  if (!drawer) return noop;

  const track     = drawer.querySelector<HTMLElement>('[data-drawer-track]');
  const closeSnap = drawer.querySelector<HTMLElement>('[data-dismiss-snap]');
  const openSnap  = drawer.querySelector<HTMLElement>('[data-drawer-sheet]');
  if (!track || !closeSnap || !openSnap) return noop;

  const horiz      = drawer.hasAttribute('data-dir-rtl');
  const scrollProp = horiz ? 'scrollLeft' : 'scrollTop';
  const sizeProp   = horiz ? 'offsetWidth' : 'offsetHeight';

  let openSize = 0;

  const onToggle = (e: Event) => {
    const { newState } = e as ToggleEvent;
    if (newState === 'open') {
      openSize = closeSnap[sizeProp];
      openSnap.scrollIntoView(
        horiz
          ? { behavior: 'instant', inline: 'end', block: 'nearest' }
          : { behavior: 'instant', block: 'end', inline: 'nearest' }
      );
    }
    if (newState === 'closed') {
      track[scrollProp] = 0;
      drawer.style.pointerEvents = '';
    }
  };

  const onScroll = () => {
    if (drawer.matches(':popover-open') && track[scrollProp] < openSize / 2) {
      drawer.style.pointerEvents = 'none';
      drawer.hidePopover();
    }
  };

  drawer.addEventListener('toggle', onToggle);
  track.addEventListener('scroll', onScroll);

  return () => {
    drawer.removeEventListener('toggle', onToggle);
    track.removeEventListener('scroll', onScroll);
  };
}