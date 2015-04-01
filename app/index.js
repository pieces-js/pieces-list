'use strict'
var pi = window.pi;
pi.components.List = require('./components/list');
// load plugins before active_list !!! (otherwise they will be not available from it)
require('./plugins/list');
pi.components.ActiveList = require('./components/active_list');
pi.controllers.Scope = require('./controllers/scope');
require('./controllers/modules');
require('./views/modules');
module.exports = pi.components.List;
