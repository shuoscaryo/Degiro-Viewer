export function newElement(type, {
    parent = null,
    classList = [],
    ...props
    } = {}
) {
    const element = document.createElement(type);
  
    if (classList.length) element.classList.add(...classList);
    if (parent) parent.append(element);
  
    Object.assign(element, props);
  
    return element;
}
