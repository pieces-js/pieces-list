'use strict'
pi = require 'pi'
require '../../components/list'
utils = pi.utils

# [Plugin]
# Dispatch 'scroll_end' event when list is scrolled to bottom
class pi.List.ScrollEnd extends pi.Plugin
  id: 'scroll_end'
  initialize: (@list) ->
    super
    @scroll_object = 
      if @list.options.scroll_object == 'window' 
        pi.Nod.win 
      else if @list.options.scroll_object
        pi.$(@list.options.scroll_object)
      else
        @list.items_cont
    @_prev_top = @scroll_object.scrollTop()

    @enable() unless @list.options.scroll_end is false
    @list.on pi.ListEvent.Update, @scroll_listener(), @, (e) => (@enabled and (e.data.type is pi.ListEvent.ItemRemoved or e.data.type is pi.ListEvent.Load))
    @

  enable: () ->
    return if @enabled

    @scroll_object.on 'scroll', @scroll_listener() 
    @enabled = true

  disable: () ->
    return unless @enabled
    @.__debounce_id__ && clearTimeout(@__debounce_id__)
    @scroll_object.off('scroll', @scroll_listener()) unless @scroll_object._disposed is true
    @_scroll_listener = null      
    @enabled = false

  scroll_listener: (event) ->
    return false if @list._disposed
    if @_prev_top <= @scroll_object.scrollTop() and @list.height() - @scroll_object.scrollTop() - @scroll_object.height()  < 50
      @list.trigger pi.ListEvent.ScrollEnd
    @_prev_top = @scroll_object.scrollTop()
    false

  @event_handler('scroll_listener', throttle: 500)

  dispose: ->
    @disable()

module.exports = pi.List.ScrollEnd
