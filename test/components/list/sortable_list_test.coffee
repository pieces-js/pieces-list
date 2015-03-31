'use strict'
h = require 'pieces-list/test/helpers'
utils = pi.utils
Nod = pi.Nod

describe "List.Sortable", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = null

  beforeEach ->
    test_div = Nod.create('div')
    test_div.style position:'relative'
    root.append test_div 
    test_div.append """
        <div class="pi" data-component="list" data-plugins="sortable" data-pid="test" style="position:relative">
          <ul class="list">
            <li class="item" data-val="10" data-key="one">One</li>
            <li class="item" data-val="5" data-key="noone">Two</li>
            <li class="item" data-val="15" data-key="anyone">Tre</li>
          </ul>
        </div>
      """
    pi.app.view.piecify()
    list = test_div.find('.pi')

  afterEach ->
    test_div.remove()


  it "sort by key", ->  
    list.sort {val: 'asc'}
    expect(test_div.find('.pi').first('.item').text()).to.equal 'Two'

  it "sort by many keys", ->
    list.sort [{key:'desc'},{val:'desc'}], [false, false]
    expect(test_div.find('.pi').first('.item').text()).to.equal 'One'

  it "dispatch sort event", (done)->
    list.on 'sorted', (event) =>
      expect(event.data[0]).to.eql {key:'asc'}
      expect(event.data[1]).to.eql {val:'asc'}
      done()
    list.sort [{key:'asc'},{val:'asc'}]

  it "resort items if item updated", (done)->
    list.sort {val: 'asc'}
    list.on 'update', (event) =>
      return unless event.data.type is 'item_updated'
      expect(test_div.find('.pi').first('.item').text()).to.eq 'Tre'
      done()
    item = list.where(record: key: 'anyone')[0]
    item.record.val = 2
    list.trigger 'update', type: 'item_updated', item: item

  it "resort items if item updated in the middle", (done)->
    list.sort {val: 'asc'}
    list.on 'update', (event) =>
      return unless event.data.type is 'item_updated'
      expect(test_div.find('.pi').first('.item').text()).to.eq 'Two'
      done()
    item = list.where(record: key: 'noone')[0]
    item.record.val = 2
    list.trigger 'update', type: 'item_updated', item: item

  it "resort items if item added", (done)->
    list.sort {val: 'asc'}
    list.on 'update', (event) =>
      return unless event.data.type is 'item_added'
      expect(test_div.find('.pi').first('.item').text()).to.eq 'Zero'
      done()
    list.add_item pi.Nod.create('''<li class="item" data-val="2" data-key="some">Zero</li>''')

  it "resort items if item added to the end", (done)->
    list.sort {val: 'asc'}
    list.on 'update', (event) =>
      return unless event.data.type is 'item_added'
      expect(test_div.find('.pi').nth('.item',4).text()).to.eq 'Zero'
      done()

    list.add_item pi.Nod.create('''<li class="item" data-val="20" data-key="some">Zero</li>''')

  it "resort items if item added in the middle", (done)->
    list.sort {val: 'asc'}
    list.on 'update', (event) =>
      return unless event.data.type is 'item_added'
      expect(test_div.find('.pi').nth('.item',3).text()).to.eq 'Zero'
      done()
    list.add_item pi.Nod.create('''<li class="item" data-val="11" data-key="some">Zero</li>''')
