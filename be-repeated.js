import { define } from 'be-decorated/be-decorated.js';
import { hookUp } from 'be-observant/hookUp.js';
import { register } from 'be-hive/register.js';
import { upSearch } from 'trans-render/lib/upSearch.js';
import { unsubscribe } from 'trans-render/lib/subscribe.js';
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
    finale(proxy, target) {
        unsubscribe(proxy);
        if (target.localName !== 'template')
            return; //[TODO]: ?
    }
    onList({ list, proxy }) {
        if (Array.isArray(list)) {
            proxy.listVal = list;
            return;
        }
        hookUp(list, proxy, 'listVal');
    }
    #prevCount = 0;
    renderList({ listVal, transform, proxy, templ, deferRendering }) {
        if (proxy.listRenderer === undefined) {
            proxy.listRenderer = new ListRenderer(this);
        }
        proxy.listRenderer.renderList(this);
    }
    onNestedLoopProp({ nestedLoopProp, proxy }) {
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
            virtualProps: ['list', 'listVal', 'templ', 'transform', 'nestedLoopProp', 'deferRendering', 'listRenderer'],
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
