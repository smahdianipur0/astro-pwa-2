type ElementProps = {
  className?: string;
  id?: string;
  textContent?: string;
  append?: HTMLElement | HTMLElement[];
  [key: string]: any;
};

export const element = {
  configure: <T extends HTMLElement>(element: T, { append, ...props }: ElementProps): T => {
    if (append) {
      Array.isArray(append)
        ? element.append(...append)
        : element.append(append);
    }
    return Object.assign(element, props);
  },

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