import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA, Row, WRM} from './types';
import {register} from 'be-hive/register.js';
import {insertAdjacentClone} from 'trans-render/lib/insertAdjacentClone.js'
import {cache, restore} from 'trans-render/lib/cache.js';
import {toTempl} from 'be-hive/toTempl.js';

interface keyVal {
    key: number,
    refs: WeakRef<Element>[],
}
export class BeRepeated extends BE<AP, Actions> implements Actions{
    static override get beConfig(){
        return {
            parse: true,
        }
    }

    async createTempl(self: this): PAP {
        const {enhancedElement, templIdx} = self;
        if(templIdx === undefined) return {};
        const toBeConvertedToTemplate = Array.from(enhancedElement.querySelectorAll(`[aria-rowindex="${templIdx}"]`));
        
        let div = document.createElement('div');
        for(const el of toBeConvertedToTemplate){
            div.appendChild(el.cloneNode(true));
        }
        const templ = await toTempl(div, false, enhancedElement);
        cache(templ);
        return {
            templ,
        }
    }

    #initializeRefs(self: this){
        this.#refs = new Map<number, WeakRef<Element>[]>();
        const {enhancedElement, startIdx, endIdx} = self;
        const indices = Array.from(enhancedElement.querySelectorAll(':scope > [aria-rowindex]'));
        const refs = this.#refs;
        for(const indx of indices){
            const num = Number(indx.getAttribute('aria-rowindex')!);
            if(num === 0){
                indx.remove();
            }else{
                let weakRefs = refs.get(num);
                if(weakRefs === undefined){
                    weakRefs = [] as WeakRef<Element>[];
                    refs.set(num, weakRefs);
                }
                weakRefs.push(new WeakRef(indx));
            
            }
            
        }
    }


    #purgeRefs(self: this){
        const {enhancedElement, startIdx, endIdx} = self;
        const renamedRefs: WRM = new Map<number, WeakRef<Element>[]>();
        const elsToPurge: keyVal[] = [];
        let reusePt = startIdx!;
        const refs = this.#refs!;
        for(const [key, val] of refs){
            if(key < startIdx! || key > endIdx!){
                if(reusePt > endIdx! || refs.has(key)){
                    elsToPurge.push({
                        key,
                        refs: val
                    });
                }else{
                    for(const ref of val){
                        const deref = ref.deref();
                        if(deref !== undefined){
                            deref.setAttribute('aria-rowindex', reusePt.toString());
                        }
                    }
                    renamedRefs.set(reusePt, val);
                }

                
            }
            reusePt++;
        }
        for(const elToPUrge of elsToPurge){
            const {key, refs} = elToPUrge;
            for(const ref of refs){
                const el = ref.deref();
                if(el !== undefined) el.remove();
            }
            
            this.#refs?.delete(key);
        }
        for(const [key, val] of renamedRefs){
            refs.set(key, val);
        }
        return {
            renamedRefs,
        }
    }

    #validateRowStillExists(idx: number){
        const rowRefs = this.#refs?.get(idx)!;
        let lastRef: Element | undefined;
        const children: Element[] = [];
        for(const ref of rowRefs){
            lastRef = ref.deref() as Element;
            if(lastRef === undefined) return false;
            children.push(lastRef);
        }
        return {
            lastRef,
            children
        }
    }

    #refs: WRM | undefined;
    async cloneIfNeeded(self: this, rows?: Row[]){
        //const t0 = performance.now();
        const {startIdx, endIdx, templ, enhancedElement, rowHandler, rendering} = self;
        if(rendering !== undefined && rendering[0] === startIdx && rendering[1] === endIdx) return {} as PAP;
        self.rendering = [startIdx!, endIdx!];
        self.startCnt!++;
        let renamedRefs: WRM | undefined;
        if(this.#refs === undefined){
            this.#initializeRefs(self);
        }else{
            renamedRefs = this.#purgeRefs(self).renamedRefs;
        }
        let lastFoundEl: Element | undefined;
        const refs = this.#refs!;
        if(rows === undefined) rows = [];
        if(renamedRefs !== undefined){
            for(const [idx, children] of renamedRefs){
                const row: Row = {
                    idx,
                    children: children.map(child => child.deref() as Element),
                    condition: 'renamed'
                }
                if(rowHandler !== undefined) await rowHandler(row)
                rows.push(row);
            }
        }
        for(let idx = startIdx!; idx <= endIdx!; idx++){
            if(self.cancel){
                //console.log('canceling');
                return {
                    cancel: false,
                    endCnt: self.endCnt! + 1,
                    
                } as PAP
            }
            if(refs.has(idx)){
                const returnObj = this.#validateRowStillExists(idx);
                if(returnObj === false){
                    this.#initializeRefs(self);
                    this.cloneIfNeeded(self, rows);
                    return {};
                }else{
                    lastFoundEl = returnObj.lastRef;
                    const {children} = returnObj
                    const row: Row = {
                        idx,
                        children,
                        condition: 'existing'
                    }
                    if(rowHandler !== undefined) await rowHandler(row);
                    rows.push(row);
                }
            }else{
                const clone = templ.content.cloneNode(true) as DocumentFragment;
                await restore(clone);
                const children = Array.from(clone.children);
                const lastNode = children.at(-1);
                refs.set(idx, children.map(child => new WeakRef<Element>(child)));
                for(const node of children){
                    node.ariaRowIndex = idx.toString();
                }
                const row: Row = {
                    idx,
                    children,
                    condition: 'new'
                };
                if(rowHandler !== undefined) await rowHandler(row);
                rows.push(row);
                if(lastFoundEl === undefined){
                    if(refs.keys.length > 0){
                        enhancedElement.prepend(clone);
                    }else{
                        enhancedElement.appendChild(clone);
                    }
                    
                }else{
                    if(lastFoundEl.nextElementSibling === null){
                        enhancedElement.appendChild(clone);
                    }else{
                        insertAdjacentClone(clone, lastFoundEl, 'afterend');
                    }
                }
                lastFoundEl = lastNode;
            }
        }
        this.dispatchEvent(new CustomEvent('rows', {
            detail: {
                rows
            }
        }));
        return {
            endCnt: self.endCnt! + 1
        } as PAP;
        //const t1 = performance.now();
        //console.log("Elapsed: " + (t1 - t0));
    }

    cancelIfNeeded(self: this){
        const {startCnt, endCnt, startIdx, endIdx, rendering} = self;
        //console.log({startCnt, endCnt, startIdx, endIdx, rendering});
        if(rendering === undefined) return {};
        if(rendering[0] === startIdx && rendering[1] === endIdx) return {};
        if(startCnt === endCnt) return {};
        //console.log('initiate cancel');
        return {
            cancel: true
        }
    }
}

export interface BeRepeated extends AllProps{}

const tagName = 'be-repeated';
const ifWantsToBe = 'repeated';
const upgrade = '*';

const xe = new XE<AP, Actions>({
    config: {
        tagName,
        propDefaults: {
            ...propDefaults,
            resolved: true,
            startCnt: 0,
            endCnt: 0,
        },
        propInfo: {
            ...propInfo,
            rowHandler: {
                type: 'Object',
                parse: false,
            },
            cancel:{
                type: 'Boolean'
            },
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
                ifAllOf: ['startIdx', 'endIdx', 'templ'],
                ifEquals: ['startCnt', 'endCnt']
            },
            cancelIfNeeded: {
                ifAllOf: ['startIdx', 'endIdx', 'templ']
            }
        }
    },
    superclass: BeRepeated
});

register(ifWantsToBe, upgrade, tagName);