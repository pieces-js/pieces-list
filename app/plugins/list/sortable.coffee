'use strict'
Plugin = pi.Plugin
List = require '../../components/list'
ListEvent = require '../../components/events/list_events'
utils = pi.utils

# Add 'sort(field,order)' method to list
class List.Sortable extends Plugin
  id: 'sortable'
  initialize: ->
    super
    # set initial sort order (e.g. 'key1:desc,key2:asc')
    if @options.param?
      @_prevs = []
      for param in @options.param.split(",")
        do(param) =>
          data = {}
          [key,order] = param.split(":")
          data[key] = order
          @_prevs.push data
      @_compare_fun = (a,b) -> utils.keys_compare a.record, b.record, @_prevs

    @target.delegate_to @, 'sort'
    @target.on ListEvent.Update, ((e) => @item_updated(e.data.item)), @, (e) => ((e.data.type is ListEvent.ItemAdded or e.data.type is ListEvent.ItemUpdated) and e.data.item.host is @target) 
    @target.on ListEvent.Update, ((e) => @resort()), @, (e) => ((e.data.type is ListEvent.Load) and e.target is @target) 
    @

  item_updated: (item) ->
    return false unless @_compare_fun
    @_bisect_sort item, 0, @target.size - 1
    false

  _bisect_sort: (item, left, right) ->
    if right-left < 2
      if @_compare_fun(item,@target.items[left])>0
        @target.move_item(item,right)
      else
        @target.move_item(item,left)  
      return
    i = (left+(right-left)/2)|0
    a = @target.items[i]
    if @_compare_fun(item,a)>0
      left = i
    else
      right = i
    @_bisect_sort item, left, right 

  # clear compare_fun
  clear: ->
    @_compare_fun = null

  # sort list with current compare_fun
  resort: ->
    return false unless @_compare_fun

    @target.items.sort @_compare_fun
    @target.data_provider(@target.items.slice(),true,false)

  sort: (sort_params) ->
    return unless sort_params?
    sort_params = utils.to_a sort_params
    @_prevs = sort_params
   
    @_compare_fun = (a,b) -> utils.keys_compare a.record, b.record, sort_params

    @target.items.sort @_compare_fun

    @target.data_provider(@target.items.slice(),true,false)
    @target.trigger ListEvent.Sorted, sort_params

  sorted: (sort_params) ->
    return unless sort_params?
    sort_params = utils.to_a sort_params
    @_prevs = sort_params
    @_compare_fun = (a,b) -> utils.keys_compare a.record, b.record, sort_params
    @target.trigger ListEvent.Sorted, sort_params

module.exports = List.Sortable
