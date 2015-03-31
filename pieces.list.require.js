(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.define({'pieces-list/components/events/list_events': function(exports, require, module) {
  'use strict';
var ListEvent;

ListEvent = {
  Update: 'update',
  ItemAdded: 'item_added',
  ItemRemoved: 'item_removed',
  ItemUpdated: 'item_updated',
  Clear: 'clear',
  Load: 'load',
  Empty: 'empty',
  ItemClick: 'item_click',
  Filtered: 'filetered',
  Searched: 'searched',
  ScrollEnd: 'scroll_end',
  Sorted: 'sorted',
  Selected: 'selected',
  SelectionCleared: 'selection_cleared'
};

module.exports = ListEvent;


}});

require.define({'pieces-list/components/list': function(exports, require, module) {
  'use strict';
var Base, Klass, List, ListEvent, Nod, Renderable, utils, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Base = require('pieces-core').components.Base;

ListEvent = require('./events/list_events');

Nod = require('pieces-core').Nod;

utils = require('pieces-core').utils;

Klass = require('./utils/klass');

Renderable = Base.Renderable;

List = (function(_super) {
  __extends(List, _super);

  function List() {
    _ref = List.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  List.include_plugins(Renderable);

  List.prototype.merge_classes = [Klass.DISABLED, Klass.ACTIVE, Klass.HIDDEN];

  List.prototype.preinitialize = function() {
    List.__super__.preinitialize.apply(this, arguments);
    this.list_klass = this.options.list_klass || Klass.LIST;
    this.item_klass = this.options.item_klass || Klass.LIST_ITEM;
    this.items = [];
    return this.buffer = document.createDocumentFragment();
  };

  List.prototype.initialize = function() {
    List.__super__.initialize.apply(this, arguments);
    this.items_cont = this.find("." + this.list_klass) || this;
    return this.parse_html_items();
  };

  List.prototype.postinitialize = function() {
    var _this = this;
    this._check_empty();
    if (this.options.noclick == null) {
      return this.listen("." + this.item_klass, 'click', function(e) {
        if (!utils.is_clickable(e.origTarget)) {
          if (_this._item_clicked(e.target)) {
            return e.cancel();
          }
        }
      });
    }
  };

  List.prototype.parse_html_items = function() {
    var node, _fn, _i, _len, _ref1,
      _this = this;
    _ref1 = this.items_cont.find_cut("." + this.item_klass);
    _fn = function(node) {
      return _this.add_item(Nod.create(node), true);
    };
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      node = _ref1[_i];
      _fn(node);
    }
    return this._flush_buffer();
  };

  List.prototype.data_provider = function(data, silent, remove) {
    var item, _i, _len;
    if (data == null) {
      data = null;
    }
    if (silent == null) {
      silent = false;
    }
    if (remove == null) {
      remove = true;
    }
    if (this.items.length) {
      this.clear(silent, remove);
    }
    if (data != null) {
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        item = data[_i];
        this.add_item(item, true);
      }
    }
    this.update('load', silent);
    return this;
  };

  List.prototype.add_item = function(data, silent) {
    var item;
    if (silent == null) {
      silent = false;
    }
    item = this._create_item(data, this.items.length);
    if (item == null) {
      return;
    }
    this.items.push(item);
    this._check_empty();
    if (!silent) {
      this.items_cont.append(item);
    } else {
      this.buffer.appendChild(item.node);
    }
    if (!silent) {
      this.trigger(ListEvent.Update, {
        type: ListEvent.ItemAdded,
        item: item
      });
    }
    return item;
  };

  List.prototype.add_item_at = function(data, index, silent) {
    var item, _after;
    if (silent == null) {
      silent = false;
    }
    if (this.items.length - 1 < index) {
      return this.add_item(data, silent);
    }
    item = this._create_item(data, index);
    this.items.splice(index, 0, item);
    _after = this.items[index + 1];
    item.record.$index = index;
    item.record.$num = index + 1;
    _after.insertBefore(item);
    this._need_update_indeces = true;
    if (!silent) {
      this._update_indeces();
      this.trigger(ListEvent.Update, {
        type: ListEvent.ItemAdded,
        item: item
      });
    }
    return item;
  };

  List.prototype.remove_item = function(item, silent, destroy) {
    var index;
    if (silent == null) {
      silent = false;
    }
    if (destroy == null) {
      destroy = true;
    }
    index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
      if (destroy) {
        this._destroy_item(item);
      } else {
        item.detach();
      }
      this._check_empty();
      this._need_update_indeces = true;
      if (!silent) {
        this._update_indeces();
        this.trigger(ListEvent.Update, {
          type: ListEvent.ItemRemoved,
          item: item
        });
      }
      return true;
    } else {
      return false;
    }
  };

  List.prototype.remove_item_at = function(index, silent) {
    var item;
    if (silent == null) {
      silent = false;
    }
    if (this.items.length - 1 < index) {
      return;
    }
    item = this.items[index];
    return this.remove_item(item, silent);
  };

  List.prototype.remove_items = function(items) {
    var item, _i, _len;
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      this.remove_item(item, true);
    }
    this.update();
  };

  List.prototype.update_item = function(item, data, silent) {
    var klass, new_item, _i, _len, _ref1;
    if (silent == null) {
      silent = false;
    }
    new_item = this._renderer.render(data, false);
    utils.extend(item.record, new_item.record, true);
    item.remove_children();
    item.html(new_item.html());
    _ref1 = item.node.className.split(/\s+/);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      klass = _ref1[_i];
      if (klass && !(__indexOf.call(this.merge_classes, klass) >= 0)) {
        item.removeClass(klass);
      }
    }
    item.mergeClasses(new_item);
    item.piecify();
    item.postinitialize();
    if (!silent) {
      this.trigger(ListEvent.Update, {
        type: ListEvent.ItemUpdated,
        item: item
      });
    }
    return item;
  };

  List.prototype.move_item = function(item, index) {
    var _after;
    if ((item.record.$index === index) || (index > this.items.length - 1)) {
      return;
    }
    this.items.splice(this.items.indexOf(item), 1);
    if (index === this.items.length) {
      this.items.push(item);
      this.items_cont.append(item);
    } else {
      this.items.splice(index, 0, item);
      _after = this.items[index + 1];
      _after.insertBefore(item);
    }
    this._need_update_indeces = true;
    this._update_indeces();
    return item;
  };

  List.prototype.where = function(query) {
    var item, matcher, _i, _len, _ref1, _results;
    matcher = typeof query === "string" ? utils.matchers.nod(query) : utils.matchers.object(query);
    _ref1 = this.items;
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      if (matcher(item)) {
        _results.push(item);
      }
    }
    return _results;
  };

  List.prototype.records = function() {
    return this.items.map(function(item) {
      return item.record;
    });
  };

  List.prototype.size = function() {
    return this.items.length;
  };

  List.prototype.update = function(type, silent) {
    if (silent == null) {
      silent = false;
    }
    this._flush_buffer();
    if (this._need_update_indeces) {
      this._update_indeces();
    }
    this._check_empty(silent);
    if (!silent) {
      return this.trigger(ListEvent.Update, {
        type: type
      });
    }
  };

  List.prototype.clear = function(silent, remove) {
    if (silent == null) {
      silent = false;
    }
    if (remove == null) {
      remove = true;
    }
    if (!remove) {
      this.items_cont.detach_children();
    }
    if (remove) {
      this.items_cont.remove_children();
    }
    this.items.length = 0;
    if (!silent) {
      this.trigger(ListEvent.Update, {
        type: ListEvent.Clear
      });
    }
    return this._check_empty(silent);
  };

  List.prototype._update_indeces = function() {
    var i, item, _i, _len, _ref1;
    _ref1 = this.items;
    for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
      item = _ref1[i];
      item.record.$index = i;
      item.record.$num = i + 1;
    }
    return this._need_update_indeces = false;
  };

  List.prototype._check_empty = function(silent) {
    if (silent == null) {
      silent = false;
    }
    if (!this.empty && this.items.length === 0) {
      this.addClass(Klass.EMPTY);
      this.empty = true;
      if (!silent) {
        return this.trigger(ListEvent.Empty, true);
      }
    } else if (this.empty && this.items.length > 0) {
      this.removeClass(Klass.EMPTY);
      this.empty = false;
      if (!silent) {
        return this.trigger(ListEvent.Empty, false);
      }
    }
  };

  List.prototype._create_item = function(data, index) {
    var item;
    if (data == null) {
      data = {};
    }
    if (data instanceof Nod && data.is_list_item) {
      if (data.host === this) {
        data.$index = index;
        data.$num = index + 1;
        return data;
      } else {
        return null;
      }
    }
    if (data instanceof Nod) {
      data.data('$index', index);
      data.data('$num', index + 1);
    } else {
      data.$index = index;
      data.$num = index + 1;
    }
    item = this._renderer.render(data, true, this);
    if (item == null) {
      return;
    }
    item.record || (item.record = {});
    item.is_list_item = true;
    return item;
  };

  List.prototype._destroy_item = function(item) {
    return item.remove();
  };

  List.prototype._flush_buffer = function(append) {
    var _results;
    if (append == null) {
      append = true;
    }
    if (append) {
      this.items_cont.append(this.buffer);
    }
    _results = [];
    while (this.buffer.firstChild) {
      _results.push(this.buffer.removeChild(this.buffer.firstChild));
    }
    return _results;
  };

  List.prototype._item_clicked = function(target) {
    var item;
    if (!target.is_list_item) {
      return;
    }
    item = target;
    if (item && item.host === this) {
      this.trigger(ListEvent.ItemClick, {
        item: item
      });
      return true;
    }
  };

  return List;

})(Base);

