import { DTR } from 'trans-render/lib/DTR.js';
export const templToCtxMap = new WeakMap();
export const templToFooterRange = new WeakMap();
export class ListRenderer {
    props;
    #deferRendering = false;
    #prevCount = 0;
    #tr;
    #ctx;
    constructor(props) {
        this.props = props;
        this.#deferRendering = !!props.deferRendering;
    }
    async renderList({ listVal, transform, proxy, templ, transformPlugins, uBound, lBound, beLazyPageSize, beLazyProps, beLazyClass, beLazyScaleFactor }) {
        const lazy = !!beLazyPageSize;
        if (this.#deferRendering) {
            this.#deferRendering = false;
            return;
        }
        if (this.#ctx === undefined) {
            this.#ctx = {
                match: transform,
                plugins: transformPlugins,
            };
        }
        let fragment = undefined; // = document.createDocumentFragment();
        let lazyTempl = undefined;
        let fragmentInsertionCount = 0;
        let idx = 0;
        let tail = proxy;
        let len = listVal.length;
        const parent = proxy.parentElement || proxy.getRootNode();
        if (lBound === undefined)
            lBound = 0;
        if (uBound === undefined) {
            uBound = lBound + len;
        }
        else {
            uBound = Math.min(uBound, lBound + len);
            len = uBound - lBound;
        }
        for (let i = lBound; i < uBound; i++) {
            const item = listVal[i];
            this.#ctx.host = item;
            if (tail !== undefined) {
                const grp = this.findGroup(tail, `template[data-idx="${idx}"]`, idx, item);
                if (grp.length > 0) {
                    if (item !== undefined) {
                        if (this.#tr !== undefined) {
                            await this.#tr.transform(grp);
                        }
                        else {
                            this.#tr = await DTR.transform(grp, this.#ctx);
                        }
                    }
                    tail = grp.pop();
                    idx++;
                    if (idx === len) {
                        if (len < this.#prevCount) {
                            const lastTemplIdx = parent.querySelector(`template[data-idx="${this.#prevCount - 1}"]`); //TODO:  what if multiple loops in the same parent?
                            if (lastTemplIdx !== null) {
                                const cnt = Number(lastTemplIdx.dataset.cnt) - 1;
                                let ns = lastTemplIdx;
                                for (let j = 0; j < cnt; j++) {
                                    ns = ns.nextElementSibling;
                                }
                                const range = new Range();
                                range.setStartAfter(tail);
                                range.setEndAfter(ns);
                                range.deleteContents();
                                this.#prevCount = idx;
                                //this.appendFooter(footerFragment, parent, proxy, templ);
                                return;
                            }
                        }
                    }
                    continue;
                }
                else {
                    tail = undefined;
                }
            }
            if (item === undefined)
                continue;
            //newElements
            const idxTempl = document.createElement('template');
            templToCtxMap.set(idxTempl, {
                idx,
                item
            });
            idxTempl.dataset.idx = idx.toString();
            idx++;
            if (fragmentInsertionCount === 0) {
                lazyTempl = document.createElement('template');
                lazyTempl.setAttribute('be-lazy', beLazyProps === undefined ? '' : JSON.stringify(beLazyProps));
                if (beLazyClass !== undefined) {
                    lazyTempl.classList.add(beLazyClass);
                }
                fragment = lazyTempl.content;
            }
            fragment.append(idxTempl);
            fragmentInsertionCount++;
            const clone = templ.content.cloneNode(true);
            if (this.#tr !== undefined) {
                await this.#tr.transform(clone);
            }
            else {
                this.#tr = await DTR.transform(clone, this.#ctx);
            }
            idxTempl.dataset.cnt = (clone.childElementCount + 1).toString();
            fragment.append(clone);
            if (lazy && fragmentInsertionCount >= beLazyPageSize) {
                if (beLazyScaleFactor !== undefined) {
                    lazyTempl.style.height = beLazyPageSize * beLazyScaleFactor + 'px';
                }
                parent.append(lazyTempl);
                await import('be-lazy/be-lazy.js');
                fragmentInsertionCount = 0;
            }
        }
        if (lazy) {
            await import('be-lazy/be-lazy.js');
            if (fragmentInsertionCount > 0) {
                if (beLazyScaleFactor !== undefined) {
                    lazyTempl.style.height = fragmentInsertionCount * beLazyScaleFactor + 'px';
                }
                parent.append(lazyTempl);
            }
        }
        else {
            if (tail && tail.nextElementSibling) {
                const { insertAdjacentTemplate } = await import('trans-render/lib/insertAdjacentTemplate.js');
                if (lazyTempl !== undefined) {
                    //TODO:  do more research if this condition should have somehow been detected earlier
                    insertAdjacentTemplate(lazyTempl, tail, 'afterend');
                }
            }
            else if (fragment !== undefined) {
                parent.appendChild(fragment);
            }
        }
        this.#prevCount = idx;
    }
    findGroup(tail, sel, idx, item) {
        const returnArr = [];
        let ns = tail.nextElementSibling;
        while (ns !== null) {
            if (ns.matches(sel)) {
                const idxTempl = ns;
                templToCtxMap.set(idxTempl, {
                    idx,
                    item
                });
                const n = Number(idxTempl.dataset.cnt);
                for (let i = 1; i < n; i++) {
                    if (ns !== null) {
                        ns = ns.nextElementSibling;
                        if (ns !== null)
                            returnArr.push(ns);
                    }
                    else {
                        return returnArr;
                    }
                }
                return returnArr;
            }
            ns = ns.nextElementSibling;
        }
        return returnArr;
    }
    appendFooter(footerFragment, parent, proxy, templ) {
        if (footerFragment === undefined)
            return;
        const initialLastElement = parent.lastElementChild;
        parent.appendChild(footerFragment);
        const finalLastElement = parent.lastElementChild;
        const range = new Range();
        range.setStartAfter(initialLastElement);
        range.setEndAfter(finalLastElement);
        templToFooterRange.set(templ, range);
    }
}
