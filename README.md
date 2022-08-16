# be-repeated

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/be-repeated)

[![Actions Status](https://github.com/bahrus/be-repeated/workflows/CI/badge.svg)](https://github.com/bahrus/be-repeated/actions?query=workflow%3ACI)

<a href="https://nodei.co/npm/be-repeated/"><img src="https://nodei.co/npm/be-repeated.png"></a>

[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-repeated?style=for-the-badge)](https://bundlephobia.com/result?p=be-repeated)

<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-repeated?compression=gzip">

be-repeated is a web component decorator that provides standalone support for repeated DOM generation.  Like web components, it can work anywhere HTML works.  It provides progressive enhancement to server-rendered content, without requiring use of templates.

<details>
    <summary>What's wrong with templates?  Gollum, gollum</summary>

Nothing is wrong with them, of course.  Behind the scenes, it uses templates.  

But why not make life simpler and just require templates?

Here's my current thinking:  Vue's charm, to me, is its readable, concise logic (and others before and after it do the same, i.e. knockout.js, angular, aurelia, etc) -- only require a template when there's more than one repeating element.  Wonderful for the developer. 

So what be-repeated does is nothing new.  However, Vue does the same for its conditional as well.  The counterpart to be-repeated is be-switched, which doesn't provide that option, and forces the developer to wrap the contents in the template.  The thinking is that we don't want to require a build step, and the whole point of be-switched is to not unnecessarily load content into the DOM tree.  Lazy loading is always best. 

But there's a strong case to be made that be-repeated should provide that option:  It gives us the ability for the viewer to see the first element of the loop, before the dependencies are downloaded (via server rendering) and then client-side provide the rest of the content via templates.  That case is much weaker in the conditional case.

So my thinking up to now, is that we don't need that for be-switched, it is best to wrap in a template to be safe -- not load too early, and be kind to the browser.

But now that I'm starting to realize these be-decorated components provide a dual purpose of being used during template instantiation, I'm realizing my thinking here was too limited, which is good news.  There's now a good reason to provide the option for be-switched to not require a template either, as the behind-the-scenes conversion to a template can be done *before* the content is added to the live DOM tree.  Meaning, be-switched is unnecessarily torturing the developer for no reason.

Except...  The way the be-decorated elements are used is such that if the decorator hasn't downloaded yet, proceed with adding the content to the live DOM tree, and apply the logic when it is downloaded.  Drats, that means be-switched is right to forgo this nicety for the developer.  Oh well.

However, this argument doesn't apply to built-in template instantiation.  Meaning it *ought* to emulate what Vue does, IMHO.

</details>

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

## Example IIc -- Large lists with lazy loading

```html
<style>
    .be-repeated-hidden{
        display:none;
    }
    template[be-lazy], template[is-lazy]{
        display:block;
        height: 1829px;
    }
    my-test {
        min-height: 18px;
    }
</style>
<obj-ml id=objML prop1-obj='["hello", "third", "planet"]'></obj-ml>
<div be-definitive='{
    "config": {
        "tagName":"my-test",
        "propDefaults": {
            "noshadow": false
        }
    }
}'>
    <style be-adopted>
        :host{
            display:block;
        }
    </style>
    <slot></slot>
</div>
<div>
    <my-test be-repeated='{
        "transform": {"my-test": "."},
        "list": {"observe": "obj-ml", "on": "value-changed", "vft": "value.prop1"},
        "beLazyPageSize": 100
    }'></my-test>
</div>

<button onclick="updateListLargeSize()">Update List To Larger Size</button>
<script>
    function updateListLargeSize() {
        const arr = [];
        for (let i = 0; i < 100000; i++) {
            arr.push(i.toString());
        }
        objML.value = {
            prop1: arr
        };
    }
</script>
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

<details>
    <summary>
    Why the template element?
    </summary>
    I would prefer to use the data element for this purpose.  Unfortunately, the table element seems to be allergic to everything except the template element.
</details>
replace empty template elements with [data element](https://developer.mozilla.org/en-US/docs/web/html/element/data)?

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


