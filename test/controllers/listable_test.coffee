'use strict'
h = require 'pieces-list/test/helpers'

TestUsers = pi.resources.TestUsers
Controller = pi.controllers.Base
utils = pi.utils
Nod = pi.Nod

pi.config.page = {default: 'test', strategy: 'one_by_one'}

describe "Controller.Listable", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  page = example = null
  test_div = null

  beforeEach ->
    page = pi.app.page
    test_div = h.test_cont root, '''
        <div class="pi" data-controller="| listable('test_users')" pid="test" style="position:relative">
          <div>
            <h1 class="pi" pid="title"></h1> 
          </div>
          <div class="pi pi-action-list" data-component="active_list" data-listen-create="true" data-plugins="restful" data-rest="test_users" pid="list">
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

  it "#index", (done) ->
    example.index().then( ->
      expect(example.view.list.size()).to.eq 15
      done()
    ).catch(done)

  describe "querying", ->
    it "#search", (done) ->
      example.search('jo').then( ->
        expect(example.view.list.size()).to.eq 3
        done()     
      ).catch(done)

    it "#sort", (done) ->
      example.sort([{age: 'asc'}]).then(
        =>
          expect(example.view.list.items[0].record.name).to.eq 'luiza'
          done()
      ).catch(done)   

    it "#filter", (done) ->
      example.filter(age: 33).then(
        =>
          expect(example.view.list.size()).to.eq 4
          done()  
      ).catch(done)

    it "work with series", (done) ->
      example.search('k').then(
        =>
          expect(example.view.list.size()).to.eq 5
          expect(example.view.list.searchable.searching).to.be.true
          example.filter(age:21).then(
            =>
              expect(example.view.list.size()).to.eq 3
              expect(example.view.list.searchable.searching).to.be.true
              example.sort([{name: 'asc'}]).then(
                => 
                  expect(example.view.list.size()).to.eq 3
                  expect(example.view.list.searchable.searching).to.be.true
                  expect(example.view.list.items[0].record.name).to.eq 'klara'
                  done()
              )
          )          
      ).catch(done)

    it "work with queued series", (done) ->
      example.search('k')
      example.filter(age:21)
      example.sort([{name: 'asc'}]).then(
        => 
          expect(example.view.list.size()).to.eq 3
          expect(example.view.list.searchable.searching).to.be.true
          expect(example.view.list.items[0].record.name).to.eq 'klara'
          done()
      ).catch(done)


    it "work with series (and clear scope)", (done) ->
      example.filter(age: 33).then(
        =>
          expect(example.view.list.size()).to.eq 4
          expect(example.view.list.searchable.searching).to.be.false
          example.search('h').then(
            =>
              expect(example.view.list.size()).to.eq 3
              expect(example.view.list.searchable.searching).to.be.true
              expect(example.view.list.filterable.filtered).to.be.true
              example.filter(null).then(
                => 
                  expect(example.view.list.size()).to.eq 5
                  expect(example.view.list.searchable.searching).to.be.true
                  expect(example.view.list.filterable.filtered).to.be.false
                  example.search('').then(
                    =>
                      expect(example.view.list.size()).to.eq 15
                      expect(example.view.list.searchable.searching).to.be.false
                      expect(example.view.list.filterable.filtered).to.be.false
                      done()
                  )
              )
          )          
      ).catch(done)

    describe "resources", ->
      it "create item", (done) ->
        was = example.view.list.size()
        TestUsers.create({name:'vasya', age: 25}).then(
          (data) =>
            expect(data.user.name).to.eq 'vasya'
            expect(data.user.age).to.eq 25
            expect(example.view.list.size()).to.eq was+1
            done()
        ).catch(done)

      it "destroy item", (done) ->
        example.index().then(
          => 
            was = example.view.list.size()
            TestUsers.first().destroy().then(
              (data) =>
                expect(example.view.list.size()).to.eq was-1
                done()
            )
        ).catch(done)

      it "update item", (done) ->
        example.sort([{age: 'desc'}]).then(
          => 
            was = example.view.list.size()
            item = example.view.list.items[was-1].record
            item.set({age: 100})
            expect(example.view.list.size()).to.eq was
            expect(example.view.list.items[0].record.age).to.eq 100
            done()
        ).catch(done)
