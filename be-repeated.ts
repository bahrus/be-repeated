import {XtalDecor, XtalDecorCore} from 'xtal-decor/xtal-decor.js';
import { XtalDecorProps } from 'xtal-decor/types';
import {CE} from 'trans-render/lib/CE.js';
import { PE } from 'trans-render/lib/PE.js';
import { SplitText } from 'trans-render/lib/SplitText.js';
import { IObserve } from 'be-observant/types';
import {getElementToObserve, addListener} from 'be-observant/be-observant.js';
import {upShadowSearch} from 'trans-render/lib/upShadowSearch.js';
import {transform as xf, processTargets} from 'trans-render/lib/transform.js';

const firstElementMap = new WeakMap<HTMLTemplateElement, Element>();

const ce = new CE<XtalDecorCore<Element>>({
    config:{
        tagName: 'be-repeated',
        propDefaults:{
            upgrade: '*',
            ifWantsToBe: 'repeated',
            forceVisible: true,
            virtualProps: ['eventHandlers', 'list', 'listVal', 'transform', 'ctx']
        }
    },
    complexPropDefaults: {
        actions:[
            ({list, self}) => {
                if(Array.isArray(list)){
                    self.listVal = list;
                    return;
                }
                const observeParams = ((typeof list === 'string') ? {vft: list} : list) as IObserve;
                const elementToObserve = getElementToObserve(self, observeParams);
                if(elementToObserve === null){
                    console.warn({msg:'404',observeParams});
                    return;
                }
                addListener(elementToObserve, observeParams, 'listVal', self);
            },
            ({listVal, transform, self, target}) => {
                if(listVal === undefined || transform === undefined) return;
                let ctx = self.ctx;
                let firstTime = false;
                if(ctx === undefined){
                    firstTime = true;
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
                    self.ctx = ctx;
                }
                
                let tail = self;
                let cnt = 0;
                let idx = 0;
                for(const item of listVal){
                    ctx.host = item;
                    if(firstTime){
                        const rs = cloneAndTransform(idx, tail, cnt, ctx, self, target);
                        tail = rs.tail;
                        cnt = rs.cnt;
                        idx = rs.idx;
                    }else{
                        const grp = findGroup(tail, `[data-idx="${idx}"]`);
                        const len = grp.length;
                        if(len > 0){
                            for(const el of grp){
                                el.classList.remove('be-repeated-hidden');
                            }
                            cnt += len + 1; //count template
                            processTargets(ctx, grp);
                            tail = grp.pop();
                            idx++;
                        }else{
                            const rs = cloneAndTransform(idx, tail, cnt, ctx, self);
                            tail = rs.tail;
                            cnt = rs.cnt;
                            idx = rs.idx;         
                        }

                    }
                    

                }
                const prevCnt = Number(self.dataset.cnt);
                while(idx < prevCnt){
                    const grp = findGroup(tail, `[data-idx="${idx}"]`);
                    const len = grp.length;
                    if(len > 0){
                        for(const el of grp){
                            el.classList.add('be-repeated-hidden');
                        }
                        cnt += len + 1;
                    }
                    idx++;
                    
                }
                if(cnt === 0) debugger;
                self.dataset.cnt = cnt.toString();
            }
        ],
        on:{},
        init:(self: Element, xtalDecor: XtalDecorProps<Element>, target: Element) => {
            if(self.localName !== 'template'){
                const templ = document.createElement('template');
                const attrIs = 'is-' + xtalDecor.ifWantsToBe;
                const attrBe = 'be-' + xtalDecor.ifWantsToBe;
                templ.setAttribute(attrBe, self.getAttribute(attrIs)!);
                self.insertAdjacentElement('afterend', templ);
                target.removeAttribute(attrIs);
                const clonedTarget = target.cloneNode(true);
                firstElementMap.set(templ, target);
                templ.content.appendChild(clonedTarget);
            }
        },
        finale:(self: Element, target: Element) => {
            if(target.localName !== 'template') return;
        }
    },
    superclass: XtalDecor
});
function findGroup(tail: Element, sel: string){
    const returnArr: Element[] = [];
    let ns = tail.nextElementSibling;
    while(ns !== null){
        if(ns.matches(sel)){
            const n = Number((ns as HTMLTemplateElement).dataset.cnt);
            for(let i = 0; i < n; i++){
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
function cloneAndTransform(idx: number, tail: Element, cnt: number, ctx: any, self: HTMLTemplateElement, target?: HTMLTemplateElement){
    const templ = document.createElement('template');
    templ.dataset.idx = idx.toString();
    idx++;
    tail.insertAdjacentElement('afterend', templ);
    cnt++;
    tail = templ;
    let templCount = 0;
    let children: Element[] = [];
    if(target !== undefined && firstElementMap.has(target)){
        const originalEl = firstElementMap.get(target)!;
        children = [originalEl];
        processTargets(ctx, children);
        firstElementMap.delete(target);
        //console.log(originalEl);
    }else{
        const clone = self.content.cloneNode(true) as Element;
        xf(clone, ctx);
        children = Array.from(clone.children);
    }


    for(const child of children){
        tail.insertAdjacentElement('afterend', child)!;
        cnt++;
        templCount++;
        tail = child;
    }
    templ.dataset.cnt = templCount.toString();
    return {idx, tail, cnt};
}
document.head.appendChild(document.createElement('be-repeated'));