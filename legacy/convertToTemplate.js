export async function convertToTemplate(proxy, target, beDecorProps) {
    const ns = proxy.nextElementSibling;
    const templ = document.createElement('template');
    if (ns !== null) {
        const range = new Range();
        range.setStartBefore(ns);
        const parent = proxy.parentElement || proxy.getRootNode();
        range.setEndAfter(parent.lastElementChild);
        const { templToFooterRange } = await import('./ListRenderer.js');
        templToFooterRange.set(templ, range);
    }
    const attrIs = 'is-' + beDecorProps.ifWantsToBe;
    const attrBe = 'be-' + beDecorProps.ifWantsToBe;
    templ.setAttribute(attrBe, proxy.getAttribute(attrIs));
    proxy.insertAdjacentElement('beforebegin', templ);
    target.removeAttribute(attrIs);
    const clonedTarget = target.cloneNode(true);
    //firstElementMap.set(templ, target);
    const attribs = clonedTarget.attributes;
    for (const attrib of attribs) {
        const name = attrib.name;
        if (name.startsWith('is-')) {
            const newName = 'be-' + name.substr(3);
            clonedTarget.setAttribute(newName, attrib.value);
            clonedTarget.removeAttribute(name);
        }
    }
    templ.content.appendChild(clonedTarget);
    //create first templ index
    const templIdx = document.createElement('template');
    templIdx.dataset.cnt = "2";
    templIdx.dataset.idx = "0";
    templ.insertAdjacentElement('afterend', templIdx);
}
