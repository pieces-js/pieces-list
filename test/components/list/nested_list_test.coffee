'use strict'
h = require 'pi/test/helpers'
utils = pi.utils
Nod = pi.Nod

describe "List.NestedSelect", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = null

  beforeEach ->
    test_div = Nod.create('div')
    test_div.style position:'relative'
    root.append test_div 
    test_div.append """
        <div class="pi test" data-component="list" data-nested-klass="pi-list" data-plugins="selectable nested_select" data-pid="test" style="position:relative">
          <ul class="list">          
            <li class="pi item pi-list click1" data-component="list" data-group-id="1" data-id="10" data-plugins="selectable"> 
              <span class="click1">Click1</span>
              <ul class="list">
                <li class="item" data-id="1" data-key="one">One<span class="tags">killer,puppy</span></li>
                <li class="item click2" data-id="2" data-key="someone">Two<span class="tags">puppy, coward</span></li>
                <li class="item click20" data-id="3" data-key="anyone">Tre<span class="tags">bully,zombopuppy</span></li>
              </ul>
            </li>
            <li class="pi item pi-list" data-component="list" data-group-id="2" data-key="a" data-id="11" data-plugins="selectable"> 
              <span>Click2</span>
              <ul class="list">
                <li class="item click3" data-key="a" data-id="4">A</li>
                <li class="item click30" data-id="5">B</li>
                <li class="item" data-id="6">C</li>
              </ul>
            </li>
            <li class="pi item"> 
              <span>Nested sublist</span>
              <div class="pi pi-list click10" data-component="list" pid="list" data-group-id="3" data-id="12" data-plugins="selectable sortable searchable"> 
                <span>Click3</span>
                <ul class="list">
                  <li class="item" data-id="7">1</li>
                  <li class="item click4" data-id="8" data-key="a">2</li>
                  <li class="item" data-id="9" data-key="a">3</li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      """
    pi.app.view.piecify()
    list = test_div.find('.test')

  afterEach ->
    test_div.remove()

  describe "selected/selected_item", ->

    it "select one upper level item", (done)->
      list.on 'selected', (event) =>
        expect(list.selected()[0].record.group_id).to.eq 1
        expect(event.data[0].record.group_id).to.eq 1
        done()

      h.clickElement test_div.find('.click1').node

    it "select one lower level item", (done)->
      list.on 'selected', (event) =>
        expect(list.selected()[0].record.id).to.eq 2
        expect(event.data[0].record.id).to.eq 2
        done()

      h.clickElement test_div.find('.click2').node

    it "select_all", (done)->
      list.on 'selected', (event) =>
        expect(list.selected()).to.have.length 12
        expect(event.data[1].record.id).to.eq 1
        done()

      list.select_all()

  describe "events", ->
    beforeEach ->
      list.items[1].selectable.type 'check'

    describe "selection_cleared", ->

      it "don't send nested selection_cleared", (done)->
        list.select_item list.items[0]

        list.items[1].select_item list.items[1].items[0]

        list.on 'selection_cleared', (event) =>
          done("should not send nested event!")

        h.clickElement test_div.find('.click3').node
        utils.after 200, done

      it "selection_cleared if all cleared", (done)->
        list.items[1].select_item list.items[1].items[0]


        list.on 'selection_cleared', (event) =>
          done()

        h.clickElement test_div.find('.click3').node

    describe "selected", ->
      it "selected event with all selected items", (done)->
        list.select_item list.items[0]
        list.items[1].select_item list.items[1].items[1]

        list.on 'selected', (e) =>
          expect(e.data).to.have.length 3
          done()

        h.clickElement test_div.find('.click3').node

    describe "update", ->
      it "update events from nested lists", (done)->
        list.on 'update', (e) =>
          expect(e.data.type).to.eq 'item_added'
          expect(e.data.item.record.id).to.eq 10
          done()

        list.items[2].list.add_item pi.Nod.create('''<li class="item" data-id="10">10</li>''')

  describe "where", ->
    it "find items within nested lists and host list", ->
      expect(list.where(record: {key: 'a'})).to.have.length 4

  describe "select and deselect item", ->
    it "select and deselect items", (done) ->
      list.on 'selected', (e) =>
        expect(e.data[0].record.id).to.eq 7
        done()
      list.select_item(list.where(record: {id: 7})[0])

  describe "selected records", ->
    it "select records", ->
      list.select_item list.items[0]

      list.items[1].select_item list.items[1].items[0]
      list.items[2].list.select_item list.items[2].list.items[2]

      expect(list.selected_records().map((rec) -> rec.id)).to.eql [10, 4, 9]

    it "return one selected record", ->
      list.select_item list.items[0]
      expect(list.selected_record().id).to.eq 10

      list.clear_selection()

      list.items[1].select_item list.items[1].items[0]
      expect(list.selected_record().id).to.eq 4

  describe "selection types", ->

    it "radio", ->
      h.clickElement test_div.find('.click1').node
      h.clickElement test_div.find('.click2').node
      h.clickElement test_div.find('.click10').node
      h.clickElement test_div.find('.click3').node
      h.clickElement test_div.find('.click20').node
      h.clickElement test_div.find('.click30').node
      h.clickElement test_div.find('.click4').node

      expect(list.selected_size()).to.eq 4

    it "inner as radio and outer as check", ->
      list.selectable.type 'check'
      h.clickElement test_div.find('.click1').node
      h.clickElement test_div.find('.click2').node
      h.clickElement test_div.find('.click10').node
      h.clickElement test_div.find('.click3').node
      h.clickElement test_div.find('.click20').node
      h.clickElement test_div.find('.click30').node
      h.clickElement test_div.find('.click4').node

      expect(list.selected_size()).to.eq 5

    it "inner as check and outer as radio", ->
      item.selectable?.type('check') for item in list.items
      list.items[2].list.selectable.type 'check'
      h.clickElement test_div.find('.click1').node
      h.clickElement test_div.find('.click2').node
      h.clickElement test_div.find('.click10').node
      h.clickElement test_div.find('.click3').node
      h.clickElement test_div.find('.click20').node
      h.clickElement test_div.find('.click30').node
      h.clickElement test_div.find('.click4').node

      expect(list.selected_size()).to.eq 6

    it "check", ->
      list.selectable.type 'check'
      item.selectable?.type('check') for item in list.items
      list.items[2].list.selectable.type 'check'
      h.clickElement test_div.find('.click1').node
      h.clickElement test_div.find('.click2').node
      h.clickElement test_div.find('.click10').node
      h.clickElement test_div.find('.click3').node
      h.clickElement test_div.find('.click20').node
      h.clickElement test_div.find('.click30').node
      h.clickElement test_div.find('.click4').node

      expect(list.selected_size()).to.eq 7

    it "nested_select_type is radio", ->
      list.selectable.type 'check radio'
      item.selectable?.type('check radio') for item in list.items
      list.items[2].list.selectable.type 'check radio'
      list.nested_select.type 'radio'
      h.clickElement test_div.find('.click1').node
      expect(list.selected_size()).to.eq 1
  
      h.clickElement test_div.find('.click2').node
      h.clickElement test_div.find('.click10').node
      expect(list.selected_size()).to.eq 1
  
      h.clickElement test_div.find('.click3').node
      h.clickElement test_div.find('.click20').node
      expect(list.selected_size()).to.eq 1
  
      h.clickElement test_div.find('.click30').node
      h.clickElement test_div.find('.click4').node
      expect(list.selected_size()).to.eq 1

      h.clickElement test_div.find('.click4').node
      expect(list.selected_size()).to.eq 0

