# be-repeated [TODO]

Attribute based version of ib-id

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

## Example III multiple elements per iteration.  Use of template [TODO]

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

templates are required when more than one element needs to repeat per iteration.



