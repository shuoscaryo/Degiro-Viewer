/**
 * Creates a new HTML element with optional attributes and appends it to a parent.
 * 
 * @param {string} type - The type of HTML element to create (e.g., 'div', 'button').
 * @param {Object} options - Optional parameters for the element.
 * @param {HTMLElement} [options.parent=null] - The parent element to append the new element to.
 * @param {string[]} [options.classList=[]] - An array of class names to add to the element.
 * @param {string|null} [options.id=null] - The ID to assign to the element.
 * 
 * @returns {HTMLElement} The newly created element.
 */
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