describe "List.NestedSelect (but not Selectable)", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = null

  beforeEach ->
    test_div = Nod.create('div')
    test_div.style position:'relative'
    root.append test_div 
    test_div.append """
        <div class="pi test" data-component="list" data-nested-klass="pi-list" data-plugins="nested_select" data-pid="test" style="position:relative">
          <ul class="list">          
            <li class="pi item pi-list click1" data-component="list" data-group-id="1" data-id="10" data-plugins="selectable"> 
              <span class="click1">Click1</span>
              <ul class="list">
                <li class="item" data-id="1" data-key="one">One<span class="tags">killer,puppy</span></li>
                <li class="item click2" data-id="2" data-key="someone">Two<span class="tags">puppy, coward</span></li>
                <li class="item click20" data-id="3" data-key="anyone">Tre<span class="tags">bully,zombopuppy</span></li>
              </ul>
            </li>
            <li class="pi item pi-list" data-component="list" data-group-id="2" data-id="11" data-plugins="selectable" data-select-type="check"> 
              <span>Click2</span>
              <ul class="list">
                <li class="item click3" data-id="4">A</li>
                <li class="item click30" data-id="5">B</li>
                <li class="item" data-id="6">C</li>
              </ul>
            </li>
            <li class="pi item pi-list click10" data-component="list" data-group-id="3" data-id="12" data-plugins="selectable"> 
              <span>Click3</span>
              <ul class="list">
                <li class="item" data-id="7">1</li>
                <li class="item click4" data-id="8">2</li>
                <li class="item" data-id="9">3</li>
              </ul>
            </li>
          </ul>
        </div>
      """
    pi.app.view.piecify()
    list = test_div.find('.test')

  afterEach ->
    test_div.remove()

  describe "selected and selected_item", ->

    it "don't select one upper level item", ->
      spy_fun = sinon.spy()
      list.on 'selected', spy_fun
      h.clickElement test_div.find('.click1').node
      expect(spy_fun.callCount).to.eq 0

    it "select all", (done)->
      list.on 'selected', (event) =>
        expect(list.selected()).to.have.length 9
        expect(event.data[1].record.id).to.eq 2
        done()

      list.select_all()

  describe "selection cleared", ->
    it "selection_cleared if all cleared", (done)->
      list.items[1].select_item list.items[1].items[0]

      list.on 'selection_cleared', (event) =>
        done()

      h.clickElement test_div.find('.click3').node