module.exports = List;


}});

require.define({'pieces-list/components/utils/klass': function(exports, require, module) {
  'use strict';
var Klass;

Klass = require('pieces-core').klass;

Klass.LIST = 'list';

Klass.LIST_ITEM = 'item';

Klass.NESTED_LIST = 'pi-list';

Klass.FILTERED = 'is-filtered';

Klass.SEARCHING = 'is-searhing';

module.exports = Klass;


}});

require.define({'pieces-list/index': function(exports, require, module) {
  'use strict'
var pi = require('pieces-core')
pi.components.List = require('./components/list')
require('./plugins/list')
module.exports = pi


}});

;require.define({'pieces-list/plugins/list/filterable': function(exports, require, module) {
  'use strict';
var Klass, List, ListEvent, Plugin, utils, _is_continuation, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

_is_continuation = function(prev, params) {
  var key, val;
  for (key in prev) {
    if (!__hasProp.call(prev, key)) continue;
    val = prev[key];
    if (params[key] !== val) {
      return false;
    }
  }
  return true;
};

List.Filterable = (function(_super) {
  __extends(Filterable, _super);

  function Filterable() {
    _ref = Filterable.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Filterable.prototype.id = 'filterable';

  Filterable.prototype.initialize = function(list) {
    var _this = this;
    this.list = list;
    Filterable.__super__.initialize.apply(this, arguments);
    this.list.delegate_to(this, 'filter');
    this.list.on(ListEvent.Update, (function(e) {
      return _this.item_updated(e.data.item);
    }), this, function(e) {
      return (e.data.type === ListEvent.ItemAdded || e.data.type === ListEvent.ItemUpdated) && e.data.item.host === _this.list;
    });
    return this;
  };

  Filterable.prototype.item_updated = function(item) {
    if (!this.matcher) {
      return false;
    }
    if (this._all_items.indexOf(item) < 0) {
      this._all_items.unshift(item);
    }
    if (this.matcher(item)) {
      return;
    } else if (this.filtered) {
      this.list.remove_item(item, true, false);
    }
    return false;
  };

  Filterable.prototype.all_items = function() {
    return this._all_items.filter(function(item) {
      return !item._disposed;
    });
  };

  Filterable.prototype.start_filter = function() {
    if (this.filtered) {
      return;
    }
    this.filtered = true;
    this.list.addClass(Klass.FILTERED);
    this._all_items = this.list.items.slice();
    return this._prevf = {};
  };

  Filterable.prototype.stop_filter = function(rollback) {
    if (rollback == null) {
      rollback = true;
    }
    if (!this.filtered) {
      return;
    }
    this.filtered = false;
    this.list.removeClass(Klass.FILTERED);
    if (rollback) {
      this.list.data_provider(this.all_items(), false, false);
    }
    this._all_items = null;
    this.matcher = null;
    return this.list.trigger(ListEvent.Filtered, false);
  };

  Filterable.prototype.filter = function(params) {
    var item, scope, _buffer;
    if (params == null) {
      return this.stop_filter();
    }
    if (!this.filtered) {
      this.start_filter();
    }
    scope = _is_continuation(this._prevf, params) ? this.list.items.slice() : this.all_items();
    this._prevf = params;
    this.matcher = utils.matchers.object_ext({
      record: params
    });
    _buffer = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = scope.length; _i < _len; _i++) {
        item = scope[_i];
        if (this.matcher(item)) {
          _results.push(item);
        }
      }
      return _results;
    }).call(this);
    this.list.data_provider(_buffer, false, false);
    return this.list.trigger(ListEvent.Filtered, true);
  };

  return Filterable;

})(Plugin);

module.exports = List.Filterable;


}});

