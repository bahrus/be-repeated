import {IEnhancement} from 'trans-render/be/types';

export interface EndUserProps extends IEnhancement{
    rowHandler?: (row: Row) => Promise<void>;
    bufferSize?:number;
    templIdx?: number,
    startIdx?: number,
    endIdx?: number,
}


export type Condition = 'new' | 'existing' | 'renamed';

export type WRM = Map<number, WeakRef<Element>[]>;

export interface AllProps extends EndUserProps {
    //newRows: Row | undefined;
    //allRows: WeakRef<Element>[] | undefined;
    templ: HTMLTemplateElement,
    startCnt?: number,
    endCnt?: number,
    cancel?: boolean,
    rendering: [number, number],
}

export interface Row{
    children: Element[],
    idx: number,
    condition: Condition,
    
}

export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;


export interface Actions{
    createTempl(self: this): ProPAP;
    cloneIfNeeded(self: this): ProPAP;
    cancelIfNeeded(self: this): PAP;
}