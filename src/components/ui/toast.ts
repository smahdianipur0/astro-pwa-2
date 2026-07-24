let timeoutId: number | undefined;

export function showToast(Clipboard? : string) {
  const toastElement = document.getElementById('toast')!;
  const clipboardElement = document.getElementById('clipboard')!;
  if (toastElement) {

    toastElement.style.marginTop = 'var(--size-lg1)';
    toastElement.style.scale = '1';
    toastElement.style.transition = 'margin-top 0.25s var(--move), scale 0.5s var(--appear)';
    if(Clipboard && clipboardElement){
      clipboardElement.textContent = `Clipboard: ${Clipboard}`
    }

    timeoutId = window.setTimeout(() => {
      toastElement.style.marginTop = '-100%';
      toastElement.style.scale = '0.55';
      toastElement.style.transition = 'margin-top 0.4s ease-in, scale 0.4s ease-in';
    }, 2000);
  }
}