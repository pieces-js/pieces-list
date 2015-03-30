'use strict'
h = require 'pi/test/helpers'
utils = pi.utils
Nod = pi.Nod

describe "List.Filterable", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = null

  beforeEach ->
    test_div = Nod.create('div')
    test_div.style position:'relative'
    root.append test_div

    test_div.append """
        <div class="pi test" data-component="list" data-plugins="filterable" data-pid="test" style="position:relative">
          <ul class="list">
            <script class="pi-renderer" type="text/html">
              <div class='item'>{{ name }}
                <span class='author'>{{ author }}</span>
              </div>
            </script>
          </ul>
        </div>
      """
    pi.app.view.piecify()

    list = test_div.find('.test')
    list.data_provider [ 
        {id:1, age: 12, gender: 0, author: 'John', labels: [1,4,6]},
        {id:2, age: 20, gender: 1, author: 'Bob', labels: [1,2]},
        {id:3, age: 18, gender: 1, author: 'John', labels: [1,3,4]} 
        {id:3, age: 25, gender: 0, author: 'Michael', labels: [1,3,4]} 
      ]

  afterEach ->
    test_div.remove()

  it "filter with one-key object", ->
    list.filter gender: 0
    expect(list.size()).to.equal 2
    list.filter author: 'John'
    expect(list.size()).to.equal 2

  it "filter with continuation", ->
    list.filter gender: 0
    expect(list.size()).to.equal 2
    list.filter author: 'John', gender: 0
    expect(list.size()).to.equal 1

  it "filter with more/less operands", ->
    list.filter "age>": 20
    expect(list.size()).to.equal 2
    list.filter "age<": 20, gender: 0
    expect(list.size()).to.equal 1
    list.filter "age<": 20
    expect(list.size()).to.equal 3

  it "filter with any operand", ->
    list.filter "author?": ['Bob','John']
    expect(list.size()).to.equal 3
    list.filter "author?": ['Bob','John'], gender: 1
    expect(list.size()).to.equal 2
    list.filter "gender?": [0,1]
    expect(list.size()).to.equal 4

  it "filter with contains operand", ->
    list.filter "labels?&": [1,4]
    expect(list.size()).to.equal 3
    list.filter "labels?&": [2,3]
    expect(list.size()).to.equal 0
    list.filter "labels?&": [3,4]
    expect(list.size()).to.equal 2

  it "return all not-removed items on filter stop", ->
    list.filter gender: 0
    expect(list.size()).to.equal 2
    list.remove_item_at 0
    expect(list.size()).to.equal 1
    list.filter() 
    expect(list.size()).to.equal 3

  it "refilter after new item added", (done) ->
    list.filter gender: 0
    expect(list.size()).to.equal 2
    list.on 'update', (e) =>
      return unless e.data.type is 'item_added'
      expect(list.size()).to.equal 3
      list.filter() 
      expect(list.size()).to.equal 5
      done()
    list.add_item {id:5, age: 12, gender: 0, author: 'Jack'}

  it "refilter after item updated", (done) ->
    list.filter gender: 0
    expect(list.size()).to.equal 2
    list.on 'update', (e) =>
      return unless e.data.type is 'item_updated'
      expect(list.size()).to.equal 1
      expect(list.all('.item').length).to.equal 1
      list.filter() 
      expect(list.size()).to.equal 4
      done()
    list.update_item list.items[0],  {id:1, age: 20, gender: 1, author: 'Bob'}
