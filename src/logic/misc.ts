
let timeoutId: number | undefined;

export function showToast() {
  const toastElement = document.getElementById('toast')!;
  if (toastElement) {
    toastElement.style.bottom = 'var(--size-lg1)';
    toastElement.style.scale = '1';
    toastElement.style.transition = 'bottom 0.25s var(--move), scale 0.5s var(--appear)';

    timeoutId = window.setTimeout(() => {
      toastElement.style.bottom = '-100%';
      toastElement.style.scale = '0.55';
      toastElement.style.transition = 'bottom 0.4s ease-in, scale 0.4s ease-in';
    }, 2000);
  }
}