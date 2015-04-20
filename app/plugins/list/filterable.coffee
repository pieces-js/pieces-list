'use strict'
Plugin = pi.Plugin
List = require '../../components/list'
ListEvent = require '../../components/events/list_events'
Klass = require '../../components/utils/klass'
utils = pi.utils


_is_continuation = (prev, params) ->
  for own key,val of prev
    if params[key] != val
      return false
  return true

# Add 'filter' method to list
# Filter items detaching (not hiding!) DOM elements.
class List.Filterable extends Plugin
  id: 'filterable'

  initialize: ->
    super
    @target.delegate_to @, 'filter'
    @target.on ListEvent.Update, ((e) => @item_updated(e.data.item)), 
      @, 
      (e) => ((e.data.type is ListEvent.ItemAdded or e.data.type is ListEvent.ItemUpdated) and e.data.item.host is @target) 
    @
  
  item_updated: (item) ->
    return false unless @matcher

    if @_all_items.indexOf(item)<0
      @_all_items.unshift item

    if @matcher(item)
      return
    else if @filtered
      @target.remove_item item, true, false

    false

  all_items: ->
    @_all_items.filter((item) -> !item._disposed)

  start_filter: () ->
    return if @filtered
    @filtered = true
    @target.addClass Klass.FILTERED
    @_all_items = @target.items.slice()
    @_prevf = {}

  stop_filter: (rollback=true) ->
    return unless @filtered
    @filtered = false
    @target.removeClass Klass.FILTERED
    @target.data_provider(@all_items(), false, false) if rollback
    @_all_items = null
    @matcher = null
    @target.trigger ListEvent.Filtered, false


  # Filter list items.
  # @param [Object] params 

  filter: (params) ->
    unless params?
      return @stop_filter()

    @start_filter() unless @filtered

    scope = if _is_continuation(@_prevf, params) then @target.items.slice() else @all_items()

    @_prevf = params

    @matcher = utils.matchers.object_ext record: params

    _buffer = (item for item in scope when @matcher(item))
    @target.data_provider(_buffer, false, false)

    @target.trigger ListEvent.Filtered, true

module.exports = List.Filterable