require.define({'pieces-list/plugins/list/index': function(exports, require, module) {
  'use strict'
require('./selectable');
require('./sortable');
require('./searchable');
require('./filterable');
require('./scrollend');
require('./nested_select');
require('./restful');


}});

require.define({'pieces-list/plugins/list/nested_select': function(exports, require, module) {
  'use strict';
var Klass, List, ListEvent, Nod, Plugin, Selectable, utils, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Selectable = require('./selectable');

Nod = require('pieces-core').Nod;

List.NestedSelect = (function(_super) {
  __extends(NestedSelect, _super);

  function NestedSelect() {
    _ref = NestedSelect.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  NestedSelect.prototype.id = 'nested_select';

  NestedSelect.prototype.initialize = function(list) {
    var _this = this;
    this.list = list;
    Plugin.prototype.initialize.apply(this, arguments);
    this.nested_klass = this.list.options.nested_klass || Klass.NESTED_LIST;
    this.selectable = this.list.selectable || {
      select_all: utils.pass,
      clear_selection: utils.pass,
      type: utils.pass,
      _selected_item: null,
      enable: utils.pass,
      disable: utils.pass
    };
    this.list.delegate_to(this, 'clear_selection', 'select_all', 'selected', 'where', 'select_item', 'deselect_item');
    if (this.list.has_selectable !== true) {
      this.list.delegate_to(this, 'selected_records', 'selected_record', 'selected_item', 'selected_size');
    }
    this.enabled = true;
    if (this.list.options.no_select != null) {
      this.disable();
    }
    this.type(this.list.options.nested_select_type || "");
    this.list.on([ListEvent.Selected, ListEvent.SelectionCleared], function(e) {
      var item;
      if (_this._watching_radio && e.type === ListEvent.Selected) {
        if (e.target === _this.list) {
          item = _this.selectable._selected_item;
        } else {
          item = e.data[0].host.selectable._selected_item;
        }
        _this.update_radio_selection(item);
      }
      if (e.target !== _this.list) {
        e.cancel();
        return _this._check_selected();
      } else {
        return false;
      }
    });
    return this;
  };

  NestedSelect.prototype.enable = function() {
    var item, _i, _len, _ref1, _ref2, _ref3, _results;
    if (!this.enabled) {
      this.enabled = true;
      this.selectable.enable();
      _ref1 = this.list.find_cut("." + this.nested_klass);
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        item = _ref1[_i];
        _results.push((_ref2 = Nod.fetch(item._nod)) != null ? (_ref3 = _ref2.selectable) != null ? _ref3.enable() : void 0 : void 0);
      }
      return _results;
    }
  };

  NestedSelect.prototype.disable = function() {
    var item, _i, _len, _ref1, _ref2, _ref3, _results;
    if (this.enabled) {
      this.enabled = false;
      this.selectable.disable();
      _ref1 = this.list.find_cut("." + this.nested_klass);
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        item = _ref1[_i];
        _results.push((_ref2 = Nod.fetch(item._nod)) != null ? (_ref3 = _ref2.selectable) != null ? _ref3.disable() : void 0 : void 0);
      }
      return _results;
    }
  };

  NestedSelect.prototype.select_item = function(item, force) {
    var _ref1;
    if (force == null) {
      force = false;
    }
    if (!item.__selected__) {
      if (this._watching_radio) {
        this.clear_selection(true);
      }
      if ((_ref1 = item.host.selectable) != null) {
        if (typeof _ref1.select_item === "function") {
          _ref1.select_item(item, force);
        }
      }
      this._check_selected();
      return item;
    }
  };

  NestedSelect.prototype.deselect_item = function(item, force) {
    var _ref1;
    if (force == null) {
      force = false;
    }
    if (item.__selected__) {
      if ((_ref1 = item.host.selectable) != null) {
        if (typeof _ref1.deselect_item === "function") {
          _ref1.deselect_item(item, force);
        }
      }
      this._check_selected();
      return item;
    }
  };

  NestedSelect.prototype.where = function(query) {
    var item, nod, ref, _i, _len, _ref1;
    ref = List.prototype.where.call(this.list, query);
    _ref1 = this.list.find_cut("." + this.nested_klass);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      if ((nod = Nod.fetch(item._nod))) {
        ref = ref.concat(nod.where(query));
      }
    }
    return ref;
  };

  NestedSelect.prototype.type = function(value) {
    this.is_radio = !!value.match('radio');
    if (this.is_radio) {
      return this.enable_radio_watch();
    } else {
      return this.disable_radio_watch();
    }
  };

  NestedSelect.prototype.enable_radio_watch = function() {
    return this._watching_radio = true;
  };

  NestedSelect.prototype.disable_radio_watch = function() {
    return this._watching_radio = false;
  };

  NestedSelect.prototype.update_radio_selection = function(item) {
    if (!item || (this._prev_selected_list === item.host)) {
      return;
    }
    this._prev_selected_list = item.host;
    if (this.list.selected().length > 1) {
      this.list.clear_selection(true);
      item.host.select_item(item);
    }
  };

  NestedSelect.prototype.clear_selection = function(silent, force) {
    var item, _i, _len, _ref1, _ref2;
    if (silent == null) {
      silent = false;
    }
    if (force == null) {
      force = false;
    }
    this.selectable.clear_selection(silent, force);
    _ref1 = this.list.find_cut("." + this.nested_klass);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      if ((_ref2 = Nod.fetch(item._nod)) != null) {
        if (typeof _ref2.clear_selection === "function") {
          _ref2.clear_selection(silent);
        }
      }
    }
    if (!silent) {
      return this.list.trigger(ListEvent.SelectionCleared);
    }
  };

  NestedSelect.prototype.select_all = function(silent, force) {
    var item, _i, _len, _ref1, _ref2, _selected;
    if (silent == null) {
      silent = false;
    }
    if (force == null) {
      force = false;
    }
    this.selectable.select_all(true, force);
    _ref1 = this.list.find_cut("." + this.nested_klass);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      if ((_ref2 = Nod.fetch(item._nod)) != null) {
        if (typeof _ref2.select_all === "function") {
          _ref2.select_all(true, force);
        }
      }
    }
    if (!silent) {
      _selected = this.selected();
      if (_selected.length) {
        return this.list.trigger(ListEvent.Selected, _selected);
      }
    }
  };

  NestedSelect.prototype.selected = function() {
    var item, sublist, sublists, _i, _j, _len, _len1, _ref1, _ref2, _selected;
    _selected = [];
    _ref1 = this.list.items;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      if (item.__selected__) {
        _selected.push(item);
      }
      if (item instanceof List) {
        _selected = _selected.concat((typeof item.selected === "function" ? item.selected() : void 0) || []);
      } else if ((sublists = item.find_cut("." + this.nested_klass))) {
        for (_j = 0, _len1 = sublists.length; _j < _len1; _j++) {
          sublist = sublists[_j];
          _selected = _selected.concat(((_ref2 = Nod.fetch(sublist._nod)) != null ? typeof _ref2.selected === "function" ? _ref2.selected() : void 0 : void 0) || []);
        }
      }
    }
    return _selected;
  };

  return NestedSelect;

})(Selectable);

