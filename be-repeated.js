import { XtalDecor } from 'xtal-decor/xtal-decor.js';
import { CE } from 'trans-render/lib/CE.js';
const ce = new CE({
    config: {
        tagName: 'be-repeated',
        propDefaults: {
            upgrade: '*',
            ifWantsToBe: 'repeated',
            forceVisible: true,
            virtualProps: ['eventHandlers', 'list', 'transform']
        }
    },
    complexPropDefaults: {
        actions: [],
        on: {},
        init: (self) => {
            console.log(self);
        },
        finale: (self, target) => {
            if (target.localName !== 'template')
                return;
        }
    },
    superclass: XtalDecor
});
document.head.appendChild(document.createElement('be-repeated'));
