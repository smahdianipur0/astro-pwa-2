export function initDrawer(drawerId: string): void {
  const drawer    = document.getElementById(drawerId);
  if (!drawer) return;

  const track     = drawer.querySelector<HTMLElement>('[data-drawer-track]');
  const closeSnap = drawer.querySelector<HTMLElement>('[data-dismiss-snap]');
  if (!track || !closeSnap) return;

  const horiz      = drawer.hasAttribute('data-dir-rtl');
  const scrollProp = horiz ? 'scrollLeft' : 'scrollTop';
  const sizeProp   = horiz ? 'offsetWidth' : 'offsetHeight';

  let openSize = 0;

  drawer.addEventListener('toggle', (e) => {
    const { newState } = e as ToggleEvent;
    if (newState === 'open') {
      openSize          = closeSnap[sizeProp];
      track[scrollProp] = openSize;
    }
    if (newState === 'closed') {
      track[scrollProp]          = 0;
      drawer.style.pointerEvents = '';
    }
  });

  track.addEventListener('scroll', () => {
    if (drawer.matches(':popover-open') && track[scrollProp] < openSize / 2) {
      drawer.style.pointerEvents = 'none';
      drawer.hidePopover();
    }
  });
}
