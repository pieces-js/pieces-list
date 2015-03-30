'use strict'
pi = require 'pi'
require '../../components/list'
utils = pi.utils
# [Plugin]
# Add ability to 'select' elements within list
# 
# Highlights selected elements with pi.klass.SELECTED class 

class pi.List.Selectable extends pi.Plugin
  id: 'selectable'
  initialize: (@list) ->
    super
    @list.merge_classes.push pi.klass.SELECTED
      
    @type(@list.options.select_type || 'radio') 
    
    @enable() unless @list.options.no_select?

    for item in @list.items 
      if item.hasClass pi.klass.SELECTED
        item.__selected__ = true

    @list.delegate_to @, 'clear_selection','selected','selected_item','select_all','select_item', 'selected_records', 'selected_record', 'deselect_item','toggle_select', 'selected_size'
    @list.on pi.ListEvent.Update, (
      (e) => 
        @_selected = null
        @_check_selected()
        false
    ), @, (e) -> (e.data.type isnt pi.ListEvent.ItemAdded) 
    @

  enable: ->
    unless @enabled
      @enabled = true
      @list.on pi.ListEvent.ItemClick, @item_click_handler()

  disable: ->
    if @enabled
      @enabled = false
      @list.off pi.ListEvent.ItemClick, @item_click_handler()

  type: (value) ->
    @is_radio = !!value.match('radio')
    @is_check = !!value.match('check')

  item_click_handler: (e) ->
    @list.toggle_select e.data.item, true
    @_check_selected() if e.data.item.enabled
    return      

  @event_handler 'item_click_handler'

  _check_selected: ->
    if @list.selected().length then @list.trigger(pi.Events.Selected, @list.selected()) else @list.trigger(pi.Events.SelectionCleared)

  # 'force' defines whether function is triggered by user interaction
  select_item: (item, force = false) ->
    if not item.__selected__ and (item.enabled or not force)
      if @is_radio and force
        @clear_selection(true)
      item.__selected__ = true
      @_selected_item = item
      @_selected = null  #TODO: add more intelligent cache
      item.addClass pi.klass.SELECTED

  deselect_item: (item, force = false) ->
    if item.__selected__ and ((item.enabled and @is_check) or (not force))
      item.__selected__ = false
      @_selected = null
      @_selected_item = null if @_selected_item is item
      item.removeClass pi.klass.SELECTED
  
  toggle_select: (item, force) ->
    if item.__selected__ then @deselect_item(item,force) else @select_item(item,force)

  clear_selection: (silent = false, force = false) ->
    @deselect_item(item) for item in @list.items when (item.enabled or force)
    @list.trigger(pi.Events.SelectionCleared) unless silent
  
  select_all: (silent = false, force = false) ->
    @select_item(item) for item in @list.items when (item.enabled or force)
    @list.trigger(pi.Events.Selected, @selected()) if @selected().length and not silent


  # Return selected items
  # @returns [Array]

  selected: () ->
    unless @_selected?
      @_selected = @list.where(__selected__: true)
    @_selected

  selected_item: ()->
    _ref = @list.selected()
    if _ref.length then _ref[0] else null

  selected_records: ->
    @list.selected().map((item)->item.record)

  selected_record: ->
    _ref = @list.selected_records()
    if _ref.length then _ref[0] else null

  selected_size: ->
    @list.selected().length

module.exports = pi.List.Selectable
