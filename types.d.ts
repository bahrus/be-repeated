import {BeDecoratedProps, EventHandler} from 'be-decorated/types';
import {RenderContext} from 'trans-render/lib/types';

export interface BeRepeatedVirtualProps{
    eventHandlers: EventHandler[], 
    list: string | any[],
    listVal: any[],
    transform: any, 
    ctx: RenderContext,
    templ: HTMLTemplateElement,
}

export interface BeRepeatedProps extends BeRepeatedVirtualProps{
    proxy: HTMLTemplateElement & BeRepeatedVirtualProps,
}

export interface BeRepeatedActions {
    intro(proxy: Element & BeRepeatedVirtualProps, target: Element, beDecorProps: BeDecoratedProps): void;
    finale(proxy: Element & BeRepeatedVirtualProps, target:Element): void; 
    onList(self: this): void; 
    renderList(self: this): void; 
}