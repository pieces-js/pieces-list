'use strict'
Plugin = pi.Plugin
List = require '../../components/list'
ListEvent = require '../../components/events/list_events'
Klass = require '../../components/utils/klass'
utils = pi.utils
Selectable = require './selectable'
Nod = pi.Nod

# Add ability to 'select' elements within list and sublists
# All sublists should have class 'pi-list'
class List.NestedSelect extends Selectable
  id: 'nested_select'
  initialize: ->
    Plugin::initialize.apply @, arguments

    @nested_klass = @options.klass || Klass.NESTED_LIST

    @selectable = @target.selectable || {select_all: utils.pass, clear_selection: utils.pass, type: utils.pass, _selected_item: null, enable: utils.pass, disable: utils.pass} 
    @target.delegate_to @, 'clear_selection', 'select_all', 'selected', 'where', 'select_item', 'deselect_item'

    unless @target.has_selectable is true
      @target.delegate_to @, 'selected_records', 'selected_record', 'selected_item', 'selected_size'

    @enabled = true

    @type(@options.type || "")

    @target.on [ListEvent.Selected, ListEvent.SelectionCleared], (e) =>
      if @_watching_radio and e.type is ListEvent.Selected
          if e.target is @target
            item = @selectable._selected_item
          else
            item = e.data[0].host.selectable._selected_item
          @update_radio_selection item
      if e.target != @target
        e.cancel()
        @_check_selected()
      else
        false
    @

  enable: ->
    unless @enabled
      @enabled = true
      @selectable.enable()
      for item in @target.find_cut(".#{@nested_klass}")
        Nod.fetch(item._nod)?.selectable?.enable()        

  disable: ->
    if @enabled
      @enabled = false
      @selectable.disable()
      for item in @target.find_cut(".#{@nested_klass}")
        Nod.fetch(item._nod)?.selectable?.disable()        


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
    ref = List::where.call(@target, query)
    for item in @target.find_cut(".#{@nested_klass}")
      ref = ref.concat(nod.where(query)) if (nod = Nod.fetch(item._nod))
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
    if @target.selected().length > 1
      @target.clear_selection(true)
      item.host.select_item item
      return

  clear_selection: (silent = false, force = false) ->
    @selectable.clear_selection(silent, force)
    for item in @target.find_cut(".#{@nested_klass}")
      Nod.fetch(item._nod)?.clear_selection?(silent)          
    @target.trigger(ListEvent.SelectionCleared) unless silent
  
  select_all: (silent = false, force = false) ->
    @selectable.select_all(true, force)
    for item in @target.find_cut(".#{@nested_klass}")
      Nod.fetch(item._nod)?.select_all?(true, force)         
    unless silent
      _selected = @selected() 
      @target.trigger(ListEvent.Selected, _selected) if _selected.length

  selected: () ->
    _selected = []
    for item in @target.items
      if item.__selected__
        _selected.push item
      if item instanceof List
        _selected = _selected.concat (item.selected?()||[])
      else if (sublists = item.find_cut(".#{@nested_klass}"))
        _selected = _selected.concat((Nod.fetch(sublist._nod)?.selected?()||[])) for sublist in sublists
    _selected

module.exports = List.NestedSelect
