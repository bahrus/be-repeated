import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE} from 'be-enhanced/types';

export interface EndUserProps extends IBE{
    startIdx?: number,
    endIdx?: number,
    templIdx?: number,
    rowHandler?: (row: Row) => Promise<void>;
    bufferSize?:number;
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

export type POA = [PAP | undefined, ActionOnEventConfigs<PAP, Actions>]

export interface Actions{
    createTempl(self: this): ProPAP;
    cloneIfNeeded(self: this): ProPAP;
    cancelIfNeeded(self: this): PAP;
}