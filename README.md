# be-repeated [WIP]

Attribute-based version of [ib-id](https://github.com/bahrus/ib-id) -- a repeating decorator web component.

Goals remain the same:

1.  Can complement server-rendered lists
2.  Can be 100% conformant to proper HTML decorum.
3.  Can use dynamic list of tags
4.  Can use enumerated set of templates.

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

As always with [be-decorated](https://github.com/bahrus/be-decorated) based web components, we can use data-be-repeated instead of be-repeated.  And the attribute can be configured to be different in each Shadow DOM realm.

Note that the "list" property can come from the host or other DOM elements via the [be-observant binding syntax](https://github.com/bahrus/be-observant).

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


