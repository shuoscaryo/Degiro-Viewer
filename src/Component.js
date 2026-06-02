export default class Component {
    constructor(element) {
        this.element = element;
        if (this.element)
        this.children = [];
        this.parent = null;
    }

    append(child)
    {
        // Add other Components to children list
        if (child instanceof Component)
        {
            this.children.push(child);
            child.parent = this;
            this.element.append(child.element);
        }
        else
            this.element.append(child);
    }

    remove(child)
    {
        if (child instanceof Component)
        {
            child.element.remove();
            const index = this.children.indexOf(child);
            if (index === -1)
                return;
            this.children.splice(index, 1);
            child.parent = null;
        }
        else
            child.remove();
    }

    destroy()
    {
        // Remove element from DOM first
        this.element.remove();
        this.element = null;
        // Update parent to remove this component (sets this.parent = null)
        if (this.parent !== null)
            this.parent.remove(this);
        // Destroy all children and self onDestroy
        while (this.children.length > 0)
            this.children[0].destroy();
        this.children = [];
        this.onDestroy();
    }

    mount()
    {
        this.onMount();
        this.children.forEach(child => child.mount());
    }

    // functions that can be modified by derived classes
    onDestroy(){}
    onMount(){}
};
