import {BeDecoratedProps, MinimalProxy} from 'be-decorated/types';
import {RenderContext, TransformPlugins} from 'trans-render/lib/types';
import {BeLazyVirtualProps} from 'be-lazy/types';


export interface BeRepeatedEndUserVirtualProps {
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
export interface BeRepeatedVirtualProps extends BeRepeatedEndUserVirtualProps, MinimalProxy{
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

export interface BeRepeatedProxy extends BeRepeatedActions, BeRepeatedVirtualProps{
    proxy: Proxy,
}

export type BRP = BeRepeatedProxy

export interface BeRepeatedActions {
    intro(proxy: Proxy, target: Element, beDecorProps: BeDecoratedProps): void;
    finale(proxy: Proxy, target:Element): void; 
    onList(brp: BRP): void; 
    onNestedLoopProp(brp: BRP): void;
    renderList(brp: BRP): void; 
}

export interface LoopContext {
    idx: number;
    item: any;
}

export interface ListRendererActions{
    renderList(brp: BRP): void;
}