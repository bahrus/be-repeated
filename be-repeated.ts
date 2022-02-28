import {BeRepeatedProps, BeRepeatedActions, BeRepeatedVirtualProps, LoopContext} from './types';
import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {register} from 'be-hive/register.js';
import { ListRenderer, templToCtxMap, templToFooterRange } from './ListRenderer.js';
import {hookUp} from 'be-observant/hookUp.js';
import  {upSearch} from 'trans-render/lib/upSearch.js';
import {unsubscribe} from 'trans-render/lib/subscribe.js';

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
        //const {unsubscribe}  = await import('trans-render/lib/subscribe.js');
        unsubscribe(proxy);
        if(target.localName !== 'template') return; //[TODO]: ?
    }
    onList(){
        //TODO:  put back list, proxy in the signature.
        //for now, causes a weird browser dev tools crash when debugging xtal-vlist/demo/dev.html
        //put back async, move hookup load back inside
        console.log('about to execute code dev tools might crash on.');
        const list = this.list;
        const proxy = this.proxy;
        console.log('i survived');
        if(Array.isArray(list)){
            proxy.listVal = list;
            return;
        }
        //const {hookUp} = await import('be-observant/hookUp.js');
        hookUp(list, proxy, 'listVal');
    }
    #prevCount = 0;
    renderList({listVal, transform, proxy, templ, deferRendering}: this){
        if(proxy.listRenderer === undefined){
            proxy.listRenderer = new ListRenderer(this);
        }
        proxy.listRenderer!.renderList(this);
        
    }

    onNestedLoopProp({nestedLoopProp, proxy}: this){
        //const {upSearch} = await import('trans-render/lib/upSearch.js');
        const templ = upSearch(this.proxy, 'template[data-idx]') as HTMLTemplateElement;
        const loopContext = templToCtxMap.get(templ);
        const subList = loopContext!.item[nestedLoopProp!];
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
            forceVisible: ['template'],
            intro: 'intro',
            finale: 'finale',
            virtualProps: [
                'list', 'listVal', 'templ', 'transform', 'nestedLoopProp', 'deferRendering', 'listRenderer', 'transformPlugins', 
                'beIntersectionalPageSize', 'beIntersectionalProps', 'beIntersectionalScaleFactor', 'lBound', 'uBound'
            ],
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

