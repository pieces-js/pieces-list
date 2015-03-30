'use strict'
h = require 'pi/test/helpers'
utils = pi.utils
Nod = pi.Nod

describe "List", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = null

  beforeEach ->
    test_div = Nod.create('div')
    test_div.style position:'relative'
    root.append test_div 
    test_div.append """
        <div class="pi test" data-component="list" data-pid="test" style="position:relative">
          <ul class="list">
            <li class="item" data-id="1" data-key="one">One<span class="tags">killer,puppy</span></li>
            <li class="item" data-id="2" data-key="someone">Two<span class="tags">puppy, coward</span></li>
            <li class="item" data-id="3" data-key="anyone">Tre<span class="tags">bully,zombopuppy</span></li>
          </ul>
        </div>
      """
    pi.app.view.piecify()
    list = test_div.find('.test')

  afterEach ->
    test_div.remove_children()

  describe "basics", ->
    it "parse list items", ->
      expect(list.size()).to.eq 3

    it "add item", ->
      item = Nod.create('<li class="item" data-id="4" data-key="new">New</li>')
      el = list.add_item item
      expect(el.record.$index).to.eq 3
      expect(list.size()).to.eq 4
      expect(test_div.find('.test').last('.item').text()).to.eq 'New'

    it "add item at index", ->
      item = Nod.create('<li class="item" data-id="4" data-key="new">New</li>')
      el = list.add_item_at item, 0
      expect(el.record.$index).to.eq 0
      expect(list.items[1].record.$index).to.eq 1
      expect(list.size()).to.eq 4
      expect(test_div.find('.test').first('.item').text()).to.eq 'New'

    it "trigger update event on add", (done) ->
      item = Nod.create('<li class="item" data-id="4" data-key="new">New</li>')
      
      list.on 'update', (event) =>
        expect(event.data.item.record.id).to.eq 4
        done()

      list.add_item_at item, 0

    it "remove element at", ->
      list.remove_item_at 0
      expect(list.size()).to.eq 2
      expect(list.items[1].record.$index).to.eq 1
      expect(test_div.find('.test').first('.item').data('id')).to.eq 2

    it "remove many items", ->
      list.remove_items [list.items[0],list.items[2]]
      expect(list.size()).to.eq 1
      expect(test_div.find('.test').first('.item').data('id')).to.eq 2

    it "update element and trigger item's events", (done) ->
      item = Nod.create('<li class="item" data-id="4" data-key="new">New</li>')
      
      old_item = list.items[0]
      old_item.disable()
      old_item.addClass 'is-fucked-up'
      old_item.on 'click', -> done()

      list.on 'update', (event) =>
        expect(event.data.item).to.eq old_item
        expect(event.data.item.hasClass('is-disabled')).to.be.true
        expect(event.data.item.hasClass('is-fucked-up')).to.be.false
        expect(event.data.item.enabled).to.eq false
        expect(event.data.type).to.eq 'item_updated'
        expect(event.data.item.record.id).to.eq 4
        expect(event.data.item.record.key).to.eq 'new'
        expect((test_div.find('.test').text()).trim()).to.eq 'NewTwopuppy, cowardTrebully,zombopuppy'
        event.data.item.enable()
        h.clickElement test_div.find(".test").first(".item").node

      list.update_item old_item, item

    it "clear all", ->
      list.clear()
      expect(test_div.find('.test').find('.item')).to.be.null

    it "create items nods as components", ->
      expect(list.items[0]).to.be.an.instanceof pi.Base

    it "peicify items nods", ->
      list._renderer = 
        render: (data, _, host) ->
          nod = Nod.create("<div>#{ data.title }</div>")
          nod.addClass 'item'
          nod.append "<span class='author pi'>#{ data.author }</span>"
          nod = nod.piecify(host)
          pi.utils.extend nod, data
          nod

      list.add_item {title: 'coffee', author: 'john'}

      item = list.where(title: 'coffee')[0]

      expect(item).to.be.an.instanceof pi.Base
      expect(item.host).to.eq list      
      expect(item.find('.author')).to.be.an.instanceof pi.Base

  describe "renderers", ->
    beforeEach ->
      list._renderer = 
        render: (data) ->
            nod = Nod.create("<div>#{ data.name }</div>")
            nod.addClass 'item'
            nod.append "<span class='author'>#{ data.author }</span>"
            nod.record = data
            nod
      return

    it "render items", ->
      list.data_provider [ 
        {id:1, name: 'Element 1', author: 'John'},
        {id:2, name: 'Element 2', author: 'Bob'},
        {id:3, name: 'Element 3', author: 'John'} 
      ]
      expect(list.all('.item').length).to.eq 3
      expect(list.first('.author').text()).to.eq 'John'

  describe "item_click", ->
    it "item after list modification", (done) ->
      list.remove_item_at 0

      list.on 'item_click', (e) =>
        expect(e.data.item.record.id).to.eq 2
        done()

      h.clickElement test_div.find(".test").first(".item").node

    it "item when click on child element", (done) ->

      list.on 'item_click', (e) =>
        expect(e.data.item.record.id).to.eq 2
        done()

      h.clickElement test_div.find(".test").find(".item:nth-child(2) .tags").node

    it "don't trigger on clickable element", (done) ->
      list.add_item Nod.create "<div class='item'>hi<a href='#' class='linko'>click</a></div>"

      list.on 'item_click', (e) =>
        expect(true).to.be.false
        done()

      utils.after 500, ->
        done()

      h.clickElement test_div.find(".test").find(".item .linko").node

  describe "where", ->
    it "find by simple one-key object", ->
      item = list.where(record:{id:1})[0]
      expect(item.record.key).to.eq 'one'

    it "find by object with string matcher", ->
      [item] = list.where(record:{key:'one'})
      expect(item.record.id).to.eq 1 

    it "find by simple string query", ->
      item = list.where('Tre')[0]
      expect(item.record.key).to.eq 'anyone'

    it "find by nested string query", ->
      [item1,item2] = list.where('.tags:\\bpuppy\\b')
      expect(item1.record.key).to.eq 'one'
      expect(item2.record.key).to.eq 'someone'