module.exports = List.NestedSelect;


}});

require.define({'pieces-list/plugins/list/restful': function(exports, require, module) {
  'use strict';
var Compiler, Events, Klass, List, ListEvent, Plugin, utils, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Events = require('pieces-core').components.Events;

Compiler = require('pieces-core').Compiler;

List.Restful = (function(_super) {
  __extends(Restful, _super);

  function Restful() {
    _ref = Restful.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Restful.prototype.id = 'restful';

  Restful.prototype.initialize = function(list) {
    var resources, rest,
      _this = this;
    this.list = list;
    Restful.__super__.initialize.apply(this, arguments);
    this.items_by_id = {};
    this.listen_load = this.list.options.listen_load === true;
    this.listen_create = this.list.options.listen_create != null ? this.list.options.listen_create : this.listen_load;
    if ((rest = this.list.options.rest) != null) {
      if (!(rest.indexOf(".") > 0)) {
        rest = utils.camelCase(rest);
      }
      resources = Compiler.str_to_fun(rest).call();
    }
    if (resources != null) {
      this.bind(resources, this.list.options.load_rest, this.scope);
    }
    this.list.delegate_to(this, 'find_by_id');
    this.list.on(Events.Destroyed, function() {
      _this.bind(null);
      return false;
    });
    return this;
  };

  Restful.prototype.bind = function(resources, load) {
    if (load == null) {
      load = false;
    }
    if (this.resources) {
      this.resources.off(this.resource_update());
    }
    this.resources = resources;
    if (this.resources == null) {
      this.items_by_id = {};
      if (!this.list._disposed) {
        this.list.clear();
      }
      return;
    }
    this.resources.listen(this.resource_update());
    if (load) {
      return this.load(resources.all());
    }
  };

  Restful.prototype.find_by_id = function(id) {
    var items;
    if (this.listen_load) {
      if (this.items_by_id[id] != null) {
        return this.items_by_id[id];
      }
    }
    items = this.list.where({
      record: {
        id: id
      }
    });
    if (items.length) {
      return this.items_by_id[id] = items[0];
    }
  };

  Restful.prototype.load = function(data) {
    var item, _i, _len;
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      item = data[_i];
      if (!(this.items_by_id[item.id] && this.listen_load)) {
        this.items_by_id[item.id] = this.list.add_item(item, true);
      }
    }
    return this.list.update(ListEvent.Load);
  };

  Restful.prototype.resource_update = function(e) {
    var _ref1;
    utils.debug_verbose('Restful list event', e);
    return (_ref1 = this["on_" + e.data.type]) != null ? _ref1.call(this, e.data[this.resources.resource_name]) : void 0;
  };

  Restful.event_handler('resource_update');

  Restful.prototype.on_load = function() {
    if (!this.listen_load) {
      return;
    }
    return this.load(this.resources.all());
  };

  Restful.prototype.on_create = function(data) {
    var item;
    if (!this.listen_create) {
      return;
    }
    if (!this.find_by_id(data.id)) {
      return this.items_by_id[data.id] = this.list.add_item(data);
    } else if (data.__tid__ && (item = this.find_by_id(data.__tid__))) {
      delete this.items_by_id[data.__tid__];
      this.items_by_id[data.id] = item;
      return this.list.update_item(item, data);
    }
  };

  Restful.prototype.on_destroy = function(data) {
    var item;
    if ((item = this.find_by_id(data.id))) {
      this.list.remove_item(item);
      delete this.items_by_id[data.id];
    }
  };

  Restful.prototype.on_update = function(data) {
    var item;
    if ((item = this.find_by_id(data.id))) {
      return this.list.update_item(item, data);
    }
  };

  Restful.prototype.dispose = function() {
    this.items_by_id = {};
    if (this.resources != null) {
      return this.resources.off(this.resource_update());
    }
  };

  return Restful;

})(Plugin);

module.exports = List.Restful;


}});

