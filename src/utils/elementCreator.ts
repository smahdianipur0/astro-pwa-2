type ElementProps = {
  className?: string;
  id?: string;
  textContent?: string;
  append?: HTMLElement | HTMLElement[];
  [key: string]: any;
};

export const configureElement = <T extends HTMLElement>(element: T, { append, ...props }: ElementProps): T => {

  if (append) {
    Array.isArray(append) 
      ? element.append(...append)
      : element.append(append);
  }


  return Object.assign(element, props);
}; 