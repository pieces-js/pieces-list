'use strict'
h = require 'pieces-list/test/helpers'

TestUsers = pi.resources.TestUsers
Controller = pi.controllers.Base
utils = pi.utils
Nod = pi.Nod

pi.config.page = {default: 'test', strategy: 'one_by_one'}

describe "Controller.Paginated", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  page = example = null
  test_div = null

  beforeEach ->
    page = pi.app.page
    test_div = h.test_cont root, '''
        <div class="pi" data-controller="| listable('test_users') paginated(per_page:5)" pid="test" style="position:relative">
          <div>
            <h1 class="pi" pid="title"></h1> 
          </div>
          <div class="pi pi-action-list" data-component="active_list" data-plugins="restful(create:true,rest:'test_users')" pid="list">
            <ul class="list">
              <script class="pi-renderer">
                <div class='item'>{{ name }}<span class="age">{{age}}</span></div>
              </script>
            </ul>
          </div> 
        </div>
      '''
    pi.app.reinitialize()
    example = page._contexts.test

  afterEach ->
    page.dispose()
    TestUsers.clear_all()
    TestUsers.off()

  describe "index paginated", ->
    it "load by pages", (done) ->
      example.index().then( ->
        expect(example.view.list.size).to.eq 5
        expect(TestUsers.count()).to.eq 5
        example.next_page()
      ).then( ->
        expect(example.view.list.size).to.eq 10
        expect(TestUsers.count()).to.eq 10
        done()
      ).catch(done) 

    it "not load if all loaded", (done) ->
      example.index().then( ->
        expect(example.view.list.size).to.eq 5
        expect(TestUsers.count()).to.eq 5
        example.next_page()
      ).then( ->
        expect(example.view.list.size).to.eq 10
        expect(TestUsers.count()).to.eq 10
        example.next_page()
      ).then( ->
        expect(example.view.list.size).to.eq 15
        expect(TestUsers.count()).to.eq 15
        example.next_page()
      ).then( ->
        expect(example.scope.is_full).to.be.true
        done()
      ).catch(done) 

    it "not load if request was queued when all loaded", (done) ->
      spy_fun = sinon.spy(example, 'do_query')
      example.index().then( ->
        expect(example.view.list.size).to.eq 5
        example.next_page()
        example.next_page()
        example.next_page()
        example.next_page()
      ).then( (data) ->
        expect(data).to.be.undefined
        expect(spy_fun.callCount).to.eq 4
        expect(example.view.list.size).to.eq 15
        expect(example.scope.is_full).to.be.true
        example.search('u')
      ).then( ->
        expect(example.view.list.size).to.eq 5
        example.next_page()
        example.next_page()
        example.next_page()
      ).then( (data) ->
        expect(data).to.be.undefined
        expect(example.view.list.size).to.eq 6
        done()
      ).catch(done)

  describe "queries", ->
    it "search by pages", (done) ->
      example.search('u').then( ->
        expect(example.view.list.size).to.eq 5
        example.next_page()
      ).then( ->
        expect(example.view.list.size).to.eq 6
        expect(TestUsers.all()).to.have.length 6
        expect(example.scope.is_full).to.be.true
        done()
      ).catch(done) 

  describe "index + search", ->
    it "request if scope is not full", (done) ->
      spy_fun = sinon.spy(example, 'do_query')
      example.sort([{age: 'desc'}]).then( ->
        expect(example.view.list.size).to.eq 5
        example.search('u')
      ).then( ->
        expect(example.view.list.size).to.eq 5
        expect(TestUsers.all()).to.have.length 9
        expect(example.view.list.items[0].record.name).to.eq 'hurry' 
        example.sort([{age: 'asc'}])
      ).then( ->
        expect(example.view.list.size).to.eq 5
        expect(TestUsers.all()).to.have.length 10
        expect(example.view.list.items[0].record.name).to.eq 'luiza' 
        expect(spy_fun.callCount).to.eq 3
        done()
      ).catch(done) 

    it "no request if scope is full and was local", (done) ->
      spy_fun = sinon.spy(example, 'do_query')
      example.sort([{age: 'desc'}]).then( ->
        expect(example.view.list.size).to.eq 5
        example.search('ur')
      ).then( ->
        expect(example.view.list.size).to.eq 2
        expect(example.scope.is_full).to.be.true
        expect(example.view.list.items[0].record.name).to.eq 'hurry' 
        example.search('urt')
      ).then( ->
        expect(example.view.list.size).to.eq 1
        example.search('ur')
      ).then( ->
        expect(example.view.list.size).to.eq 2
        expect(example.scope.is_full).to.be.true
        expect(example.view.list.items[0].record.name).to.eq 'hurry' 
        expect(spy_fun.callCount).to.eq 2
        done()
      ).catch(done) 

    it "request if scope is full and got debounce search calls", (done) ->
      spy_fun = sinon.spy(example, 'do_query')
      example.search('ur')
      example.search('urt')
      example.search('urt wqeq').then( ->
        expect(spy_fun.callCount).to.eq 1
        done()
      ).catch(done)

    it "reload initial even if scope was full in beetween call series", (done) ->
      spy_fun = sinon.spy(example, 'do_query')
      example.search('u')
      example.search('urr')
      example.search('ur').then( ->
        expect(example.view.list.size).to.eq 2
        example.search('')
      ).then(->
        expect(example.view.list.size).to.eq 5
        expect(spy_fun.callCount).to.eq 4
        done()
      ).catch(done)

    it "reload initial even if error", (done) ->
      spy_fun = sinon.spy(example, 'do_query')
      example.search('ur')
      example.filter('urt')
      example.search(null).catch( ->
        expect(example.view.list.size).to.eq 2
        expect(example.scope._scope.q).to.eq 'ur'
        expect(example.scope._scope.filter).to.be.undefined
        example.search(null)
      ).then( ->
        expect(example.view.list.size).to.eq 5
        expect(spy_fun.callCount).to.eq 3
        done()
      ).catch(done)
