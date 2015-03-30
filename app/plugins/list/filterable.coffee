'use strict'
pi = require 'pi'
require '../../components/list'
utils = pi.utils

_is_continuation = (prev, params) ->
  for own key,val of prev
    if params[key] != val
      return false
  return true

# [Plugin]
#
# Add 'filter' method to list
# Filter items detaching (not hiding!) DOM elements.
class pi.List.Filterable extends pi.Plugin
  id: 'filterable'

  initialize: (@list) ->
    super
    @list.delegate_to @, 'filter'
    @list.on pi.ListEvent.Update, ((e) => @item_updated(e.data.item)), 
      @, 
      (e) => ((e.data.type is pi.ListEvent.ItemAdded or e.data.type is pi.ListEvent.ItemUpdated) and e.data.item.host is @list) 
    @
  
  item_updated: (item) ->
    return false unless @matcher

    if @_all_items.indexOf(item)<0
      @_all_items.unshift item

    if @matcher(item)
      return
    else if @filtered
      @list.remove_item item, true, false

    false

  all_items: ->
    @_all_items.filter((item) -> !item._disposed)

  start_filter: () ->
    return if @filtered
    @filtered = true
    @list.addClass pi.klass.FILTERED
    @_all_items = @list.items.slice()
    @_prevf = {}

  stop_filter: (rollback=true) ->
    return unless @filtered
    @filtered = false
    @list.removeClass pi.klass.FILTERED
    @list.data_provider(@all_items(), false, false) if rollback
    @_all_items = null
    @matcher = null
    @list.trigger pi.ListEvent.Filtered, false


  # Filter list items.
  # @param [Object] params 

  filter: (params) ->
    unless params?
      return @stop_filter()

    @start_filter() unless @filtered

    scope = if _is_continuation(@_prevf, params) then @list.items.slice() else @all_items()

    @_prevf = params

    @matcher = utils.matchers.object_ext record: params

    _buffer = (item for item in scope when @matcher(item))
    @list.data_provider(_buffer, false, false)

    @list.trigger pi.ListEvent.Filtered, true

module.exports = pi.List.Filterable
