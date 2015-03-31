'use strict'
h = require 'pieces-list/test/helpers'
utils = pi.utils
Nod = pi.Nod

describe "List.JST (simple template)", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = list2 = null

  beforeEach ->
    test_div = Nod.create('div')
    test_div.style position:'relative'
    root.append test_div

    test_div.append """
        <div class="pi test" data-component="list" data-pid="test" style="position:relative">
          <ul class="list">
            <script type="text/html" class="pi-renderer">
              <li class="item">
                {{ name }}<span>{{ $num }}</span>
              </li>
            </script>
          </ul>
        </div>
        <div class="pi test2" data-component="list" data-pid="test2" style="position:relative">
          <ul class="list">
            <script type="text/html" class="pi-renderer">
              <li class="item {? active ? 'is-active' ?}">
                {? size > 10 ? '10+' : size ?}
                {> tags }
                  <span class="tag tag-{{$i}}">{{ name }}</span>
                {< tags }
              </li> 
            </script>
          </ul>
        </div>
        <div class="pi test3" data-component="list" data-pid="test3" style="position:relative">
          <ul class="list">
            <script type="text/html" class="pi-renderer">
              <li class="item">
                {> types }
                  <span class="type type-{{$key}}">{{ name }}: {{ count }} / {{ $parent.size }}</span>
                {< types }
              </li> 
            </script>
          </ul>
        </div>
        <div class="pi test4" data-component="list" data-pid="test4" style="position:relative">
          <ul class="list">
            <script type="text/html" class="pi-renderer">
              <li class="item">
                {> profiles }
                  <span>{{ title }}</span><span>Phones:</span>
                  {> phones }
                  <span>Phone {{ $key }}: {{ $val }}</span>
                  {< phones }
                {< profiles }
              </li> 
            </script>
          </ul>
        </div>
        <div class="pi test5" data-component="list" data-pid="test5" style="position:relative">
          <ul class="list">
            <script type="text/html" class="pi-renderer">
              <li class="item">
                {> has_settings }
                  <span>Lang:</span> {{= settings.lang }}
                  <span>TZ:</span> {{ settings.tz }}
                {< has_settings }
              </li> 
            </script>
          </ul>
        </div>
      """
    pi.app.view.piecify()


  afterEach ->
    test_div.remove()

  
  it "render elements", ->
    list = test_div.find('.test')
    list.data_provider [ 
      {id:1, name: 'Element 1', size: 0, active: false},
      {id:2, name: 'Element 2', size: 100, active: true},
      {id:3, name: 'Element 3'} 
    ]
    expect(list.all('.item').length).to.equal 3
    expect(list.first('span').text()).to.equal '1'
    expect(utils.squish(list.items[2].html())).to.equal 'Element 3<span>3</span>'

  it "render elements with conditions and iterations (array)", ->
    list = test_div.find('.test2')
    list.data_provider [ 
      {id:1, name: 'Element 1', size: 0, active: false},
      {id:2, name: 'Element 2', size: 100, active: true},
      {id:3, name: 'Element 3', tags: [{name: 'a'},{name: 'b'}]} 
    ]
    expect(list.all('.item').length).to.equal 3
    expect(list.first('.is-active').text().trim()).to.equal '10+'
    expect(list.items[0].html().trim()).to.equal '0'
    expect(utils.squish(list.items[2].html())).to.equal '<span class="tag tag-0">a</span><span class="tag tag-1">b</span>'

  it "render iterations (object)", ->
    list = test_div.find('.test3')
    list.data_provider [ 
      {size: 0},
      {size: 100, types: {doc: {name: 'Documents', count: 12}, other: {name: 'Other', count: 88}}}
    ]
    expect(list.all('.item').length).to.equal 2
    expect(list.items[0].html().trim()).to.equal ''
    expect(utils.squish(list.items[1].html())).to.equal '<span class="type type-doc">Documents: 12 / 100</span><span class="type type-other">Other: 88 / 100</span>'

  it "render nested iterations (object)", ->
    list = test_div.find('.test4')
    list.data_provider [ 
      {profiles: [{title: 'new', phones: []}]},
      {profiles: [{title: 'john', phones: {home: '123', mobile: '987654321'}}, {title: 'jack', phones: {home: '0000'}}]}
    ]
    expect(list.all('.item').length).to.equal 2
    expect(list.items[0].html().trim()).to.equal '<span>new</span><span>Phones:</span>'
    expect(utils.squish(list.items[1].html())).to.equal '<span>john</span><span>Phones:</span> <span>Phone home: 123</span><span>Phone mobile: 987654321</span><span>jack</span><span>Phones:</span> <span>Phone home: 0000</span>'

  it "render elements with block condition", ->
    list = test_div.find('.test5')
    list.data_provider [ 
      {has_settings: false, settings: {}},
      {has_settings: 1, settings: {lang: '<a span="#de">De</a>', tz: '>+2'}}
    ]
    expect(list.all('.item').length).to.equal 2
    expect(list.items[0].html().trim()).to.equal ''
    expect(utils.squish(list.items[1].html())).to.equal '<span>Lang:</span> <a span="#de">De</a> <span>TZ:</span> &gt;+2'

