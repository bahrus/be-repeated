# be-repeated

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/be-repeated)

[![Actions Status](https://github.com/bahrus/be-repeated/workflows/CI/badge.svg)](https://github.com/bahrus/be-repeated/actions?query=workflow%3ACI)

<a href="https://nodei.co/npm/be-repeated/"><img src="https://nodei.co/npm/be-repeated.png"></a>

be-repeated is a web component decorator that provides standalone support for repeated DOM generation.  Like web components, it can work anywhere HTML works.  It provides progressive enhancement to server-rendered content, without requiring use of templates.

The package also includes a [trans-render](https://github.com/bahrus/trans-render) plug-in that *does* enable the repeating logic to be performed during "template stamping", based on the same syntax, and sharing the core logic.  However, the nice thing is that if employed properly, the template instantiation can use the plug-in only if it is already loaded.  If not, no biggie, just render the non expanded HTML to the live DOM tree, and let the component render the repeating content once the library *is* downloaded. (Status:  Experimental).

Finally, the package will contain a Cloudflare HTMLRewriter helper class, to generate repeating content in the context of a Cloudflare worker, also based on the same syntax (but logic is by necessity separate). [TODO].


## Syntax Example I -- Client-side binding. Basic, template free. 

```html
<ul>
    <li>Head Item</li>
    <li be-repeated='{
        "listVal": ["hello", "world"],
        "transform": {"li": "."}
    }'>...</li>
    <li>Footer Item</li>
</ul>
```

Working with JSON-in-HTML, like the example above shows, is much more pleasant in VSCode if using the web-friendly [JSON-in-HTML extension](https://marketplace.visualstudio.com/items?itemName=andersonbruceb.json-in-html).  And the [may-it-be compiler](https://github.com/bahrus/may-it-be) makes working with such attributes quite pleasant.

As always with all [be-decorated](https://github.com/bahrus/be-decorated) based web components, we can use data-be-repeated instead of be-repeated.  And the attribute can be configured to be different in each Shadow DOM realm.

Note that the "list" property can come from the host or other DOM elements via the [be-observant binding syntax](https://github.com/bahrus/be-observant) as demonstrated below.

## Example II -- Updatable via binding.

```html
<obj-ml prop1-obj='["hello", "world"]'></obj-ml>
<ul>
    <li>Head Item</li>
    <li be-repeated='{
        "transform": {"li": "."},
        "list": {"observe": "obj-ml", "on": "value-changed", "vft": "value.prop1"}
    }'>...</li>
    <li>Footer Item</li>
</ul>
```

## Example III -- Multiple elements per iteration.  First required use of template.

```html
<obj-ml defs-obj='[
    {"term": "nah", "def": "not so"}, 
    {"term":"goo", "def": "a viscid or sticky substance"}]'>
</obj-ml>
<dl>
    <dt>Definition</dt>
    <dd>Meaning of the word</dd>
    <template be-repeated='{
        "transform": {
            "dt": "term",
            "dd": "def"
        },
        "list":  {"observe": "obj-ml", "on": "value-changed", "vft": "value.defs"}
    }'>
        <dt></dt>
        <dd></dd>
    </template>
</dl>
```

Template tags are required when more than one element needs to repeat per iteration.


## Example IV -- Nested Loops

```html
<ul>
    <template be-repeated='{
        "listVal": [
            {"description": "first item", "innerList": [{"name": "a"}, {"name": "b"}]},
            {"description": "second item", "innerList": [{"name": "c"}, {"name": "b"}]}
        ],
        "transform": {".description": "description"}
    }'>
        <li>
            <span class=description></span>
            <ul>
                <li be-repeated='{
                    "nestedLoopProp": "innerList",
                    "transform": {
                        ".name": "name"
                    }
                }'>
                    <span class=name></span>
                </li>
            </ul>
        </li>
    </template>
</ul>
```

## Example IVa -- Nested Loops, template free

Templates may not be required, at least for simple examples, but possibly as complexity increases, templates may avoid some misfires.

```html
<ul>
    <li be-repeated='{
        "list": [
            {"description": "first item", "innerList": [{"name": "a"}, {"name": "b"}]},
            {"description": "second item", "innerList": [{"name": "c"}, {"name": "b"}]}
        ],
        "transform": {".description": "description"}
    }'>
        <span class=description></span>
        <ul>
            <li be-repeated='{
                "nestedLoopProp": "innerList",
                "transform": {
                    ".name": "name"
                }
            }'>
                <span class=name></span>
            </li>
        </ul>
    </li>
</ul>
```

## Example V -- Compatibility with server-rendered lists.

If the server can render the initial list, that could significantly improve the initial performance, especially if the client doesn't blindly re-render the entire list.

To indicate the server has rendered the list, and to skip the first rendering on the client, set the property:  deferRendering to true.

The markup generated by the server needs to look as follows:

```html
<obj-ml id=objML prop1-obj='["hello", "world"]'></obj-ml>
<ul>
    <li>Head Item</li>
    <template be-repeated='{
        "transform": {"li": "."},
        "list": {"observe": "obj-ml", "on": "value-changed", "vft": "value.prop1"},
        "deferRendering": true
    }'><li>...</li></template>
    <template data-cnt="2" data-idx="0"></template>
    <li>hello</li>
    <template data-cnt="2" data-idx="1"></template>
    <li>world</li>
    <li>Footer Item</li>
</ul>

<button onclick="updateListSameSize()">Update List Same Size</button>
<script>
    function updateListSameSize(){
        objML.value = {
            prop1: ['good', 'morning']
        };
    }
</script>
```

## Example VI -- Performing repeat during template instantiation.

```html
<dl id=dl>
    <dt>Definition</dt>
    <dd>Meaning of the word</dd>

    <template id=container>
        <template be-repeated='{
            "transform": {
                "dt": "term",
                "dd": "def"
            },
            "listVal":  [{"term": "nah", "def": "not so"}, {"term":"goo", "def": "a viscid or sticky substance"}]
        }'>
            <dt></dt>
            <dd></dd>
        </template>
    </template>
</dl>
<script type=module>
    import { ListRenderer } from 'be-repeated/ListRenderer.js';
    const clone = container.content.cloneNode(true);
    const beRepeateds = Array.from(clone.querySelectorAll('[be-repeated]'));
    for(const beRepeated of beRepeateds){
        const attr = beRepeated.getAttribute('be-repeated');
        const settings = JSON.parse(attr);
        const obj = {
            proxy: beRepeated,
            ...settings,
            templ: beRepeated,
        };
        const listRenderer = new ListRenderer(obj);
        listRenderer.renderList(obj);
        settings.deferRendering = true;
        beRepeated.setAttribute('be-repeated', JSON.stringify(settings));
        dl.appendChild(clone);
    }
</script>
```

## Example VII -- Conditional template instantiation.

Performing repeat during template instantiation, using declarative trans-render syntax, and only if library already loaded. (WIP)

## Viewing this element locally

1.  Install git.
2.  Fork/clone this repo.
3.  Install node.
4.  Open command window to folder where you cloned this repo.
5.  > npm install
6.  > npm run serve
7.  Open http://localhost:3030/demo/dev in a modern browser.

## Running Tests

```
> npm run test
```


