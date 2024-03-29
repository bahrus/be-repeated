import { PP, VirtualProps, LoopContext, ListRendererActions, IGroup } from './types';
import { TR, DTR } from 'trans-render/lib/DTR.js';
import { RenderContext } from 'trans-render/lib/types';

export const templToCtxMap = new WeakMap<HTMLTemplateElement, LoopContext>();
export const templToFooterRange = new WeakMap<HTMLTemplateElement, Range>();

export class ListRenderer implements ListRendererActions {
    #deferRendering = false;
    #prevCount = 0;

    constructor(public props: PP){
        this.#deferRendering = !!props.deferRendering;
        
    }
    async renderList({listVal, transform, proxy, templ, transformPlugins, uBound, lBound,
        beLazyPageSize, beLazyProps, beLazyClass, beLazyScaleFactor, timestampKey}: PP){
        const lazy = !!beLazyPageSize;
        if(this.#deferRendering){
            this.#deferRendering = false;
            return;
        }

        let fragment: DocumentFragment | undefined = undefined;// = document.createDocumentFragment();
        let lazyTempl: HTMLTemplateElement | undefined = undefined;
        let fragmentInsertionCount = 0;
        let idx = 0;
        let tail = proxy as Element | undefined;
        let len = listVal!.length;
        let pageLen = len;
        const parent = proxy.parentElement || proxy.getRootNode() as Element;
        if(lBound === undefined) lBound = 0;
        if(uBound === undefined) { 
            uBound = len - 1;
        }else{
            uBound = Math.min(uBound, len - 1);
            //len = uBound - lBound;
            pageLen = uBound - lBound + 1;
        }
        const isEmpty = lBound > uBound;
        for(let i = lBound; i <= uBound; i++){
            const item = listVal![i];
            const ctx = {
                match: transform,
                plugins: transformPlugins,
                timestampKey,
                host: item,
            } as RenderContext;
            if(tail !== undefined){
                let grp: IGroup | undefined;
                if(!isEmpty){
                    grp = this.findGroup(tail, `template[data-idx="${idx}"]`, idx, item);
                }
                if(isEmpty || grp!.fragment!.length > 0){
                    if(grp !== undefined){
                        if(item !== undefined){
                            await DTR.transform(grp.fragment!, ctx, undefined, grp.fragmentManager);
                        }
                        tail = grp.fragment!.pop()!;
                    }else{
                        tail = templ!;
                    }

                    idx++;
                    if(idx >= pageLen){
                        if(idx < this.#prevCount){
                            //clear out extra nodes that are no longer relevant
                            const lastTemplIdx = parent.querySelector(`template[data-idx="${this.#prevCount - 1}"]`) as HTMLElement; //TODO:  what if multiple loops in the same parent?
                            if(lastTemplIdx !== null){
                                const cnt = Number(lastTemplIdx.dataset.cnt!) - 1;
                                let ns = lastTemplIdx;
                                for(let j = 0; j < cnt; j++){
                                    ns = ns.nextElementSibling as HTMLElement;
                                }
                                const range = new Range();
                                range.setStartAfter(tail);
                                range.setEndAfter(ns);
                                range.deleteContents();
                                this.#prevCount = idx;
                                return;
                            }
                        }

                    }
                    continue;
                }else{
                    tail = undefined;
                }
            }
            if(item === undefined) continue;
            //newElements
            const idxTempl = document.createElement('template');
            templToCtxMap.set(idxTempl as any as HTMLTemplateElement, {
                idx,
                item
            });
            idxTempl.dataset.idx = idx.toString();
            idx++;

            if(fragmentInsertionCount === 0){
                lazyTempl = document.createElement('template');
                lazyTempl.setAttribute('be-lazy', beLazyProps === undefined ? '' : JSON.stringify(beLazyProps));
                if(beLazyClass !== undefined){
                    lazyTempl.classList.add(beLazyClass);
                }
                fragment = lazyTempl.content;
            }
            fragment!.append(idxTempl);
            
            fragmentInsertionCount++;
            const clone = templ!.content.cloneNode(true) as Element;
            await DTR.transform(clone, ctx, undefined, idxTempl);
            idxTempl.dataset.cnt = (clone.childElementCount + 1).toString();
            fragment!.append(clone);
            if(lazy && fragmentInsertionCount >= beLazyPageSize!){
                if(beLazyScaleFactor !== undefined){
                    lazyTempl!.style.height = beLazyPageSize! * beLazyScaleFactor + 'px';
                }
                parent.append(lazyTempl!);
                await import('be-lazy/be-lazy.js');
                fragmentInsertionCount = 0;
            }
        }
        if(lazy){
            await import('be-lazy/be-lazy.js');
            if(fragmentInsertionCount > 0) {
                if(beLazyScaleFactor !== undefined){
                    lazyTempl!.style.height = fragmentInsertionCount * beLazyScaleFactor + 'px';
                }
                parent.append(lazyTempl!);
            }
        }else{
            if(tail && tail.nextElementSibling){
                const {insertAdjacentTemplate} = await import('trans-render/lib/insertAdjacentTemplate.js');
                if(lazyTempl !== undefined){
                    //TODO:  do more research if this condition should have somehow been detected earlier
                    insertAdjacentTemplate(lazyTempl!, tail, 'afterend');
                }
                
            }else if(fragment !== undefined){
                parent.appendChild(fragment);
            }
            
        }
        
        this.#prevCount = idx;
    }

    findGroup(tail: Element, sel: string, idx: number, item: any): IGroup{
        
        const returnArr: Element[] = [];
        const returnGrp: IGroup = {
            fragment: returnArr,
        }
        let ns = tail.nextElementSibling;
        while(ns !== null){
            if(ns.matches(sel)){
                const idxTempl = ns as HTMLTemplateElement;
                returnGrp.fragmentManager = idxTempl;
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
                        return returnGrp;
                    }
                }
                return returnGrp;
            }
            ns = ns!.nextElementSibling;
        }
        return returnGrp;        
    }

    appendFooter(footerFragment: DocumentFragment | undefined, parent: Element, proxy: Element & VirtualProps, templ: HTMLTemplateElement | undefined){
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