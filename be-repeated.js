import { XtalDecor } from 'xtal-decor/xtal-decor.js';
import { CE } from 'trans-render/lib/CE.js';
const ce = new CE({
    config: {
        tagName: 'be-repeated',
        propDefaults: {
            upgrade: '*',
            ifWantsToBe: 'repeated',
            forceVisible: true,
            virtualProps: ['eventHandlers', 'list', 'transform',]
        }
    },
    complexPropDefaults: {
        actions: [
            ({ list, transform, self }) => {
                if (list === undefined || transform === undefined)
                    return;
                let tail = self;
                let cnt = 0;
                let idx = 0;
                for (const item of list) {
                    const templ = document.createElement('template');
                    templ.dataset.idx = idx.toString();
                    idx++;
                    tail.insertAdjacentElement('afterend', templ);
                    cnt++;
                    tail = templ;
                    const clone = self.content.cloneNode(true);
                    const children = Array.from(clone.children);
                    for (const child of children) {
                        tail.insertAdjacentElement('afterend', child);
                        cnt++;
                        tail = child;
                    }
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
document.head.appendChild(document.createElement('be-repeated'));
