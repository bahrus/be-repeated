# be-repeated (♻️)

## Example 1

```html
<div role="grid" aria-rowcount="100" >
  <div role="rowgroup">
    <div role="row" aria-rowindex="1">
      <span role="columnheader">First Name</span>
      <span role="columnheader">Last Name</span>
      <span role="columnheader">Position</span>
    </div>
  </div>
  <div role="rowgroup" be-repeated='{
      "startIdx": 2,
      "endIdx": 99,
      "templIdx": 0
    }'>
    <div role="row" aria-rowindex="0">
        <span role="gridcell" itemprop=first></span>
        <span role="gridcell" itemprop=second></span>
        <span role="gridcell" itemprop=third></span>
    </div>
    <div role="row" aria-rowindex="2">
      <span role="gridcell" itemprop=first>Morgan</span>
      <span role="gridcell" itemprop=second>Brian</span>
      <span role="gridcell" itemprop=third>Midfielder</span>
    </div>
    <div role="row" aria-rowindex="3">
      <span role="gridcell" itemprop=first>Abby</span>
      <span role="gridcell" itemprop=second>Dahlkemper</span>
      <span role="gridcell" itemprop=third>Defender</span>
    </div>
    <div role="row" aria-rowindex="4">
      <span role="gridcell" itemprop=first>Ashlyn</span>
      <span role="gridcell" itemprop=second>Harris</span>
      <span role="gridcell" itemprop=third>Goalkeeper</span>
    </div>
  </div>
</div>
```

What be-repeated does:

1.  Finds the element with aria-index=0, creates a template from it.
2.  Appends/deletes clones of the template, updating the aria-rowindex, until the indexes match the range specified.  When finished, raises an event, allowing subscribers to modify content as needed.  It then deletes the item with aria-rowindex="0".
3.  This does not alter server or previously rendered HTML and works around it.

Example 2 in the demo folder shows how we can separate out the JSON attribute into individual attributes.  We will skip that here, in favor of the example below which shows an alternative shorter name that this package provides support for.

## Example 3 Alternate name and more semantic syntax

```html
<div role="grid" aria-rowcount="100" >
  <div role="rowgroup">
    <div role="row" aria-rowindex="1">
      <span role="columnheader">First Name</span>
      <span role="columnheader">Last Name</span>
      <span role="columnheader">Position</span>
    </div>
  </div>
  <div role="rowgroup" ♻️-start-idx=2 ♻️-end-idx=99 ♻️-template-idx=0>
    <div role="row" aria-rowindex="0">
        <span role="gridcell" itemprop=first></span>
        <span role="gridcell" itemprop=second></span>
        <span role="gridcell" itemprop=third></span>
    </div>
    <div role="row" aria-rowindex="2">
      <span role="gridcell" itemprop=first>Morgan</span>
      <span role="gridcell" itemprop=second>Brian</span>
      <span role="gridcell" itemprop=third>Midfielder</span>
    </div>
    <div role="row" aria-rowindex="3">
      <span role="gridcell" itemprop=first>Abby</span>
      <span role="gridcell" itemprop=second>Dahlkemper</span>
      <span role="gridcell" itemprop=third>Defender</span>
    </div>
    <div role="row" aria-rowindex="4">
      <span role="gridcell" itemprop=first>Ashlyn</span>
      <span role="gridcell" itemprop=second>Harris</span>
      <span role="gridcell" itemprop=third>Goalkeeper</span>
    </div>
  </div>
</div>
```
