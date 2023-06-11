import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA, Row} from './types';
import {register} from 'be-hive/register.js';
import {insertAdjacentClone} from 'trans-render/lib/insertAdjacentClone.js'

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

    createTempl(self: this): PAP {
        const {enhancedElement, templIdx} = self;
        if(templIdx === undefined) return {};
        const toBeConvertedToTemplate = Array.from(enhancedElement.querySelectorAll(`[aria-rowindex="${templIdx}"]`));
        
        const templ = document.createElement('template');
        for(const el of toBeConvertedToTemplate){
            templ.content.appendChild(el.cloneNode(true));
        }
        return {
            templ,
        }
    }

    #updateRefs(self: this){
        this.#refs = new Map<number, WeakRef<Element>[]>();
        const {enhancedElement, startIdx, endIdx} = self;
        const indices = Array.from(enhancedElement.querySelectorAll(':scope > [aria-rowindex]'));
        const refs = this.#refs;
        for(const indx of indices){
            const num = Number(indx.getAttribute('aria-rowindex')!);
            if(num < startIdx!){
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
        const elsToPurge: keyVal[] = [];
        for(const [key, val] of this.#refs!){
            if(key < startIdx! || key > endIdx!){
                elsToPurge.push({
                    key,
                    refs: val
                });
                
            }
        }
        for(const elToPUrge of elsToPurge){
            const {key, refs} = elToPUrge;
            for(const ref of refs){
                const el = ref.deref();
                if(el !== undefined) el.remove();
            }
            
            this.#refs?.delete(key);
        }
    }

    #refs: Map<number, WeakRef<Element>[]> | undefined;
    cloneIfNeeded(self: this, newRows?: Row[]){
        const {startIdx, endIdx, templ, enhancedElement} = self;
        if(this.#refs === undefined){
            this.#updateRefs(self);
        }else{
            this.#purgeRefs(self);
        }
        let lastFoundEl: Element | undefined;
        const refs = this.#refs!;
        if(newRows === undefined) newRows = [];
        for(let idx = startIdx!; idx <= endIdx!; idx++){
            if(refs.has(idx)){
                const deref = refs.get(idx)!.at(-1)?.deref();
                if(deref !== undefined){
                    lastFoundEl = deref;
                    continue;
                }else{
                    this.#updateRefs(self);
                    this.cloneIfNeeded(self, newRows);
                    return {};
                }
            }else{
                const clone = templ.content.cloneNode(true) as DocumentFragment;
                const nodes = Array.from(clone.childNodes);
                const children = Array.from(clone.children);
                const lastNode = children.at(-1);
                refs.set(idx, children.map(child => new WeakRef<Element>(child)));
                for(const node of nodes){
                    if(node instanceof Element){
                        node.ariaRowIndex = idx.toString();
                        
                    }
                }
                const row: Row = {
                    idx,
                    nodes
                };
                newRows.push(row);
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
        this.dispatchEvent(new CustomEvent('newRows', {
            detail: {
                newRows
            }
        }))

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