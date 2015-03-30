'use strict'
h = require 'pi/test/helpers'
utils = pi.utils
Nod = pi.Nod

describe "List.ScrollEnd", ->
  root = h.test_cont(pi.Nod.body)

  after ->
    root.remove()

  test_div = list = null

  beforeEach ->
    test_div = Nod.create('div')
    test_div.style position:'relative'
    root.append test_div 
    test_div.append """
        <div class="pi" data-component="list" data-plugins="scroll_end" data-pid="test" style="position:relative; height: 30px;">
          <ul class="list" style="overflow-y:scroll;height:30px;">
            <li class="item" data-id="1" style="height:40px;" data-key="one">One<span class="tags">killer,puppy</span></li>
            <li class="item" data-id="2" style="height:40px;" data-key="someone">Two<span class="tags">puppy, coward</span></li>
            <li class="item" data-id="3" style="height:40px;" data-key="anyone">Tre<span class="tags">bully,zombopuppy</span></li>
          </ul>
        </div>
      """
    pi.app.view.piecify()
    list = test_div.find('.pi')

  afterEach ->
    test_div.remove()

  it "send scroll_end event", (done)->  
    list.on 'scroll_end', (event) =>
      done()  

    list.items_cont.node.scrollTop = list.items_cont.node.scrollHeight - list.items_cont.node.clientHeight - 49

  it "not send scroll_end event", ->  

    list.on 'scroll_end', (spy = sinon.spy())
    list.items_cont.node.scrollTop = list.items_cont.node.scrollHeight - list.items_cont.node.clientHeight - 100 
    expect(spy.callCount).to.eq 0


  it "send scroll_end event once per 500ms", (done)->        
    spy_fun = sinon.spy()
    list.on 'scroll_end', spy_fun

    utils.after 500, =>
      expect(spy_fun.callCount).to.eq 1
      done()

    list.items_cont.node.scrollTop = list.items_cont.node.scrollHeight - list.items_cont.node.clientHeight - 49 
    utils.after 200, =>
       list.items_cont.node.scrollTop += 5
       

  it "send scroll_end event twice per 1000ms", (done)->  
    
    spy_fun = sinon.spy()

    list.on 'scroll_end', spy_fun

    utils.after 1200, =>
      expect(spy_fun.callCount).to.eq 2
      done()

    list.items_cont.node.scrollTop = list.items_cont.node.scrollHeight - list.items_cont.node.clientHeight - 40 

    utils.after 200, =>
       list.items_cont.node.scrollTop += 5

    utils.after 350, =>
       list.items_cont.node.scrollTop += 5

    utils.after 450, =>
       list.items_cont.node.scrollTop += 5