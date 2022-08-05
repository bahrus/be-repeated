import { BeRepeatedProps, BeRepeatedVirtualProps, LoopContext, ListRendererActions } from './types';
import { TR, DTR } from 'trans-render/lib/DTR.js';
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
    async renderList({listVal, transform, proxy, templ, transformPlugins, uBound, lBound,
        beLazyPageSize, beLazyProps, beLazyClass, beLazyScaleFactor, timeStampMap}: BeRepeatedProps){
        const lazy = !!beLazyPageSize;
        if(this.#deferRendering){
            this.#deferRendering = false;
            return;
        }

        if(this.#ctx === undefined){
            this.#ctx = {
                match: transform,
                plugins: transformPlugins,
                lastTimestamp: timeStampMap,
            };
        }
        let fragment: DocumentFragment | undefined = undefined;// = document.createDocumentFragment();
        let lazyTempl: HTMLTemplateElement | undefined = undefined;
        let fragmentInsertionCount = 0;
        let idx = 0;
        let tail = proxy as Element | undefined;
        let len = listVal!.length;
        const parent = proxy.parentElement || proxy.getRootNode() as Element;
        if(lBound === undefined) lBound = 0;
        if(uBound === undefined) { 
            uBound = lBound + len;
        }else{
            uBound = Math.min(uBound, lBound + len);
            len = uBound - lBound;
        }
        const lBoundEqualsUBound = lBound === uBound;
        for(let i = lBound; i <= uBound; i++){
            const item = listVal![i];
            this.#ctx.host = item;
            if(tail !== undefined){
                let grp: Element[] | undefined;
                if(!lBoundEqualsUBound){
                    grp = this.findGroup(tail, `template[data-idx="${idx}"]`, idx, item);
                }
                if(lBoundEqualsUBound || grp!.length > 0){
                    if(grp !== undefined){
                        if(item !== undefined){
                            if(this.#tr !== undefined){
                                await this.#tr.transform(grp);
                            }else{
                                this.#tr = await DTR.transform(grp, this.#ctx);
                            }
                        }
                        if(!lBoundEqualsUBound){
    
                        }
                        tail = grp.pop()!;
                    }else{
                        tail = templ!;
                    }

                    idx++;
                    if(idx >= len){
                        if(len < this.#prevCount){
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
                                //this.appendFooter(footerFragment, parent, proxy, templ);
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
            if(this.#tr !== undefined){
                await this.#tr.transform(clone);
            }else{
                this.#tr = await DTR.transform(clone, this.#ctx);
            }
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