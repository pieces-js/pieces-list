'use strict'
Base = pi.controllers.Base
Core = pi.Core
utils = pi.utils
Scope = require '../scope'

_url_rxp = /^(http|\/)/

# Provides methods to work with list of elements
class Base.Listable extends Core
  @mixedin: (owner) ->
    options = ''+owner.options.modules.listable
    if options.match(_url_rxp)
      owner.source = options
      owner.source_type = 'url'
      owner.source_name = 'items'
    else
      if (res = utils.obj.get_class_path(pi.resources, options))
        owner.source = res
        owner.source_type = 'resource'
        owner.source_name = res.resources_name
    throw Error("Undefined source for Listable: #{options}") unless owner.source?
    owner.scope = new Scope()

  # [internal]
  query: (params={}) ->
    unless @_promise?
      @_promise = utils.promise.resolved()

    @_promise = @_promise.then( =>
      @scope.set(params)
      if @scope.is_full is true
        utils.promise.resolved()
      else
        @do_query(@scope.params)
    ).catch( (e) =>
      # cleanup failed promise
      delete @_promise
      throw e
    )

  # [internal] do resource query or URL query
  do_query: (params) ->
    if @source_type is 'url'
      pi.Net.get(url, params)
    else
      @source.fetch(params)

  # Reload list of elements according to current scope
  index: (params) ->
    @query(params).then(
     (data) => 
        @view.load data[@source_name]
        data
    )

  # Load list by search query (using ...?q=query)
  # or search locally 
  search: (q) ->
    @query({q: q}).then(
      (data) =>
        if data?
          @view.reload data[@source_name]
          @view.searched q
        else
          @view.search(q)
        data
    )

  # Sort list (using ...?sort[field]=asc&sort[field2]=desc)
  # or sort locally 
  sort: (params = null) ->
    sort_params = {sort: params}
    @query(sort_params).then(
      (data) =>
        if data?
          @view.reload data[@source_name]
          @view.sorted params
        else
          @view.sort(params)
        data
    )

  # Filter list (using ...?filter[field]=value1&filter[field2]=value2)
  # or filter locally 
  filter: (params = null) ->
    filter_params = {filter: params}
    @query(filter_params).then(
      (data) =>
        if data?
          @view.reload data[@source_name]
          @view.filtered params
        else
          @view.filter(params)
        data
    )

# Add scope rules
Scope.rules['q'] = 
  (prev_q, new_q) ->
    if new_q?
      # if new query is not null then check whether previous
      # query is a prefix
      new_q.match(prev_q)?.index == 0
    else
      # otherwise check whether previous query was not null
      !prev_q

module.exports = Base.Listable
