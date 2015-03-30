'use strict'
pi = require 'pi'
require '../../components/list'
require './selectable'
utils = pi.utils

# [Plugin]
# Add ability to 'select' elements within list and sublists
# All sublists should have class 'pi-list'

_null = ->

class pi.List.NestedSelect extends pi.List.Selectable
  id: 'nested_select'
  initialize: (@list) ->
    pi.Plugin::initialize.apply @, arguments

    @nested_klass = @list.options.nested_klass || 'nested-list'

    @selectable = @list.selectable || {select_all: _null, clear_selection: _null, type: _null, _selected_item: null, enable: _null, disable: _null} 
    @list.delegate_to @, 'clear_selection', 'select_all', 'selected', 'where', 'select_item', 'deselect_item'

    unless @list.has_selectable is true
      @list.delegate_to @, 'selected_records', 'selected_record', 'selected_item', 'selected_size'

    @enabled = true

    @disable() if @list.options.no_select?

    @type @list.options.nested_select_type||""

    @list.on [pi.Events.Selected,pi.Events.SelectionCleared], (e) =>
      if @_watching_radio and e.type is pi.Events.Selected 
          if e.target is @list
            item = @selectable._selected_item
          else
            item = e.data[0].host.selectable._selected_item
          @update_radio_selection item
      if e.target != @list
        e.cancel()
        @_check_selected()
      else
        false
    @

  enable: ->
    unless @enabled
      @enabled = true
      @selectable.enable()
      for item in @list.find_cut(".#{@nested_klass}")
        pi.Nod.fetch(item._nod)?.selectable?.enable()        

  disable: ->
    if @enabled
      @enabled = false
      @selectable.disable()
      for item in @list.find_cut(".#{@nested_klass}")
        pi.Nod.fetch(item._nod)?.selectable?.disable()        


  select_item: (item, force = false) ->
    if not item.__selected__
      if @_watching_radio
        @clear_selection(true)
      item.host.selectable?.select_item?(item,force)
      @_check_selected()
      item

  deselect_item: (item, force = false) ->
    if item.__selected__
      item.host.selectable?.deselect_item?(item,force)
      @_check_selected()
      item

  where: (query) ->
    ref = pi.List::where.call(@list, query)
    for item in @list.find_cut(".#{@nested_klass}")
      ref = ref.concat(nod.where(query)) if (nod = pi.Nod.fetch(item._nod))
    ref   

  type: (value) ->
    @is_radio = !!value.match('radio')
    if @is_radio 
      @enable_radio_watch()
    else
      @disable_radio_watch()

  enable_radio_watch: ->
    @_watching_radio = true

  disable_radio_watch: ->
    @_watching_radio = false

  update_radio_selection: (item) ->
    return if not item or (@_prev_selected_list is item.host)
    @_prev_selected_list = item.host
    if @list.selected().length > 1
      @list.clear_selection(true)
      item.host.select_item item
      return

  clear_selection: (silent = false, force = false) ->
    @selectable.clear_selection(silent, force)
    for item in @list.find_cut(".#{@nested_klass}")
      pi.Nod.fetch(item._nod)?.clear_selection?(silent)          
    @list.trigger(pi.Events.SelectionCleared) unless silent
  
  select_all: (silent = false, force = false) ->
    @selectable.select_all(true, force)
    for item in @list.find_cut(".#{@nested_klass}")
      pi.Nod.fetch(item._nod)?.select_all?(true, force)         
    unless silent
      _selected = @selected() 
      @list.trigger(pi.Events.Selected, _selected) if _selected.length

  selected: () ->
    _selected = []
    for item in @list.items
      if item.__selected__
        _selected.push item
      if item instanceof pi.List
        _selected = _selected.concat (item.selected?()||[])
      else if (sublists = item.find_cut(".#{@nested_klass}"))
        _selected = _selected.concat((pi.Nod.fetch(sublist._nod)?.selected?()||[])) for sublist in sublists
    _selected

module.exports = pi.List.NestedSelect
