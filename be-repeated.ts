import {XtalDecor, XtalDecorCore} from 'xtal-decor/xtal-decor.js';
import { XtalDecorProps } from 'xtal-decor/types';
import {CE} from 'trans-render/lib/CE.js';
import { PE } from 'trans-render/lib/PE.js';
import { SplitText } from 'trans-render/lib/SplitText.js';
import { IObserve } from 'be-observant/types';
import {getElementToObserve, addListener} from 'be-observant/be-observant.js';
import {upShadowSearch} from 'trans-render/lib/upShadowSearch.js';
import {transform as xf, processTargets} from 'trans-render/lib/transform.js';

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
                const observeParams = list as IObserve;
                const elementToObserve = getElementToObserve(self, observeParams);
                if(elementToObserve === null){
                    console.warn({msg:'404',observeParams});
                    return;
                }
                addListener(elementToObserve, observeParams, 'listVal', self);
            },
            ({listVal, transform, self}) => {
                if(listVal === undefined || transform === undefined) return;
                let ctx = self.ctx;
                if(ctx === undefined){
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
                    const templ = document.createElement('template');
                    templ.dataset.idx = idx.toString();
                    idx++;
                    tail.insertAdjacentElement('afterend', templ);
                    cnt++;
                    tail = templ;
                    const clone = self.content.cloneNode(true);
                    xf(clone, ctx);
                    const children = Array.from(clone.children);

                    for(const child of children){
                        tail.insertAdjacentElement('afterend', child)!;
                        cnt++;
                        tail = child;
                    }
                }
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
                templ.content.appendChild(target);
            }
        },
        finale:(self: Element, target: Element) => {
            if(target.localName !== 'template') return;
        }
    },
    superclass: XtalDecor
});
document.head.appendChild(document.createElement('be-repeated'));