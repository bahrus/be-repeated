import {RenderContext, TransformPluginSettings} from 'trans-render/lib/types';
import {ListRenderer} from './ListRenderer';

export const trPlugin : TransformPluginSettings = {
    selector: 'beRepeatedAttribs',
    processor: ({target, val, attrib}: RenderContext) => {
        const settings = JSON.parse(val!);
        if(settings.deferRendering) return;
        const obj = {
            proxy: target,
            ...settings,
            templ: target,
        };
        const listRenderer = new ListRenderer(obj);
        listRenderer.renderList(obj);
        settings.deferRendering = true;
        target!.setAttribute(attrib!, JSON.stringify(settings));
        
    }
} 
