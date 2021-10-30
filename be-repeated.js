import { define } from 'be-decorated/be-decorated.js';
import { hookUp } from 'be-observant/hookUp.js';
import { PE } from 'trans-render/lib/PE.js';
import { SplitText } from 'trans-render/lib/SplitText.js';
import { transform as xf, processTargets } from 'trans-render/lib/transform.js';
import { register } from 'be-hive/register.js';
import { upSearch } from 'trans-render/lib/upSearch.js';
const firstElementMap = new WeakMap();
const templToCtxMap = new WeakMap();
export class BeRepeatedController {
    intro(proxy, target, beDecorProps) {
        if (proxy.localName !== 'template') {
            const templ = document.createElement('template');
            const attrIs = 'is-' + beDecorProps.ifWantsToBe;
            const attrBe = 'be-' + beDecorProps.ifWantsToBe;
            templ.setAttribute(attrBe, proxy.getAttribute(attrIs));
            proxy.insertAdjacentElement('beforebegin', templ);
            target.removeAttribute(attrIs);
            const clonedTarget = target.cloneNode(true);
            firstElementMap.set(templ, target);
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
        }
        else {
            proxy.templ = target;
        }
    }
    finale(proxy, target) {
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
    renderList({ listVal, transform, proxy, templ, ctx }) {
        let firstTime = false;
        if (ctx === undefined) {
            firstTime = true;
            ctx = {
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
        let tail = templ;
        let cnt = 0;
        let idx = 0;
        for (const item of listVal) {
            ctx.host = item;
            if (firstTime) {
                const rs = cloneAndTransform(idx, tail, cnt, ctx, proxy, templ);
                tail = rs.tail;
                cnt = rs.cnt;
                idx = rs.idx;
            }
            else {
                const grp = findGroup(tail, `[data-idx="${idx}"]`);
                const len = grp.length;
                if (len > 0) {
                    for (const el of grp) {
                        el.classList.remove('be-repeated-hidden');
                    }
                    cnt += len + 1; //count template
                    processTargets(ctx, grp);
                    tail = grp.pop();
                    idx++;
                }
                else {
                    const rs = cloneAndTransform(idx, tail, cnt, ctx, proxy);
                    tail = rs.tail;
                    cnt = rs.cnt;
                    idx = rs.idx;
                }
            }
        }
        const prevCnt = Number(proxy.dataset.cnt);
        while (idx < prevCnt) {
            const grp = findGroup(tail, `[data-idx="${idx}"]`);
            const len = grp.length;
            if (len > 0) {
                for (const el of grp) {
                    //el.classList.add('be-repeated-hidden');
                    el.remove();
                }
                cnt += len + 1;
            }
            idx++;
        }
        //if(cnt === 0) debugger;
        proxy.dataset.cnt = cnt.toString();
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
            forceVisible: true,
            intro: 'intro',
            finale: 'finale',
            virtualProps: ['ctx', 'eventHandlers', 'list', 'listVal', 'templ', 'transform', 'nestedLoopProp'],
        },
        actions: {
            onList: {
                ifAllOf: ['list']
            },
            renderList: {
                ifAllOf: ['transform', 'listVal', 'templ']
            },
            onNestedLoopProp: {
                ifAllOf: ['nestedLoopProp']
            }
        }
    },
    complexPropDefaults: {
        controller: BeRepeatedController
    }
});
function findGroup(tail, sel) {
    const returnArr = [];
    let ns = tail.nextElementSibling;
    while (ns !== null) {
        if (ns.matches(sel)) {
            const n = Number(ns.dataset.cnt);
            for (let i = 0; i < n; i++) {
                if (ns !== null) {
                    ns = ns.nextElementSibling;
                    if (ns !== null)
                        returnArr.push(ns);
                }
                else {
                    return returnArr;
                }
            }
            return returnArr;
        }
        ns = ns.nextElementSibling;
    }
    return returnArr;
}
function cloneAndTransform(idx, tail, cnt, ctx, self, target) {
    const templ = document.createElement('template');
    templToCtxMap.set(templ, {
        idx,
        item: ctx.host
    });
    templ.dataset.idx = idx.toString();
    idx++;
    // tail.insertAdjacentElement('afterend', templ);
    let templCount = 0;
    let children = [];
    if (target !== undefined && firstElementMap.has(target)) {
        const originalEl = firstElementMap.get(target);
        originalEl.insertAdjacentElement('beforebegin', templ);
        cnt++;
        tail = originalEl;
        children = [originalEl];
        processTargets(ctx, children);
        cnt++;
        templCount++;
        firstElementMap.delete(target);
        //console.log(originalEl);
    }
    else {
        tail.insertAdjacentElement('afterend', templ);
        cnt++;
        tail = templ;
        const clone = self.content.cloneNode(true);
        xf(clone, ctx);
        children = Array.from(clone.children);
        for (const child of children) {
            tail.insertAdjacentElement('afterend', child);
            cnt++;
            templCount++;
            tail = child;
        }
    }
    templ.dataset.cnt = templCount.toString();
    return { idx, tail, cnt };
}
register(ifWantsToBe, upgrade, tagName);
