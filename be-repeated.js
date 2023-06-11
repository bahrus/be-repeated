import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
import { insertAdjacentClone } from 'trans-render/lib/insertAdjacentClone.js';
export class BeRepeated extends BE {
    static get beConfig() {
        return {
            parse: true,
        };
    }
    createTempl(self) {
        const { enhancedElement, templIdx } = self;
        if (templIdx === undefined)
            return {};
        const toBeConvertedToTemplate = Array.from(enhancedElement.querySelectorAll(`[aria-rowindex="${templIdx}"]`));
        const templ = document.createElement('template');
        for (const el of toBeConvertedToTemplate) {
            templ.content.appendChild(el.cloneNode(true));
        }
        return {
            templ,
        };
    }
    #updateRefs(self) {
        this.#refs = new Map();
        const { enhancedElement, startIdx, endIdx } = self;
        const indices = Array.from(enhancedElement.querySelectorAll(':scope > [aria-rowindex]'));
        const refs = this.#refs;
        for (const indx of indices) {
            const num = Number(indx.getAttribute('aria-rowindex'));
            if (num < startIdx) {
                indx.remove();
            }
            else {
                let weakRefs = refs.get(num);
                if (weakRefs === undefined) {
                    weakRefs = [];
                    refs.set(num, weakRefs);
                }
                weakRefs.push(new WeakRef(indx));
            }
        }
    }
    #purgeRefs(self) {
        const { enhancedElement, startIdx, endIdx } = self;
        const elsToPurge = [];
        for (const [key, val] of this.#refs) {
            if (key < startIdx || key > endIdx) {
                elsToPurge.push({
                    key,
                    refs: val
                });
            }
        }
        for (const elToPUrge of elsToPurge) {
            const { key, refs } = elToPUrge;
            for (const ref of refs) {
                const el = ref.deref();
                if (el !== undefined)
                    el.remove();
            }
            this.#refs?.delete(key);
        }
    }
    #refs;
    cloneIfNeeded(self, newRows) {
        const { startIdx, endIdx, templ, enhancedElement } = self;
        if (this.#refs === undefined) {
            this.#updateRefs(self);
        }
        else {
            this.#purgeRefs(self);
        }
        let lastFoundEl;
        const refs = this.#refs;
        if (newRows === undefined)
            newRows = [];
        for (let idx = startIdx; idx <= endIdx; idx++) {
            if (refs.has(idx)) {
                const deref = refs.get(idx).at(-1)?.deref();
                if (deref !== undefined) {
                    lastFoundEl = deref;
                    continue;
                }
                else {
                    this.#updateRefs(self);
                    this.cloneIfNeeded(self, newRows);
                    return {};
                }
            }
            else {
                const clone = templ.content.cloneNode(true);
                const nodes = Array.from(clone.childNodes);
                const children = Array.from(clone.children);
                const lastNode = children.at(-1);
                refs.set(idx, children.map(child => new WeakRef(child)));
                for (const node of nodes) {
                    if (node instanceof Element) {
                        node.ariaRowIndex = idx.toString();
                    }
                }
                const row = {
                    idx,
                    nodes
                };
                newRows.push(row);
                if (lastFoundEl === undefined) {
                    if (refs.keys.length > 0) {
                        enhancedElement.prepend(clone);
                    }
                    else {
                        enhancedElement.appendChild(clone);
                    }
                }
                else {
                    if (lastFoundEl.nextElementSibling === null) {
                        enhancedElement.appendChild(clone);
                    }
                    else {
                        insertAdjacentClone(clone, lastFoundEl, 'afterend');
                    }
                }
                lastFoundEl = lastNode;
            }
        }
        this.dispatchEvent(new CustomEvent('newRows', {
            detail: {
                newRows
            }
        }));
    }
}
const tagName = 'be-repeated';
const ifWantsToBe = 'repeated';
const upgrade = '*';
const xe = new XE({
    config: {
        tagName,
        propDefaults: {
            ...propDefaults,
            resolved: true,
        },
        propInfo: {
            ...propInfo,
            // newRows: {
            //     notify:{
            //         dispatch: true
            //     }
            // }
        },
        actions: {
            createTempl: {
                ifKeyIn: ['templIdx'],
            },
            cloneIfNeeded: {
                ifAllOf: ['startIdx', 'endIdx', 'templ']
            }
        }
    },
    superclass: BeRepeated
});
register(ifWantsToBe, upgrade, tagName);
