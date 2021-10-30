import {BeRepeatedProps, BeRepeatedActions, BeRepeatedVirtualProps, LoopContext} from './types';
import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import { hookUp } from 'be-observant/hookUp.js';
import { PE } from 'trans-render/lib/PE.js';
import { SplitText } from 'trans-render/lib/SplitText.js';
import {transform as xf, processTargets} from 'trans-render/lib/transform.js';
import {register} from 'be-hive/register.js';
import {upSearch} from 'trans-render/lib/upSearch.js';

const firstElementMap = new WeakMap<HTMLTemplateElement, Element>();
const templToCtxMap = new WeakMap<HTMLTemplateElement, LoopContext>();

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
        hookUp(list, proxy, 'listVal');
    }
    renderList({listVal, transform, proxy, templ, ctx}: this){
    }

    onNestedLoopProp({nestedLoopProp, proxy}: this){
        const templ = upSearch(this.proxy, 'template[data-idx]') as HTMLTemplateElement;
        const loopContext = templToCtxMap.get(templ);
        const subList = loopContext!.item[nestedLoopProp];
        proxy.listVal = subList;
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
            virtualProps: ['ctx', 'eventHandlers', 'list', 'listVal', 'templ', 'transform', 'nestedLoopProp'],
        },
        actions:{
            onList:{
                ifAllOf:['list']
            },
            renderList:{
                ifAllOf:['transform', 'listVal', 'templ']
            },
            onNestedLoopProp:{
                ifAllOf:['nestedLoopProp']
            }
        }
    },
    complexPropDefaults:{
        controller: BeRepeatedController
    }
});

register(ifWantsToBe, upgrade, tagName);

