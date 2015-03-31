'use strict'
pi.noconflict()
require './support/resources'

class TestHelpers
  @test_cont: (cont, html = 'div') ->
    nod = pi.Nod.create html
    cont.append nod
    nod

  @inputElement: (type, name, value='') ->
    input = document.createElement 'input'
    input.type = type
    input.name = name
    input.value = value
    input
  
  @selectElement: (name, multiple = false, options...) ->
    select = document.createElement 'select'
    select.name = name
    select.multiple = multiple

    for option in options 
      do (option) ->
        opt = document.createElement 'option'
        opt.value = option.value
        opt.selected = true if option.selected
        opt.text = option.value
        select.appendChild opt

    select
  
  @mouseEventElement: (el,type, x=0, y=0) ->
    ev = document.createEvent "MouseEvent"
    ev.initEvent(
      type,
      true, #bubble 
      true #cancelable
    )
    el.dispatchEvent ev 
    return

  @changeElement: (el) ->
    ev = document.createEvent "HTMLEvents"
    ev.initEvent(
      'change',
      true, #bubble 
      true
    )
    el.dispatchEvent ev 
    return

  @submitElement: (el) ->
    ev = document.createEvent "HTMLEvents"
    ev.initEvent(
      'submit',
      false, #bubble 
      true
    )
    el.dispatchEvent ev 
    return

  @clickElement: (el) ->
    TestHelpers.mouseEventElement el, "click"
    return

  @keyEvent: (nod, type, code) ->
    code = code.charCodeAt(0) if typeof code is 'string'
    ev = document.createEvent "KeyboardEvent"
    ev.initKeyboardEvent(type, true, true, null, 0, false, 0, false, code, 0) 
    nod.native_event_listener ev
    return

  @scrollEvent: (el) ->
    ev = document.createEvent "Event"
    ev.initEvent(
      'scroll',
      true, #bubble 
      true #cancelable
    )
    el.dispatchEvent ev 
  
  @resizeEvent: ->
    ev = document.createEvent('UIEvents')
    ev.initUIEvent('resize', true, false,window,0)
    window.dispatchEvent(ev)

  @mock_net: ->
    @_orig_req = pi.Net.request
    pi.Net.request = (pi._mock_net ||= ( ->
        (method, url, data, options) ->
          new Promise(
            (resolve, reject) ->
              req = new XMLHttpRequest()
             
              params = []
              if data?
                params.push("#{ key }=#{ encodeURIComponent(val) }") for own key, val of data
            
              params = "#{ params.join("&") }"

              fake_url="/support/#{ url.replace(/\//g,"_") }"
             
              req.open 'GET', fake_url, true
              
              req.onreadystatechange = ->

                return if req.readyState isnt 4 

                if req.status is 200
                  response = JSON.parse req.responseText
                  method = method.toLowerCase()
                  resolve(if response[method]? then response[method] else response["default"])
                else
                  reject Error(req.statusText)
        
              req.onerror = ->
                reject Error("Network Error")
                return
            
              req.send(null)
          )
      )())
    pi.Net[method] = curry(pi.Net.request, [method.toUpperCase()], pi.Net) for method in ['get', 'post', 'patch', 'put', 'delete']
    return
  @unmock_net: ->
    pi.Net.request = @_orig_req
    pi.Net[method] = curry(pi.Net.request, [method.toUpperCase()], pi.Net) for method in ['get', 'post', 'patch', 'put', 'delete']

  @mock_raf: ->
    @_orig_raf = pi.Nod::_with_raf
    pi.Nod::_with_raf = (name, callback) -> callback()

  @unmock_raf: ->
    pi.Nod::_with_raf = @_orig_raf

module.exports = TestHelpers