require.define({'pieces-list/plugins/list/scrollend': function(exports, require, module) {
  'use strict';
var Klass, List, ListEvent, Nod, Plugin, utils, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Nod = require('pieces-core').Nod;

List.ScrollEnd = (function(_super) {
  __extends(ScrollEnd, _super);

  function ScrollEnd() {
    _ref = ScrollEnd.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ScrollEnd.prototype.id = 'scroll_end';

  ScrollEnd.prototype.initialize = function(list) {
    var _this = this;
    this.list = list;
    ScrollEnd.__super__.initialize.apply(this, arguments);
    this.scroll_object = this.list.options.scroll_object === 'window' ? Nod.win : this.list.options.scroll_object ? pi.$(this.list.options.scroll_object) : this.list.items_cont;
    this._prev_top = this.scroll_object.scrollTop();
    if (this.list.options.scroll_end !== false) {
      this.enable();
    }
    this.list.on(ListEvent.Update, this.scroll_listener(), this, function(e) {
      return _this.enabled && (e.data.type === ListEvent.ItemRemoved || e.data.type === ListEvent.Load);
    });
    return this;
  };

  ScrollEnd.prototype.enable = function() {
    if (this.enabled) {
      return;
    }
    this.scroll_object.on('scroll', this.scroll_listener());
    return this.enabled = true;
  };

  ScrollEnd.prototype.disable = function() {
    if (!this.enabled) {
      return;
    }
    this.__debounce_id__ && clearTimeout(this.__debounce_id__);
    if (this.scroll_object._disposed !== true) {
      this.scroll_object.off('scroll', this.scroll_listener());
    }
    this._scroll_listener = null;
    return this.enabled = false;
  };

  ScrollEnd.prototype.scroll_listener = function(event) {
    if (this.list._disposed) {
      return false;
    }
    if (this._prev_top <= this.scroll_object.scrollTop() && this.list.height() - this.scroll_object.scrollTop() - this.scroll_object.height() < 50) {
      this.list.trigger(ListEvent.ScrollEnd);
    }
    this._prev_top = this.scroll_object.scrollTop();
    return false;
  };

  ScrollEnd.event_handler('scroll_listener', {
    throttle: 500
  });

  ScrollEnd.prototype.dispose = function() {
    return this.disable();
  };

  return ScrollEnd;

})(Plugin);

module.exports = List.ScrollEnd;


}});

require.define({'pieces-list/plugins/list/searchable': function(exports, require, module) {
  'use strict';
var Klass, List, ListEvent, Nod, Plugin, utils, _clear_mark_regexp, _is_continuation, _ref, _selector_regexp,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Nod = require('pieces-core').Nod;

_clear_mark_regexp = /<mark>([^<>]*)<\/mark>/gim;

_selector_regexp = /[\.#a-z\s\[\]=\"-_,]/i;

_is_continuation = function(prev, query) {
  var _ref;
  return ((_ref = query.match(prev)) != null ? _ref.index : void 0) === 0;
};

List.Searchable = (function(_super) {
  __extends(Searchable, _super);

  function Searchable() {
    _ref = Searchable.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Searchable.prototype.id = 'searchable';

  Searchable.prototype.initialize = function(list) {
    var _this = this;
    this.list = list;
    Searchable.__super__.initialize.apply(this, arguments);
    this.update_scope(this.list.options.search_scope);
    this.list.delegate_to(this, 'search', 'highlight');
    this.searching = false;
    this.list.on(ListEvent.Update, (function(e) {
      return _this.item_updated(e.data.item);
    }), this, function(e) {
      return (e.data.type === ListEvent.ItemAdded || e.data.type === ListEvent.ItemUpdated) && e.data.item.host === _this.list;
    });
    return this;
  };

  Searchable.prototype.item_updated = function(item) {
    if (!this.matcher) {
      return false;
    }
    if (this._all_items.indexOf(item) < 0) {
      this._all_items.unshift(item);
    }
    if (this.matcher(item)) {
      this.highlight_item(this._prevq, item);
      return;
    } else if (this.searching) {
      this.list.remove_item(item, true, false);
    }
    return false;
  };

  Searchable.prototype.update_scope = function(scope) {
    this.matcher_factory = this._matcher_from_scope(scope);
    if (scope && _selector_regexp.test(scope)) {
      return this._highlight_elements = function(item) {
        var selector, _i, _len, _ref1, _results;
        _ref1 = scope.split(',');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          selector = _ref1[_i];
          _results.push(item.find(selector));
        }
        return _results;
      };
    } else {
      return this._highlight_elements = function(item) {
        return [item];
      };
    }
  };

  Searchable.prototype._matcher_from_scope = function(scope) {
    return this.matcher_factory = scope == null ? function(value) {
      return utils.matchers.nod(value);
    } : function(value) {
      return utils.matchers.nod(scope + ':' + value);
    };
  };

  Searchable.prototype.all_items = function() {
    return this._all_items.filter(function(item) {
      return !item._disposed;
    });
  };

  Searchable.prototype.start_search = function() {
    if (this.searching) {
      return;
    }
    this.searching = true;
    this.list.addClass(Klass.SEARCHING);
    this._all_items = this.list.items.slice();
    return this._prevq = '';
  };

  Searchable.prototype.stop_search = function(rollback) {
    var items;
    if (rollback == null) {
      rollback = true;
    }
    if (!this.searching) {
      return;
    }
    this.searching = false;
    this.list.removeClass(Klass.SEARCHING);
    items = this.all_items();
    if (this.__highlighted__) {
      this.clear_highlight(items);
    }
    this.__highlighted__ = false;
    if (rollback) {
      this.list.data_provider(items, false, false);
    }
    this._all_items = null;
    this.matcher = null;
    return this.list.trigger(ListEvent.Searched, false);
  };

  Searchable.prototype.clear_highlight = function(nodes) {
    var nod, _i, _len, _raw_html, _results;
    _results = [];
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      nod = nodes[_i];
      _raw_html = nod.html();
      _raw_html = _raw_html.replace(_clear_mark_regexp, "$1");
      _results.push(nod.html(_raw_html));
    }
    return _results;
  };

  Searchable.prototype.highlight_item = function(query, item) {
    var nod, nodes, _i, _len, _raw_html, _regexp, _results;
    nodes = this._highlight_elements(item);
    _results = [];
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      nod = nodes[_i];
      if (!(nod != null)) {
        continue;
      }
      _raw_html = nod.html();
      _regexp = new RegExp("((?:^|>)[^<>]*?)(" + query + ")", "gim");
      _raw_html = _raw_html.replace(_clear_mark_regexp, "$1");
      if (query !== '') {
        _raw_html = _raw_html.replace(_regexp, '$1<mark>$2</mark>');
      }
      _results.push(nod.html(_raw_html));
    }
    return _results;
  };

  Searchable.prototype.highlight = function(q) {
    var item, _i, _len, _ref1;
    this.__highlighted__ = true;
    this._prevq = q;
    _ref1 = this.list.items;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      this.highlight_item(q, item);
    }
  };

  Searchable.prototype.search = function(q, highlight) {
    var item, scope, _buffer;
    if (q == null) {
      q = '';
    }
    if (!q) {
      return this.stop_search();
    }
    if (highlight == null) {
      highlight = this.list.options.highlight;
    }
    if (!this.searching) {
      this.start_search();
    }
    scope = _is_continuation(this._prevq, q) ? this.list.items.slice() : this.all_items();
    this._prevq = q;
    this.matcher = this.matcher_factory(utils.escapeRegexp(q));
    _buffer = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = scope.length; _i < _len; _i++) {
        item = scope[_i];
        if (this.matcher(item)) {
          _results.push(item);
        }
      }
      return _results;
    }).call(this);
    this.list.data_provider(_buffer, false, false);
    if (highlight) {
      this.highlight(q);
    }
    return this.list.trigger(ListEvent.Searched, true);
  };

  return Searchable;

})(Plugin);

