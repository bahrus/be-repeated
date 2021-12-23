import {BeRepeatedProps, BeRepeatedActions, BeRepeatedVirtualProps, LoopContext} from './types';
import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import { hookUp } from 'be-observant/hookUp.js';
import { PE } from 'trans-render/lib/PE.js';
import { SplitText } from 'trans-render/lib/SplitText.js';
import {transform as xf, processTargets} from 'trans-render/lib/transform.js';
import {register} from 'be-hive/register.js';
import {upSearch} from 'trans-render/lib/upSearch.js';

//const firstElementMap = new WeakMap<HTMLTemplateElement, Element>();
const templToCtxMap = new WeakMap<HTMLTemplateElement, LoopContext>();
const templToFooterRange = new WeakMap<HTMLTemplateElement, Range>();

export class BeRepeatedController implements BeRepeatedActions {
    //#footerRange: Range | undefined;
    intro(proxy: Element & BeRepeatedVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        if(proxy.localName !== 'template'){
            const ns = proxy.nextElementSibling;
            const templ = document.createElement('template');
            if(ns !== null){
                const range = new Range();
                range.setStartBefore(ns);
                const parent = proxy.parentElement || proxy.getRootNode() as Element;
                range.setEndAfter(parent.lastElementChild!);
                templToFooterRange.set(templ, range);
            }
            const attrIs = 'is-' + beDecorProps.ifWantsToBe;
            const attrBe = 'be-' + beDecorProps.ifWantsToBe;
            templ.setAttribute(attrBe, proxy.getAttribute(attrIs)!);
            proxy.insertAdjacentElement('beforebegin', templ);
            target.removeAttribute(attrIs);
            const clonedTarget = target.cloneNode(true) as Element;
            //firstElementMap.set(templ, target);
            const attribs = clonedTarget.attributes;
            for(const attrib of attribs){
                const name = attrib.name;
                if(name.startsWith('is-')){
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
        }else{
            proxy.templ = target as HTMLTemplateElement;
        }
    }
    finale(proxy: Element & BeRepeatedVirtualProps, target:Element){
        if(target.localName !== 'template') return; //[TODO]: ?
    }
    onList({list, proxy}: this){
        if(Array.isArray(list)){
            proxy.listVal = list;
            return;
        }
        hookUp(list, proxy, 'listVal');
    }
    #prevCount = 0;
    renderList({listVal, transform, proxy, templ, ctx, }: this){
        let footerFragment: DocumentFragment | undefined;
        if(templToFooterRange.has(proxy.templ)){
            footerFragment = templToFooterRange.get(proxy.templ)!.extractContents();
        }
        //let firstTime = false;
        if(ctx === undefined){
            //firstTime = true;
            ctx ={
                match: transform,
                postMatch: [
                    {
                        rhsType: Array,
                        rhsHeadType: Object,
                        ctor: PE
                    },
                    {
                        rhsType: Array,
                        rhsHeadType: String,
                        ctor: SplitText
                    },
                    {
                        rhsType: String,
                        ctor: SplitText,
                    }
                ],
            };
            proxy.ctx = ctx;
        }
        const fragment = document.createDocumentFragment();
        let idx = 0;
        let tail = proxy as Element | undefined;
        const len = listVal.length;
        const parent = proxy.parentElement || proxy.getRootNode() as Element;
        for(const item of listVal){
            ctx.host = item;
            if(tail !== undefined){
                const grp = this.findGroup(tail, `template[data-idx="${idx}"]`, idx, item);
                if(grp.length > 0){
                    processTargets(ctx, grp);
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
                                this.appendFooter(footerFragment, parent, proxy);
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
            const clone = templ.content.cloneNode(true) as Element;
            
            xf(clone , ctx);
            idxTempl.dataset.cnt = (clone.childElementCount + 1).toString();
            fragment.append(clone);
        }
        parent.append(fragment);
        this.#prevCount = len;
        this.appendFooter(footerFragment, parent, proxy);
    }

    onNestedLoopProp({nestedLoopProp, proxy}: this){
        const templ = upSearch(this.proxy, 'template[data-idx]') as HTMLTemplateElement;
        const loopContext = templToCtxMap.get(templ);
        const subList = loopContext!.item[nestedLoopProp];
        proxy.listVal = subList;
    }

    appendFooter(footerFragment: DocumentFragment | undefined, parent: Element, proxy: HTMLTemplateElement & BeRepeatedVirtualProps){
        if(footerFragment === undefined) return;
        const initialLastElement = parent.lastElementChild!;
        parent.appendChild(footerFragment);
        const finalLastElement = parent.lastElementChild!;
        const range = new Range();
        range.setStartAfter(initialLastElement);
        range.setEndAfter(finalLastElement);
        templToFooterRange.set(proxy.templ, range);
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
}

export interface BeRepeatedController extends BeRepeatedProps{}

const tagName = 'be-repeated';

const ifWantsToBe = 'repeated';

const upgrade = '*';

define<BeRepeatedProps & BeDecoratedProps<BeRepeatedProps, BeRepeatedActions>, BeRepeatedActions>({
    config:{
        tagName,
        propDefaults:{
            upgrade,
            ifWantsToBe,
            forceVisible: ['template'],
            intro: 'intro',
            finale: 'finale',
            virtualProps: ['ctx', 'eventHandlers', 'list', 'listVal', 'templ', 'transform', 'nestedLoopProp'],
        },
        actions:{
            onList:'list',
            renderList:{
                ifAllOf:['transform', 'listVal', 'templ']
            },
            onNestedLoopProp:'nestedLoopProp'
        }
    },
    complexPropDefaults:{
        controller: BeRepeatedController
    }
});

register(ifWantsToBe, upgrade, tagName);

