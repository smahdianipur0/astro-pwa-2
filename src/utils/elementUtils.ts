type ElementProps = {
  className?: string;
  id?: string;
  textContent?: string;
  append?: HTMLElement | HTMLElement[];
  [key: string]: any;
};

type ValidTagNames = keyof HTMLElementTagNameMap;

export const element = {
    configure: <T extends ValidTagNames>( tag: T,{ append, ...props }: ElementProps): HTMLElementTagNameMap[T] => {

    const element = document.createElement(tag) as HTMLElementTagNameMap[T];
    if (append) {
      if (Array.isArray(append)) {
        for (const child of append) {
          element.appendChild(child);
        }
      } else {
        element.appendChild(append);
      }
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