module.exports = List.Searchable;


}});

require.define({'pieces-list/plugins/list/selectable': function(exports, require, module) {
  'use strict';
var Klass, List, ListEvent, Nod, Plugin, utils, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Nod = require('pieces-core').Nod;

List.Selectable = (function(_super) {
  __extends(Selectable, _super);

  function Selectable() {
    _ref = Selectable.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Selectable.prototype.id = 'selectable';

  Selectable.prototype.initialize = function(list) {
    var item, _i, _len, _ref1,
      _this = this;
    this.list = list;
    Selectable.__super__.initialize.apply(this, arguments);
    this.list.merge_classes.push(Klass.SELECTED);
    this.type(this.list.options.select_type || 'radio');
    if (this.list.options.no_select == null) {
      this.enable();
    }
    _ref1 = this.list.items;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      if (item.hasClass(Klass.SELECTED)) {
        item.__selected__ = true;
      }
    }
    this.list.delegate_to(this, 'clear_selection', 'selected', 'selected_item', 'select_all', 'select_item', 'selected_records', 'selected_record', 'deselect_item', 'toggle_select', 'selected_size');
    this.list.on(ListEvent.Update, (function(e) {
      _this._selected = null;
      _this._check_selected();
      return false;
    }), this, function(e) {
      return e.data.type !== ListEvent.ItemAdded;
    });
    return this;
  };

  Selectable.prototype.enable = function() {
    if (!this.enabled) {
      this.enabled = true;
      return this.list.on(ListEvent.ItemClick, this.item_click_handler());
    }
  };

  Selectable.prototype.disable = function() {
    if (this.enabled) {
      this.enabled = false;
      return this.list.off(ListEvent.ItemClick, this.item_click_handler());
    }
  };

  Selectable.prototype.type = function(value) {
    this.is_radio = !!value.match('radio');
    return this.is_check = !!value.match('check');
  };

  Selectable.prototype.item_click_handler = function(e) {
    this.list.toggle_select(e.data.item, true);
    if (e.data.item.enabled) {
      this._check_selected();
    }
  };

  Selectable.event_handler('item_click_handler');

  Selectable.prototype._check_selected = function() {
    if (this.list.selected().length) {
      return this.list.trigger(ListEvent.Selected, this.list.selected());
    } else {
      return this.list.trigger(ListEvent.SelectionCleared);
    }
  };

  Selectable.prototype.select_item = function(item, force) {
    if (force == null) {
      force = false;
    }
    if (!item.__selected__ && (item.enabled || !force)) {
      if (this.is_radio && force) {
        this.clear_selection(true);
      }
      item.__selected__ = true;
      this._selected_item = item;
      this._selected = null;
      return item.addClass(Klass.SELECTED);
    }
  };

  Selectable.prototype.deselect_item = function(item, force) {
    if (force == null) {
      force = false;
    }
    if (item.__selected__ && ((item.enabled && this.is_check) || (!force))) {
      item.__selected__ = false;
      this._selected = null;
      if (this._selected_item === item) {
        this._selected_item = null;
      }
      return item.removeClass(Klass.SELECTED);
    }
  };

  Selectable.prototype.toggle_select = function(item, force) {
    if (item.__selected__) {
      return this.deselect_item(item, force);
    } else {
      return this.select_item(item, force);
    }
  };

  Selectable.prototype.clear_selection = function(silent, force) {
    var item, _i, _len, _ref1;
    if (silent == null) {
      silent = false;
    }
    if (force == null) {
      force = false;
    }
    _ref1 = this.list.items;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      if (item.enabled || force) {
        this.deselect_item(item);
      }
    }
    if (!silent) {
      return this.list.trigger(ListEvent.SelectionCleared);
    }
  };

  Selectable.prototype.select_all = function(silent, force) {
    var item, _i, _len, _ref1;
    if (silent == null) {
      silent = false;
    }
    if (force == null) {
      force = false;
    }
    _ref1 = this.list.items;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      item = _ref1[_i];
      if (item.enabled || force) {
        this.select_item(item);
      }
    }
    if (this.selected().length && !silent) {
      return this.list.trigger(ListEvent.Selected, this.selected());
    }
  };

  Selectable.prototype.selected = function() {
    if (this._selected == null) {
      this._selected = this.list.where({
        __selected__: true
      });
    }
    return this._selected;
  };

  Selectable.prototype.selected_item = function() {
    _ref = this.list.selected();
    if (_ref.length) {
      return _ref[0];
    } else {
      return null;
    }
  };

  Selectable.prototype.selected_records = function() {
    return this.list.selected().map(function(item) {
      return item.record;
    });
  };

  Selectable.prototype.selected_record = function() {
    _ref = this.list.selected_records();
    if (_ref.length) {
      return _ref[0];
    } else {
      return null;
    }
  };

  Selectable.prototype.selected_size = function() {
    return this.list.selected().length;
  };

  return Selectable;

})(Plugin);

module.exports = List.Selectable;


}});

