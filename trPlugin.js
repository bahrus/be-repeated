import { ListRenderer } from './ListRenderer';
export const trPlugin = {
    selector: 'beRepeatedAttribs',
    processor: ({ target, val, attrib }) => {
        const settings = JSON.parse(val);
        if (settings.deferRendering)
            return;
        const obj = {
            proxy: target,
            ...settings,
            templ: target,
        };
        const listRenderer = new ListRenderer(obj);
        listRenderer.renderList(obj);
        settings.deferRendering = true;
        target.setAttribute(attrib, JSON.stringify(settings));
    }
};
