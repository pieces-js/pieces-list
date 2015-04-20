'use strict'
Plugin = pi.Plugin
List = require '../../components/list'
ListEvent = require '../../components/events/list_events'
Klass = require '../../components/utils/klass'
utils = pi.utils
Events = pi.components.Events
Compiler = pi.Compiler

# Bind resources to List (handle create, update and destroy events)  
class List.Restful extends Plugin
  id: 'restful'
  initialize: ->
    super
    # invoke renderer before binding resource
    @target.renderer
    @items_by_id = {}
    @options.load = @options.load is true
    @options.create = if @options.create? then @options.create else @options.load
    
    if (rest = @options.rest)?
      # we want to use it with snake-cased names too (e.g. 'user', 'user_data')
      rest = utils.camelCase(rest) if rest.match(/^[a-z\_]+$/i)
        
      resources = Compiler.str_to_fun(rest).call() 

    @bind resources

    @target.delegate_to @, 'find_by_id'
    @target.on Events.Destroyed, =>
      @bind null
      false
    @

  bind: (resources, load = true) ->
    if @resources
      @resources.off @resource_update()
    @resources = resources
    unless @resources?
       @items_by_id = {}
       @target.clear() unless @target._disposed
       return

    @resources.listen @resource_update()
    
    @load(resources.all()) if load

  find_by_id: (id) ->
    if @options.load
      return @items_by_id[id] if @items_by_id[id]?
    items = @target.where(record: {id: id})
    if items.length
      @items_by_id[id] = items[0]

  load: (data) ->
    for item in data
      @items_by_id[item.id] = @target.add_item(item, true) unless @items_by_id[item.id] and @options.load
    @target.update(ListEvent.Load)

  resource_update: (e) ->
    utils.debug_verbose 'Restful list event', e
    @["on_#{e.data.type}"]?.call(@, e.data[@resources.resource_name])

  @event_handler 'resource_update'

  on_load: ->
    return unless @options.load
    @load @resources.all()

  on_create: (data) ->
    return unless @options.create
    unless @find_by_id(data.id)
      @items_by_id[data.id] = @target.add_item data
    # handle temp item created
    else if data.__tid__ and (item = @find_by_id(data.__tid__))
      delete @items_by_id[data.__tid__]
      @items_by_id[data.id] = item
      @target.update_item item, data

  on_destroy: (data) ->
    if (item = @find_by_id(data.id))
      @target.remove_item item
      delete @items_by_id[data.id]
    return

  on_update: (data) ->
    if (item = @find_by_id(data.id))
      @target.update_item item, data

  dispose: ->
    @items_by_id = null
    @resources.off(@resource_update()) if @resources?

module.exports = List.Restful