describe "List.NestedSelect (several nested lists within one item)", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = null

  beforeEach ->
    test_div = Nod.create('div')
    test_div.style position:'relative'
    root.append test_div 
    test_div.append """
        <div class="pi test" data-component="list" data-nested-klass="pi-list" data-plugins="nested_select" data-pid="test" style="position:relative">
          <ul class="list">          
            <li class="pi item pi-list click1" data-component="list" data-group-id="1" data-id="10" data-plugins="selectable"> 
              <span class="click1">Click1</span>
              <ul class="list">
                <li class="item" data-id="1" data-key="one">One<span class="tags">killer,puppy</span></li>
                <li class="item click2" data-id="2" data-key="someone">Two<span class="tags">puppy, coward</span></li>
                <li class="item click20" data-id="3" data-key="anyone">Tre<span class="tags">bully,zombopuppy</span></li>
              </ul>
            </li>
            <div class="pi item">
              <li class="pi pi-list" data-group-id="2" data-component="list" data-id="11" data-plugins="selectable" data-select-type="check"> 
                <span>Click2</span>
                <ul class="list">
                  <li class="item click3" data-id="4">A</li>
                  <li class="item click30" data-id="5">B</li>
                  <li class="item" data-id="6">C</li>
                </ul>
              </li>
              <li class="pi pi-list click10" data-component="list" data-group-id="3" data-id="12" data-plugins="selectable" data-select-type="check"> 
                <span>Click3</span>
                <ul class="list">
                  <li class="item" data-id="7">1</li>
                  <li class="item click4" data-id="8">2</li>
                  <li class="item" data-id="9">3</li>
                </ul>
              </li>
            </div>
          </ul>
        </div>
      """
    pi.app.view.piecify()
    list = test_div.find('.test')

  afterEach ->
    test_div.remove()

  describe "selected and selected_item", ->
    it "select item", ->
      spy_fun = sinon.spy()
      list.on 'selected', spy_fun
      h.clickElement $('.click4').node
      expect(list.selected()).to.have.length 1
      expect(spy_fun.callCount).to.eq 1

    it "select all", ->
      list.on 'selected', (spy_fun = sinon.spy())
      list.select_all()
      
      expect(spy_fun.callCount).to.eq 1
      expect(list.selected()).to.have.length 9
      expect(list.selected()[8].record.id).to.eq 9

  describe "selection cleared", ->
    it "send nested selection cleared if all cleared", ->
      h.clickElement $('.click4').node

      sublist = $('.click10')

      expect(list.selected()).to.have.length 1
      expect(sublist.selected()).to.have.length 1

      list.on 'selection_cleared', (spy_fun = sinon.spy())
      
      h.clickElement $('.click4').node

      expect(sublist.selected()).to.have.length 0
      expect(list.selected()).to.have.length 0
      expect(spy_fun.callCount).to.eq 1
