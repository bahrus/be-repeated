import {BeDecoratedProps, MinimalProxy} from 'be-decorated/types';
import {RenderContext, TransformPlugins} from 'trans-render/lib/types';
import {BeLazyVirtualProps} from 'be-lazy/types';

export interface BeRepeatedVirtualProps extends MinimalProxy{
    list?: string | any[],
    listVal?: any[],
    nestedLoopProp?: string,
    transform?: any, 
    templ?: HTMLTemplateElement,
    deferRendering?: boolean,
    transformPlugins?: TransformPlugins,
    timestampKey?:  string,
    listRenderer: ListRendererActions,
    beLazyPageSize?: number,
    beLazyProps?: BeLazyVirtualProps,
    beLazyClass?: string,
    beLazyScaleFactor?: number,
    lBound?: number,
    uBound?: number,
    contextStack: RenderContext[],
}

export interface IGroup{
    fragmentManager?: HTMLTemplateElement;
    fragment?: Element[];
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