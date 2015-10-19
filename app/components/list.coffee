'use strict'
Base = pi.components.Base
ListEvent = require './events/list_events'
Nod = pi.Nod
utils = pi.utils
Klass = require './utils/klass'

# Basic list component
class List extends Base
  merge_classes: [Klass.DISABLED, Klass.ACTIVE, Klass.HIDDEN]

  @active_property @::, 'size', default: 0
  @active_property @::, 
                  'empty', 
                  default: true, 
                  class: Klass.EMPTY
                  event: ListEvent.Empty

  preinitialize: ->
    super
    @list_klass = @options.list_klass || Klass.LIST
    @item_klass = @options.item_klass || Klass.LIST_ITEM

    @items = []
    @buffer = document.createDocumentFragment()

  initialize: ->
    super
    @items_cont = @find(".#{ @list_klass }") || @
    @parse_html_items()
    @

  postinitialize: ->
    super
    @_invalidate_size()
    unless @options.noclick?
      @listen ".#{ @item_klass }", 'click', (e) =>  
        unless utils.is_clickable(e.origTarget)
          if @_item_clicked(e.target) 
            e.cancel()
  
  parse_html_items: ->
    for node in @items_cont.find_cut(".#{ @item_klass }") 
      do (node) =>   
        @add_item Nod.create(node), true
    @_flush_buffer()

  # Set list elements
  # @params [Array, Null] data if null then clear list

  data_provider: (data = null, silent = false, remove = true) ->
    @clear(silent, remove) if @items.length  

    if data?
      @add_item(item,true) for item in data
    
    @update('load', silent)
    @

  add_item: (data, silent = false) ->
    item = @_create_item data, @items.length
    return unless item?
    
    @items.push item

    unless silent then @items_cont.append(item) else @buffer.appendChild(item.node)

    @_invalidate_size() unless silent

    @trigger(ListEvent.Update, {type: ListEvent.ItemAdded, item:item}) unless silent
    item
    
  add_item_at: (data, index, silent = false) ->
    if @items.length-1 < index
      return @add_item(data,silent)
      
          
    item = @_create_item data, index
    @items.splice(index,0,item)

    _after = @items[index+1]
    
    # save item index in DOM element
    item.record.$index = index
    item.record.$num = index+1
    _after.insertBefore item

    @_need_update_indeces = true

    @_invalidate_size()

    unless silent
      @_update_indeces()
      @trigger(ListEvent.Update, {type: ListEvent.ItemAdded, item:item})
    item

  remove_item: (item, silent = false, destroy = true) ->
    index = @items.indexOf(item)
    if index > -1
      @items.splice(index,1)
      if destroy
        @_destroy_item(item)
      else
        item.detach()

      @_invalidate_size()

      @_need_update_indeces = true

      unless silent
        @_update_indeces()
        @trigger(ListEvent.Update, {type: ListEvent.ItemRemoved,item:item})
      true
    else
      false

  remove_item_at: (index, silent = false) ->
    if @items.length-1 < index
      return
    
    item = @items[index]
    @remove_item(item,silent)

  remove_items: (items) ->
    for item in items
      @remove_item(item, true)
    @update()
    return

  # redraw item with new data
  # How it works:
  #  1. Render new item for new data
  #  2. Update item html (merge classes)
  #  3. Update item record (by extending it with new item data (overwriting))

  update_item: (item, data, silent=false) ->
    new_item = @renderer.render data, false

    # update associated record
    utils.extend item.record, new_item.record, true

    item._with_raf('list:data', =>
      # remove_children
      item.remove_children()

      # update HTML
      item.html new_item.html()

      #try to remove runtime classes
      for klass in item.node.className.split(/\s+/)
        item.removeClass(klass) if klass and !(klass in @merge_classes)
      #merge classes
      item.mergeClasses new_item
      
      # piecify ...
      item.piecify()
      # ... and postinitialize (because DOM was updated)
      item.postinitialize()

      @trigger(ListEvent.Update, {type: ListEvent.ItemUpdated, item: item}) unless silent
    )
    item  

  move_item: (item, index) ->
    return if (item.record.$index is index) || (index>@items.length-1)

    @items.splice @items.indexOf(item), 1

    if index is @items.length
      @items.push item
      @items_cont.append(item)
    else
      @items.splice(index,0,item)
      _after = @items[index+1]
      _after.insertBefore item

    @_need_update_indeces = true
    @_update_indeces()
    item

  # Find items within list using query
  #
  # @params [String, Object] query 
  #
  # @example Find items by object mask (would match all objects that have keys and equal ('==') values)
  #   list.find({age: 20, name: 'John'})
  # @example Find by string query = find by nod content
  #   list.find(".title:keyword") // match all items for which item.nod.find('.title').text().search(/keyword/) > -1

  where: (query) ->
    matcher = if typeof query == "string" then utils.matchers.nod(query) else utils.matchers.object(query)
    item for item in @items when matcher(item)

  records: ->
    @items.map((item) -> item.record)

  update: (type, silent = false) ->
    @_flush_buffer()
    @_update_indeces() if @_need_update_indeces
    @_invalidate_size()
    @trigger(ListEvent.Update, {type: type}) unless silent

  clear: (silent = false, remove = true) ->
    @items_cont.detach_children() unless remove
    @items_cont.remove_children() if remove
    @items.length = 0
    @_invalidate_size()
    @trigger(ListEvent.Update, {type: ListEvent.Clear}) unless silent

  _update_indeces: ->
    for item,i in @items
      item.record.$index = i
      item.record.$num = i+1
    @_need_update_indeces = false

  _invalidate_size: ->
    @size = @items.length
    @empty = @size is 0

  _create_item: (data={},index) ->
    if data instanceof Nod and data.is_list_item
      if data.host is @
        data.$index = index
        data.$num = index+1
        return data
      else
        return null
    if data instanceof Nod 
      data.data('$index', index)
      data.data('$num', index+1)
    else
      data.$index = index
      data.$num = index+1
    item = @renderer.render data, true, @
    return unless item?
    item.record ||={}
    item.is_list_item = true
    item

  _destroy_item: (item) ->
    item.remove()

  _flush_buffer: (append = true) ->
    @items_cont.append @buffer if append
    while @buffer.firstChild
     @buffer.removeChild(@buffer.firstChild)

  _item_clicked: (target) ->
    return unless target.is_list_item
    item = target
    if item and item.host is @
      @trigger ListEvent.ItemClick, {item: item}
      true

module.exports = List
