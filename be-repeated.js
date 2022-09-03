import { define } from 'be-decorated/be-decorated.js';
import { register } from 'be-hive/register.js';
export class BeRepeatedController extends EventTarget {
    async intro(proxy, target, beDecorProps) {
        if (proxy.localName !== 'template') {
            const { convertToTemplate } = await import('./convertToTemplate.js');
            await convertToTemplate(proxy, target, beDecorProps);
        }
        else {
            proxy.templ = target;
        }
        proxy.resolved = true;
    }
    async finale(proxy, target) {
        const { unsubscribe } = await import('trans-render/lib/subscribe.js');
        unsubscribe(proxy);
        //if(target.localName !== 'template') return; //[TODO]: ?
    }
    async onList() {
        //TODO:  put back list, proxy in the signature.
        //for now, causes a weird browser dev tools crash when debugging xtal-vlist/demo/dev.html
        //Not crashing on edge, only chrome
        //console.log('about to execute code dev tools might crash on.');
        const list = this.list;
        const proxy = this.proxy;
        //console.log('i survived');
        if (Array.isArray(list)) {
            proxy.listVal = list;
            return;
        }
        const { hookUp } = await import('be-observant/hookUp.js');
        hookUp(list, proxy, 'listVal');
    }
    #prevList;
    async renderList({ listVal, transform, proxy, templ, deferRendering }) {
        //because of "isVisible" condition, we might be asked to render the list only because visibility changes
        //this logic prevents that:
        if (listVal === this.#prevList)
            return;
        const { ListRenderer } = await import('./ListRenderer.js');
        if (proxy.listRenderer === undefined) {
            proxy.listRenderer = new ListRenderer(this);
        }
        proxy.listRenderer.renderList(this);
        this.#prevList = listVal;
    }
    async onNestedLoopProp({ nestedLoopProp, proxy }) {
        const { upSearch } = await import('trans-render/lib/upSearch.js');
        const templ = upSearch(this.proxy, 'template[data-idx]');
        const { templToCtxMap } = await import('./ListRenderer.js');
        const loopContext = templToCtxMap.get(templ);
        const subList = loopContext.item[nestedLoopProp];
        proxy.listVal = subList;
    }
}
const tagName = 'be-repeated';
const ifWantsToBe = 'repeated';
const upgrade = '*';
define({
    config: {
        tagName,
        propDefaults: {
            upgrade,
            ifWantsToBe,
            forceVisible: ['template'],
            intro: 'intro',
            finale: 'finale',
            virtualProps: [
                'list', 'listVal', 'templ', 'transform', 'nestedLoopProp', 'deferRendering', 'listRenderer', 'transformPlugins',
                'beLazyPageSize', 'beLazyProps', 'beLazyScaleFactor', 'lBound', 'uBound', 'timestampKey', 'beOosoom', 'isVisible'
            ],
            proxyPropDefaults: {
                beOosoom: 'isVisible',
                isVisible: true
            }
        },
        actions: {
            onList: 'list',
            renderList: {
                ifAllOf: ['transform', 'listVal', 'templ', 'isVisible']
            },
            onNestedLoopProp: 'nestedLoopProp'
        }
    },
    complexPropDefaults: {
        controller: BeRepeatedController
    }
});
register(ifWantsToBe, upgrade, tagName);
