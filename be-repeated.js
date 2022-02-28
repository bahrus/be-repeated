import { define } from 'be-decorated/be-decorated.js';
import { register } from 'be-hive/register.js';
import { ListRenderer, templToCtxMap, templToFooterRange } from './ListRenderer.js';
export class BeRepeatedController {
    //#footerRange: Range | undefined;
    intro(proxy, target, beDecorProps) {
        if (proxy.localName !== 'template') {
            const ns = proxy.nextElementSibling;
            const templ = document.createElement('template');
            if (ns !== null) {
                const range = new Range();
                range.setStartBefore(ns);
                const parent = proxy.parentElement || proxy.getRootNode();
                range.setEndAfter(parent.lastElementChild);
                templToFooterRange.set(templ, range);
            }
            const attrIs = 'is-' + beDecorProps.ifWantsToBe;
            const attrBe = 'be-' + beDecorProps.ifWantsToBe;
            templ.setAttribute(attrBe, proxy.getAttribute(attrIs));
            proxy.insertAdjacentElement('beforebegin', templ);
            target.removeAttribute(attrIs);
            const clonedTarget = target.cloneNode(true);
            //firstElementMap.set(templ, target);
            const attribs = clonedTarget.attributes;
            for (const attrib of attribs) {
                const name = attrib.name;
                if (name.startsWith('is-')) {
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
        }
        else {
            proxy.templ = target;
        }
    }
    async finale(proxy, target) {
        const { unsubscribe } = await import('trans-render/lib/subscribe.js');
        unsubscribe(proxy);
        if (target.localName !== 'template')
            return; //[TODO]: ?
    }
    async onList() {
        //TODO:  put back list, proxy in the signature.
        //for now, causes a weird browser dev tools crash when debugging xtal-vlist/demo/dev.html
        console.log('about to execute code dev tools might crash on.');
        const list = this.list;
        const proxy = this.proxy;
        console.log('i survived');
        if (Array.isArray(list)) {
            proxy.listVal = list;
            return;
        }
        const { hookUp } = await import('be-observant/hookUp.js');
        hookUp(list, proxy, 'listVal');
    }
    #prevCount = 0;
    renderList({ listVal, transform, proxy, templ, deferRendering }) {
        if (proxy.listRenderer === undefined) {
            proxy.listRenderer = new ListRenderer(this);
        }
        proxy.listRenderer.renderList(this);
    }
    async onNestedLoopProp({ nestedLoopProp, proxy }) {
        const { upSearch } = await import('trans-render/lib/upSearch.js');
        const templ = upSearch(this.proxy, 'template[data-idx]');
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
                'beIntersectionalPageSize', 'beIntersectionalProps', 'beIntersectionalScaleFactor', 'lBound', 'uBound'
            ],
        },
        actions: {
            onList: 'list',
            renderList: {
                ifAllOf: ['transform', 'listVal', 'templ']
            },
            onNestedLoopProp: 'nestedLoopProp'
        }
    },
    complexPropDefaults: {
        controller: BeRepeatedController
    }
});
register(ifWantsToBe, upgrade, tagName);
