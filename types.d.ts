import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE} from 'be-enhanced/types';

export interface EndUserProps extends IBE{
    startIdx?: number,
    endIdx?: number,
    templIdx?: number,
}

export type Condition = 'new' | 'existing' | 'renamed';

export interface AllProps extends EndUserProps {
    //newRows: Row | undefined;
    //allRows: WeakRef<Element>[] | undefined;
    templ: HTMLTemplateElement
}

export interface Row{
    nodes: Node[],
    idx: number,
    condition: Condition
}

export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;

export type POA = [PAP | undefined, ActionOnEventConfigs<PAP, Actions>]

export interface Actions{
    createTempl(self: this): PAP;
    cloneIfNeeded(self: this): void;
}