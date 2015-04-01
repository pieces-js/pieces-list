'use strict'
utils = pi.utils
Config = pi.config

# Scope determines whether to load query data from server or it can be parsed locally.
# Stores current query params and defines whether query context has been changed.
class Scope
  # Global rules that are applied to all scopes.
  # Every rule is a key -> function pair where fucntion accepts two arguments:
  # previous value and new value, and return 'true' iff new values doesn't change the scope.
  # 
  # Example:
  #   
  #   For searching we use 'q' key. Then we don't want to reload data if
  #   scoped data is full and our new 'q' value is a continuation of the previous one 
  #   (e.g. querying 'beatles' after 'beat'). Then our rule function looks like that:
  #   
  #   (prev_q, new_q) ->
  #     if new_q?
  #       # if new query not null then check whether previous
  #       # query is a prefix
  #       new_q.match(prev_q)?.index == 0
  #     else
  #       # otherwise check whether previous query was not null
  #       !prev_q
  @rules: {}

  # Global blacklist of params (e.g. page, per_page etc) that are not part of scope.
  @blacklist: []

  # Create scope
  # @param [null, Array] blacklist A list of params keys that should be filtered
  # @param [Object] rules Contains custom rules for specific keys
  constructor: (blacklist=[], rules={}) ->
    @is_full = false
    @blacklist = utils.arr.uniq(@constructor.blacklist.concat(blacklist))
    @rules = utils.merge(rules, @constructor.rules)
    @_scope = {}
    @params = {}

  _filter_key: (key) ->
    return @blacklist.indexOf(key) < 0 if @blacklist.length
    true

  _merge: (key, val) ->
    if val is null and @_scope[key]?
      delete @_scope[key]
      @is_full = false
      return
    @_scope[key] = @_resolve key, @_scope[key], val
    return

  _resolve: (key, old_val, val) ->
    if @rules[key]?(old_val,val)
      old_val
    else
      @is_full = false
      val

  set: (params = {}) ->
    (@params[key] = val) for own key, val of params when @_filter_key(key)

    for key, val of @params
      do =>
        if @_scope[key] isnt val
          @_merge(key, val)

  # Clear scope params and set is_full to false. 
  clear: ->
    @params = {}
    @_scope = {}
    @is_full = false

  to_s: ->
    _ref = []
    _ref.push("#{key}=#{val}") for key, val of @_scope
    _ref.join("&")

  # Set scope.is_full to true.
  full: ->
    utils.debug "Scope is full: #{@to_s()}"
    @is_full = true

  # Set scope.is_full to false
  reload: ->
    utils.debug "Scope should be reloaded: #{@to_s()}"
    @is_full = false

module.exports = Scope
