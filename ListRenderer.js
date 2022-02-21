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
    async renderList({ listVal, transform, proxy, templ, transformPlugins, beIntersectionalPageSize, beIntersectionalProps }) {
        const intersectional = !!beIntersectionalPageSize;
        if (this.#deferRendering) {
            this.#deferRendering = false;
            return;
        }
        // let footerFragment: DocumentFragment | undefined;
        // if(templToFooterRange.has(templ!)){
        //     footerFragment = templToFooterRange.get(templ!)!.extractContents();
        // }
        if (this.#ctx === undefined) {
            this.#ctx = {
                match: transform,
                plugins: transformPlugins,
            };
        }
        let fragment; // = document.createDocumentFragment();
        let intersectionalTempl;
        let fragmentInsertionCount = 0;
        let idx = 0;
        let tail = proxy;
        const len = listVal.length;
        const parent = proxy.parentElement || proxy.getRootNode();
        for (const item of listVal) {
            this.#ctx.host = item;
            if (tail !== undefined) {
                const grp = this.findGroup(tail, `template[data-idx="${idx}"]`, idx, item);
                if (grp.length > 0) {
                    //processTargets(this.#ctx, grp);
                    if (this.#tr !== undefined) {
                        await this.#tr.transform(grp);
                    }
                    else {
                        this.#tr = await DTR.transform(grp, this.#ctx);
                    }
                    tail = grp.pop();
                    idx++;
                    if (idx === len) {
                        if (len < this.#prevCount) {
                            const lastTemplIdx = parent.querySelector(`template[data-idx="${this.#prevCount - 1}"]`); //TODO:  what if multiple loops in the same parent?
                            if (lastTemplIdx !== null) {
                                const cnt = Number(lastTemplIdx.dataset.cnt) - 1;
                                let ns = lastTemplIdx;
                                for (let i = 0; i < cnt; i++) {
                                    ns = ns.nextElementSibling;
                                }
                                const range = new Range();
                                range.setStartAfter(tail);
                                range.setEndAfter(ns);
                                range.deleteContents();
                                this.#prevCount = len;
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
            //newElements
            const idxTempl = document.createElement('template');
            //const idxTempl = document.createComment('');
            templToCtxMap.set(idxTempl, {
                idx,
                item
            });
            idxTempl.dataset.idx = idx.toString();
            idx++;
            if (fragmentInsertionCount === 0) {
                intersectionalTempl = document.createElement('template');
                intersectionalTempl.setAttribute('be-intersectional', beIntersectionalProps === undefined ? '' : JSON.stringify(beIntersectionalProps));
                //fragment.appendChild(templ);
                fragment = intersectionalTempl.content;
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
            if (intersectional && fragmentInsertionCount >= beIntersectionalPageSize) {
                parent.append(intersectionalTempl);
                await import('be-intersectional/be-intersectional.js');
                fragmentInsertionCount = 0;
            }
        }
        if (intersectional) {
            await import('be-intersectional/be-intersectional.js');
            if (fragmentInsertionCount > 0)
                parent.append(intersectionalTempl);
        }
        else {
            if (tail && tail.nextElementSibling) {
                const { insertAdjacentTemplate } = await import('trans-render/lib/insertAdjacentTemplate.js');
                insertAdjacentTemplate(intersectionalTempl, tail, 'afterend');
            }
            else {
                parent.appendChild(fragment);
            }
        }
        this.#prevCount = len;
        //this.appendFooter(footerFragment, parent, proxy, templ);
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
