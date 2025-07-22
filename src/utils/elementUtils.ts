export const el = {
    
  wait: (selector: string): Promise<HTMLElement> => {
    return new Promise(resolve => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element as HTMLElement);
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element as HTMLElement);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
}; 