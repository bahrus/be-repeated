import {RenderContext} from 'trans-render/lib/types';
import {BeRepeatedController} from './be-repeated.js';

export const trPlugin = ({target, val}: RenderContext) => {

};

trPlugin.doTransform = (fragment: DocumentFragment) => {
    const elements = Array.from(fragment.querySelectorAll('[be-repeated]'));
    for(const element of elements){
        const ctx = {
            target: element,
            val: element.getAttribute('be-repeated'),
        } as RenderContext;
    }
}