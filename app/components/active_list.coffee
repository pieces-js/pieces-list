'use strict'
List = require './list'
Selectable = require '../plugins/list/selectable'
Searchable = require '../plugins/list/searchable'
Sortable = require '../plugins/list/sortable'
Filterable = require '../plugins/list/filterable'

# Action list component (list + selectable, sortable, searchable, ...)
class ActiveList extends List
  @include_plugins Selectable, Sortable, Searchable, Filterable

module.exports = ActiveList