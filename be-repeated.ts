import {BRP, BeRepeatedActions, BeRepeatedVirtualProps, LoopContext} from './types';
import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {register} from 'be-hive/register.js';

export class BeRepeated extends EventTarget implements BeRepeatedActions {
    async intro(proxy: Element & BeRepeatedVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        if(proxy.localName !== 'template'){
            const {convertToTemplate} = await import('./convertToTemplate.js');
            await convertToTemplate(proxy, target, beDecorProps);
        }else{
            proxy.templ = target as HTMLTemplateElement;
        }
        proxy.resolved = true;
    }
    async finale(proxy: Element & BeRepeatedVirtualProps, target:Element){
        const {unsubscribe}  = await import('trans-render/lib/subscribe.js');
        unsubscribe(proxy);
    }
    async onList({list, proxy}: BRP){
        if(Array.isArray(list)){
            proxy.listVal = list;
            return;
        }
        const {hookUp} = await import('be-observant/hookUp.js')
        hookUp(list, proxy, 'listVal');
    }
    #prevList: any[] | undefined;
    async renderList(brp: BRP){
        const {listVal, transform, proxy, templ, deferRendering} = brp;
        //because of "isVisible" condition, we might be asked to render the list only because visibility changes
        //this logic prevents that:
        if(listVal === this.#prevList) return;
        const {ListRenderer} = await import ('./ListRenderer.js');
        if(proxy.listRenderer === undefined){
            proxy.listRenderer = new ListRenderer(brp);
        }
        proxy.listRenderer!.renderList(brp);
        this.#prevList = listVal;
    }

    async onNestedLoopProp({nestedLoopProp, proxy}: BRP){
        const {upSearch} = await import('trans-render/lib/upSearch.js');
        const templ = upSearch(this.proxy, 'template[data-idx]') as HTMLTemplateElement;
        const {templToCtxMap} = await import ('./ListRenderer.js');
        const loopContext = templToCtxMap.get(templ);
        const subList = loopContext!.item[nestedLoopProp!];
        proxy.listVal = subList;
    }


}

const tagName = 'be-repeated';

const ifWantsToBe = 'repeated';

const upgrade = '*';

define<BeRepeatedVirtualProps & BeDecoratedProps<BeRepeatedVirtualProps, BeRepeatedActions>, BeRepeatedActions>({
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
                'beLazyPageSize', 'beLazyProps', 'beLazyScaleFactor', 'lBound', 'uBound', 'timestampKey', 'beOosoom', 'isVisible'
            ],
            proxyPropDefaults:{
                beOosoom: 'isVisible',
                isVisible: true
            }
        },
        actions:{
            onList:'list',
            renderList:{
                ifAllOf:['transform', 'listVal', 'templ', 'isVisible']
            },
            onNestedLoopProp:'nestedLoopProp'
        }
    },
    complexPropDefaults:{
        controller: BeRepeated
    }
});

register(ifWantsToBe, upgrade, tagName);

