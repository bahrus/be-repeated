# be-repeated [TODO]

Attribute based version of ib-id

## Syntax Example I -- Basic, template free. [TODO]

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

Note that the "list" property can come from the host or other DOM elements via the [be-observant binding syntax](https://github.com/bahrus/be-observant).

