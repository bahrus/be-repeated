import {BeRepeatedProps, BeRepeatedVirtualProps, LoopContext, ListRendererActions} from './types';
import { PE } from 'trans-render/lib/PE.js';
import { SplitText } from 'trans-render/lib/SplitText.js';
//import {transform as xf, processTargets} from 'trans-render/lib/transform.js';
import {TR, DTR} from 'trans-render/lib/DTR.js';
import { RenderContext } from 'trans-render/lib/types';

export const templToCtxMap = new WeakMap<HTMLTemplateElement, LoopContext>();
export const templToFooterRange = new WeakMap<HTMLTemplateElement, Range>();

export class ListRenderer implements ListRendererActions {
    #deferRendering = false;
    #prevCount = 0;
    #tr?: TR;
    #ctx: RenderContext | undefined;
    constructor(public props: BeRepeatedProps){
        this.#deferRendering = !!props.deferRendering;
        
    }
    async renderList({listVal, transform, proxy, templ, transformPlugins}: BeRepeatedProps){
        if(this.#deferRendering){
            this.#deferRendering = false;
            return;
        }
        let footerFragment: DocumentFragment | undefined;
        if(templToFooterRange.has(templ!)){
            footerFragment = templToFooterRange.get(templ!)!.extractContents();
        }
        if(this.#ctx === undefined){
            this.#ctx = {
                match: transform,
                plugins: transformPlugins,
            };
        }
        const fragment = document.createDocumentFragment();
        let idx = 0;
        let tail = proxy as Element | undefined;
        const len = listVal!.length;
        const parent = proxy.parentElement || proxy.getRootNode() as Element;
        for(const item of listVal!){
            this.#ctx.host = item;
            if(tail !== undefined){
                const grp = this.findGroup(tail, `template[data-idx="${idx}"]`, idx, item);
                if(grp.length > 0){
                    //processTargets(this.#ctx, grp);
                    if(this.#tr !== undefined){
                        this.#tr.transform(grp);
                    }else{
                        this.#tr = await DTR.transform(grp, this.#ctx);
                    }
                    tail = grp.pop()!;
                    idx++;
                    if(idx === len){
                        if(len < this.#prevCount){
                            const lastTemplIdx = parent.querySelector(`template[data-idx="${this.#prevCount - 1}"]`) as HTMLElement; //TODO:  what if multiple loops in the same parent?
                            if(lastTemplIdx !== null){
                                const cnt = Number(lastTemplIdx.dataset.cnt!) - 1;
                                let ns = lastTemplIdx;
                                for(let i = 0; i < cnt; i++){
                                    ns = ns.nextElementSibling as HTMLElement;
                                }
                                const range = new Range();
                                range.setStartAfter(tail);
                                range.setEndAfter(ns);
                                range.deleteContents();
                                this.#prevCount = len;
                                this.appendFooter(footerFragment, parent, proxy, templ);
                                return;
                            }
                        }

                    }
                    continue;
                }else{
                    tail = undefined;
                }
            }
            const idxTempl = document.createElement('template');
            
            templToCtxMap.set(idxTempl, {
                idx,
                item
            });
            idxTempl.dataset.idx = idx.toString();
            idx++;
            fragment.append(idxTempl);
            const clone = templ!.content.cloneNode(true) as Element;
            if(this.#tr !== undefined){
                this.#tr.transform(clone);
            }else{
                this.#tr = await DTR.transform(clone, this.#ctx);
            }
            idxTempl.dataset.cnt = (clone.childElementCount + 1).toString();
            fragment.append(clone);
        }
        parent.append(fragment);
        this.#prevCount = len;
        this.appendFooter(footerFragment, parent, proxy, templ);
    }

    findGroup(tail: Element, sel: string, idx: number, item: any){
        const returnArr: Element[] = [];
        let ns = tail.nextElementSibling;
        while(ns !== null){
            if(ns.matches(sel)){
                const idxTempl = ns as HTMLTemplateElement;
                templToCtxMap.set(idxTempl, {
                    idx,
                    item
                });
                const n = Number(idxTempl.dataset.cnt);
                for(let i = 1; i < n; i++){
                    if(ns !== null) {
                        ns = ns.nextElementSibling;
                        if(ns !== null) returnArr.push(ns);
                    }else{
                        return returnArr;
                    }
                }
                return returnArr;
            }
            ns = ns!.nextElementSibling;
        }
        return returnArr;        
    }

    appendFooter(footerFragment: DocumentFragment | undefined, parent: Element, proxy: Element & BeRepeatedVirtualProps, templ: HTMLTemplateElement | undefined){
        if(footerFragment === undefined) return;
        const initialLastElement = parent.lastElementChild!;
        parent.appendChild(footerFragment);
        const finalLastElement = parent.lastElementChild!;
        const range = new Range();
        range.setStartAfter(initialLastElement);
        range.setEndAfter(finalLastElement);
        templToFooterRange.set(templ!, range);
    }
}