import { XtalDecor } from 'xtal-decor/xtal-decor.js';
import { CE } from 'trans-render/lib/CE.js';
import { PE } from 'trans-render/lib/PE.js';
import { SplitText } from 'trans-render/lib/SplitText.js';
import { getElementToObserve, addListener } from 'be-observant/be-observant.js';
import { transform as xf, processTargets } from 'trans-render/lib/transform.js';
const ce = new CE({
    config: {
        tagName: 'be-repeated',
        propDefaults: {
            upgrade: '*',
            ifWantsToBe: 'repeated',
            forceVisible: true,
            virtualProps: ['eventHandlers', 'list', 'listVal', 'transform', 'ctx']
        }
    },
    complexPropDefaults: {
        actions: [
            ({ list, self }) => {
                if (Array.isArray(list)) {
                    self.listVal = list;
                    return;
                }
                const observeParams = list;
                const elementToObserve = getElementToObserve(self, observeParams);
                if (elementToObserve === null) {
                    console.warn({ msg: '404', observeParams });
                    return;
                }
                addListener(elementToObserve, observeParams, 'listVal', self);
            },
            ({ listVal, transform, self }) => {
                if (listVal === undefined || transform === undefined)
                    return;
                let ctx = self.ctx;
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
                    self.ctx = ctx;
                }
                let tail = self;
                let cnt = 0;
                let idx = 0;
                for (const item of listVal) {
                    ctx.host = item;
                    if (firstTime) {
                        const rs = cloneAndTransform(idx, tail, cnt, ctx, self);
                        tail = rs.tail;
                        cnt = rs.cnt;
                        idx = rs.idx;
                    }
                    else {
                        const grp = findGroup(tail, `[data-idx="${idx}"]`);
                        if (grp.length > 0) {
                            for (const el of grp) {
                                el.classList.remove('be-repeated-hidden');
                            }
                            processTargets(ctx, grp);
                            tail = grp.pop();
                            idx++;
                        }
                        else {
                            const rs = cloneAndTransform(idx, tail, cnt, ctx, self);
                            tail = rs.tail;
                            cnt = rs.cnt;
                            idx = rs.idx;
                        }
                    }
                }
                const prevCnt = Number(self.dataset.cnt);
                while (idx < prevCnt) {
                    const grp = findGroup(tail, `[data-idx="${idx}"]`);
                    for (const el of grp) {
                        el.classList.add('be-repeated-hidden');
                    }
                    idx++;
                }
                self.dataset.cnt = cnt.toString();
            }
        ],
        on: {},
        init: (self, xtalDecor, target) => {
            if (self.localName !== 'template') {
                const templ = document.createElement('template');
                const attrIs = 'is-' + xtalDecor.ifWantsToBe;
                const attrBe = 'be-' + xtalDecor.ifWantsToBe;
                templ.setAttribute(attrBe, self.getAttribute(attrIs));
                self.insertAdjacentElement('afterend', templ);
                target.removeAttribute(attrIs);
                templ.content.appendChild(target);
            }
        },
        finale: (self, target) => {
            if (target.localName !== 'template')
                return;
        }
    },
    superclass: XtalDecor
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
function cloneAndTransform(idx, tail, cnt, ctx, self) {
    const templ = document.createElement('template');
    templ.dataset.idx = idx.toString();
    idx++;
    tail.insertAdjacentElement('afterend', templ);
    cnt++;
    tail = templ;
    let templCount = 0;
    const clone = self.content.cloneNode(true);
    xf(clone, ctx);
    const children = Array.from(clone.children);
    for (const child of children) {
        tail.insertAdjacentElement('afterend', child);
        cnt++;
        templCount++;
        tail = child;
    }
    templ.dataset.cnt = templCount.toString();
    return { idx, tail, cnt };
}
document.head.appendChild(document.createElement('be-repeated'));
