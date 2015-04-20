'use strict'
Base = pi.controllers.Base
Core = pi.Core
utils = pi.utils
Config = pi.config
Scope = require '../scope'

# Provides methods to work with list of elements
class Base.Paginated extends Core
  @mixedin: (owner) ->
    options = owner.options.modules.paginated || {}
  
    owner.per_page = options.per_page || Config.paginated?.per_page || 20
    owner.scope.set per_page: owner.per_page

    owner.query = utils.func.append(
      owner.query,
      (
        (promise, args) -> 
          @_page = args[0]?.page || 1
          promise.then(
            (data) =>
              @page_resolver(data) if data?
              data
          )
      )
    )

  # page resolver proccess server response to detect whether all data was loaded
  page_resolver: (data) ->
    @scope.full() if (list = data[@source_name])? and list.length < @per_page

  next_page: ->
    return utils.resolved_promise() if @scope.is_full
  
    @_page =  (@_page||0)+1
    @index(page: @_page)

# add page params to scope blacklist
Scope.blacklist.push 'page'

module.exports = Base.Paginated
