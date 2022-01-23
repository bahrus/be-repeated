# be-repeated [WIP]

[![Actions Status](https://github.com/bahrus/be-repeated/workflows/CI/badge.svg)](https://github.com/bahrus/be-repeated/actions?query=workflow%3ACI)

<a href="https://nodei.co/npm/be-repeated/"><img src="https://nodei.co/npm/be-repeated.png"></a>

be-repeated is a web component decorator that provides standalone support for repeating DOM generation.  

Goals:

1.  Can complement server-rendered lists.
2.  Syntax is truly declarative.  No JS!
3.  Syntax is compatible Cloudflare's [HTMLRewriter](https://discourse.wicg.io/t/proposal-support-cloudflares-htmlrewriter-api-in-workers/5721/3) (in theory).
3.  Can be 100% conformant to proper HTML decorum.


## Syntax Example I -- Basic, template free. 

```html
<ul>
    <li>Head Item</li>
    <li be-repeated='{
        "list": ["hello", "world"],
        "transform": {"li": "."}
    }'>...</li>
    <li>Footer Item</li>
</ul>
```

Working with JSON-in-HTML, like the example above shows, is much more pleasant in VSCode if using the web-friendly [JSON-in-HTML extension](https://marketplace.visualstudio.com/items?itemName=andersonbruceb.json-in-html).

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
        "list": [
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

Example V -- Compatibility with server-rendered lists.

If the server can render the initial list, that could significantly improve the initial performance, especially if the client doesn't blindly re-render the entire list.

To indicate the server has rendered the list, and to skip the first rendering on the client, set the property:  deferRendering to true.


