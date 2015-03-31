'use strict'

class pi.Testo extends pi.resources.Base
  @set_resource 'testos'

class pi.Testo2 extends pi.resources.REST
  @set_resource 'testos'

class pi.TestoWrap extends pi.resources.REST
  @set_resource 'testos'
  wrap_attributes: true

class pi.Eater extends pi.resources.REST
  @set_resource 'eaters'
  @params 'name', 'age', 'weight'

class pi.resources.Chef extends pi.resources.REST
  @extend pi.resources.HasMany
  @set_resource 'chefs'

  @has_many 'testos', source: pi.Testo2, belongs_to: true, route: true, attribute: true, destroy: true, update_if: (type) -> type == 'destroy'
  @has_many 'eaters', source: pi.Eater, params: ['kg_eaten'], attribute: true, id_alias: 'eater_id', scope: false, update_if: true

  @params 'name', 'age', 'coolness'

  on_testos_update: ->
    @testos_updated=0 unless @testos_updated?
    @testos_updated++


class pi.resources.Testo extends pi.resources.Base
  @set_resource 'testos'

class pi.Salt extends pi.resources.Base
  @set_resource 'salts'


class pi.TestoRest extends pi.resources.REST
  @set_resource 'testos'
  @can_create pi.Salt
  @routes_namespace 'test/:path.json'
  @routes collection: [action: 'destroy_all', path: ':resources', method: 'delete']
  @params 'type', {flour: ['id', 'weight', {rye: ['type']} ]}, {salt: ['id', 'salinity']}

  @before_save -> @type||='normal'

  knead: ->
    @_is_kneading = true

class pi.TestoRest2 extends pi.resources.REST
  @set_resource 'testos'
  @routes_namespace 'types/:type/test/:path.json'

## RVC ##

class pi.resources.TestUsers extends pi.resources.REST
  @set_resource 'users'
  @params 'name','age'


class pi.resources.Meeting extends pi.resources.REST
  @extend pi.resources.HasMany
  @set_resource 'meetings'

  @has_many 'users', source: pi.resources.TestUsers, params: ['role_id'], attribute: true, scope: false, route: true, path: '/users/?filter[age]=:age'
  @params 'name', 'age'
  

class pi.resources.Profile extends pi.resources.REST
  @set_resource 'profiles'
  @params 'age', 'weight', 'height'

class pi.resources.User extends pi.resources.REST
  @set_resource 'users'
  @extend pi.resources.HasOne
  @params 'name','email'
  @has_one 'profile', source: pi.resources.Profile, attribute: true, destroy: true, update_if: (event, el) -> (event and event.type is 'destroy') or el.age < 100

  on_profile_update: ->
    @profile_updated=0 unless @profile_updated?
    @profile_updated++