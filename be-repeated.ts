import {XtalDecor, XtalDecorCore} from 'xtal-decor/xtal-decor.js';
import { XtalDecorProps } from 'xtal-decor/types';
import {CE} from 'trans-render/lib/CE.js';
import { IObserve } from 'be-observant/types';
import {getElementToObserve, addListener} from 'be-observant/be-observant.js';
import {upShadowSearch} from 'trans-render/lib/upShadowSearch.js';

const ce = new CE<XtalDecorCore<Element>>({
    config:{
        tagName: 'be-repeated',
        propDefaults:{
            upgrade: '*',
            ifWantsToBe: 'repeated',
            forceVisible: true,
            virtualProps: ['eventHandlers', 'list', 'transform']
        }
    },
    complexPropDefaults: {
        actions:[
        ],
        on:{},
        init:(self: Element) => {
            console.log(self);
        },
        finale:(self: Element, target: Element) => {
            if(target.localName !== 'template') return;
        }
    },
    superclass: XtalDecor
});
document.head.appendChild(document.createElement('be-repeated'));