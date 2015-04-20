'use strict'
Base = pi.views.Base
Core = pi.Core
utils = pi.utils

class Base.Listable extends Core
  @mixedin: (owner) ->
    throw Error('List component is missing') unless owner.list?
    super

  load: (data) ->
    for item in data
      @list.add_item item, true
    @list.update()

  reload: (data) ->
    @list.data_provider data
    @searched(@_query) if @_query

  sort: (params) ->
    @list.sort params        

  sorted: (params) ->
    @list.sortable.clear()
    @list.sortable.sorted(params) if params?

  search: (query) ->
    @_query = query 
    @list.search query, true

  searched: (query) ->
    @_query = query # store query to highlight after update
    @list.searchable.start_search()
    @list.highlight query
    
    @list.searchable.stop_search(false) unless query

  filter: (data) ->
    @list.filter data

  filtered: (data) ->
    @list.filterable.start_filter()
    if data?
      @list.trigger 'filter_update'
    else
      @list.filterable.stop_filter(false)
   
  clear: (data) ->
    @list.clear()
    @list.clear_selection()?
    @list.scroll_end?.disable()