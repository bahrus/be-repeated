import {BeRepeatedProps, BeRepeatedActions, BeRepeatedVirtualProps} from './types';
import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {IObserve} from 'be-observant/types';
import {getElementToObserve, addListener} from 'be-observant/be-observant.js';
import { PE } from 'trans-render/lib/PE.js';
import { SplitText } from 'trans-render/lib/SplitText.js';
import {transform as xf, processTargets} from 'trans-render/lib/transform.js';

const firstElementMap = new WeakMap<HTMLTemplateElement, Element>();

export class BeRepeatedController implements BeRepeatedActions {
    intro(proxy: Element & BeRepeatedVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        if(proxy.localName !== 'template'){
            const templ = document.createElement('template');
            const attrIs = 'is-' + beDecorProps.ifWantsToBe;
            const attrBe = 'be-' + beDecorProps.ifWantsToBe;
            templ.setAttribute(attrBe, proxy.getAttribute(attrIs)!);
            proxy.insertAdjacentElement('beforebegin', templ);
            target.removeAttribute(attrIs);
            const clonedTarget = target.cloneNode(true) as Element;
            firstElementMap.set(templ, target);
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
        const observeParams = ((typeof list === 'string') ? {vft: list} : list) as IObserve;
        const elementToObserve = getElementToObserve(proxy, observeParams);
        if(elementToObserve === null){
            console.warn({msg:'404',observeParams});
            return;
        }
        addListener(elementToObserve, observeParams, 'listVal', proxy);
    }
    renderList({listVal, transform, proxy, templ, ctx}: this){
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
            proxy.ctx = ctx;
        }
        
        let tail = templ as Element;
        let cnt = 0;
        let idx = 0;
        for(const item of listVal){
            ctx.host = item;
            if(firstTime){
                const rs = cloneAndTransform(idx, tail, cnt, ctx, proxy, templ);
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
                    tail = grp.pop() as Element;
                    idx++;
                }else{
                    const rs = cloneAndTransform(idx, tail, cnt, ctx, proxy);
                    tail = rs.tail;
                    cnt = rs.cnt;
                    idx = rs.idx;         
                }

            }
            

        }
        const prevCnt = Number(proxy.dataset.cnt);
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
        proxy.dataset.cnt = cnt.toString();
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
            forceVisible: true,
            intro: 'intro',
            finale: 'finale',
            virtualProps: ['ctx', 'eventHandlers', 'list', 'listVal', 'templ', 'transform'],
        },
        actions:{
            onList:{
                ifAllOf:['list']
            },
            renderList:{
                ifAllOf:['transform', 'listVal', 'templ']
            }
        }
    },
    complexPropDefaults:{
        controller: BeRepeatedController
    }
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
    // tail.insertAdjacentElement('afterend', templ);
    
    let templCount = 0;
    let children: Element[] = [];
    if(target !== undefined && firstElementMap.has(target)){
        const originalEl = firstElementMap.get(target)!;
        originalEl.insertAdjacentElement('beforebegin', templ);
        cnt++;
        tail = originalEl;
        children = [originalEl];
        processTargets(ctx, children);
        cnt++;
        templCount++;
        firstElementMap.delete(target);
        //console.log(originalEl);
    }else{
        tail.insertAdjacentElement('afterend', templ);
        cnt++;
        tail = templ;
        const clone = self.content.cloneNode(true) as Element;
        xf(clone, ctx);
        children = Array.from(clone.children);
        for(const child of children){
            tail.insertAdjacentElement('afterend', child)!;
            cnt++;
            templCount++;
            tail = child;
        }
    }
    templ.dataset.cnt = templCount.toString();
    return {idx, tail, cnt};
}
const beHive = document.querySelector('be-hive') as any;
if(beHive !== null){
    customElements.whenDefined(beHive.localName).then(() => {
        beHive.register({
            ifWantsToBe,
            upgrade,
            localName: tagName,
        })
    })
}else{
    document.head.appendChild(document.createElement(tagName));
}