require.define({'pieces-list/plugins/list/sortable': function(exports, require, module) {
  'use strict';
var List, ListEvent, Plugin, utils, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

utils = require('pieces-core').utils;

List.Sortable = (function(_super) {
  __extends(Sortable, _super);

  function Sortable() {
    _ref = Sortable.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Sortable.prototype.id = 'sortable';

  Sortable.prototype.initialize = function(list) {
    var param, _fn, _i, _len, _ref1,
      _this = this;
    this.list = list;
    Sortable.__super__.initialize.apply(this, arguments);
    if (this.list.options.sort != null) {
      this._prevs = [];
      _ref1 = this.list.options.sort.split(",");
      _fn = function(param) {
        var data, key, order, _ref2;
        data = {};
        _ref2 = param.split(":"), key = _ref2[0], order = _ref2[1];
        data[key] = order;
        return _this._prevs.push(data);
      };
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        param = _ref1[_i];
        _fn(param);
      }
      this._compare_fun = function(a, b) {
        return utils.keys_compare(a.record, b.record, this._prevs);
      };
    }
    this.list.delegate_to(this, 'sort');
    this.list.on(ListEvent.Update, (function(e) {
      return _this.item_updated(e.data.item);
    }), this, function(e) {
      return (e.data.type === ListEvent.ItemAdded || e.data.type === ListEvent.ItemUpdated) && e.data.item.host === _this.list;
    });
    this.list.on(ListEvent.Update, (function(e) {
      return _this.resort();
    }), this, function(e) {
      return (e.data.type === ListEvent.Load) && e.target === _this.list;
    });
    return this;
  };

  Sortable.prototype.item_updated = function(item) {
    if (!this._compare_fun) {
      return false;
    }
    this._bisect_sort(item, 0, this.list.size() - 1);
    return false;
  };

  Sortable.prototype._bisect_sort = function(item, left, right) {
    var a, i;
    if (right - left < 2) {
      if (this._compare_fun(item, this.list.items[left]) > 0) {
        this.list.move_item(item, right);
      } else {
        this.list.move_item(item, left);
      }
      return;
    }
    i = (left + (right - left) / 2) | 0;
    a = this.list.items[i];
    if (this._compare_fun(item, a) > 0) {
      left = i;
    } else {
      right = i;
    }
    return this._bisect_sort(item, left, right);
  };

  Sortable.prototype.clear = function() {
    return this._compare_fun = null;
  };

  Sortable.prototype.resort = function() {
    if (!this._compare_fun) {
      return false;
    }
    this.list.items.sort(this._compare_fun);
    return this.list.data_provider(this.list.items.slice(), true, false);
  };

  Sortable.prototype.sort = function(sort_params) {
    if (sort_params == null) {
      return;
    }
    sort_params = utils.to_a(sort_params);
    this._prevs = sort_params;
    this._compare_fun = function(a, b) {
      return utils.keys_compare(a.record, b.record, sort_params);
    };
    this.list.items.sort(this._compare_fun);
    this.list.data_provider(this.list.items.slice(), true, false);
    return this.list.trigger(ListEvent.Sorted, sort_params);
  };

  Sortable.prototype.sorted = function(sort_params) {
    if (sort_params == null) {
      return;
    }
    sort_params = utils.to_a(sort_params);
    this._prevs = sort_params;
    this._compare_fun = function(a, b) {
      return utils.keys_compare(a.record, b.record, sort_params);
    };
    return this.list.trigger(ListEvent.Sorted, sort_params);
  };

  return Sortable;

})(Plugin);

module.exports = List.Sortable;


}});


//# sourceMappingURL=pieces.list.js.map