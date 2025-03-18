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
}; 