'use strict'
h = require 'pi/test/helpers'
utils = pi.utils
Nod = pi.Nod
Testo= pi.resources.Testo
View = pi.resources.View
Chef = pi.resources.Chef
Testo2 = pi.Testo2

describe "List.Restful", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = null

  page = pi.app.page


  describe "with params", ->

    beforeEach ->
      Testo.load [
        {id:1, type: 'puff', salt_id: 2},
        {id:2, type: 'gut', salt_id: 1},
        {id:3, type: 'bett', salt_id: 2},
        {id:4, type: 'yeast', salt_id: 1},
        {id:5, type: 'sweet', salt_id: 2},
        {id:6, type: 'donut', salt_id: 1}  
      ]
      test_div = Nod.create('div')
      test_div.style position:'relative'
      root.append test_div 
      test_div.append """
        <div class="pi pi-action-list" data-component="list" data-plugins="restful" data-load-rest="true" data-rest="Testo.view(salt_id:1)" data-listen-load="true" pid="list">
          <ul class="list">
            <script class="pi-renderer" type="text/html">
              <div class='type item'>{{ type }}
                <span class='salt'>{{ salt_id }}</span>
              </div>
            </script>
          </ul>
        </div> 
      """
      pi.app.reinitialize()
      list = test_div.find('.pi-action-list')

    afterEach ->
      test_div.remove()
      Testo.off()
      Testo.clear_all()

    describe "initialization", ->
      it "load elements on initialize", ->
        expect(list.size()).to.eq 3

      it "reload elements on unbind-bind", ->
        expect(list.size()).to.eq 3
        list.restful.bind null
        list.restful.bind Testo.view(salt_id:1), true
        expect(list.size()).to.eq 3

    describe "CRUD", ->
      it "add element", ->
        Testo.build(type:'dirt',id:7, salt_id: 1)
        expect(list.size()).to.eq 4
        expect(list.items[list.size()-1].record.type).to.eq 'dirt'

      it "not add element if it doesn't match", ->
        Testo.build(type:'dirt',id:7, salt_id: 2)
        expect(list.size()).to.eq 3

      it "remove element", ->
        Testo.remove_by_id(2)
        expect(list.size()).to.eq 2

      it "not remove element if it doesn't match", ->
        Testo.remove_by_id(1)
        expect(list.size()).to.eq 3

      it "load elements", ->
        Testo.load([{type:'dirt',id:7, salt_id: 1},{type:'sqrrt',id:8, salt_id: 2}])
        expect(list.size()).to.eq 4

      it "not load elements if they exist", ->
        Testo.load([{type:'dirt',id:2, salt_id: 1},{type:'sqrrt',id:4, salt_id: 1}])
        expect(list.size()).to.eq 3

  describe "with view", ->
    view = null
    beforeEach ->
      Testo.load [
        {id:1, type: 'puff', salt_id: 2},
        {id:2, type: 'gut', salt_id: 1},
        {id:3, type: 'bett', salt_id: 2},
        {id:4, type: 'yeast', salt_id: 1},
        {id:5, type: 'sweet', salt_id: 2},
        {id:6, type: 'donut', salt_id: 1}  
      ]
      test_div = Nod.create('div')
      test_div.style position:'relative'
      root.append test_div 
      test_div.append """
        <div class="pi pi-action-list" data-component="list" data-listen-load="true" data-plugins="restful"  pid="list">
          <ul class="list">
            <script class="pi-renderer" type="text/html">
              <div class='type item'>{{ type }}
                <span class='salt'>{{ salt_id }}</span>
              </div>
            </script>
          </ul>
        </div> 
      """
      pi.app.reinitialize()
      view = new View(Testo, salt_id: 1)
      view.build Testo.get(2)
      list = test_div.find('.pi-action-list')
      list.restful.bind view, true

    afterEach ->
      test_div.remove()
      Testo.off()
      Testo.clear_all()
      view.clear_all()
      view.off()

    describe "initialization", ->
      it "load elements on bind", ->
        expect(list.size()).to.eq 1

    describe "CRUD", ->
      it "add element", ->
        view.build(type:'dirt',id:7, salt_id: 1)
        expect(list.size()).to.eq 2
        expect(list.items[list.size()-1].record.type).to.eq 'dirt'

      it "remove element", ->
        Testo.remove_by_id(2)
        expect(list.size()).to.eq 0

      it "not remove element if it doesn't match", ->
        Testo.remove_by_id(1)
        expect(list.size()).to.eq 1


  describe "with association", ->
    chef = null
    beforeEach ->
      Chef.load [{id:1}]
      Testo2.load [
        {id:1, type: 'puff', chef_id: 2},
        {id:2, type: 'gut', chef_id: 1},
        {id:3, type: 'bett', chef_id: 2},
        {id:4, type: 'yeast', chef_id: 1},
        {id:5, type: 'sweet', chef_id: 2},
        {id:6, type: 'donut', chef_id: 1}  
      ]
      test_div = Nod.create('div')
      test_div.style position:'relative'
      root.append test_div 
      test_div.append """
        <div class="pi pi-action-list" data-component="list" data-listen-load="true" data-rest="Chef(1).testos()" data-plugins="restful" data-load-rest="true" pid="list">
          <ul class="list">
            <script class="pi-renderer" type="text/html">
              <div class='type item'>{{ type }}
                <span class='salt'>{{ salt_id }}</span>
              </div>
            </script>
          </ul>
        </div> 
      """
      pi.app.reinitialize()
      chef = Chef.get(1)
      list = test_div.find('.pi-action-list')

    afterEach ->
      test_div.remove()
      Testo2.off()
      Testo2.clear_all()
      Chef.clear_all()
      Chef.off()

    describe "initialization", ->
      it "load elements on bind", ->
        expect(list.size()).to.eq 3

    describe "CRUD", ->
      it "add element", ->
        chef.testos().build(type:'dirt',id:7)
        expect(list.size()).to.eq 4
        expect(list.items[list.size()-1].record.type).to.eq 'dirt'

      it "remove element", ->
        Testo2.remove_by_id(2)
        expect(list.size()).to.eq 2

      it "not remove element if it doesn't match", ->
        Testo2.remove_by_id(1)
        expect(list.size()).to.eq 3

  describe "with scoped resource which belongs to association", ->
    chef = null
    beforeEach ->
      Chef.load [{id:1}]
      Testo2.load [
        {id:1, type: 'puff', chef_id: 2},
        {id:2, type: 'gut', chef_id: 1},
        {id:3, type: 'bett', chef_id: 2},
        {id:4, type: 'yeast', chef_id: 1},
        {id:5, type: 'sweet', chef_id: 2},
        {id:6, type: 'donut', chef_id: 1}  
      ]
      test_div = Nod.create('div')
      test_div.style position:'relative'
      root.append test_div 
      test_div.append """
        <div class="pi pi-action-list" data-component="list" data-listen-load="true" data-plugins="restful" data-load-rest="true" pid="list">
          <ul class="list">
            <script class="pi-renderer" type="text/html">
              <div class='type item'>{{ type }}
                <span class='salt'>{{ salt_id }}</span>
              </div>
            </script>
          </ul>
        </div> 
      """
      pi.app.reinitialize()
      chef = Chef.get(1)
      list = test_div.find('.pi-action-list')
      list.restful.bind Testo2.view(chef_id:1), true

    afterEach ->
      test_div.remove()
      Testo2.off()
      Testo2.clear_all()
      Chef.clear_all()
      Chef.off()

    describe "initialization", ->
      it "load elements on bind", ->
        expect(list.size()).to.eq 3

    describe "CRUD", ->
      it "add element", ->
        chef.testos().build(type:'dirt',id:7)
        expect(list.size()).to.eq 4
        expect(list.items[list.size()-1].record.type).to.eq 'dirt'

      it "remove element", ->
        Testo2.remove_by_id(2)
        expect(list.size()).to.eq 2

      it "not remove element if it doesn't match", ->
        Testo2.remove_by_id(1)
        expect(list.size()).to.eq 3


  describe "with temporary association", ->
    chef = null
    beforeEach ->
      Testo2.load [
        {id:1, type: 'puff', chef_id: 2},
        {id:2, type: 'gut', chef_id: 1},
        {id:3, type: 'bett', chef_id: 2},
        {id:4, type: 'yeast', chef_id: 1},
        {id:5, type: 'sweet', chef_id: 2},
        {id:6, type: 'donut', chef_id: 1}  
      ]
      test_div = Nod.create('div')
      test_div.style position:'relative'
      root.append test_div 
      test_div.append """
        <div class="pi pi-action-list" data-component="list" data-listen-load="true" data-plugins="restful" pid="list">
          <ul class="list">
            <script class="pi-renderer" type="text/html">
              <div class='type item'>{{ type }}
                <span class='salt'>{{ salt_id }}</span>
              </div>
            </script>
          </ul>
        </div> 
      """
      chef = Chef.build name: 'Julio'
      @testo = chef.testos().build type: 'yaws'
      pi.app.reinitialize()
      list = test_div.find('.pi-action-list')

    afterEach ->
      test_div.remove()
      Testo2.off()
      Testo2.clear_all()
      Chef.clear_all()
      Chef.off()

    describe "initialization", ->
      it "load elements on bind", ->
        list.restful.bind chef.testos(), true
        expect(list.size()).to.eq 1
        expect(list.items[0].record.id).to.eq @testo.id

    describe "CRUD", ->
      beforeEach ->
        list.restful.bind chef.testos(), true

      it "add element", ->
        chef.testos().build(type:'dirt')
        expect(list.size()).to.eq 2
        expect(list.items[list.size()-1].record.type).to.eq 'dirt'
        expect(list.last('.type').text().trim()).to.eq 'dirt'

      it "remove element", ->
        chef.testos().remove @testo
        expect(list.size()).to.eq 0

      it "not remove element if it doesn't match", ->
        Testo2.remove_by_id(1)
        expect(list.size()).to.eq 1

      it "update element on create", ->
        @testo.set type: 'yeast', id: 123
        expect(list.size()).to.eq 1
        expect(list.items[list.size()-1].record.type).to.eq 'yeast'
        expect(list.items[list.size()-1].record.id).to.eq 123
        expect(list.find('.type').text().trim()).to.eq 'yeast'

      it "update element on update", ->
        @testo.set type: 'yeast'
        expect(list.size()).to.eq 1
        expect(list.items[list.size()-1].record.type).to.eq 'yeast'
        expect(list.find('.type').text().trim()).to.eq 'yeast'

      it "load elements on owner create", ->
        chef.set id: 5
        expect(list.size()).to.eq 1
        expect(list.items[list.size()-1].record.chef_id).to.eq 5




