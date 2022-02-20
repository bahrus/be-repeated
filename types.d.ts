import {BeDecoratedProps, EventHandler} from 'be-decorated/types';
import {RenderContext, TransformPlugins} from 'trans-render/lib/types';

export interface BeRepeatedVirtualProps{
    list?: string | any[],
    listVal?: any[],
    nestedLoopProp?: string,
    transform?: any, 
    templ?: HTMLTemplateElement,
    deferRendering?: boolean,
    transformPlugins?: TransformPlugins,
    listRenderer: ListRendererActions,
    beIntersectionalPageSize?: number,
}

export interface BeRepeatedProps extends BeRepeatedVirtualProps{
    proxy: Element & BeRepeatedVirtualProps,
}

export interface BeRepeatedActions {
    intro(proxy: Element & BeRepeatedVirtualProps, target: Element, beDecorProps: BeDecoratedProps): void;
    finale(proxy: Element & BeRepeatedVirtualProps, target:Element): void; 
    onList(self: this): void; 
    onNestedLoopProp(self: this): void;
    renderList(self: this): void; 
}

export interface LoopContext {
    //list: any[];
    idx: number;
    item: any;
}

export interface ListRendererActions{
    renderList(self: BeRepeatedProps): void;
}