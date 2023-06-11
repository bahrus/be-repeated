
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
<style>
  [aria-rowindex="0"]{
    display: none;
  }
</style>
```

What be-repeated does:

1.  Finds the element with aria-index=0, creates a template from it.
2.  Appends/deletes[TODO] clones of the template, updating the aria-rowindex, until the indexes match the range specified.  When finished, raises an event, allowing subscribers to modify content as needed.