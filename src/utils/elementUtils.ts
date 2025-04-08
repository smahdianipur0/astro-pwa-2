type ElementProps = {
  className?: string;
  id?: string;
  textContent?: string;
  dataset?: {[key: string]: string;};
  append?: (HTMLElement | SVGElement) | (HTMLElement | SVGElement)[];
  [key: string]: any;
};

type ValidTagNames = keyof HTMLElementTagNameMap;
type ValidSvgTagNames = keyof SVGElementTagNameMap;

export const element = {
    configure: <T extends ValidTagNames>(tag: T, { append, dataset, ...props }: ElementProps): HTMLElementTagNameMap[T] => {
    const element = document.createElement(tag) as HTMLElementTagNameMap[T];
    
    if (append) {
      (Array.isArray(append) ? append : [append]).forEach(child =>
        element.appendChild(child)
      );
    }

    if (dataset) {
      Object.assign(element.dataset, dataset);
    }

    return Object.assign(element, props);
  },

  draw: <T extends ValidSvgTagNames>(tag: T,{ append, dataset, style, ...props }: ElementProps): SVGElementTagNameMap[T] => {
    const element = document.createElementNS("http://www.w3.org/2000/svg",tag) as SVGElementTagNameMap[T];
  
    if (append) {
      (Array.isArray(append) ? append : [append]).forEach(child =>
        element.appendChild(child)
      );
    }
  
    if (dataset) {
      Object.assign(element.dataset, dataset);
    }
  
    if (typeof style === "string") {element.style.cssText = style;}
  

    Object.entries(props).forEach(([key, value]) => {
      if (value != null) {
        element.setAttribute(key, value.toString());
      }
    });
  
    return element;
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