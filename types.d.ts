import {BeDecoratedProps, MinimalProxy} from 'be-decorated/types';
import {RenderContext, TransformPlugins} from 'trans-render/lib/types';
import {BeLazyVirtualProps} from 'be-lazy/types';


export interface BeRepeatedEndUserProps {
    list?: string | any[],
    listVal?: any[],
    nestedLoopProp?: string,
    transform?: any, 
    deferRendering?: boolean,
    transformPlugins?: TransformPlugins,
    timestampKey?:  string,
    beLazyPageSize?: number,
    beLazyProps?: BeLazyVirtualProps,
    beLazyClass?: string,
    lBound?: number,
    uBound?: number,
    beLazyScaleFactor?: number,
}
export interface BeRepeatedVirtualProps extends BeRepeatedEndUserProps, MinimalProxy{
    templ?: HTMLTemplateElement,
    listRenderer: ListRendererActions,
    beOosoom: string,
    isVisible?: boolean
}

export interface IGroup{
    fragmentManager?: HTMLTemplateElement;
    fragment?: Element[];
}

export type Proxy = Element & BeRepeatedVirtualProps;

export interface ProxyProps extends BeRepeatedVirtualProps{
    proxy: Proxy,
}

export type PP = ProxyProps;

export interface BeRepeatedActions {
    intro(proxy: Proxy, target: Element, beDecorProps: BeDecoratedProps): void;
    finale(proxy: Proxy, target:Element): void; 
    onList(pp: PP): void; 
    onNestedLoopProp(pp: PP): void;
    renderList(pp: PP): void; 
}

export interface LoopContext {
    idx: number;
    item: any;
}

export interface ListRendererActions{
    renderList(pp: PP): void;
}