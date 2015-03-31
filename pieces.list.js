(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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



},{}],2:[function(require,module,exports){
'use strict';
var Base, Klass, List, ListEvent, Nod, Renderable, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Base = require('pieces-core').components.Base;

ListEvent = require('./events/list_events');

Nod = require('pieces-core').Nod;

utils = require('pieces-core').utils;

Klass = require('./utils/klass');

Renderable = Base.Renderable;

List = (function(superClass) {
  extend(List, superClass);

  function List() {
    return List.__super__.constructor.apply(this, arguments);
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
    this._check_empty();
    if (this.options.noclick == null) {
      return this.listen("." + this.item_klass, 'click', (function(_this) {
        return function(e) {
          if (!utils.is_clickable(e.origTarget)) {
            if (_this._item_clicked(e.target)) {
              return e.cancel();
            }
          }
        };
      })(this));
    }
  };

  List.prototype.parse_html_items = function() {
    var fn, j, len, node, ref;
    ref = this.items_cont.find_cut("." + this.item_klass);
    fn = (function(_this) {
      return function(node) {
        return _this.add_item(Nod.create(node), true);
      };
    })(this);
    for (j = 0, len = ref.length; j < len; j++) {
      node = ref[j];
      fn(node);
    }
    return this._flush_buffer();
  };

  List.prototype.data_provider = function(data, silent, remove) {
    var item, j, len;
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
      for (j = 0, len = data.length; j < len; j++) {
        item = data[j];
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
    var _after, item;
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
    var item, j, len;
    for (j = 0, len = items.length; j < len; j++) {
      item = items[j];
      this.remove_item(item, true);
    }
    this.update();
  };

  List.prototype.update_item = function(item, data, silent) {
    var j, klass, len, new_item, ref;
    if (silent == null) {
      silent = false;
    }
    new_item = this._renderer.render(data, false);
    utils.extend(item.record, new_item.record, true);
    item.remove_children();
    item.html(new_item.html());
    ref = item.node.className.split(/\s+/);
    for (j = 0, len = ref.length; j < len; j++) {
      klass = ref[j];
      if (klass && !(indexOf.call(this.merge_classes, klass) >= 0)) {
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
    var item, j, len, matcher, ref, results;
    matcher = typeof query === "string" ? utils.matchers.nod(query) : utils.matchers.object(query);
    ref = this.items;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      item = ref[j];
      if (matcher(item)) {
        results.push(item);
      }
    }
    return results;
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
    var i, item, j, len, ref;
    ref = this.items;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      item = ref[i];
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
    var results;
    if (append == null) {
      append = true;
    }
    if (append) {
      this.items_cont.append(this.buffer);
    }
    results = [];
    while (this.buffer.firstChild) {
      results.push(this.buffer.removeChild(this.buffer.firstChild));
    }
    return results;
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



},{"./events/list_events":1,"./utils/klass":3,"pieces-core":54}],3:[function(require,module,exports){
'use strict';
var Klass;

Klass = require('pieces-core').klass;

Klass.LIST = 'list';

Klass.LIST_ITEM = 'item';

Klass.NESTED_LIST = 'pi-list';

Klass.FILTERED = 'is-filtered';

Klass.SEARCHING = 'is-searhing';

module.exports = Klass;



},{"pieces-core":54}],4:[function(require,module,exports){
'use strict'
var pi = require('pieces-core')
pi.components.List = require('./components/list')
require('./plugins/list')
module.exports = pi

},{"./components/list":2,"./plugins/list":6,"pieces-core":54}],5:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Plugin, _is_continuation, utils,
  hasProp = {}.hasOwnProperty,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

_is_continuation = function(prev, params) {
  var key, val;
  for (key in prev) {
    if (!hasProp.call(prev, key)) continue;
    val = prev[key];
    if (params[key] !== val) {
      return false;
    }
  }
  return true;
};

List.Filterable = (function(superClass) {
  extend(Filterable, superClass);

  function Filterable() {
    return Filterable.__super__.constructor.apply(this, arguments);
  }

  Filterable.prototype.id = 'filterable';

  Filterable.prototype.initialize = function(list) {
    this.list = list;
    Filterable.__super__.initialize.apply(this, arguments);
    this.list.delegate_to(this, 'filter');
    this.list.on(ListEvent.Update, ((function(_this) {
      return function(e) {
        return _this.item_updated(e.data.item);
      };
    })(this)), this, (function(_this) {
      return function(e) {
        return (e.data.type === ListEvent.ItemAdded || e.data.type === ListEvent.ItemUpdated) && e.data.item.host === _this.list;
      };
    })(this));
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
    var _buffer, item, scope;
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
      var i, len, results;
      results = [];
      for (i = 0, len = scope.length; i < len; i++) {
        item = scope[i];
        if (this.matcher(item)) {
          results.push(item);
        }
      }
      return results;
    }).call(this);
    this.list.data_provider(_buffer, false, false);
    return this.list.trigger(ListEvent.Filtered, true);
  };

  return Filterable;

})(Plugin);

module.exports = List.Filterable;



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3,"pieces-core":54}],6:[function(require,module,exports){
'use strict'
require('./selectable');
require('./sortable');
require('./searchable');
require('./filterable');
require('./scrollend');
require('./nested_select');
require('./restful');

},{"./filterable":5,"./nested_select":7,"./restful":8,"./scrollend":9,"./searchable":10,"./selectable":11,"./sortable":12}],7:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Nod, Plugin, Selectable, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Selectable = require('./selectable');

Nod = require('pieces-core').Nod;

List.NestedSelect = (function(superClass) {
  extend(NestedSelect, superClass);

  function NestedSelect() {
    return NestedSelect.__super__.constructor.apply(this, arguments);
  }

  NestedSelect.prototype.id = 'nested_select';

  NestedSelect.prototype.initialize = function(list) {
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
    this.list.on([ListEvent.Selected, ListEvent.SelectionCleared], (function(_this) {
      return function(e) {
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
      };
    })(this));
    return this;
  };

  NestedSelect.prototype.enable = function() {
    var i, item, len, ref1, ref2, ref3, results;
    if (!this.enabled) {
      this.enabled = true;
      this.selectable.enable();
      ref1 = this.list.find_cut("." + this.nested_klass);
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        item = ref1[i];
        results.push((ref2 = Nod.fetch(item._nod)) != null ? (ref3 = ref2.selectable) != null ? ref3.enable() : void 0 : void 0);
      }
      return results;
    }
  };

  NestedSelect.prototype.disable = function() {
    var i, item, len, ref1, ref2, ref3, results;
    if (this.enabled) {
      this.enabled = false;
      this.selectable.disable();
      ref1 = this.list.find_cut("." + this.nested_klass);
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        item = ref1[i];
        results.push((ref2 = Nod.fetch(item._nod)) != null ? (ref3 = ref2.selectable) != null ? ref3.disable() : void 0 : void 0);
      }
      return results;
    }
  };

  NestedSelect.prototype.select_item = function(item, force) {
    var ref1;
    if (force == null) {
      force = false;
    }
    if (!item.__selected__) {
      if (this._watching_radio) {
        this.clear_selection(true);
      }
      if ((ref1 = item.host.selectable) != null) {
        if (typeof ref1.select_item === "function") {
          ref1.select_item(item, force);
        }
      }
      this._check_selected();
      return item;
    }
  };

  NestedSelect.prototype.deselect_item = function(item, force) {
    var ref1;
    if (force == null) {
      force = false;
    }
    if (item.__selected__) {
      if ((ref1 = item.host.selectable) != null) {
        if (typeof ref1.deselect_item === "function") {
          ref1.deselect_item(item, force);
        }
      }
      this._check_selected();
      return item;
    }
  };

  NestedSelect.prototype.where = function(query) {
    var i, item, len, nod, ref, ref1;
    ref = List.prototype.where.call(this.list, query);
    ref1 = this.list.find_cut("." + this.nested_klass);
    for (i = 0, len = ref1.length; i < len; i++) {
      item = ref1[i];
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
    var i, item, len, ref1, ref2;
    if (silent == null) {
      silent = false;
    }
    if (force == null) {
      force = false;
    }
    this.selectable.clear_selection(silent, force);
    ref1 = this.list.find_cut("." + this.nested_klass);
    for (i = 0, len = ref1.length; i < len; i++) {
      item = ref1[i];
      if ((ref2 = Nod.fetch(item._nod)) != null) {
        if (typeof ref2.clear_selection === "function") {
          ref2.clear_selection(silent);
        }
      }
    }
    if (!silent) {
      return this.list.trigger(ListEvent.SelectionCleared);
    }
  };

  NestedSelect.prototype.select_all = function(silent, force) {
    var _selected, i, item, len, ref1, ref2;
    if (silent == null) {
      silent = false;
    }
    if (force == null) {
      force = false;
    }
    this.selectable.select_all(true, force);
    ref1 = this.list.find_cut("." + this.nested_klass);
    for (i = 0, len = ref1.length; i < len; i++) {
      item = ref1[i];
      if ((ref2 = Nod.fetch(item._nod)) != null) {
        if (typeof ref2.select_all === "function") {
          ref2.select_all(true, force);
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
    var _selected, i, item, j, len, len1, ref1, ref2, sublist, sublists;
    _selected = [];
    ref1 = this.list.items;
    for (i = 0, len = ref1.length; i < len; i++) {
      item = ref1[i];
      if (item.__selected__) {
        _selected.push(item);
      }
      if (item instanceof List) {
        _selected = _selected.concat((typeof item.selected === "function" ? item.selected() : void 0) || []);
      } else if ((sublists = item.find_cut("." + this.nested_klass))) {
        for (j = 0, len1 = sublists.length; j < len1; j++) {
          sublist = sublists[j];
          _selected = _selected.concat(((ref2 = Nod.fetch(sublist._nod)) != null ? typeof ref2.selected === "function" ? ref2.selected() : void 0 : void 0) || []);
        }
      }
    }
    return _selected;
  };

  return NestedSelect;

})(Selectable);

module.exports = List.NestedSelect;



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3,"./selectable":11,"pieces-core":54}],8:[function(require,module,exports){
'use strict';
var Compiler, Events, Klass, List, ListEvent, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Events = require('pieces-core').components.Events;

Compiler = require('pieces-core').Compiler;

List.Restful = (function(superClass) {
  extend(Restful, superClass);

  function Restful() {
    return Restful.__super__.constructor.apply(this, arguments);
  }

  Restful.prototype.id = 'restful';

  Restful.prototype.initialize = function(list) {
    var resources, rest;
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
    this.list.on(Events.Destroyed, (function(_this) {
      return function() {
        _this.bind(null);
        return false;
      };
    })(this));
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
    var i, item, len;
    for (i = 0, len = data.length; i < len; i++) {
      item = data[i];
      if (!(this.items_by_id[item.id] && this.listen_load)) {
        this.items_by_id[item.id] = this.list.add_item(item, true);
      }
    }
    return this.list.update(ListEvent.Load);
  };

  Restful.prototype.resource_update = function(e) {
    var ref;
    utils.debug_verbose('Restful list event', e);
    return (ref = this["on_" + e.data.type]) != null ? ref.call(this, e.data[this.resources.resource_name]) : void 0;
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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3,"pieces-core":54}],9:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Nod, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Nod = require('pieces-core').Nod;

List.ScrollEnd = (function(superClass) {
  extend(ScrollEnd, superClass);

  function ScrollEnd() {
    return ScrollEnd.__super__.constructor.apply(this, arguments);
  }

  ScrollEnd.prototype.id = 'scroll_end';

  ScrollEnd.prototype.initialize = function(list) {
    this.list = list;
    ScrollEnd.__super__.initialize.apply(this, arguments);
    this.scroll_object = this.list.options.scroll_object === 'window' ? Nod.win : this.list.options.scroll_object ? pi.$(this.list.options.scroll_object) : this.list.items_cont;
    this._prev_top = this.scroll_object.scrollTop();
    if (this.list.options.scroll_end !== false) {
      this.enable();
    }
    this.list.on(ListEvent.Update, this.scroll_listener(), this, (function(_this) {
      return function(e) {
        return _this.enabled && (e.data.type === ListEvent.ItemRemoved || e.data.type === ListEvent.Load);
      };
    })(this));
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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3,"pieces-core":54}],10:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Nod, Plugin, _clear_mark_regexp, _is_continuation, _selector_regexp, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Nod = require('pieces-core').Nod;

_clear_mark_regexp = /<mark>([^<>]*)<\/mark>/gim;

_selector_regexp = /[\.#a-z\s\[\]=\"-_,]/i;

_is_continuation = function(prev, query) {
  var ref;
  return ((ref = query.match(prev)) != null ? ref.index : void 0) === 0;
};

List.Searchable = (function(superClass) {
  extend(Searchable, superClass);

  function Searchable() {
    return Searchable.__super__.constructor.apply(this, arguments);
  }

  Searchable.prototype.id = 'searchable';

  Searchable.prototype.initialize = function(list) {
    this.list = list;
    Searchable.__super__.initialize.apply(this, arguments);
    this.update_scope(this.list.options.search_scope);
    this.list.delegate_to(this, 'search', 'highlight');
    this.searching = false;
    this.list.on(ListEvent.Update, ((function(_this) {
      return function(e) {
        return _this.item_updated(e.data.item);
      };
    })(this)), this, (function(_this) {
      return function(e) {
        return (e.data.type === ListEvent.ItemAdded || e.data.type === ListEvent.ItemUpdated) && e.data.item.host === _this.list;
      };
    })(this));
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
        var i, len, ref, results, selector;
        ref = scope.split(',');
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          selector = ref[i];
          results.push(item.find(selector));
        }
        return results;
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
    var _raw_html, i, len, nod, results;
    results = [];
    for (i = 0, len = nodes.length; i < len; i++) {
      nod = nodes[i];
      _raw_html = nod.html();
      _raw_html = _raw_html.replace(_clear_mark_regexp, "$1");
      results.push(nod.html(_raw_html));
    }
    return results;
  };

  Searchable.prototype.highlight_item = function(query, item) {
    var _raw_html, _regexp, i, len, nod, nodes, results;
    nodes = this._highlight_elements(item);
    results = [];
    for (i = 0, len = nodes.length; i < len; i++) {
      nod = nodes[i];
      if (!(nod != null)) {
        continue;
      }
      _raw_html = nod.html();
      _regexp = new RegExp("((?:^|>)[^<>]*?)(" + query + ")", "gim");
      _raw_html = _raw_html.replace(_clear_mark_regexp, "$1");
      if (query !== '') {
        _raw_html = _raw_html.replace(_regexp, '$1<mark>$2</mark>');
      }
      results.push(nod.html(_raw_html));
    }
    return results;
  };

  Searchable.prototype.highlight = function(q) {
    var i, item, len, ref;
    this.__highlighted__ = true;
    this._prevq = q;
    ref = this.list.items;
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      this.highlight_item(q, item);
    }
  };

  Searchable.prototype.search = function(q, highlight) {
    var _buffer, item, scope;
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
      var i, len, results;
      results = [];
      for (i = 0, len = scope.length; i < len; i++) {
        item = scope[i];
        if (this.matcher(item)) {
          results.push(item);
        }
      }
      return results;
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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3,"pieces-core":54}],11:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Nod, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = require('pieces-core').utils;

Nod = require('pieces-core').Nod;

List.Selectable = (function(superClass) {
  extend(Selectable, superClass);

  function Selectable() {
    return Selectable.__super__.constructor.apply(this, arguments);
  }

  Selectable.prototype.id = 'selectable';

  Selectable.prototype.initialize = function(list) {
    var i, item, len, ref;
    this.list = list;
    Selectable.__super__.initialize.apply(this, arguments);
    this.list.merge_classes.push(Klass.SELECTED);
    this.type(this.list.options.select_type || 'radio');
    if (this.list.options.no_select == null) {
      this.enable();
    }
    ref = this.list.items;
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      if (item.hasClass(Klass.SELECTED)) {
        item.__selected__ = true;
      }
    }
    this.list.delegate_to(this, 'clear_selection', 'selected', 'selected_item', 'select_all', 'select_item', 'selected_records', 'selected_record', 'deselect_item', 'toggle_select', 'selected_size');
    this.list.on(ListEvent.Update, ((function(_this) {
      return function(e) {
        _this._selected = null;
        _this._check_selected();
        return false;
      };
    })(this)), this, function(e) {
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
    var i, item, len, ref;
    if (silent == null) {
      silent = false;
    }
    if (force == null) {
      force = false;
    }
    ref = this.list.items;
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      if (item.enabled || force) {
        this.deselect_item(item);
      }
    }
    if (!silent) {
      return this.list.trigger(ListEvent.SelectionCleared);
    }
  };

  Selectable.prototype.select_all = function(silent, force) {
    var i, item, len, ref;
    if (silent == null) {
      silent = false;
    }
    if (force == null) {
      force = false;
    }
    ref = this.list.items;
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
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
    var _ref;
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
    var _ref;
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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3,"pieces-core":54}],12:[function(require,module,exports){
'use strict';
var List, ListEvent, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = require('pieces-core').Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

utils = require('pieces-core').utils;

List.Sortable = (function(superClass) {
  extend(Sortable, superClass);

  function Sortable() {
    return Sortable.__super__.constructor.apply(this, arguments);
  }

  Sortable.prototype.id = 'sortable';

  Sortable.prototype.initialize = function(list) {
    var fn, j, len, param, ref;
    this.list = list;
    Sortable.__super__.initialize.apply(this, arguments);
    if (this.list.options.sort != null) {
      this._prevs = [];
      ref = this.list.options.sort.split(",");
      fn = (function(_this) {
        return function(param) {
          var data, key, order, ref1;
          data = {};
          ref1 = param.split(":"), key = ref1[0], order = ref1[1];
          data[key] = order;
          return _this._prevs.push(data);
        };
      })(this);
      for (j = 0, len = ref.length; j < len; j++) {
        param = ref[j];
        fn(param);
      }
      this._compare_fun = function(a, b) {
        return utils.keys_compare(a.record, b.record, this._prevs);
      };
    }
    this.list.delegate_to(this, 'sort');
    this.list.on(ListEvent.Update, ((function(_this) {
      return function(e) {
        return _this.item_updated(e.data.item);
      };
    })(this)), this, (function(_this) {
      return function(e) {
        return (e.data.type === ListEvent.ItemAdded || e.data.type === ListEvent.ItemUpdated) && e.data.item.host === _this.list;
      };
    })(this));
    this.list.on(ListEvent.Update, ((function(_this) {
      return function(e) {
        return _this.resort();
      };
    })(this)), this, (function(_this) {
      return function(e) {
        return (e.data.type === ListEvent.Load) && e.target === _this.list;
      };
    })(this));
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



},{"../../components/events/list_events":1,"../../components/list":2,"pieces-core":54}],13:[function(require,module,exports){
'use strict';
var Base, Compiler, Events, Klass, Nod, _array_rxp, _node_attr, _prop_setter, _proper, _toggle_class, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

Klass = require('./utils/klass');

Events = require('./events');

utils = require('../core/utils');

Nod = require('../core/nod').Nod;

Compiler = require('../grammar/compiler');

_array_rxp = /\[\]$/;

_proper = function(target, name, prop) {
  return Object.defineProperty(target, name, prop);
};

_prop_setter = {
  'default': function(name, val) {
    if (this.__properties__[name] !== val) {
      this.__properties__[name] = val;
      return true;
    } else {
      return false;
    }
  },
  bool: function(name, val) {
    val = !!val;
    if (this.__properties__[name] !== val) {
      this.__properties__[name] = val;
      return true;
    } else {
      return false;
    }
  }
};

_toggle_class = function(val, class_desc) {
  if (class_desc == null) {
    return;
  }
  if (class_desc.on === val) {
    return this.addClass(class_desc.name);
  } else {
    return this.removeClass(class_desc.name);
  }
};

_node_attr = function(val, node_attr) {
  if (node_attr == null) {
    return;
  }
  if (val === node_attr.on) {
    return this.attr(node_attr.name, node_attr.name);
  } else {
    return this.attr(node_attr.name, null);
  }
};

Base = (function(superClass) {
  extend(Base, superClass);

  Base.include_plugins = function() {
    var i, len, plugin, plugins, results;
    plugins = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    results = [];
    for (i = 0, len = plugins.length; i < len; i++) {
      plugin = plugins[i];
      results.push(plugin.included(this));
    }
    return results;
  };

  Base.requires = function() {
    var components;
    components = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return this.before_create(function() {
      var cmp, results;
      results = [];
      while (components.length) {
        cmp = components.pop();
        if (this[cmp] === void 0) {
          throw Error("Missing required component " + cmp);
        } else {
          results.push(void 0);
        }
      }
      return results;
    });
  };

  Base.active_property = function(target, name, options) {
    var d, toggle_name;
    if (options == null) {
      options = {};
    }
    target.__prop_desc__ = utils.clone(target.__prop_desc__ || {});
    options.type || (options.type = 'default');
    if ((options["class"] != null) && typeof options['class'] === 'string') {
      options["class"] = {
        name: options["class"],
        on: true
      };
    }
    if ((options.node_attr != null) && typeof options.node_attr === 'string') {
      options.node_attr = {
        name: options.node_attr,
        on: true
      };
    }
    target.__prop_desc__[name] = options;
    d = {
      get: function() {
        return this.__properties__[name];
      }
    };
    if (!!options.readonly) {
      d.writable = false;
    } else {
      d.set = function(val) {
        if (_prop_setter[options.type].call(this, name, val)) {
          val = this.__properties__[name];
          _toggle_class.call(this, val, options["class"]);
          _node_attr.call(this, val, options.node_attr);
          if (options.event != null) {
            this.trigger(options.event, val);
          }
        }
        return val;
      };
    }
    if (options.type === 'bool') {
      if (options.functions != null) {
        target[options.functions[0]] = function() {
          this[name] = true;
          return this;
        };
        target[options.functions[1]] = function() {
          this[name] = false;
          return this;
        };
      }
      if (options.toggle) {
        toggle_name = typeof options.toggle === 'string' ? options.toggle : "toggle_" + name;
        target[toggle_name] = function(val) {
          if (val == null) {
            val = null;
          }
          if (val === null) {
            this[name] = !this[name];
          } else {
            this[name] = val;
          }
          return this;
        };
      }
    }
    return _proper(target, name, d);
  };

  function Base(node1, host, options1) {
    this.node = node1;
    this.host = host;
    this.options = options1 != null ? options1 : {};
    Base.__super__.constructor.apply(this, arguments);
    this.preinitialize();
    this.initialize();
    this.init_plugins();
    this.init_children();
    this.setup_events();
    this.postinitialize();
  }

  Base.prototype.preinitialize = function() {
    var desc, name, ref, results;
    Nod.store(this, true);
    this.__properties__ = {};
    this.__components__ = [];
    this.__plugins__ = [];
    this.pid = this.data('pid') || this.attr('pid') || this.node.id;
    ref = this.__prop_desc__;
    results = [];
    for (name in ref) {
      if (!hasProp.call(ref, name)) continue;
      desc = ref[name];
      results.push((function(_this) {
        return function(name, desc) {
          return _this.__properties__[name] = desc["default"];
        };
      })(this)(name, desc));
    }
    return results;
  };

  Base.prototype.initialize = function() {
    if (this.options.disabled || this.hasClass(Klass.DISABLED)) {
      this.disable();
    }
    if (this.options.hidden || this.hasClass(Klass.HIDDEN)) {
      this.hide();
    }
    if (this.options.active || this.hasClass(Klass.ACTIVE)) {
      this.activate();
    }
    this._initialized = true;
    return this.trigger(Events.Initialized, true, false);
  };

  Base.register_callback('initialize');

  Base.prototype.init_plugins = function() {
    var i, len, name, ref;
    if (this.options.plugins != null) {
      ref = this.options.plugins;
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        this.attach_plugin(this.constructor.lookup_module(name));
      }
      delete this.options.plugins;
    }
  };

  Base.prototype.attach_plugin = function(plugin) {
    if (plugin != null) {
      utils.debug_verbose("plugin attached " + plugin.prototype.id);
      return this.__plugins__.push(plugin.attached(this));
    }
  };

  Base.prototype.init_children = function() {
    var fn, i, len, node, ref;
    ref = this.find_cut("." + Klass.PI);
    fn = (function(_this) {
      return function(node) {
        var arr, child, name1;
        child = Nod.create(node).piecify(_this);
        if (child != null ? child.pid : void 0) {
          if (_array_rxp.test(child.pid)) {
            arr = (_this[name1 = child.pid.slice(0, -2)] || (_this[name1] = []));
            if (!(arr.indexOf(child) > -1)) {
              arr.push(child);
            }
          } else {
            _this[child.pid] = child;
          }
          return _this.__components__.push(child);
        }
      };
    })(this);
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      fn(node);
    }
  };

  Base.prototype.setup_events = function() {
    var event, handler, handlers, i, len, ref, ref1;
    ref = this.options.events;
    for (event in ref) {
      handlers = ref[event];
      ref1 = handlers.split(/;\s*/);
      for (i = 0, len = ref1.length; i < len; i++) {
        handler = ref1[i];
        this.on(event, Compiler.str_to_event_handler(handler, this));
      }
    }
    delete this.options.events;
  };

  Base.prototype.postinitialize = function() {
    return this.trigger(Events.Created, true, false);
  };

  Base.register_callback('postinitialize', {
    as: 'create'
  });

  Base.prototype.piecify = function() {
    var c, i, len, ref;
    this.__components__.length = 0;
    this.init_children();
    ref = this.__components__;
    for (i = 0, len = ref.length; i < len; i++) {
      c = ref[i];
      c.piecify(this);
    }
    return this;
  };

  Base.prototype.trigger = function(event, data, bubbles) {
    if (this._initialized && (this.enabled || event === Events.Enabled)) {
      return Base.__super__.trigger.call(this, event, data, bubbles);
    }
  };

  Base.prototype.bubble_event = function(event) {
    if (this.host != null) {
      return this.host.trigger(event);
    }
  };

  Base.active_property(Base.prototype, 'visible', {
    type: 'bool',
    "default": true,
    event: Events.Hidden,
    "class": {
      name: Klass.HIDDEN,
      on: false
    },
    functions: ['show', 'hide']
  });

  Base.active_property(Base.prototype, 'enabled', {
    type: 'bool',
    "default": true,
    event: Events.Enabled,
    "class": {
      name: Klass.DISABLED,
      on: false
    },
    functions: ['enable', 'disable']
  });

  Base.active_property(Base.prototype, 'active', {
    type: 'bool',
    "default": true,
    event: Events.Active,
    "class": {
      name: Klass.ACTIVE,
      on: false
    },
    functions: ['activate', 'deactivate']
  });

  Base.prototype.dispose = function() {
    var i, len, plugin, ref;
    if (this._disposed) {
      return;
    }
    this._initialized = false;
    if (this.host != null) {
      this.host.remove_component(this);
    }
    ref = this.__plugins__;
    for (i = 0, len = ref.length; i < len; i++) {
      plugin = ref[i];
      plugin.dispose();
    }
    this.__plugins__.length = 0;
    this.__components__.length = 0;
    this.__properties__ = {};
    Base.__super__.dispose.apply(this, arguments);
    return this.trigger(Events.Destroyed, true, false);
  };

  Base.prototype.remove_component = function(child) {
    if (!child.pid) {
      return;
    }
    if (_array_rxp.test(child.pid)) {
      if (this["" + child.pid.slice(0, -2)]) {
        delete this["" + child.pid.slice(0, -2)];
      }
    } else {
      delete this[child.pid];
    }
    return this.__components__.splice(this.__components__.indexOf(child), 1);
  };

  Base.prototype.remove_children = function() {
    var child, i, len, list;
    list = this.__components__.slice();
    for (i = 0, len = list.length; i < len; i++) {
      child = list[i];
      this.remove_component(child);
      child.remove();
    }
    return Base.__super__.remove_children.apply(this, arguments);
  };

  return Base;

})(Nod);

module.exports = Base;



},{"../core/nod":40,"../core/utils":46,"../grammar/compiler":52,"./events":15,"./utils/klass":23}],14:[function(require,module,exports){
'use strict';
var Base, BaseInput, Events, _pass, _serialize, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Base = require('./base');

Events = require('./events');

utils = require('../core/utils');

_pass = function(val) {
  return val;
};

_serialize = function(val) {
  return utils.serialize(val);
};

BaseInput = (function(superClass) {
  extend(BaseInput, superClass);

  function BaseInput() {
    return BaseInput.__super__.constructor.apply(this, arguments);
  }

  BaseInput.prototype.postinitialize = function() {
    this.input || (this.input = this.node.nodeName === 'INPUT' ? this : this.find('input'));
    if (this.options.serialize === true) {
      this._serializer = _serialize;
    } else {
      this._serializer = _pass;
    }
    if ((this.options.default_value != null) && !utils.serialize(this.value())) {
      return this.value(this.options.default_value);
    }
  };

  BaseInput.prototype.value = function(val) {
    if (val != null) {
      this.input.node.value = val;
      return this;
    } else {
      return this._serializer(this.input.node.value);
    }
  };

  BaseInput.prototype.clear = function(silent) {
    if (silent == null) {
      silent = false;
    }
    if (this.options.default_value != null) {
      this.value(this.options.default_value);
    } else {
      this.value('');
    }
    if (!silent) {
      return this.trigger(Events.InputEvent.Clear);
    }
  };

  return BaseInput;

})(Base);

module.exports = BaseInput;



},{"../core/utils":46,"./base":13,"./events":15}],15:[function(require,module,exports){
var events = require('./pi_events'),
    utils = require('../../core/utils');

utils.extend(events, require('./input_events'));
module.exports = events;

},{"../../core/utils":46,"./input_events":16,"./pi_events":17}],16:[function(require,module,exports){
'use strict';
module.exports = {
  InputEvent: {
    Change: 'changed',
    Clear: 'cleared',
    Editable: 'editable'
  },
  FormEvent: {
    Update: 'updated',
    Submit: 'submited',
    Invalid: 'invalid'
  }
};



},{}],17:[function(require,module,exports){
'use strict';
module.exports = {
  Initialized: 'initialized',
  Created: 'creation_complete',
  Destroyed: 'destroyed',
  Enabled: 'enabled',
  Hidden: 'hidden',
  Active: 'active',
  Selected: 'selected',
  Update: 'update'
};



},{}],18:[function(require,module,exports){
'use strict';
var Base, BaseInput, Events, Form, Former, Klass, Nod, Validator, _array_name, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Base = require('./base');

Events = require('./events');

Validator = require('./utils/validator');

utils = require('../core/utils');

Former = require('../core/former/former');

Nod = require('../core/nod').Nod;

BaseInput = require('./base_input');

Klass = require('./utils/klass');

_array_name = function(name) {
  return name.indexOf('[]') > -1;
};

Form = (function(superClass) {
  extend(Form, superClass);

  function Form() {
    return Form.__super__.constructor.apply(this, arguments);
  }

  Form.prototype.postinitialize = function() {
    Form.__super__.postinitialize.apply(this, arguments);
    this._cache = {};
    this._value = {};
    this._invalids = [];
    this.former = new Former(this.node, this.options);
    this.read_values();
    this.on(Events.InputEvent.Change, (function(_this) {
      return function(e) {
        e.cancel();
        if (_this.validate_nod(e.target)) {
          return _this.update_value(e.target.name(), e.data);
        }
      };
    })(this));
    this.on('change', (function(_this) {
      return function(e) {
        if (!utils.is_input(e.target.node)) {
          return;
        }
        if (_this.validate_nod(e.target)) {
          return _this.update_value(e.target.node.name, _this.former._parse_nod_value(e.target.node));
        }
      };
    })(this));
    this.form = this.node.nodeName === 'FORM' ? this : this.find('form');
    if (this.form != null) {
      return this.form.on('submit', (function(_this) {
        return function(e) {
          e.cancel();
          return _this.submit();
        };
      })(this));
    }
  };

  Form.prototype.submit = function() {
    this.read_values();
    if (this.validate() === true) {
      return this.trigger(Events.FormEvent.Submit, this._value);
    }
  };

  Form.prototype.value = function(val) {
    if (val != null) {
      this._value = {};
      this.former.traverse_nodes(this.node, (function(_this) {
        return function(node) {
          return _this.fill_value(node, val);
        };
      })(this));
      this.read_values();
      return this;
    } else {
      return this._value;
    }
  };

  Form.prototype.clear = function(silent) {
    if (silent == null) {
      silent = false;
    }
    this._value = {};
    this.former.traverse_nodes(this.node, (function(_this) {
      return function(node) {
        return _this.clear_value(node);
      };
    })(this));
    if (this.former.options.clear_hidden === false) {
      this.read_values();
    }
    if (!silent) {
      return this.trigger(Events.InputEvent.Clear);
    }
  };

  Form.prototype.read_values = function() {
    var _name_values;
    _name_values = [];
    this.former.traverse_nodes(this.node, (function(_this) {
      return function(node) {
        var nod;
        if (((nod = Nod.fetch(node._nod)) instanceof BaseInput) && nod.name()) {
          if (!_array_name(name)) {
            _this._cache[nod.name()] = nod;
          }
          return _name_values.push({
            name: nod.name(),
            value: nod.value()
          });
        } else if (utils.is_input(node) && node.name) {
          if (!_array_name(node.name)) {
            _this._cache[node.name] = Nod.create(node);
          }
          return _name_values.push({
            name: node.name,
            value: _this.former._parse_nod_value(node)
          });
        }
      };
    })(this));
    return this._value = this.former.process_name_values(_name_values);
  };

  Form.prototype.find_by_name = function(name) {
    var nod;
    if (this._cache[name] != null) {
      return this._cache[name];
    }
    nod = this.find("[name=" + name + "]");
    if (nod != null) {
      return (this._cache[name] = nod);
    }
  };

  Form.prototype.fill_value = function(node, val) {
    var nod;
    if (((nod = Nod.fetch(node._nod)) instanceof BaseInput) && nod.name()) {
      val = this.former._nod_data_value(nod.name(), val);
      if (val == null) {
        return;
      }
      return nod.value(val);
    } else if (utils.is_input(node)) {
      return this.former._fill_nod(node, val);
    }
  };

  Form.prototype.validate = function() {
    this.former.traverse_nodes(this.node, (function(_this) {
      return function(node) {
        return _this.validate_value(node);
      };
    })(this));
    if (this._invalids.length) {
      this.trigger(Events.FormEvent.Invalid, this._invalids);
      return false;
    } else {
      return true;
    }
  };

  Form.prototype.validate_value = function(node) {
    var nod;
    if ((nod = Nod.fetch(node._nod)) instanceof BaseInput) {
      return this.validate_nod(nod);
    }
  };

  Form.prototype.validate_nod = function(nod) {
    var flag, i, len, ref, type, types;
    if ((types = nod.data('validates'))) {
      flag = true;
      ref = types.split(" ");
      for (i = 0, len = ref.length; i < len; i++) {
        type = ref[i];
        if (!Validator.validate(type, nod, this)) {
          nod.addClass(Klass.INVALID);
          flag = false;
          break;
        }
      }
      if (flag) {
        nod.removeClass(Klass.INVALID);
        if (nod.__invalid__) {
          this._invalids.splice(this._invalids.indexOf(nod.name()), 1);
          delete nod.__invalid__;
        }
        return true;
      } else {
        if (nod.__invalid__ == null) {
          this._invalids.push(nod.name());
        }
        nod.__invalid__ = true;
        return false;
      }
    } else {
      return true;
    }
  };

  Form.prototype.clear_value = function(node) {
    var nod;
    if ((nod = Nod.fetch(node._nod)) instanceof BaseInput) {
      return nod.clear();
    } else if (utils.is_input(node)) {
      return this.former._clear_nod(node);
    }
  };

  Form.prototype.update_value = function(name, val, silent) {
    if (silent == null) {
      silent = false;
    }
    if (!name) {
      return;
    }
    name = this.former.transform_name(name);
    val = this.former.transform_value(val);
    if (_array_name(name) === true) {
      return;
    }
    utils.obj.set_path(this._value, name, val);
    if (!silent) {
      return this.trigger(Events.FormEvent.Update, this._value);
    }
  };

  return Form;

})(Base);

module.exports = Form;



},{"../core/former/former":38,"../core/nod":40,"../core/utils":46,"./base":13,"./base_input":14,"./events":15,"./utils/klass":23,"./utils/validator":25}],19:[function(require,module,exports){
'use strict'
var components = {};
components.Events = require('./events');
components.Base = require('./base');
components.BaseInput = require('./base_input');
components.TextInput = require('./textinput');
components.Form = require('./form')
module.exports = components;

},{"./base":13,"./base_input":14,"./events":15,"./form":18,"./textinput":20}],20:[function(require,module,exports){
'use strict';
var Base, BaseInput, Events, Klass, TextInput, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Base = require('./base');

Events = require('./events');

utils = require('../core/utils');

BaseInput = require('./base_input');

Klass = require('./utils/klass');

TextInput = (function(superClass) {
  extend(TextInput, superClass);

  function TextInput() {
    return TextInput.__super__.constructor.apply(this, arguments);
  }

  TextInput.prototype.postinitialize = function() {
    TextInput.__super__.postinitialize.apply(this, arguments);
    this.editable = true;
    if (this.options.readonly || this.hasClass(Klass.READONLY)) {
      this.readonly();
    }
    return this.input.on('change', (function(_this) {
      return function(e) {
        e.cancel();
        return _this.trigger(Events.InputEvent.Change, _this.value());
      };
    })(this));
  };

  TextInput.active_property(TextInput.prototype, 'editable', {
    type: 'bool',
    "default": true,
    event: Events.InputEvent.Editable,
    "class": {
      name: Klass.READONLY,
      on: false
    },
    node_attr: {
      name: 'readonly',
      on: false
    }
  });

  TextInput.prototype.readonly = function(val) {
    if (val == null) {
      val = true;
    }
    return this.editable = !val;
  };

  return TextInput;

})(BaseInput);

module.exports = TextInput;



},{"../core/utils":46,"./base":13,"./base_input":14,"./events":15,"./utils/klass":23}],21:[function(require,module,exports){
'use strict';
var Guesser, utils,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  hasProp = {}.hasOwnProperty;

utils = require('../../core/utils');

Guesser = (function() {
  function Guesser() {}

  Guesser.klasses = [];

  Guesser.klass_reg = null;

  Guesser.klass_to_component = {};

  Guesser.tag_to_component = {};

  Guesser.specials = {};

  Guesser.compile_klass_reg = function() {
    if (!this.klasses.length) {
      return this.klass_reg = null;
    } else {
      return this.klass_reg = new RegExp("(" + this.klasses.map(function(klass) {
        return "(\\b" + (utils.escapeRegexp(klass)) + "\\b)";
      }).join("|") + ")", "g");
    }
  };

  Guesser.rules_for = function(component_name, klasses, tags, fun) {
    var base, i, j, klass, len, len1, tag;
    if (klasses == null) {
      klasses = [];
    }
    if (tags == null) {
      tags = [];
    }
    if (klasses.length) {
      for (i = 0, len = klasses.length; i < len; i++) {
        klass = klasses[i];
        this.klass_to_component[klass] = component_name;
        this.klasses.push(klass);
      }
      this.compile_klass_reg();
    }
    if (tags.length) {
      for (j = 0, len1 = tags.length; j < len1; j++) {
        tag = tags[j];
        ((base = this.tag_to_component)[tag] || (base[tag] = [])).push(component_name);
      }
    }
    if (typeof fun === 'function') {
      return this.specials[component_name] = fun;
    }
  };

  Guesser.find = function(nod) {
    var _match, el, i, j, len, len1, m, match, matches, ref, ref1, resolver, tag, tmatches;
    matches = [];
    if (this.klass_reg && (_match = nod.node.className.match(this.klass_reg))) {
      matches = utils.arr.uniq(_match);
      if (matches.length === 1) {
        return this.klass_to_component[matches[0]];
      }
    }
    matches = matches.map((function(_this) {
      return function(klass) {
        return _this.klass_to_component[klass];
      };
    })(this));
    tag = nod.node.nodeName.toLowerCase();
    if (tag === 'input') {
      tag += "[" + nod.node.type + "]";
    }
    if (this.tag_to_component[tag] != null) {
      tmatches = [];
      if (matches.length) {
        ref = this.tag_to_component[tag];
        for (i = 0, len = ref.length; i < len; i++) {
          el = ref[i];
          if ((indexOf.call(matches, el) >= 0)) {
            tmatches.push(el);
          }
        }
      } else {
        tmatches = this.tag_to_component[tag];
      }
      tmatches = utils.arr.uniq(tmatches);
      if (tmatches.length === 1) {
        return tmatches[0];
      } else {
        matches = tmatches;
      }
    }
    if (matches.length) {
      for (j = 0, len1 = matches.length; j < len1; j++) {
        m = matches[j];
        if ((this.specials[m] != null) && this.specials[m].call(null, nod)) {
          return m;
        }
      }
      return matches[matches.length - 1];
    } else {
      ref1 = this.specials;
      for (match in ref1) {
        if (!hasProp.call(ref1, match)) continue;
        resolver = ref1[match];
        if (resolver.call(null, nod)) {
          return match;
        }
      }
    }
    return 'base';
  };

  return Guesser;

})();

module.exports = Guesser;



},{"../../core/utils":46}],22:[function(require,module,exports){
'use strict';
var ComponentBuilder, Components, Config, Guesser, Initializer, Nod, _event_re, utils;

Guesser = require('./guesser');

Nod = require('../../core/nod').Nod;

Config = require('../../core/config');

Components = require('../');

utils = require('../../core/utils');

_event_re = /^on_(.+)/i;

Initializer = (function() {
  function Initializer() {}

  Initializer.builders = [];

  Initializer.append_builder = function(builder) {
    return this.builders.push(builder);
  };

  Initializer.insert_builder_at = function(builder, index) {
    return this.builders.splice(index, 0, builder);
  };

  Initializer.insert_builder_before = function(builder, before_builder) {
    var ind;
    if ((ind = this.builders.indexOf(before_builder)) > -1) {
      return this.insert_builder_at(builder, ind);
    } else {
      return this.append_builder(builder);
    }
  };

  Initializer.insert_builder_after = function(builder, after_builder) {
    var ind;
    if ((ind = this.builders.indexOf(before_builder)) > -1) {
      return this.insert_builder_at(builder, ind + 1);
    } else {
      return this.append_builder(builder);
    }
  };

  Initializer.init = function(nod, host) {
    var builder, i, len, ref;
    nod = nod instanceof Nod ? nod : Nod.create(nod);
    ref = this.builders;
    for (i = 0, len = ref.length; i < len; i++) {
      builder = ref[i];
      if (builder.match(nod)) {
        return builder.build(nod, host);
      }
    }
  };

  Initializer.gather_options = function(el, config_name) {
    var key, matches, opts, val;
    if (config_name == null) {
      config_name = "base";
    }
    opts = utils.clone(el.data());
    opts.plugins = opts.plugins != null ? opts.plugins.split(/\s+/) : null;
    opts.events = {};
    for (key in opts) {
      val = opts[key];
      if (matches = key.match(_event_re)) {
        opts.events[matches[1]] = val;
      }
    }
    return utils.merge(utils.obj.get_path(Config, config_name) || {}, opts);
  };

  return Initializer;

})();

ComponentBuilder = (function() {
  function ComponentBuilder() {}

  ComponentBuilder.match = utils.truthy;

  ComponentBuilder.build = function(nod, host) {
    var component;
    component = this.guess_component(nod);
    if (component == null) {
      return;
    }
    if (nod instanceof component) {
      return nod;
    }
    return new component(nod.node, host, Initializer.gather_options(nod, "components." + component.class_name));
  };

  ComponentBuilder.guess_component = function(nod) {
    var component, component_name;
    component_name = nod.data('component') || Guesser.find(nod);
    component = utils.obj.get_class_path(Components, component_name);
    if (component == null) {
      return utils.error("Unknown component " + component_name, nod.data());
    } else {
      component.class_name = component_name;
      utils.debug_verbose("Component created: " + component_name);
      return component;
    }
  };

  return ComponentBuilder;

})();

Initializer.append_builder(ComponentBuilder);

module.exports = Initializer;



},{"../":19,"../../core/config":32,"../../core/nod":40,"../../core/utils":46,"./guesser":21}],23:[function(require,module,exports){
'use strict';
var klass;

klass = {
  PI: 'pi',
  DISABLED: 'is-disabled',
  HIDDEN: 'is-hidden',
  ACTIVE: 'is-active',
  READONLY: 'is-readonly',
  INVALID: 'is-invalid',
  SELECTED: 'is-selected',
  EMPTY: 'is-empty'
};

module.exports = klass;



},{}],24:[function(require,module,exports){
'use strict';
var $, App, Compiler, EventDispatcher, Initializer, Klass, Nod, find, piecify, utils;

EventDispatcher = require('../../core/events').EventDispatcher;

Nod = require('../../core/nod').Nod;

Initializer = require('./initializer');

Klass = require('./klass');

Compiler = require('../../grammar/compiler');

utils = require('../../core/utils');

App = require('../../core/app');

piecify = function(nod, host) {
  return Initializer.init(nod, host || nod.parent(Klass.PI));
};

EventDispatcher.Global = new EventDispatcher();

Nod.root = new Nod.Root();

Nod.root.initialize();

find = function(pid_path, from) {
  return utils.obj.get_path(window.pi.app.view, pid_path);
};

utils.extend(Nod.prototype, {
  piecify: function(host) {
    return piecify(this, host);
  },
  pi_call: function(target, action) {
    if (!this._pi_call || this._pi_action !== action) {
      this._pi_action = action;
      this._pi_call = Compiler.str_to_fun(action, target);
    }
    return this._pi_call.call(null);
  }
});

Nod.root.ready(function() {
  return Nod.root.listen('a', 'click', function(e) {
    var href;
    if ((href = e.target.attr("href")) && href[0] === "@") {
      e.cancel();
      utils.debug("handle pi click: " + (e.target.attr("href")));
      e.target.pi_call(e.target, e.target.attr("href"));
    }
  });
});

$ = function(q) {
  if (q[0] === '@') {
    return find(q.slice(1));
  } else if (utils.is_html(q)) {
    return Nod.create(q);
  } else {
    return Nod.root.find(q);
  }
};

module.exports = $;



},{"../../core/app":31,"../../core/events":36,"../../core/nod":40,"../../core/utils":46,"../../grammar/compiler":52,"./initializer":22,"./klass":23}],25:[function(require,module,exports){
'use strict';
var Validator, _type_rxp, utils;

utils = require('../../core/utils');

_type_rxp = /(\w+)(?:\(([\w\-\/]+)\))/;

Validator = (function() {
  function Validator() {}

  Validator.add = function(name, fun) {
    return this[name] = fun;
  };

  Validator.validate = function(type, nod, form) {
    var data, matches;
    if ((matches = type.match(_type_rxp))) {
      type = matches[1];
      data = utils.serialize(matches[2]);
    }
    return this[type](nod.value(), nod, form, data);
  };

  Validator.email = function(val) {
    return utils.is_email(val);
  };

  Validator.len = function(val, nod, form, data) {
    return (val + "").length >= data;
  };

  Validator.truth = function(val) {
    return !!utils.serialize(val);
  };

  Validator.presence = function(val) {
    return val && ((val + "").length > 0);
  };

  Validator.digital = function(val) {
    return utils.is_digital(val + "");
  };

  Validator.confirm = function(val, nod, form) {
    var conf_nod, confirm_name;
    confirm_name = nod.name().replace(/([\]]+)?$/, "_confirmation$1");
    conf_nod = form.find_by_name(confirm_name);
    if (conf_nod == null) {
      return false;
    }
    return conf_nod.value() === val;
  };

  return Validator;

})();

module.exports = Validator;



},{"../../core/utils":46}],26:[function(require,module,exports){
'use strict';
var Base, Context, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Context = require('./context');

utils = require('../core/utils');

Base = (function(superClass) {
  extend(Base, superClass);

  Base.prototype.id = 'base';

  function Base(options) {
    Base.__super__.constructor.call(this, options);
    this.init_modules();
  }

  Base.prototype.set_view = function(view) {
    this.view = view;
    this.view.controller = this;
    return this;
  };

  Base.prototype.init_modules = function(modules) {
    var _, mod, ref, results;
    ref = this.options.modules;
    results = [];
    for (mod in ref) {
      _ = ref[mod];
      results.push(this.mixin(this.constructor.lookup_module(mod)));
    }
    return results;
  };

  Base.prototype.load = function(data) {
    var promise;
    if (data == null) {
      data = {};
    }
    promise = Base.__super__.load.apply(this, arguments);
    this.view.loaded(data.params);
    return promise;
  };

  Base.prototype.activate = function(data) {
    if (data == null) {
      data = {};
    }
    this.view.activated(data.params);
  };

  Base.prototype.deactivated = function() {
    this.view.deactivated();
  };

  Base.prototype.unload = function() {
    this.view.unloaded();
  };

  Base.prototype.exit = function(data) {
    return this.host_context.switch_back(data);
  };

  Base.prototype["switch"] = function(to, data) {
    return this.host_context.switch_context(this.id, to, data);
  };

  return Base;

})(Context);

module.exports = Base;



},{"../core/utils":46,"./context":27}],27:[function(require,module,exports){
'use strict';
var Context, Core, History, Strategy, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Core = require('../core/core');

utils = require('../core/utils');

History = require('../core/utils/history');

Context = (function(superClass) {
  extend(Context, superClass);

  function Context(options1) {
    this.options = options1 != null ? options1 : {};
    Context.__super__.constructor.apply(this, arguments);
    if (this.options.strategy) {
      this.strategy = Strategy.get(this.options.strategy);
      this.mixin(this.strategy);
    }
    this.preinitialize();
  }

  Context.prototype.preinitialize = function() {
    return this._contexts = {};
  };

  Context.register_callback('postinitialize', {
    as: 'create',
    only: 'after'
  });

  Context.prototype.add_context = function(context, options) {
    var ref;
    if (options == null) {
      options = {};
    }
    this._contexts[(ref = options.as) != null ? ref : context.id] = context;
    return context.host_context = this;
  };

  Context.prototype.initialize = function() {
    return this._initialized = true;
  };

  Context.register_callback('initialize');

  Context.prototype.load = function() {
    var ref;
    if (!this._initialized) {
      this.initialize();
    }
    return utils.promise.as((ref = this.strategy) != null ? ref.load(this) : void 0);
  };

  Context.register_callback('load');

  Context.prototype.unload = function() {
    var ref;
    return (ref = this.strategy) != null ? ref.unload(this) : void 0;
  };

  Context.register_callback('unload');

  Context.prototype.activate = function() {};

  Context.prototype.deactivate = function() {};

  Context.prototype.has_context = function(id) {
    return !!this._contexts[id];
  };

  Context.prototype.dispose = function() {
    var ref;
    this._initialized = false;
    this._contexts = {};
    return (ref = this.strategy) != null ? ref.dispose(this) : void 0;
  };

  return Context;

})(Core);

Strategy = (function() {
  function Strategy() {}

  Strategy.storage = {};

  Strategy.register = function(id, type) {
    return this.storage[id] = type;
  };

  Strategy.get = function(id) {
    return this.storage[id];
  };

  return Strategy;

})();

Strategy.OneForAll = (function(superClass) {
  extend(OneForAll, superClass);

  function OneForAll() {
    return OneForAll.__super__.constructor.apply(this, arguments);
  }

  OneForAll.mixedin = function(owner) {
    return owner._history = new History();
  };

  OneForAll.load = function(context1) {
    var id;
    this.context = context1;
    if (this.context.context || this.__loading) {
      return;
    }
    if ((id = this.context.options["default"] || "main") && this.context.has_context(id)) {
      return this.context.__loading_promise = this.context.switch_to(id).then(((function(_this) {
        return function() {
          _this.context.context = _this.context._contexts[id];
          _this.context.context_id = id;
          return delete _this.context.__loading_promise;
        };
      })(this)), ((function(_this) {
        return function(e) {
          delete _this.context.__loading_promise;
          utils.error(e);
          throw e;
        };
      })(this)));
    }
  };

  OneForAll.unload = function(context1) {
    this.context = context1;
    return (this.context.__loading_promise || utils.promise.resolved()).then((function(_this) {
      return function() {
        var ref;
        return (ref = _this.context.context) != null ? ref.unload() : void 0;
      };
    })(this));
  };

  OneForAll.dispose = function(context1) {
    this.context = context1;
    this.context._history = new History();
    delete this.context.context;
    delete this.context.context_id;
    return delete this.context.__loading_promise;
  };

  OneForAll.prototype.switch_to = function(to, params, history) {
    var data, preloader, ref, target;
    if (history == null) {
      history = false;
    }
    if (!to || !this._contexts[to]) {
      return utils.promise.rejected("Undefined target context: " + to);
    }
    data = {
      from: this.context_id,
      params: params
    };
    target = this._contexts[to];
    preloader = (ref = typeof target.preload === "function" ? target.preload() : void 0) != null ? ref : utils.promise.resolved();
    return preloader.then((function(_this) {
      return function() {
        var ref1;
        if ((ref1 = _this.context) != null) {
          ref1.unload();
        }
        target.load(data);
        if (!history) {
          _this._history.push(to);
        }
        _this.context = target;
        return _this.context_id = to;
      };
    })(this));
  };

  OneForAll.prototype.switch_back = function(data) {
    var to;
    to = this._history.prev();
    if (!to) {
      return utils.promise.resolved();
    }
    return this.switch_to(to, data, true);
  };

  OneForAll.prototype.switch_forward = function(data) {
    var to;
    to = this._history.next();
    if (!to) {
      return utils.promise.resolved();
    }
    return this.switch_to(to, data, true);
  };

  return OneForAll;

})(Core);

Strategy.OneByOne = (function(superClass) {
  extend(OneByOne, superClass);

  function OneByOne() {
    return OneByOne.__super__.constructor.apply(this, arguments);
  }

  OneByOne.prototype.switch_to = function(to_data, params, history, up) {
    var data, preloader, ref, ref1, target, to;
    if (history == null) {
      history = false;
    }
    if (up == null) {
      up = true;
    }
    if (!to_data || (typeof to_data === 'string' && !this._contexts[to_data])) {
      return utils.promise.rejected("Undefined target context: " + to_data);
    }
    ref = typeof to_data === 'object' ? [to_data.id, to_data.up] : [to_data, up], to = ref[0], up = ref[1];
    data = {
      from: this.context_id,
      params: params
    };
    target = this._contexts[to];
    preloader = (ref1 = typeof target.preload === "function" ? target.preload() : void 0) != null ? ref1 : utils.promise.resolved();
    return preloader.then((function(_this) {
      return function() {
        var ref2, ref3;
        if (up) {
          if ((ref2 = _this.context) != null) {
            ref2.deactivate();
          }
          target.load(data);
        } else {
          if ((ref3 = _this.context) != null) {
            ref3.unload();
          }
          target.activate(data);
        }
        if (!history) {
          _this._history.push({
            id: to,
            up: up
          });
        }
        _this.context = target;
        return _this.context_id = to;
      };
    })(this));
  };

  OneByOne.prototype.switch_up = function(to, data) {
    return this.switch_to(to, data);
  };

  OneByOne.prototype.switch_down = function(to, data) {
    return this.switch_to(to, data, false, false);
  };

  OneByOne.prototype.switch_forward = Strategy.OneForAll.prototype.switch_forward;

  OneByOne.prototype.switch_back = function(data) {
    var inverted_to, to;
    to = this._history.prev();
    if (!to) {
      return utils.promise.resolved();
    }
    inverted_to = utils.merge(to, {
      up: !to.up
    });
    return this.switch_to(inverted_to, data, true);
  };

  return OneByOne;

})(Strategy.OneForAll);

Strategy.AllForOne = (function(superClass) {
  extend(AllForOne, superClass);

  function AllForOne() {
    return AllForOne.__super__.constructor.apply(this, arguments);
  }

  AllForOne.load = function(context1) {
    var _, ctx, ref, results;
    this.context = context1;
    ref = this.context._contexts;
    results = [];
    for (_ in ref) {
      if (!hasProp.call(ref, _)) continue;
      ctx = ref[_];
      results.push(ctx.load());
    }
    return results;
  };

  AllForOne.unload = function(context1) {
    var _, ctx, ref, results;
    this.context = context1;
    ref = this.context._contexts;
    results = [];
    for (_ in ref) {
      if (!hasProp.call(ref, _)) continue;
      ctx = ref[_];
      results.push(ctx.unload());
    }
    return results;
  };

  AllForOne.dispose = function(context1) {
    this.context = context1;
  };

  AllForOne.prototype.context = function(id) {
    return this._contexts[id];
  };

  return AllForOne;

})(Core);

Strategy.register('one_for_all', Strategy.OneForAll);

Strategy.register('one_by_one', Strategy.OneByOne);

Strategy.register('all_for_one', Strategy.AllForOne);

module.exports = Context;



},{"../core/core":33,"../core/utils":46,"../core/utils/history":45}],28:[function(require,module,exports){
'use strict'
var controllers = {}

controllers.Context = require('./context');
controllers.Page = require('./page');
controllers.Base = require('./base');
module.exports = controllers;

},{"./base":26,"./context":27,"./page":30}],29:[function(require,module,exports){
'use strict';
var BaseView, Compiler, ControllerBuilder, Controllers, Initializer, Page, Views, _mod_rxp, utils;

Controllers = require('./index');

utils = require('../core/utils');

BaseView = require('../views/base');

Views = require('../views');

Initializer = require('../components/utils/initializer');

Page = require('./page');

Compiler = require('../grammar/compiler');

_mod_rxp = /^(\w+)(\(.*\))?$/;

ControllerBuilder = (function() {
  function ControllerBuilder() {}

  ControllerBuilder.match = function(nod) {
    return !!nod.data('controller');
  };

  ControllerBuilder.build = function(nod, host) {
    var _view, c_options, cklass, cklass_name, controller, host_context, options, ref, ref1, v_options, view, vklass, vklass_name;
    options = Initializer.gather_options(nod);
    c_options = options.controller.split(/\s*\|\s*/);
    cklass_name = c_options[0] || 'base';
    cklass = utils.obj.get_class_path(Controllers, cklass_name);
    if (cklass == null) {
      return utils.error("Unknown controller " + options.controller);
    }
    v_options = (ref = (ref1 = options.view) != null ? ref1.split(/\s*\|\s*/) : void 0) != null ? ref : [cklass_name];
    vklass_name = v_options[0] || cklass_name;
    vklass = utils.obj.get_class_path(Views, vklass_name) || BaseView;
    delete options['view'];
    delete options['controller'];
    options.modules = this.parse_modules(c_options.slice(1));
    controller = new cklass(utils.clone(options));
    delete options['strategy'];
    delete options['default'];
    utils.extend(options.modules, this.parse_modules(v_options.slice(1)), true);
    view = new vklass(nod.node, host, options);
    controller.set_view(view);
    host_context = (_view = host.view()) ? _view.controller : Page.instance;
    host_context.add_context(controller, {
      as: view.pid
    });
    return view;
  };

  ControllerBuilder.parse_modules = function(list) {
    var data, fn, i, len, mod;
    data = {};
    fn = function(mod) {
      var _, name, opts, optstr, ref;
      ref = mod.match(_mod_rxp), _ = ref[0], name = ref[1], optstr = ref[2];
      if (optstr != null) {
        opts = Compiler.compile_fun(optstr).call();
      }
      return data[name] = opts;
    };
    for (i = 0, len = list.length; i < len; i++) {
      mod = list[i];
      fn(mod);
    }
    return data;
  };

  return ControllerBuilder;

})();

Initializer.insert_builder_at(ControllerBuilder, 0);

module.exports = ControllerBuilder;



},{"../components/utils/initializer":22,"../core/utils":46,"../grammar/compiler":52,"../views":77,"../views/base":76,"./index":28,"./page":30}],30:[function(require,module,exports){
'use strict';
var Compiler, Config, Context, Page, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Context = require('./context');

utils = require('../core/utils');

Config = require('../core/config');

Compiler = require('../grammar/compiler');

Page = (function(superClass) {
  extend(Page, superClass);

  Page.instance = null;

  function Page() {
    this.constructor.instance = this;
    Page.__super__.constructor.call(this, utils.merge({
      strategy: 'one_for_all',
      "default": 'main'
    }, Config.page));
  }

  return Page;

})(Context);

Compiler.modifiers.push(function(str) {
  if (str.slice(0, 2) === '@@') {
    str = "@app.page.context." + str.slice(2);
  }
  return str;
});

module.exports = Page;



},{"../core/config":32,"../core/utils":46,"../grammar/compiler":52,"./context":27}],31:[function(require,module,exports){
'use strict';
var App, Nod, Page, utils;

Nod = require('./nod').Nod;

Page = require('../controllers/page');

utils = require('./utils');

App = (function() {
  function App() {}

  App.prototype.initialize = function(nod) {
    if (this._initialized) {
      return false;
    }
    this.page = new Page();
    this.view = (nod != null ? nod : Nod.root).piecify();
    this._initialized = true;
    return this.page.load();
  };

  App.prototype.reinitialize = function() {
    if (!this._initialized) {
      return false;
    }
    this.page.dispose();
    this.view.piecify();
    return this.page.load();
  };

  App.prototype.dispose = function() {
    if (!this._initialized) {
      return false;
    }
    this.page.dispose();
    this.view.remove_children();
    return true;
  };

  return App;

})();

module.exports = App;



},{"../controllers/page":30,"./nod":40,"./utils":46}],32:[function(require,module,exports){
'use strict';
var config;

config = {};

module.exports = config;



},{}],33:[function(require,module,exports){
'use strict';
var Core, utils,
  slice = [].slice;

utils = require('./utils');

Core = (function() {
  var _after, _before;

  Core.include = function() {
    var i, len, mixin, mixins, results;
    mixins = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    results = [];
    for (i = 0, len = mixins.length; i < len; i++) {
      mixin = mixins[i];
      utils.extend(this.prototype, mixin.prototype, true, ['constructor']);
      results.push(mixin.included(this));
    }
    return results;
  };

  Core.extend = function() {
    var i, len, mixin, mixins, results;
    mixins = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    results = [];
    for (i = 0, len = mixins.length; i < len; i++) {
      mixin = mixins[i];
      utils.extend(this, mixin, true, ['__super__']);
      results.push(mixin.extended(this));
    }
    return results;
  };

  Core.alias = function(from, to) {
    this.prototype[from] = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this[to].apply(this, args);
    };
  };

  Core.class_alias = function(from, to) {
    this[from] = this[to];
  };

  Core.included = utils.truthy;

  Core.extended = utils.truthy;

  Core.mixedin = utils.truthy;

  Core.register_callback = function(method, options) {
    var _when, callback_name, fn, i, len, types;
    if (options == null) {
      options = {};
    }
    callback_name = options.as || method;
    types = options.only || ["before", "after"];
    types = utils.to_a(types);
    fn = (function(_this) {
      return function(_when) {
        return _this[_when + "_" + callback_name] = function(callback) {
          var base, name1;
          if (this.prototype["_" + _when + "_" + callback_name] && !this.prototype.hasOwnProperty("_" + _when + "_" + callback_name)) {
            this.prototype["_" + _when + "_" + callback_name] = this.prototype["_" + _when + "_" + callback_name].slice();
          }
          return ((base = this.prototype)[name1 = "_" + _when + "_" + callback_name] || (base[name1] = [])).push(callback);
        };
      };
    })(this);
    for (i = 0, len = types.length; i < len; i++) {
      _when = types[i];
      fn(_when);
    }
    this.prototype["__" + method] = function() {
      var args, res;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.run_callbacks("before_" + callback_name, args);
      res = this.constructor.prototype[method].apply(this, args);
      this.run_callbacks("after_" + callback_name, args);
      return res;
    };
    return (this.callbacked || (this.callbacked = [])).push(method);
  };

  Core.lookup_module = function(name) {
    var klass, ref;
    name = utils.camelCase(name);
    klass = this;
    while ((klass != null)) {
      if (klass[name] != null) {
        return klass[name];
      }
      klass = (ref = klass.__super__) != null ? ref.constructor : void 0;
    }
    utils.debug("module not found: " + name);
    return null;
  };

  Core.prototype.mixin = function() {
    var i, len, mixin, mixins, results;
    mixins = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    results = [];
    for (i = 0, len = mixins.length; i < len; i++) {
      mixin = mixins[i];
      if (typeof mixin === 'string') {
        mixin = this.constructor.lookup_module(mixin);
      }
      if (!mixin) {
        continue;
      }
      utils.extend(this, mixin.prototype, true, ['constructor']);
      results.push(mixin.mixedin(this));
    }
    return results;
  };

  _before = function(name) {
    if (this["__h__" + name] != null) {
      return this["__h__" + name];
    }
  };

  _after = function(name, res) {
    return this["__h__" + name] = res;
  };

  Core.event_handler = function(name, options) {
    if (options == null) {
      options = {};
    }
    if (typeof this.prototype[name] !== 'function') {
      return utils.error("undefined handler", this, name);
    }
    this.prototype[name] = utils.func.unwrap(this.prototype[name], options);
    return this.prototype[name] = utils.func.wrap(this.prototype[name], utils.curry(_before, name), utils.curry(_after, name), {
      break_if_value: true
    });
  };

  function Core() {
    var fn, i, len, method, ref;
    ref = this.constructor.callbacked || [];
    fn = (function(_this) {
      return function(method) {
        return _this[method] = _this["__" + method];
      };
    })(this);
    for (i = 0, len = ref.length; i < len; i++) {
      method = ref[i];
      fn(method);
    }
  }

  Core.prototype.run_callbacks = function(type, args) {
    var callback, i, len, ref, results;
    ref = this["_" + type] || [];
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      callback = ref[i];
      results.push(callback.apply(this, args));
    }
    return results;
  };

  Core.prototype.delegate_to = function() {
    var fn, i, len, method, methods, to;
    to = arguments[0], methods = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    to = typeof to === 'string' ? this[to] : to;
    fn = (function(_this) {
      return function(method) {
        return _this[method] = function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return to[method].apply(to, args);
        };
      };
    })(this);
    for (i = 0, len = methods.length; i < len; i++) {
      method = methods[i];
      fn(method);
    }
  };

  return Core;

})();

module.exports = Core;



},{"./utils":46}],34:[function(require,module,exports){
'use strict';
var Browser, NodEvent;

NodEvent = require('../nod').NodEvent;

Browser = require('../utils/browser');

if (!!Browser.info().gecko) {
  NodEvent.register_alias('mousewheel', 'DOMMouseScroll');
}



},{"../nod":40,"../utils/browser":43}],35:[function(require,module,exports){
'use strict';
var Core, Event, EventDispatcher, EventListener, _types, exports, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

utils = require('../utils');

Core = require('../core');

exports = {};

Event = (function(superClass) {
  extend(Event, superClass);

  function Event(event, target, bubbles) {
    this.target = target;
    if (bubbles == null) {
      bubbles = true;
    }
    if ((event != null) && typeof event === "object") {
      utils.extend(this, event);
    } else {
      this.type = event;
    }
    this.bubbles = bubbles;
    this.canceled = false;
    this.captured = false;
  }

  Event.prototype.cancel = function() {
    return this.canceled = true;
  };

  return Event;

})(Core);

exports.Event = Event;

EventListener = (function(superClass) {
  extend(EventListener, superClass);

  function EventListener(type1, handler, context1, disposable, conditions1) {
    this.type = type1;
    this.handler = handler;
    this.context = context1 != null ? context1 : null;
    this.disposable = disposable != null ? disposable : false;
    this.conditions = conditions1;
    EventListener.__super__.constructor.apply(this, arguments);
    if (this.handler._uid == null) {
      this.handler._uid = "fun" + utils.uid();
    }
    this.uid = this.type + ":" + this.handler._uid;
    if (typeof this.conditions !== 'function') {
      this.conditions = utils.truthy;
    }
    if (this.context != null) {
      if (this.context._uid == null) {
        this.context._uid = "obj" + utils.uid();
      }
      this.uid += ":" + this.context._uid;
    }
  }

  EventListener.prototype.dispatch = function(event) {
    if (this.disposed || !this.conditions(event)) {
      return;
    }
    if (this.handler.call(this.context, event) !== false) {
      event.captured = true;
    }
    if (this.disposable) {
      return this.dispose();
    }
  };

  EventListener.prototype.dispose = function() {
    this.handler = this.context = this.conditions = null;
    return this.disposed = true;
  };

  return EventListener;

})(Core);

_types = function(types) {
  if (typeof types === 'string') {
    return types.split(/\,\s*/);
  } else if (Array.isArray(types)) {
    return types;
  } else {
    return [null];
  }
};

exports.EventListener = EventListener;

EventDispatcher = (function(superClass) {
  extend(EventDispatcher, superClass);

  EventDispatcher.prototype.listeners = '';

  EventDispatcher.prototype.listeners_by_key = '';

  function EventDispatcher() {
    EventDispatcher.__super__.constructor.apply(this, arguments);
    this.listeners = {};
    this.listeners_by_key = {};
  }

  EventDispatcher.prototype.on = function(types, callback, context, conditions) {
    var i, len, ref, results, type;
    ref = _types(types);
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      type = ref[i];
      results.push(this.add_listener(new EventListener(type, callback, context, false, conditions)));
    }
    return results;
  };

  EventDispatcher.prototype.one = function(type, callback, context, conditions) {
    return this.add_listener(new EventListener(type, callback, context, true, conditions));
  };

  EventDispatcher.prototype.off = function(types, callback, context, conditions) {
    var i, len, ref, results, type;
    ref = _types(types);
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      type = ref[i];
      results.push(this.remove_listener(type, callback, context, conditions));
    }
    return results;
  };

  EventDispatcher.prototype.trigger = function(event, data, bubbles) {
    var i, len, listener, ref;
    if (bubbles == null) {
      bubbles = true;
    }
    if (!(event instanceof Event)) {
      event = new Event(event, this, bubbles);
    }
    if (data != null) {
      event.data = data;
    }
    event.currentTarget = this;
    if (this.listeners[event.type] != null) {
      utils.debug_verbose("Event: " + event.type, event);
      ref = this.listeners[event.type];
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        listener.dispatch(event);
        if (event.canceled === true) {
          break;
        }
      }
      this.remove_disposed_listeners();
    }
    if (event.captured !== true) {
      if (event.bubbles) {
        this.bubble_event(event);
      }
    }
  };

  EventDispatcher.prototype.bubble_event = function(event) {};

  EventDispatcher.prototype.add_listener = function(listener) {
    var base, name;
    (base = this.listeners)[name = listener.type] || (base[name] = []);
    this.listeners[listener.type].push(listener);
    return this.listeners_by_key[listener.uid] = listener;
  };

  EventDispatcher.prototype.remove_listener = function(type, callback, context, conditions) {
    var i, len, listener, ref, uid;
    if (context == null) {
      context = null;
    }
    if (conditions == null) {
      conditions = null;
    }
    if (type == null) {
      return this.remove_all();
    }
    if (this.listeners[type] == null) {
      return;
    }
    if (callback == null) {
      ref = this.listeners[type];
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        listener.dispose();
      }
      this.remove_type(type);
      this.remove_disposed_listeners();
      return;
    }
    uid = type + ":" + callback._uid;
    if (context != null) {
      uid += ":" + context._uid;
    }
    listener = this.listeners_by_key[uid];
    if (listener != null) {
      delete this.listeners_by_key[uid];
      this.remove_listener_from_list(type, listener);
    }
  };

  EventDispatcher.prototype.remove_listener_from_list = function(type, listener) {
    if ((this.listeners[type] != null) && this.listeners[type].indexOf(listener) > -1) {
      this.listeners[type] = this.listeners[type].filter(function(item) {
        return item !== listener;
      });
      if (!this.listeners[type].length) {
        return this.remove_type(type);
      }
    }
  };

  EventDispatcher.prototype.remove_disposed_listeners = function() {
    var key, listener, ref, results;
    ref = this.listeners_by_key;
    results = [];
    for (key in ref) {
      listener = ref[key];
      if (listener.disposed) {
        this.remove_listener_from_list(listener.type, listener);
        results.push(delete this.listeners_by_key[key]);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  EventDispatcher.prototype.remove_type = function(type) {
    return delete this.listeners[type];
  };

  EventDispatcher.prototype.remove_all = function() {
    this.listeners = {};
    return this.listeners_by_key = {};
  };

  return EventDispatcher;

})(Core);

exports.EventDispatcher = EventDispatcher;

module.exports = exports;



},{"../core":33,"../utils":46}],36:[function(require,module,exports){
'use strict'
module.exports = require('./events');

},{"./events":35}],37:[function(require,module,exports){
'use strict';
var Core, EventListener, Nod, NodEvent, ResizeDelegate, ResizeListener, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

utils = require('../utils');

EventListener = require('./events').EventListener;

Core = require('../core');

Nod = require('../nod').Nod;

NodEvent = require('../nod').NodEvent;

ResizeListener = (function(superClass) {
  extend(ResizeListener, superClass);

  function ResizeListener(nod1, handler) {
    var _filter;
    this.nod = nod1;
    this.handler = handler;
    this._w = this.nod.width();
    this._h = this.nod.height();
    _filter = (function(_this) {
      return function(e) {
        if (_this._w !== e.width || _this._h !== e.height) {
          _this._w = e.width;
          _this._h = e.height;
          return true;
        } else {
          return false;
        }
      };
    })(this);
    ResizeListener.__super__.constructor.call(this, 'resize', this.handler, this.nod, false, _filter);
  }

  return ResizeListener;

})(EventListener);

ResizeDelegate = (function(superClass) {
  extend(ResizeDelegate, superClass);

  function ResizeDelegate() {
    this.listeners = [];
  }

  ResizeDelegate.prototype.add = function(nod, callback) {
    this.listeners.push(new ResizeListener(nod, callback));
    if (this.listeners.length === 1) {
      return this.listen();
    }
  };

  ResizeDelegate.prototype.remove = function(nod) {
    var flag, i, j, len, listener, ref;
    flag = false;
    ref = this.listeners;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      listener = ref[i];
      if (listener.nod === nod) {
        flag = true;
        break;
      }
    }
    if (flag === true) {
      return this.listeners.splice(i, 1);
    }
  };

  ResizeDelegate.prototype.listen = function() {
    return NodEvent.add(Nod.win.node, 'resize', this.resize_listener());
  };

  ResizeDelegate.prototype.off = function() {
    return NodEvent.remove(Nod.win.node, 'resize', this.resize_listener());
  };

  ResizeDelegate.prototype.resize_listener = function(e) {
    var j, len, listener, ref, results;
    ref = this.listeners;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      listener = ref[j];
      results.push(listener.dispatch(this._create_event(listener)));
    }
    return results;
  };

  ResizeDelegate.event_handler('resize_listener', {
    throttle: 300
  });

  ResizeDelegate.prototype._create_event = function(listener) {
    var nod;
    nod = listener.nod;
    return {
      type: 'resize',
      target: nod,
      width: nod.width(),
      height: nod.height()
    };
  };

  return ResizeDelegate;

})(Core);

module.exports = ResizeDelegate;



},{"../core":33,"../nod":40,"../utils":46,"./events":35}],38:[function(require,module,exports){
'use strict';
var Former, utils,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

utils = require('../utils');

Former = (function() {
  function Former(nod1, options1) {
    this.nod = nod1;
    this.options = options1 != null ? options1 : {};
    if (this.options.rails === true) {
      this.options.name_transform = this._rails_name_transform;
    }
    if (this.options.serialize === true) {
      this.options.parse_value = utils.serialize;
    }
  }

  Former.parse = function(nod, options) {
    return (new Former(nod, options)).parse();
  };

  Former.fill = function(nod, options) {
    return (new Former(nod, options)).fill();
  };

  Former.clear = function(nod, options) {
    return (new Former(nod, options)).clear();
  };

  Former.prototype.parse = function() {
    return this.process_name_values(this.collect_name_values());
  };

  Former.prototype.fill = function(data) {
    return this.traverse_nodes(this.nod, (function(_this) {
      return function(nod) {
        return _this._fill_nod(nod, data);
      };
    })(this));
  };

  Former.prototype.clear = function() {
    return this.traverse_nodes(this.nod, (function(_this) {
      return function(nod) {
        return _this._clear_nod(nod);
      };
    })(this));
  };

  Former.prototype.process_name_values = function(name_values) {
    var _arrays, _result, fn, item, j, len1;
    _result = {};
    _arrays = {};
    fn = (function(_this) {
      return function(item) {
        var _arr_fullname, _current, _name_parts, i, k, len, len2, name, name_part, results, value;
        name = item.name, value = item.value;
        if (_this.options.skip_empty && (value === '' || value === null)) {
          return;
        }
        _arr_fullname = '';
        _current = _result;
        name = _this.transform_name(name, false);
        value = _this.transform_value(value);
        _name_parts = name.split(".");
        len = _name_parts.length;
        results = [];
        for (i = k = 0, len2 = _name_parts.length; k < len2; i = ++k) {
          name_part = _name_parts[i];
          results.push((function(name_part) {
            var _arr_len, _arr_name, _array_item, _next_field;
            if (name_part.indexOf('[]') > -1) {
              _arr_name = name_part.substr(0, name_part.indexOf('['));
              _arr_fullname += _arr_name;
              _current[_arr_name] || (_current[_arr_name] = []);
              if (i === (len - 1)) {
                return _current[_arr_name].push(value);
              } else {
                _next_field = _name_parts[i + 1];
                _arrays[_arr_fullname] || (_arrays[_arr_fullname] = []);
                _arr_len = _arrays[_arr_fullname].length;
                if (_current[_arr_name].length > 0) {
                  _array_item = _current[_arr_name][_current[_arr_name].length - 1];
                }
                if (!_arr_len || ((indexOf.call(_arrays[_arr_fullname], _next_field) >= 0) && !(_next_field.indexOf('[]') > -1 || !((_array_item[_next_field] != null) && (i + 1 === len - 1))))) {
                  _array_item = {};
                  _current[_arr_name].push(_array_item);
                  _arrays[_arr_fullname] = [];
                }
                _arrays[_arr_fullname].push(_next_field);
                return _current = _array_item;
              }
            } else {
              _arr_fullname += name_part;
              if (i < (len - 1)) {
                _current[name_part] || (_current[name_part] = {});
                return _current = _current[name_part];
              } else {
                return _current[name_part] = value;
              }
            }
          })(name_part));
        }
        return results;
      };
    })(this);
    for (j = 0, len1 = name_values.length; j < len1; j++) {
      item = name_values[j];
      fn(item);
    }
    return _result;
  };

  Former.prototype.collect_name_values = function() {
    return this.traverse_nodes(this.nod, (function(_this) {
      return function(nod) {
        return _this._parse_nod(nod);
      };
    })(this));
  };

  Former.prototype.traverse_nodes = function(nod, callback) {
    var current, result;
    result = this._to_array(callback(nod));
    current = nod.firstChild;
    while ((current != null)) {
      if (current.nodeType === 1) {
        result = result.concat(this.traverse_nodes(current, callback));
      }
      current = current.nextSibling;
    }
    return result;
  };

  Former.prototype.transform_name = function(name, prefix) {
    if (prefix == null) {
      prefix = true;
    }
    if (this.options.fill_prefix && prefix) {
      name = name.replace(this.options.fill_prefix, '');
    }
    if (this.options.name_transform != null) {
      name = this.options.name_transform(name);
    }
    return name;
  };

  Former.prototype.transform_value = function(val) {
    if (this.options.parse_value != null) {
      return this.options.parse_value(val);
    }
    return val;
  };

  Former.prototype._to_array = function(val) {
    if (val == null) {
      return [];
    } else {
      return utils.to_a(val);
    }
  };

  Former.prototype._parse_nod = function(nod) {
    var val;
    if (this.options.disabled === false && nod.disabled) {
      return;
    }
    if (!/(input|select|textarea)/i.test(nod.nodeName)) {
      return;
    }
    if (!nod.name) {
      return;
    }
    val = this._parse_nod_value(nod);
    if (val == null) {
      return;
    }
    return {
      name: nod.name,
      value: val
    };
  };

  Former.prototype._fill_nod = function(nod, data) {
    var type, value;
    if (!/(input|select|textarea)/i.test(nod.nodeName)) {
      return;
    }
    value = this._nod_data_value(nod.name, data);
    if (value == null) {
      return;
    }
    if (nod.nodeName.toLowerCase() === 'select') {
      this._fill_select(nod, value);
    } else {
      if (typeof value === 'object') {
        return;
      }
      type = nod.type.toLowerCase();
      switch (false) {
        case !(/(radio|checkbox)/.test(type) && value):
          nod.checked = true;
          break;
        case !(/(radio|checkbox)/.test(type) && !value):
          nod.checked = false;
          break;
        default:
          nod.value = value;
      }
    }
  };

  Former.prototype._fill_select = function(nod, value) {
    var j, len1, option, ref, results;
    value = value instanceof Array ? value : [value];
    value = value.map(function(val) {
      return "" + val;
    });
    ref = nod.getElementsByTagName("option");
    results = [];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      option = ref[j];
      results.push((function(option) {
        var ref1;
        return option.selected = (ref1 = option.value, indexOf.call(value, ref1) >= 0);
      })(option));
    }
    return results;
  };

  Former.prototype._clear_nod = function(nod) {
    var type;
    if (!/(input|select|textarea)/i.test(nod.nodeName)) {
      return;
    }
    if (nod.nodeName.toLowerCase() === 'select') {
      this._fill_select(nod, []);
    } else {
      type = nod.type.toLowerCase();
      switch (false) {
        case !/(radio|checkbox)/.test(type):
          nod.checked = false;
          break;
        case !(type === 'hidden' && !this.options.clear_hidden):
          true;
          break;
        default:
          nod.value = '';
      }
    }
  };

  Former.prototype._nod_data_value = function(name, data) {
    var j, key, len1, ref;
    if (!name) {
      return;
    }
    name = this.transform_name(name);
    if (name.indexOf('[]') > -1) {
      return;
    }
    ref = name.split(".");
    for (j = 0, len1 = ref.length; j < len1; j++) {
      key = ref[j];
      data = data[key];
      if (data == null) {
        break;
      }
    }
    return data;
  };

  Former.prototype._parse_nod_value = function(nod) {
    var type;
    if (nod.nodeName.toLowerCase() === 'select') {
      return this._parse_select_value(nod);
    } else {
      type = nod.type.toLowerCase();
      switch (false) {
        case !(/(radio|checkbox)/.test(type) && nod.checked):
          return nod.value;
        case !(/(radio|checkbox)/.test(type) && !nod.checked):
          return null;
        case !/(button|reset|submit|image)/.test(type):
          return null;
        case !/(file)/.test(type):
          return this._parse_file_value(nod);
        default:
          return nod.value;
      }
    }
  };

  Former.prototype._parse_file_value = function(nod) {
    var ref;
    if (!((ref = nod.files) != null ? ref.length : void 0)) {
      return;
    }
    if (nod.multiple) {
      return nod.files;
    } else {
      return nod.files[0];
    }
  };

  Former.prototype._parse_select_value = function(nod) {
    var j, len1, multiple, option, ref, results;
    multiple = nod.multiple;
    if (!multiple) {
      return nod.value;
    }
    ref = nod.getElementsByTagName("option");
    results = [];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      option = ref[j];
      if (option.selected) {
        results.push(option.value);
      }
    }
    return results;
  };

  Former.prototype._rails_name_transform = function(name) {
    return name.replace(/\[([^\]])/ig, ".$1").replace(/([^\[])([\]]+)/ig, "$1");
  };

  return Former;

})();

module.exports = Former;



},{"../utils":46}],39:[function(require,module,exports){
'use strict'
var pi = {}

// export function to global object (window) with ability to rollback (noconflict)
var _conflicts = {}

pi.export = function(fun, as){
  if(window[as] && !_conflicts[as])
    _conflicts[as] = window[as];
  window[as] = fun;
};

pi.noconflict = function(){
  for (var name in _conflicts){
    if(_conflicts.hasOwnProperty(name)){
      window[name] = _conflicts[name];
    }
  }
};

pi.config = require('./config');

var utils = pi.utils = require('./utils');

// export functions 
pi.export(utils.curry, 'curry');
pi.export(utils.delayed, 'delayed');
pi.export(utils.after, 'after');
pi.export(utils.debounce, 'debounce');
pi.export(utils.throttle, 'throttle');

pi.Core = require('./core');

pi.Events = require('./events');

var NodClasses = require('./nod');

pi.Nod = NodClasses.Nod;

utils.extend(pi.Events, NodClasses, false, ['Nod']);

pi.Events.ResizeDelegate = require('./events/resize_delegate');

pi.Events.NodEvent.register_delegate('resize', new pi.Events.ResizeDelegate());

// setup event aliases
require('./events/aliases');

module.exports = pi;

},{"./config":32,"./core":33,"./events":36,"./events/aliases":34,"./events/resize_delegate":37,"./nod":40,"./utils":46}],40:[function(require,module,exports){
'use strict';
var Event, EventDispatcher, KeyEvent, MouseEvent, Nod, NodEvent, NodEventDispatcher, _body, _caf, _data_reg, _dataset, _fragment, _from_dataCase, _geometry_styles, _key_regexp, _mouse_regexp, _node, _prepare_event, _prop_hash, _raf, _selector, _selector_regexp, _store, _win, d, exports, fn, fn1, j, l, len, len1, ref, ref1, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

utils = require('./utils');

EventDispatcher = require('./events').EventDispatcher;

Event = require('./events').Event;

exports = {};

NodEvent = (function(superClass) {
  extend(NodEvent, superClass);

  NodEvent.aliases = {};

  NodEvent.reversed_aliases = {};

  NodEvent.delegates = {};

  NodEvent.add = function(nod, event, handler) {
    return nod.addEventListener(event, handler);
  };

  NodEvent.remove = function(nod, event, handler) {
    return nod.removeEventListener(event, handler);
  };

  NodEvent.register_delegate = function(type, delegate) {
    return this.delegates[type] = delegate;
  };

  NodEvent.has_delegate = function(type) {
    return !!this.delegates[type];
  };

  NodEvent.register_alias = function(from, to) {
    this.aliases[from] = to;
    return this.reversed_aliases[to] = from;
  };

  NodEvent.has_alias = function(type) {
    return !!this.aliases[type];
  };

  NodEvent.is_aliased = function(type) {
    return !!this.reversed_aliases[type];
  };

  function NodEvent(event) {
    this.event = event || window.event;
    this.origTarget = this.event.target || this.event.srcElement;
    this.target = Nod.create(this.origTarget);
    this.type = this.constructor.is_aliased(event.type) ? this.constructor.reversed_aliases[event.type] : event.type;
    this.ctrlKey = this.event.ctrlKey;
    this.shiftKey = this.event.shiftKey;
    this.altKey = this.event.altKey;
    this.metaKey = this.event.metaKey;
    this.detail = this.event.detail;
    this.bubbles = this.event.bubbles;
  }

  NodEvent.prototype.stopPropagation = function() {
    if (this.event.stopPropagation) {
      return this.event.stopPropagation();
    } else {
      return this.event.cancelBubble = true;
    }
  };

  NodEvent.prototype.stopImmediatePropagation = function() {
    if (this.event.stopImmediatePropagation) {
      return this.event.stopImmediatePropagation();
    } else {
      this.event.cancelBubble = true;
      return this.event.cancel = true;
    }
  };

  NodEvent.prototype.preventDefault = function() {
    if (this.event.preventDefault) {
      return this.event.preventDefault();
    } else {
      return this.event.returnValue = false;
    }
  };

  NodEvent.prototype.cancel = function() {
    this.stopImmediatePropagation();
    this.preventDefault();
    return NodEvent.__super__.cancel.apply(this, arguments);
  };

  return NodEvent;

})(Event);

exports.NodEvent = NodEvent;

_mouse_regexp = /(click|mouse|contextmenu)/i;

_key_regexp = /(keyup|keydown|keypress)/i;

MouseEvent = (function(superClass) {
  extend(MouseEvent, superClass);

  function MouseEvent() {
    MouseEvent.__super__.constructor.apply(this, arguments);
    this.button = this.event.button;
    if (this.pageX == null) {
      this.pageX = this.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      this.pageY = this.event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    if (this.offsetX == null) {
      this.offsetX = this.event.layerX - this.origTarget.offsetLeft;
      this.offsetY = this.event.layerY - this.origTarget.offsetTop;
    }
    this.wheelDelta = this.event.wheelDelta;
    if (this.wheelDelta == null) {
      this.wheelDelta = -this.event.detail * 40;
    }
  }

  return MouseEvent;

})(NodEvent);

exports.MouseEvent = MouseEvent;

KeyEvent = (function(superClass) {
  extend(KeyEvent, superClass);

  function KeyEvent() {
    KeyEvent.__super__.constructor.apply(this, arguments);
    this.keyCode = this.event.keyCode || this.event.which;
    this.charCode = this.event.charCode;
  }

  return KeyEvent;

})(NodEvent);

exports.KeyEvent = KeyEvent;

_prepare_event = function(e) {
  if (_mouse_regexp.test(e.type)) {
    return new MouseEvent(e);
  } else if (_key_regexp.test(e.type)) {
    return new KeyEvent(e);
  } else {
    return new NodEvent(e);
  }
};

_selector_regexp = /^[\.#]/;

_selector = function(s, parent) {
  if (!_selector_regexp.test(s)) {
    return function(e) {
      return e.target.node.matches(s);
    };
  } else {
    return function(e) {
      var node;
      parent || (parent = document);
      node = e.target.node;
      if (node.matches(s)) {
        return true;
      }
      if (node === parent) {
        return false;
      }
      while ((node = node.parentNode) && node !== parent) {
        if (node.matches(s)) {
          return (e.target = Nod.create(node));
        }
      }
    };
  }
};

NodEventDispatcher = (function(superClass) {
  extend(NodEventDispatcher, superClass);

  function NodEventDispatcher() {
    NodEventDispatcher.__super__.constructor.apply(this, arguments);
    this.native_event_listener = (function(_this) {
      return function(event) {
        return _this.trigger(_prepare_event(event));
      };
    })(this);
  }

  NodEventDispatcher.prototype.listen = function(selector, event, callback, context) {
    return this.on(event, callback, context, _selector(selector, this.node));
  };

  NodEventDispatcher.prototype.add_native_listener = function(type) {
    if (NodEvent.has_delegate(type)) {
      return NodEvent.delegates[type].add(this, this.native_event_listener);
    } else {
      return NodEvent.add(this.node, type, this.native_event_listener);
    }
  };

  NodEventDispatcher.prototype.remove_native_listener = function(type) {
    if (NodEvent.has_delegate(type)) {
      return NodEvent.delegates[type].remove(this);
    } else {
      return NodEvent.remove(this.node, type, this.native_event_listener);
    }
  };

  NodEventDispatcher.prototype.add_listener = function(listener) {
    if (!this.listeners[listener.type]) {
      if (NodEvent.has_alias(listener.type)) {
        this.add_native_listener(NodEvent.aliases[listener.type]);
      } else {
        this.add_native_listener(listener.type);
      }
    }
    return NodEventDispatcher.__super__.add_listener.apply(this, arguments);
  };

  NodEventDispatcher.prototype.remove_type = function(type) {
    if (NodEvent.has_alias(type)) {
      this.remove_native_listener(NodEvent.aliases[type]);
    } else {
      this.remove_native_listener(type);
    }
    return NodEventDispatcher.__super__.remove_type.apply(this, arguments);
  };

  NodEventDispatcher.prototype.remove_all = function() {
    var fn, list, ref, type;
    ref = this.listeners;
    fn = (function(_this) {
      return function() {
        if (NodEvent.has_alias(type)) {
          return _this.remove_native_listener(NodEvent.aliases[type]);
        } else {
          return _this.remove_native_listener(type);
        }
      };
    })(this);
    for (type in ref) {
      if (!hasProp.call(ref, type)) continue;
      list = ref[type];
      fn();
    }
    return NodEventDispatcher.__super__.remove_all.apply(this, arguments);
  };

  return NodEventDispatcher;

})(EventDispatcher);

exports.NodEventDispatcher = NodEventDispatcher;

_prop_hash = function(method, callback) {
  return Nod.prototype[method] = function(prop, val) {
    var k, p;
    if (typeof prop !== "object") {
      return callback.call(this, prop, val);
    }
    for (k in prop) {
      if (!hasProp.call(prop, k)) continue;
      p = prop[k];
      callback.call(this, k, p);
    }
  };
};

_geometry_styles = function(sty) {
  var fn, j, len, s;
  fn = function() {
    var name;
    name = s;
    Nod.prototype[name] = function(val) {
      if (val === void 0) {
        return this.node["offset" + (utils.capitalize(name))];
      }
      this._with_raf(name, (function(_this) {
        return function() {
          _this.node.style[name] = val + "px";
          if (name === 'width' || name === 'height') {
            return _this.trigger('resize');
          }
        };
      })(this));
      return this;
    };
  };
  for (j = 0, len = sty.length; j < len; j++) {
    s = sty[j];
    fn();
  }
};

_fragment = function(html) {
  var f, temp;
  temp = document.createElement('div');
  temp.innerHTML = html;
  f = document.createDocumentFragment();
  while (temp.firstChild) {
    f.appendChild(temp.firstChild);
  }
  return f;
};

_node = function(n) {
  if (n instanceof Nod) {
    return n.node;
  }
  if (typeof n === "string") {
    return _fragment(n);
  }
  return n;
};

_data_reg = /^data-\w[\w\-]*$/;

_from_dataCase = function(str) {
  var words;
  words = str.split('-');
  return words.join('_');
};

_dataset = (function() {
  if (typeof DOMStringMap === "undefined") {
    return function(node) {
      var attr, dataset, j, len, ref;
      dataset = {};
      if (node.attributes != null) {
        ref = node.attributes;
        for (j = 0, len = ref.length; j < len; j++) {
          attr = ref[j];
          if (_data_reg.test(attr.name)) {
            dataset[_from_dataCase(attr.name.slice(5))] = utils.serialize(attr.value);
          }
        }
      }
      return dataset;
    };
  } else {
    return function(node) {
      var dataset, key, ref, val;
      dataset = {};
      ref = node.dataset;
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        val = ref[key];
        dataset[utils.snake_case(key)] = utils.serialize(val);
      }
      return dataset;
    };
  }
})();

_raf = window.requestAnimationFrame != null ? window.requestAnimationFrame : function(callback) {
  return utils.after(0, callback);
};

_caf = window.cancelAnimationFrame != null ? window.cancelAnimationFrame : utils.pass;

_store = {};

Nod = (function(superClass) {
  extend(Nod, superClass);

  Nod.store = function(nod, overwrite) {
    var node;
    if (overwrite == null) {
      overwrite = false;
    }
    node = nod.node;
    if (node._nod && _store[node._nod] && !overwrite) {
      return;
    }
    node._nod = utils.uid("nod");
    return _store[node._nod] = nod;
  };

  Nod.fetch = function(id) {
    return id && _store[id];
  };

  Nod["delete"] = function(nod) {
    var ref;
    return delete _store[(ref = nod.node) != null ? ref._nod : void 0];
  };

  Nod.create = function(node) {
    switch (false) {
      case !!node:
        return null;
      case !(node instanceof this):
        return node;
      case !(typeof node["_nod"] !== "undefined"):
        return Nod.fetch(node._nod);
      case !utils.is_html(node):
        return this._create_html(node);
      case typeof node !== "string":
        return new this(document.createElement(node));
      default:
        return new this(node);
    }
  };

  Nod._create_html = function(html) {
    var node, temp;
    temp = _fragment(html);
    node = temp.firstChild;
    temp.removeChild(node);
    return new this(node);
  };

  function Nod(node1) {
    this.node = node1;
    Nod.__super__.constructor.apply(this, arguments);
    if (this.node == null) {
      throw Error("Node is undefined!");
    }
    this._disposed = false;
    this._data = _dataset(this.node);
    Nod.store(this);
  }

  Nod.prototype.find = function(selector) {
    return Nod.create(this.node.querySelector(selector));
  };

  Nod.prototype.all = function(selector) {
    return this.node.querySelectorAll(selector);
  };

  Nod.prototype.each = function(selector, callback) {
    var i, j, len, node, ref, results;
    i = 0;
    ref = this.node.querySelectorAll(selector);
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      node = ref[j];
      if (callback.call(null, node, i) === true) {
        break;
      }
      results.push(i++);
    }
    return results;
  };

  Nod.prototype.first = function(selector) {
    return this.find(selector);
  };

  Nod.prototype.last = function(selector) {
    return this.find(selector + ":last-child");
  };

  Nod.prototype.nth = function(selector, n) {
    return this.find(selector + ":nth-child(" + n + ")");
  };

  Nod.prototype.find_bf = function(selector) {
    var acc, el, nod, rest;
    rest = [];
    acc = [];
    el = this.node.firstChild;
    while (el) {
      if (el.nodeType !== 1) {
        el = el.nextSibling || rest.shift();
        continue;
      }
      if (el.matches(selector)) {
        acc.push(el);
        nod = el.querySelector(selector);
        if (nod != null) {
          rest.push(nod);
        }
      } else {
        if ((nod = el.querySelector(selector))) {
          el.nextSibling && rest.unshift(el.nextSibling);
          el = nod;
          continue;
        }
      }
      el = el.nextSibling || rest.shift();
    }
    return acc;
  };

  Nod.prototype.find_cut = function(selector) {
    var acc, el, rest;
    rest = [];
    acc = [];
    el = this.node.firstChild;
    while (el) {
      if (el.nodeType !== 1) {
        el = el.nextSibling || rest.shift();
        continue;
      }
      if (el.matches(selector)) {
        acc.push(el);
      } else {
        el.firstChild && rest.unshift(el.firstChild);
      }
      el = el.nextSibling || rest.shift();
    }
    return acc;
  };

  Nod.prototype.attrs = function(data) {
    var name, val;
    for (name in data) {
      if (!hasProp.call(data, name)) continue;
      val = data[name];
      this.attr(name, val);
    }
    return this;
  };

  Nod.prototype.styles = function(data) {
    var name, val;
    for (name in data) {
      if (!hasProp.call(data, name)) continue;
      val = data[name];
      this.style(name, val);
    }
    return this;
  };

  Nod.prototype.parent = function(selector) {
    var p;
    if (selector == null) {
      if (this.node.parentNode != null) {
        return Nod.create(this.node.parentNode);
      } else {
        return null;
      }
    } else {
      p = this.node;
      while ((p = p.parentNode) && (p !== document)) {
        if (p.matches(selector)) {
          return Nod.create(p);
        }
      }
      return null;
    }
  };

  Nod.prototype.children = function(selector) {
    var j, len, n, ref, results;
    if (selector != null) {
      ref = this.node.children;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        n = ref[j];
        if (n.matches(selector)) {
          results.push(n);
        }
      }
      return results;
    } else {
      return this.node.children;
    }
  };

  Nod.prototype.wrap = function() {
    var klasses, wrapper;
    klasses = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    wrapper = Nod.create('div');
    wrapper.addClass.apply(wrapper, klasses);
    this.node.parentNode.insertBefore(wrapper.node, this.node);
    return wrapper.append(this.node);
  };

  Nod.prototype.prepend = function(node) {
    node = _node(node);
    this.node.insertBefore(node, this.node.firstChild);
    return this;
  };

  Nod.prototype.append = function(node) {
    node = _node(node);
    this.node.appendChild(node);
    return this;
  };

  Nod.prototype.insertBefore = function(node) {
    node = _node(node);
    this.node.parentNode.insertBefore(node, this.node);
    return this;
  };

  Nod.prototype.insertAfter = function(node) {
    node = _node(node);
    this.node.parentNode.insertBefore(node, this.node.nextSibling);
    return this;
  };

  Nod.prototype.detach = function() {
    var ref;
    if ((ref = this.node.parentNode) != null) {
      ref.removeChild(this.node);
    }
    return this;
  };

  Nod.prototype.detach_children = function() {
    while (this.node.children.length) {
      this.node.removeChild(this.node.children[0]);
    }
    return this;
  };

  Nod.prototype.remove_children = function() {
    var nod;
    while (this.node.firstChild) {
      if ((nod = Nod.fetch(this.node.firstChild._nod))) {
        nod.remove();
      } else {
        this.node.removeChild(this.node.firstChild);
      }
    }
    return this;
  };

  Nod.prototype.remove = function() {
    this.detach();
    this.remove_children();
    this.dispose();
    return null;
  };

  Nod.prototype.empty = function() {
    this.html('');
    return this;
  };

  Nod.prototype.clone = function() {
    var c, nod;
    c = document.createElement(this.node.nameNode);
    c.innerHTML = this.node.outerHTML;
    nod = new Nod(c.firstChild);
    return utils.extend(nod, this, true, ['listeners', 'listeners_by_type', '__components__', 'native_event_listener', 'node']);
  };

  Nod.prototype.dispose = function() {
    if (this._disposed) {
      return;
    }
    this.off();
    Nod["delete"](this);
    this._disposed = true;
  };

  Nod.prototype.html = function(val) {
    if (val != null) {
      this.node.innerHTML = val;
      return this;
    } else {
      return this.node.innerHTML;
    }
  };

  Nod.prototype.outerHTML = function(val) {
    if (val != null) {
      this.node.outerHTML = val;
      return this;
    } else {
      return this.node.outerHTML;
    }
  };

  Nod.prototype.text = function(val) {
    if (val != null) {
      this.node.textContent = val;
      return this;
    } else {
      return this.node.textContent;
    }
  };

  Nod.prototype.name = function() {
    return this.node.name || this.data('name');
  };

  Nod.prototype.value = function(val) {
    if (val != null) {
      this.node.value = val;
      return this;
    } else {
      return this.node.value;
    }
  };

  Nod.prototype.addClass = function() {
    var c, j, len;
    for (j = 0, len = arguments.length; j < len; j++) {
      c = arguments[j];
      this.node.classList.add(c);
    }
    return this;
  };

  Nod.prototype.removeClass = function() {
    var c, j, len;
    for (j = 0, len = arguments.length; j < len; j++) {
      c = arguments[j];
      this.node.classList.remove(c);
    }
    return this;
  };

  Nod.prototype.toggleClass = function(c) {
    this.node.classList.toggle(c);
    return this;
  };

  Nod.prototype.hasClass = function(c) {
    return this.node.classList.contains(c);
  };

  Nod.prototype.mergeClasses = function(nod) {
    var j, klass, len, ref;
    ref = nod.node.className.split(/\s+/);
    for (j = 0, len = ref.length; j < len; j++) {
      klass = ref[j];
      if (klass) {
        this.addClass(klass);
      }
    }
    return this;
  };

  Nod.prototype.x = function() {
    var node, offset;
    offset = this.node.offsetLeft;
    node = this.node;
    while ((node = node.offsetParent)) {
      offset += node.offsetLeft;
    }
    return offset;
  };

  Nod.prototype.y = function() {
    var node, offset;
    offset = this.node.offsetTop;
    node = this.node;
    while ((node = node.offsetParent)) {
      offset += node.offsetTop;
    }
    return offset;
  };

  Nod.prototype._with_raf = function(name, fun) {
    if (this["__" + name + "_rid"]) {
      _caf(this["__" + name + "_rid"]);
      delete this["__" + name + "_rid"];
    }
    return this["__" + name + "_rid"] = _raf(fun);
  };

  Nod.prototype.move = function(x, y) {
    return this._with_raf('move', (function(_this) {
      return function() {
        return _this.style({
          left: x + "px",
          top: y + "px"
        });
      };
    })(this));
  };

  Nod.prototype.moveX = function(x) {
    return this.left(x);
  };

  Nod.prototype.moveY = function(y) {
    return this.top(y);
  };

  Nod.prototype.scrollX = function(x) {
    return this._with_raf('scrollX', (function(_this) {
      return function() {
        return _this.node.scrollLeft = x;
      };
    })(this));
  };

  Nod.prototype.scrollY = function(y) {
    return this._with_raf('scrollY', (function(_this) {
      return function() {
        return _this.node.scrollTop = y;
      };
    })(this));
  };

  Nod.prototype.position = function() {
    return {
      x: this.x(),
      y: this.y()
    };
  };

  Nod.prototype.offset = function() {
    return {
      x: this.node.offsetLeft,
      y: this.node.offsetTop
    };
  };

  Nod.prototype.size = function(width, height) {
    if (width == null) {
      width = null;
    }
    if (height == null) {
      height = null;
    }
    if (!((width != null) && (height != null))) {
      return {
        width: this.width(),
        height: this.height()
      };
    }
    if (width == null) {
      width = this.width();
    }
    if (height == null) {
      height = this.height();
    }
    this._with_raf('size', (function(_this) {
      return function() {
        _this.node.style.width = width + "px";
        _this.node.style.height = height + "px";
        return _this.trigger('resize');
      };
    })(this));
  };

  Nod.prototype.show = function() {
    return this.node.style.display = "block";
  };

  Nod.prototype.hide = function() {
    return this.node.style.display = "none";
  };

  Nod.prototype.focus = function() {
    this.node.focus();
    return this;
  };

  Nod.prototype.blur = function() {
    this.node.blur();
    return this;
  };

  return Nod;

})(NodEventDispatcher);

_prop_hash("data", function(prop, val) {
  if (prop === void 0) {
    return this._data;
  }
  prop = prop.replace("-", "_");
  if (val === null) {
    val = this._data[prop];
    delete this._data[prop];
    return val;
  }
  if (val === void 0) {
    return this._data[prop];
  } else {
    this._data[prop] = val;
    return this;
  }
});

_prop_hash("style", function(prop, val) {
  if (val === null) {
    this.node.style[prop] = null;
  } else if (val === void 0) {
    return this.node.style[prop];
  }
  return this.node.style[prop] = val;
});

_prop_hash("attr", function(prop, val) {
  if (val === null) {
    return this.node.removeAttribute(prop);
  } else if (val === void 0) {
    return this.node.getAttribute(prop);
  } else {
    return this.node.setAttribute(prop, val);
  }
});

_geometry_styles(["top", "left", "width", "height"]);

ref = ["width", "height"];
fn = function() {
  var prop;
  prop = "client" + (utils.capitalize(d));
  return Nod.prototype[prop] = function() {
    return this.node[prop];
  };
};
for (j = 0, len = ref.length; j < len; j++) {
  d = ref[j];
  fn();
}

ref1 = ["top", "left", "width", "height"];
fn1 = function() {
  var prop;
  prop = "scroll" + (utils.capitalize(d));
  return Nod.prototype[prop] = function() {
    return this.node[prop];
  };
};
for (l = 0, len1 = ref1.length; l < len1; l++) {
  d = ref1[l];
  fn1();
}

exports.Nod = Nod;

Nod.Root = (function(superClass) {
  extend(Root, superClass);

  Root.instance = null;

  function Root() {
    if (Nod.Root.instance) {
      throw "Nod.Root is already defined!";
    }
    Nod.Root.instance = this;
    Root.__super__.constructor.call(this, document.documentElement);
  }

  Root.prototype.initialize = function() {
    var _ready_state, load_handler, ready_handler;
    _ready_state = document.attachEvent ? 'complete' : 'interactive';
    this._loaded = document.readyState === 'complete';
    if (!this._loaded) {
      this._loaded_callbacks = [];
      load_handler = (function(_this) {
        return function() {
          utils.debug('DOM loaded');
          _this._loaded = true;
          _this.fire_all();
          return NodEvent.remove(window, 'load', load_handler);
        };
      })(this);
      NodEvent.add(window, 'load', load_handler);
    }
    if (!this._ready) {
      if (document.addEventListener) {
        this._ready = document.readyState === _ready_state;
        if (this._ready) {
          return;
        }
        this._ready_callbacks = [];
        ready_handler = (function(_this) {
          return function() {
            utils.debug('DOM ready');
            _this._ready = true;
            _this.fire_ready();
            return document.removeEventListener('DOMContentLoaded', ready_handler);
          };
        })(this);
        return document.addEventListener('DOMContentLoaded', ready_handler);
      } else {
        this._ready = document.readyState === _ready_state;
        if (this._ready) {
          return;
        }
        this._ready_callbacks = [];
        ready_handler = (function(_this) {
          return function() {
            if (document.readyState === _ready_state) {
              utils.debug('DOM ready');
              _this._ready = true;
              _this.fire_ready();
              return document.detachEvent('onreadystatechange', ready_handler);
            }
          };
        })(this);
        return document.attachEvent('onreadystatechange', ready_handler);
      }
    }
  };

  Root.prototype.ready = function(callback) {
    if (this._ready) {
      return callback.call(null);
    } else {
      return this._ready_callbacks.push(callback);
    }
  };

  Root.prototype.loaded = function(callback) {
    if (this._loaded) {
      return callback.call(null);
    } else {
      return this._loaded_callbacks.push(callback);
    }
  };

  Root.prototype.fire_all = function() {
    var callback;
    if (this._ready_callbacks) {
      this.fire_ready();
    }
    while (callback = this._loaded_callbacks.shift()) {
      callback.call(null);
    }
    return this._loaded_callbacks = null;
  };

  Root.prototype.fire_ready = function() {
    var callback;
    while (callback = this._ready_callbacks.shift()) {
      callback.call(null);
    }
    return this._ready_callbacks = null;
  };

  Root.prototype.scrollTop = function() {
    return this.node.scrollTop || document.body.scrollTop;
  };

  Root.prototype.scrollLeft = function() {
    return this.node.scrollLeft || document.body.scrollLeft;
  };

  Root.prototype.scrollHeight = function() {
    return this.node.scrollHeight;
  };

  Root.prototype.scrollWidth = function() {
    return this.node.scrollWidth;
  };

  Root.prototype.height = function() {
    return window.innerHeight || this.node.clientHeight;
  };

  Root.prototype.width = function() {
    return window.innerWidth || this.node.clientWidth;
  };

  return Root;

})(Nod);

Nod.Win = (function(superClass) {
  extend(Win, superClass);

  Win.instance = null;

  function Win() {
    if (Nod.Win.instance) {
      throw "Nod.Win is already defined!";
    }
    Nod.Win.instance = this;
    this.delegate_to(Nod.root, 'scrollLeft', 'scrollTop', 'scrollWidth', 'scrollHeight');
    Win.__super__.constructor.call(this, window);
  }

  Win.prototype.scrollY = function(y) {
    var x;
    x = this.scrollLeft();
    return this._with_raf('scrollY', (function(_this) {
      return function() {
        return _this.node.scrollTo(x, y);
      };
    })(this));
  };

  Win.prototype.scrollX = function(x) {
    var y;
    y = this.scrollTop();
    return this._with_raf('scrollX', (function(_this) {
      return function() {
        return _this.node.scrollTo(x, y);
      };
    })(this));
  };

  Win.prototype.width = function() {
    return this.node.innerWidth;
  };

  Win.prototype.height = function() {
    return this.node.innerHeight;
  };

  Win.prototype.x = function() {
    return 0;
  };

  Win.prototype.y = function() {
    return 0;
  };

  return Win;

})(Nod);

_win = null;

_body = null;

Object.defineProperties(Nod, {
  win: {
    get: function() {
      return _win || (_win = new Nod.Win());
    }
  },
  body: {
    get: function() {
      return _body || (_body = new Nod(document.body));
    }
  }
});

module.exports = exports;



},{"./events":36,"./utils":46}],41:[function(require,module,exports){
'use strict';
var Arr, utils,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

utils = require('./base');

Arr = (function() {
  function Arr() {}

  Arr.sort = function(arr, sort_params) {
    return arr.sort(utils.curry(utils.keys_compare, [sort_params], utils, true));
  };

  Arr.sort_by = function(arr, key, order) {
    if (order == null) {
      order = 'asc';
    }
    return arr.sort(utils.curry(utils.key_compare, [key, order], utils, true));
  };

  Arr.uniq = function(arr) {
    var el, k, len1, res;
    res = [];
    for (k = 0, len1 = arr.length; k < len1; k++) {
      el = arr[k];
      if ((indexOf.call(res, el) < 0)) {
        res.push(el);
      }
    }
    return res;
  };

  Arr.shuffle = function(arr) {
    var _, i, j, k, len, len1, res;
    len = arr.length;
    res = Array(len);
    for (i = k = 0, len1 = arr.length; k < len1; i = ++k) {
      _ = arr[i];
      j = utils.random(0, i);
      if (i !== j) {
        res[i] = res[j];
      }
      res[j] = arr[i];
    }
    return res;
  };

  Arr.sample = function(arr, size) {
    var len;
    if (size == null) {
      size = 1;
    }
    len = arr.length;
    if (size === 1) {
      return arr[utils.random(len - 1)];
    }
    return this.shuffle(arr).slice(0, +(size - 1) + 1 || 9e9);
  };

  return Arr;

})();

module.exports = Arr;



},{"./base":42}],42:[function(require,module,exports){
'use strict';
var _uniq_id, fn, i, len, method, ref, utils,
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

_uniq_id = 100;

utils = (function() {
  function utils() {}

  utils.email_rxp = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;

  utils.digital_rxp = /^[\d\s-\(\)]+$/;

  utils.html_rxp = /^\s*<[\s\S]+>\s*$/m;

  utils.esc_rxp = /[-[\]{}()*+?.,\\^$|#]/g;

  utils.clickable_rxp = /^(a|button|input|textarea)$/i;

  utils.input_rxp = /^(input|select|textarea)$/i;

  utils.notsnake_rxp = /((?:^[^A-Z]|[A-Z])[^A-Z]*)/g;

  utils.str_rxp = /(^'|'$)/g;

  utils.html_entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };

  utils.html_entities_rxp = /[&<>"']/g;

  utils.uid = function(pref) {
    return (pref || "") + (++_uniq_id);
  };

  utils.random = function(min, max) {
    var ref;
    if (max == null) {
      max = null;
    }
    if (max == null) {
      ref = [min, 0], max = ref[0], min = ref[1];
    }
    return min + (Math.random() * (max - min + 1)) | 0;
  };

  utils.escapeRegexp = function(str) {
    return str.replace(this.esc_rxp, "\\$&");
  };

  utils.escapeHTML = function(str) {
    if (!str) {
      return str;
    }
    return ('' + str).replace(this.html_entities_rxp, (function(_this) {
      return function(match) {
        return _this.html_entities[match];
      };
    })(this));
  };

  utils.is_digital = function(str) {
    return this.digital_rxp.test(str);
  };

  utils.is_email = function(str) {
    return this.email_rxp.test(str);
  };

  utils.is_html = function(str) {
    return this.html_rxp.test(str);
  };

  utils.is_clickable = function(node) {
    return this.clickable_rxp.test(node.nodeName);
  };

  utils.is_input = function(node) {
    return this.input_rxp.test(node.nodeName);
  };

  utils.camelCase = function(string) {
    var word;
    string = string + "";
    if (string.length) {
      return ((function() {
        var i, len, ref, results;
        ref = string.split('_');
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          word = ref[i];
          results.push(this.capitalize(word));
        }
        return results;
      }).call(this)).join('');
    } else {
      return string;
    }
  };

  utils.snake_case = function(string) {
    var matches, word;
    string = string + "";
    if (string.length) {
      matches = string.match(this.notsnake_rxp);
      return ((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = matches.length; i < len; i++) {
          word = matches[i];
          results.push(word.toLowerCase());
        }
        return results;
      })()).join('_');
    } else {
      return string;
    }
  };

  utils.capitalize = function(word) {
    return word[0].toUpperCase() + word.slice(1);
  };

  utils.serialize = function(val) {
    return val = (function() {
      switch (false) {
        case !(val == null):
          return null;
        case val !== 'null':
          return null;
        case val !== 'undefined':
          return void 0;
        case val !== 'true':
          return true;
        case val !== 'false':
          return false;
        case val !== '':
          return '';
        case !(isNaN(Number(val)) && typeof val === 'string'):
          return (val + "").replace(this.str_rxp, '');
        case !isNaN(Number(val)):
          return val;
        default:
          return Number(val);
      }
    }).call(this);
  };

  utils.squish = function(str) {
    return ('' + str).replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' ');
  };

  utils.key_compare = function(a, b, key, order) {
    var reverse;
    reverse = order === 'asc';
    a = this.serialize(a[key]);
    b = this.serialize(b[key]);
    if (a === b) {
      return 0;
    }
    if (!a || a < b) {
      return 1 + (-2 * reverse);
    } else {
      return -(1 + (-2 * reverse));
    }
  };

  utils.keys_compare = function(a, b, params) {
    var fn, i, key, len, order, param, r;
    r = 0;
    for (i = 0, len = params.length; i < len; i++) {
      param = params[i];
      fn = (function(_this) {
        return function(key, order) {
          var r_;
          r_ = _this.key_compare(a, b, key, order);
          if (r === 0) {
            return r = r_;
          }
        };
      })(this);
      for (key in param) {
        if (!hasProp.call(param, key)) continue;
        order = param[key];
        fn(key, order);
      }
    }
    return r;
  };

  utils.clone = function(obj, except) {
    var flags, key, newInstance;
    if (except == null) {
      except = [];
    }
    if ((obj == null) || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof RegExp) {
      flags = '';
      if (obj.global != null) {
        flags += 'g';
      }
      if (obj.ignoreCase != null) {
        flags += 'i';
      }
      if (obj.multiline != null) {
        flags += 'm';
      }
      if (obj.sticky != null) {
        flags += 'y';
      }
      return new RegExp(obj.source, flags);
    }
    if (obj instanceof Element) {
      return obj.cloneNode(true);
    }
    if (typeof obj.clone === 'function') {
      return obj.clone();
    }
    newInstance = new obj.constructor();
    for (key in obj) {
      if ((indexOf.call(except, key) < 0)) {
        newInstance[key] = this.clone(obj[key]);
      }
    }
    return newInstance;
  };

  utils.merge = function(to, from) {
    var key, obj, prop;
    obj = this.clone(to);
    for (key in from) {
      if (!hasProp.call(from, key)) continue;
      prop = from[key];
      obj[key] = prop;
    }
    return obj;
  };

  utils.extend = function(target, data, overwrite, except) {
    var key, prop;
    if (overwrite == null) {
      overwrite = false;
    }
    if (except == null) {
      except = [];
    }
    for (key in data) {
      if (!hasProp.call(data, key)) continue;
      prop = data[key];
      if (((target[key] == null) || overwrite) && !(indexOf.call(except, key) >= 0)) {
        target[key] = prop;
      }
    }
    return target;
  };

  utils.extract_to = function(data, source, param) {
    var el, fn, i, j, key, len, len1, p, vals;
    if (source == null) {
      return;
    }
    if (Array.isArray(source)) {
      fn = (function(_this) {
        return function(el) {
          var el_data;
          el_data = {};
          _this.extract_to(el_data, el, param);
          return data.push(el_data);
        };
      })(this);
      for (i = 0, len = source.length; i < len; i++) {
        el = source[i];
        fn(el);
      }
      data;
    } else {
      if (typeof param === 'string') {
        if (source[param] != null) {
          data[param] = source[param];
        }
      } else if (Array.isArray(param)) {
        for (j = 0, len1 = param.length; j < len1; j++) {
          p = param[j];
          this.extract_to(data, source, p);
        }
      } else {
        for (key in param) {
          if (!hasProp.call(param, key)) continue;
          vals = param[key];
          if (source[key] == null) {
            return;
          }
          if (Array.isArray(source[key])) {
            data[key] = [];
          } else {
            data[key] = {};
          }
          this.extract_to(data[key], source[key], vals);
        }
      }
    }
    return data;
  };

  utils.extract = function(source, param) {
    var data;
    data = {};
    this.extract_to(data, source, param);
    return data;
  };

  utils.subclass = function(parent) {
    var child, key;
    child = function() {
      return this.constructor.__super__.constructor.apply(this, arguments);
    };
    for (key in parent) {
      if (!hasProp.call(parent, key)) continue;
      child[key] = parent[key];
    }
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
    child.__super__ = parent.prototype;
    return child;
  };

  utils.to_a = function(obj) {
    if (obj == null) {
      return [];
    }
    if (Array.isArray(obj)) {
      return obj;
    } else {
      return [obj];
    }
  };

  utils.debounce = function(period, fun, ths, throttle) {
    var _buf, _wait;
    if (throttle == null) {
      throttle = false;
    }
    _wait = false;
    _buf = null;
    return function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (_wait) {
        _buf = args;
        return;
      }
      (ths || {}).__debounce_id__ = utils.after(period, function() {
        _wait = false;
        if (throttle && (_buf != null)) {
          fun.apply(ths, _buf);
        }
        return _buf = null;
      });
      _wait = true;
      if (_buf == null) {
        return fun.apply(ths, args);
      }
    };
  };

  utils.throttle = function(period, fun, ths) {
    return utils.debounce(period, fun, ths, true);
  };

  utils.curry = function(fun, args, ths, last) {
    if (args == null) {
      args = [];
    }
    if (last == null) {
      last = false;
    }
    fun = "function" === typeof fun ? fun : ths[fun];
    args = utils.to_a(args);
    return function() {
      var rest;
      rest = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return fun.apply(ths || this, last ? rest.concat(args) : args.concat(rest));
    };
  };

  utils.delayed = function(delay, fun, args, ths) {
    if (args == null) {
      args = [];
    }
    return function() {
      return setTimeout(utils.curry(fun, args, ths), delay);
    };
  };

  utils.after = function(delay, fun, ths) {
    return utils.delayed(delay, fun, [], ths)();
  };

  return utils;

})();

ref = [['truthy', true], ['falsey', false], ['null', null], ['pass', void 0]];
fn = function(method) {
  var name, val;
  name = method[0], val = method[1];
  return utils[name] = function() {
    return val;
  };
};
for (i = 0, len = ref.length; i < len; i++) {
  method = ref[i];
  fn(method);
}

module.exports = utils;



},{}],43:[function(require,module,exports){
'use strict';
var _android_version_rxp, _ios_rxp, _ios_version_rxp, _mac_os_version_rxp, _win_version, _win_version_rxp, browser;

_mac_os_version_rxp = /\bMac OS X ([\d\._]+)\b/;

_win_version_rxp = /\bWindows NT ([\d\.]+)\b/;

_ios_rxp = /(iphone|ipod|ipad)/i;

_ios_version_rxp = /\bcpu\s*(?:iphone\s+)?os ([\d\.\-_]+)\b/i;

_android_version_rxp = /\bandroid[\s\-]([\d\-\._]+)\b/i;

_win_version = {
  '6.3': '8.1',
  '6.2': '8',
  '6.1': '7',
  '6.0': 'Vista',
  '5.2': 'XP',
  '5.1': 'XP'
};

browser = (function() {
  function browser() {}

  browser.scrollbar_width = function() {
    return this._scrollbar_width || (this._scrollbar_width = (function() {
      var outer, outerStyle, w;
      outer = document.createElement('div');
      outerStyle = outer.style;
      outerStyle.position = 'absolute';
      outerStyle.width = '100px';
      outerStyle.height = '100px';
      outerStyle.overflow = "scroll";
      outerStyle.top = '-9999px';
      document.body.appendChild(outer);
      w = outer.offsetWidth - outer.clientWidth;
      document.body.removeChild(outer);
      return w;
    })());
  };

  browser.info = function() {
    if (!this._info) {
      this._info = window.bowser != null ? this._extend_info(window.bowser) : this._extend_info();
    }
    return this._info;
  };

  browser._extend_info = function(data) {
    if (data == null) {
      data = {};
    }
    data.os = this.os();
    return data;
  };

  browser.os = function() {
    return this._os || (this._os = (function() {
      var matches, res, ua;
      res = {};
      ua = window.navigator.userAgent;
      if (ua.indexOf('Windows') > -1) {
        res.windows = true;
        if (matches = _win_version_rxp.exec(ua)) {
          res.version = _win_version[matches[1]];
        }
      } else if (ua.indexOf('Macintosh') > -1) {
        res.macos = true;
        if (matches = _mac_os_version_rxp.exec(ua)) {
          res.version = matches[1];
        }
      } else if (ua.indexOf('X11') > -1) {
        res.unix = true;
      } else if (matches = _ios_rxp.exec(ua)) {
        res[matches[1]] = true;
        if (matches = _ios_version_rxp.exec(ua)) {
          res.version = matches[1];
        }
      } else if (ua.indexOf('Android') > -1) {
        res.android = true;
        if (matches = _android_version_rxp.exec(ua)) {
          res.version = matches[1];
        }
      } else if (ua.indexOf('Tizen') > -1) {
        res.tizen = true;
      } else if (ua.indexOf('Blackberry') > -1) {
        res.blackberry = true;
      }
      if (res.version) {
        res.version = res.version.replace(/(_|\-)/g, ".");
      }
      return res;
    })());
  };

  return browser;

})();

module.exports = browser;



},{}],44:[function(require,module,exports){
'use strict';
var Func, utils,
  slice = [].slice;

utils = require('./base');

Func = (function() {
  function Func() {}

  Func.BREAK = "__BREAK__";

  Func.wrap = function(target, before, after, options) {
    if (options == null) {
      options = {};
    }
    return function() {
      var a, args, b, res, self;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      self = options["this"] || this;
      if (before != null) {
        b = before.apply(self, args);
        if (b && (options.break_if_value === true)) {
          return b;
        }
        if (b === Func.BREAK) {
          return options.break_with;
        }
      }
      res = target.apply(self, args);
      if (after != null) {
        a = after.call(self, res, args, b);
      }
      return res;
    };
  };

  Func.append = function(target, callback, options) {
    if (options == null) {
      options = {};
    }
    return Func.wrap(target, null, callback, options);
  };

  Func.prepend = function(target, callback, options) {
    if (options == null) {
      options = {};
    }
    return Func.wrap(target, callback, null, options);
  };

  Func.unwrap = function(fun, options, ths) {
    if (options == null) {
      options = {};
    }
    if (ths == null) {
      ths = null;
    }
    return function() {
      if (options.debounce != null) {
        return utils.debounce(options.debounce, fun, ths || this);
      }
      if (options.throttle != null) {
        return utils.throttle(options.throttle, fun, ths || this);
      }
      return fun.bind(ths || this);
    };
  };

  return Func;

})();

module.exports = Func;



},{"./base":42}],45:[function(require,module,exports){
'use strict';
var History;

History = (function() {
  function History(limit) {
    this.limit = limit != null ? limit : 10;
    this._storage = [];
    this._position = -1;
  }

  History.prototype.push = function(item) {
    if (this._position < -1) {
      this._storage.splice(this._storage.length + this._position + 1, -this._position + 1);
      this._position = -1;
    }
    this._storage.push(item);
    if (this._storage.length > this.limit) {
      return this._storage.shift();
    }
  };

  History.prototype.prev = function() {
    if (!(-this._position < this._storage.length)) {
      return;
    }
    this._position -= 1;
    return this._storage[this._storage.length + this._position];
  };

  History.prototype.next = function() {
    if (this._position > -2) {
      return;
    }
    this._position += 1;
    return this._storage[this._storage.length + this._position];
  };

  History.prototype.size = function() {
    return this._storage.length;
  };

  History.prototype.clear = function() {
    this._storage.length = 0;
    return this._position = -1;
  };

  return History;

})();

module.exports = History;



},{}],46:[function(require,module,exports){
'use strict'
var utils = require('./base');

utils.arr = require('./arr');
utils.obj = require('./obj');
utils.promise = require('./promise');
utils.func = require('./func');
utils.browser = require('./browser');
utils.time = require('./time');

// logger extends base utils
require('./logger');

utils.matchers = require('./matchers');

module.exports = utils;

},{"./arr":41,"./base":42,"./browser":43,"./func":44,"./logger":47,"./matchers":48,"./obj":49,"./promise":50,"./time":51}],47:[function(require,module,exports){
'use strict';
var _formatter, _log_levels, _show_log, info, level, utils, val,
  slice = [].slice;

utils = require('./base');

require('./browser');

require('./time');

info = utils.browser.info();

_formatter = info.msie ? function(level, args) {
  console.log("[" + level + "]", args);
} : window.mochaPhantomJS ? function(level, args) {} : function(level, messages) {
  console.log("%c " + (utils.time.now('%H:%M:%S:%L')) + " [" + level + "]", "color: " + _log_levels[level].color, messages);
};

if (!window.console || !window.console.log) {
  window.console = {
    log: function() {}
  };
}

utils.log_level || (utils.log_level = "info");

_log_levels = {
  error: {
    color: "#dd0011",
    sort: 4
  },
  debug: {
    color: "#009922",
    sort: 0
  },
  debug_verbose: {
    color: "#eee",
    sort: -1
  },
  info: {
    color: "#1122ff",
    sort: 1
  },
  warning: {
    color: "#ffaa33",
    sort: 2
  }
};

_show_log = function(level) {
  return _log_levels[utils.log_level].sort <= _log_levels[level].sort;
};

utils.log = function() {
  var level, messages;
  level = arguments[0], messages = 2 <= arguments.length ? slice.call(arguments, 1) : [];
  return _show_log(level) && _formatter(level, messages);
};

for (level in _log_levels) {
  val = _log_levels[level];
  utils[level] = utils.curry(utils.log, level);
}

module.exports = utils.log;



},{"./base":42,"./browser":43,"./time":51}],48:[function(require,module,exports){
'use strict';
var Matchers, _key_operand, _operands, utils,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  hasProp = {}.hasOwnProperty;

utils = require('./base');

_operands = {
  "?": function(values) {
    return function(value) {
      return indexOf.call(values, value) >= 0;
    };
  },
  "?&": function(values) {
    return function(value) {
      var i, len, v;
      for (i = 0, len = values.length; i < len; i++) {
        v = values[i];
        if (!(indexOf.call(value, v) >= 0)) {
          return false;
        }
      }
      return true;
    };
  },
  ">": function(val) {
    return function(value) {
      return value >= val;
    };
  },
  "<": function(val) {
    return function(value) {
      return value <= val;
    };
  },
  "~": function(val) {
    if (typeof val === 'string') {
      val = new RegExp(utils.escapeRegexp(val));
    }
    return function(value) {
      return val.test(value);
    };
  }
};

_key_operand = /^([\w\d_]+)(\?&|>|<|~|\?)$/;

Matchers = (function() {
  function Matchers() {}

  Matchers.object = function(obj, all) {
    var fn, key, val;
    if (all == null) {
      all = true;
    }
    fn = (function(_this) {
      return function(key, val) {
        if (val == null) {
          return obj[key] = function(value) {
            return !value;
          };
        } else if (typeof val === "object") {
          return obj[key] = _this.object(val, all);
        } else if (!(typeof val === 'function')) {
          return obj[key] = function(value) {
            return val === value;
          };
        }
      };
    })(this);
    for (key in obj) {
      val = obj[key];
      fn(key, val);
    }
    return function(item) {
      var _any, matcher;
      if (item == null) {
        return false;
      }
      _any = false;
      for (key in obj) {
        matcher = obj[key];
        if (matcher(item[key])) {
          _any = true;
          if (!all) {
            return _any;
          }
        } else {
          if (all) {
            return false;
          }
        }
      }
      return _any;
    };
  };

  Matchers.nod = function(string) {
    var query, ref, regexp, selectors;
    if (string.indexOf(":") > 0) {
      ref = string.split(":"), selectors = ref[0], query = ref[1];
      regexp = new RegExp(query, 'i');
      selectors = selectors.split(',');
      return function(item) {
        var i, len, ref1, selector;
        for (i = 0, len = selectors.length; i < len; i++) {
          selector = selectors[i];
          if (!!((ref1 = item.find(selector)) != null ? ref1.text().match(regexp) : void 0)) {
            return true;
          }
        }
        return false;
      };
    } else {
      regexp = new RegExp(string, 'i');
      return function(item) {
        return !!item.text().match(regexp);
      };
    }
  };

  Matchers.object_ext = function(obj, all) {
    var key, matchers, matches, val;
    if (all == null) {
      all = true;
    }
    matchers = {};
    for (key in obj) {
      if (!hasProp.call(obj, key)) continue;
      val = obj[key];
      if ((val != null) && (typeof val === 'object' && !(Array.isArray(val)))) {
        matchers[key] = this.object_ext(val, all);
      } else {
        if ((matches = key.match(_key_operand))) {
          matchers[matches[1]] = _operands[matches[2]](val);
        } else {
          matchers[key] = val;
        }
      }
    }
    return this.object(matchers, all);
  };

  return Matchers;

})();

module.exports = Matchers;



},{"./base":42}],49:[function(require,module,exports){
'use strict';
var Obj, utils;

utils = require('./base');

Obj = (function() {
  function Obj() {}

  Obj.get_path = function(obj, path) {
    var key, parts, res;
    parts = path.split(".");
    res = obj;
    while (parts.length) {
      key = parts.shift();
      if (res[key] != null) {
        res = res[key];
      } else {
        return;
      }
    }
    return res;
  };

  Obj.set_path = function(obj, path, val) {
    var key, parts, res;
    parts = path.split(".");
    res = obj;
    while (parts.length > 1) {
      key = parts.shift();
      if (res[key] == null) {
        res[key] = {};
      }
      res = res[key];
    }
    return res[parts[0]] = val;
  };

  Obj.get_class_path = function(pckg, path) {
    path = path.split('.').map((function(_this) {
      return function(p) {
        return utils.camelCase(p);
      };
    })(this)).join('.');
    return this.get_path(pckg, path);
  };

  Obj.set_class_path = function(pckg, path, val) {
    path = path.split('.').map((function(_this) {
      return function(p) {
        return utils.camelCase(p);
      };
    })(this)).join('.');
    return this.set_path(pckg, path, val);
  };

  Obj.wrap = function(key, obj) {
    var data;
    data = {};
    data[key] = obj;
    return data;
  };

  Obj.from_arr = function(arr) {
    var _, data, i, j, len;
    data = {};
    for (i = j = 0, len = arr.length; j < len; i = j += 2) {
      _ = arr[i];
      data[arr[i]] = arr[i + 1];
    }
    return data;
  };

  return Obj;

})();

module.exports = Obj;



},{"./base":42}],50:[function(require,module,exports){
'use strict';
var PromiseUtils, utils;

utils = require('./base');

PromiseUtils = (function() {
  function PromiseUtils() {}

  PromiseUtils.resolved = function(data) {
    return new Promise(function(resolve) {
      return resolve(data);
    });
  };

  PromiseUtils.rejected = function(error) {
    return new Promise(function(_, reject) {
      return reject(error);
    });
  };

  PromiseUtils.delayed = function(time, data, rejected) {
    if (rejected == null) {
      rejected = false;
    }
    return new Promise(function(resolve, reject) {
      return utils.after(time, function() {
        if (rejected) {
          return reject(data);
        } else {
          return resolve(data);
        }
      });
    });
  };

  PromiseUtils.as = function(obj) {
    if (PromiseUtils.is(obj)) {
      return obj;
    } else {
      return PromiseUtils.resolved(obj);
    }
  };

  PromiseUtils.is = function(obj) {
    return obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
  };

  return PromiseUtils;

})();

module.exports = PromiseUtils;



},{"./base":42}],51:[function(require,module,exports){
'use strict';
var Time, _formatter, _pad, _reg;

_reg = /%[a-zA-Z]/g;

_pad = function(val, offset) {
  var n;
  if (offset == null) {
    offset = 1;
  }
  n = 10;
  while (offset) {
    if (val < n) {
      val = "0" + val;
    }
    n *= 10;
    offset--;
  }
  return val;
};

_formatter = {
  "H": function(d) {
    return _pad(d.getHours());
  },
  "k": function(d) {
    return d.getHours();
  },
  "I": function(d) {
    return _pad(_formatter.l(d));
  },
  "l": function(d) {
    var h;
    h = d.getHours();
    if (h > 12) {
      return h - 12;
    } else {
      return h;
    }
  },
  "M": function(d) {
    return _pad(d.getMinutes());
  },
  "S": function(d) {
    return _pad(d.getSeconds());
  },
  "L": function(d) {
    return _pad(d.getMilliseconds(), 2);
  },
  "z": function(d) {
    var offset, sign;
    offset = d.getTimezoneOffset();
    sign = offset > 0 ? "-" : "+";
    offset = Math.abs(offset);
    return sign + _pad(Math.floor(offset / 60)) + ":" + _pad(offset % 60);
  },
  "Y": function(d) {
    return d.getFullYear();
  },
  "y": function(d) {
    return (d.getFullYear() + "").slice(2);
  },
  "m": function(d) {
    return _pad(d.getMonth() + 1);
  },
  "d": function(d) {
    return _pad(d.getDate());
  },
  "e": function(d) {
    return d.getDate();
  },
  "P": function(d) {
    if (d.getHours() > 11) {
      return "PM";
    } else {
      return "AM";
    }
  },
  "p": function(d) {
    return _formatter.P(d).toLowerCase();
  }
};

Time = (function() {
  function Time() {}

  Time.add_formatter = function(code, formatter) {
    return _formatter[code] = formatter;
  };

  Time.parse = function(t) {
    if (typeof t === 'number' && t < 4000000000) {
      t *= 1000;
    }
    return new Date(t);
  };

  Time.now = function(fmt) {
    return this.format(new Date(), fmt);
  };

  Time.format = function(t, fmt) {
    t = this.parse(t);
    if (fmt == null) {
      return t;
    }
    return fmt.replace(_reg, function(match) {
      var code;
      code = match.slice(1);
      if (_formatter[code]) {
        return _formatter[code](t);
      } else {
        return match;
      }
    });
  };

  Time.duration = function(val, milliseconds, show_milliseconds) {
    var arr, m, ms, res;
    if (milliseconds == null) {
      milliseconds = false;
    }
    if (show_milliseconds == null) {
      show_milliseconds = false;
    }
    if (milliseconds) {
      ms = val % 1000;
      val = (val / 1000) | 0;
    }
    arr = [];
    m = (val / 60) | 0;
    arr.push((m / 60) | 0);
    arr.push(_pad(m % 60));
    arr.push(_pad(val % 60));
    res = arr.join(":");
    if ((ms != null) && show_milliseconds) {
      res += "." + (_pad(ms, 2));
    }
    return res;
  };

  return Time;

})();

module.exports = Time;



},{}],52:[function(require,module,exports){
'use strict';
var CompiledFun, Compiler, _error, _operators, _view_context_mdf, parser, utils,
  slice = [].slice;

parser = require('./pi_grammar').parser;

utils = require('../core/utils');

_error = function(fun_str) {
  utils.error("Function [" + fun_str + "] was compiled with error");
  return false;
};

_operators = {
  ">": function(a, b) {
    return a > b;
  },
  "<": function(a, b) {
    return a < b;
  },
  "=": function(a, b) {
    return a === b;
  },
  "bool": function(a) {
    return !!a;
  }
};

CompiledFun = (function() {
  function CompiledFun(target1, fun_str1) {
    var e;
    this.target = target1 != null ? target1 : {};
    this.fun_str = fun_str1;
    try {
      this._parsed = parser.parse(fun_str);
    } catch (_error) {
      e = _error;
      this._compiled = utils.curry(_error, [fun_str]);
    }
  }

  CompiledFun.prototype.call = function() {
    var args, ths;
    ths = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return this.apply(ths, args);
  };

  CompiledFun.prototype.apply = function(ths, args) {
    this.call_ths = ths || {};
    return this.compiled().apply(this, args);
  };

  CompiledFun.prototype.compiled = function() {
    return this._compiled || (this._compiled = this._compile_fun());
  };

  CompiledFun.prototype._compile_fun = function() {
    return (function(_this) {
      return function() {
        return _this["_get_" + _this._parsed.code](_this._parsed);
      };
    })(this);
  };

  CompiledFun.prototype._get_chain = function(data) {
    var _target, frst, i, step;
    frst = data.value[0];
    _target = (function() {
      var base;
      switch (frst.name) {
        case 'this':
          return this.target;
        case 'app':
          return pi.app;
        case 'host':
          return this.target.host;
        case 'view':
          return typeof (base = this.target).view === "function" ? base.view() : void 0;
        default:
          return this["_get_" + frst.code](frst, this.call_ths) || this["_get_" + frst.code](frst, window);
      }
    }).call(this);
    i = 1;
    while (i < data.value.length) {
      step = data.value[i++];
      _target = this["_get_" + step.code](step, _target);
    }
    return _target;
  };

  CompiledFun.prototype._get_res = function(data, from) {
    if (from == null) {
      from = {};
    }
    return from[data.name] || window.pi.resources[data.name];
  };

  CompiledFun.prototype._get_prop = function(data, from) {
    return from[data.name];
  };

  CompiledFun.prototype._get_call = function(data, from) {
    return from[data.name].apply(from, this._get_args(data.args));
  };

  CompiledFun.prototype._get_args = function(args) {
    var arg, j, len, results;
    results = [];
    for (j = 0, len = args.length; j < len; j++) {
      arg = args[j];
      results.push(this["_get_" + arg.code](arg));
    }
    return results;
  };

  CompiledFun.prototype._get_if = function(data) {
    var _left, _right;
    _left = data.cond.left;
    _right = data.cond.right;
    _left = this["_get_" + _left.code](_left);
    if (_right != null) {
      _right = this["_get_" + _right.code](_right);
    }
    if (_operators[data.cond.type](_left, _right)) {
      return this["_get_" + data.left.code](data.left);
    } else if (data.right != null) {
      return this["_get_" + data.right.code](data.right);
    } else {
      return false;
    }
  };

  CompiledFun.prototype._get_simple = function(data) {
    return data.value;
  };

  return CompiledFun;

})();

Compiler = (function() {
  function Compiler() {}

  Compiler.modifiers = [];

  Compiler.process_modifiers = function(str) {
    var fun, j, len, ref;
    ref = this.modifiers;
    for (j = 0, len = ref.length; j < len; j++) {
      fun = ref[j];
      str = fun.call(null, str);
    }
    return str;
  };

  Compiler.compile_fun = function(callstr, target) {
    callstr = this.process_modifiers(callstr);
    return new CompiledFun(target, callstr);
  };

  Compiler.str_to_fun = Compiler.compile_fun;

  Compiler.str_to_event_handler = function(callstr, host) {
    var _f;
    _f = this.compile_fun(callstr, host);
    return function(e) {
      return _f.call({
        e: e
      });
    };
  };

  return Compiler;

})();

_view_context_mdf = function(str) {
  return str.replace(/@(this|app|host|view)(\b)/g, '$1$2').replace(/@@/g, 'pi.app.page.context.').replace(/@/g, 'pi.app.view.');
};

Compiler.modifiers.push(_view_context_mdf);

module.exports = Compiler;



},{"../core/utils":46,"./pi_grammar":53}],53:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,6],$V1=[1,16],$V2=[1,17],$V3=[1,11],$V4=[1,12],$V5=[1,13],$V6=[5,11,33],$V7=[2,2],$V8=[2,4],$V9=[1,21],$Va=[1,22],$Vb=[1,23],$Vc=[1,19],$Vd=[5,11,21,28,29,30,32,33],$Ve=[5,11,15,21,28,29,30,32,33],$Vf=[2,12],$Vg=[1,30],$Vh=[19,20,24,25,26],$Vi=[1,37],$Vj=[2,22];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"e":4,"EOF":5,"group_e":6,"ternary":7,"simple_e":8,"(":9,"object":10,")":11,"method_chain":12,"val":13,"method":14,".":15,"resource":16,"key":17,"args":18,"RES":19,"KEY":20,",":21,"key_val":22,":":23,"NUMBER":24,"BOOL":25,"STRING":26,"op":27,"EQL":28,"MORE":29,"LESS":30,"cond":31,"TIF":32,"TELSE":33,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",9:"(",11:")",15:".",19:"RES",20:"KEY",21:",",23:":",24:"NUMBER",25:"BOOL",26:"STRING",28:"EQL",29:"MORE",30:"LESS",32:"TIF",33:"TELSE"},
productions_: [0,[3,2],[4,1],[4,1],[4,1],[4,3],[6,3],[8,1],[8,1],[12,1],[12,3],[14,1],[14,1],[14,4],[16,4],[16,4],[16,1],[17,1],[18,3],[18,3],[18,1],[18,1],[18,0],[10,3],[10,1],[22,3],[13,1],[13,1],[13,1],[27,1],[27,1],[27,1],[31,3],[7,5],[7,5]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1]; 
break;
case 2: case 3: case 4: case 9: case 11: case 24:
this.$ = $$[$0];
break;
case 5:
this.$ = {code: 'simple', value: fn_arr_obj($$[$0-1])};
break;
case 6:
this.$ = $$[$0-1];
break;
case 7:
this.$ = {code: 'chain', value: $$[$0]};
break;
case 8:
this.$ = {code: 'simple', value: $$[$0]};
break;
case 10: case 23:
this.$ = $$[$0-2].concat($$[$0]);
break;
case 12:
this.$ = [{code: 'prop', name: $$[$0]}];
break;
case 13:
this.$ = [{code: 'call', name: $$[$0-3], args: $$[$0-1]}];
break;
case 14:
this.$ = [{code: 'res', name: $$[$0-3]}, {code: 'call', name: 'view', args: [{code: 'simple', value: fn_arr_obj($$[$0-1])}]}];
break;
case 15:
this.$ = [{code: 'res', name: $$[$0-3]}, {code: 'call', name: 'get', args: [{code: 'simple', value: $$[$0-1]}]}];
break;
case 16:
this.$ = [{code: 'res', name: $$[$0]}];
break;
case 17:
this.$ = yytext;
break;
case 18: case 19:
this.$ = [$$[$0-2]].concat($$[$0]);
break;
case 20:
this.$ = [$$[$0]];
break;
case 21:
this.$ = [{code: 'simple', value: fn_arr_obj($$[$0])}];
break;
case 22:
this.$ = [];
break;
case 25:
this.$ = [$$[$0-2],$$[$0]];
break;
case 26:
this.$ = Number(yytext);
break;
case 27:
this.$ = yytext=="true";
break;
case 28:
this.$ = yytext.replace(/(^['"]|['"]$)/g,'');
break;
case 29: case 30: case 31:
this.$ = yytext.replace(/(^\s+|\s+$)/g,'');
break;
case 32:
this.$ = {left: $$[$0-2], right: $$[$0], type: $$[$0-1]};
break;
case 33:
this.$ = {code: 'if', cond: $$[$0-4], left: $$[$0-2], right: $$[$0]};
break;
case 34:
this.$ = {code: 'if', cond: {left: $$[$0-4], type: 'bool'}, left: $$[$0-2], right: $$[$0]};
break;
}
},
table: [{3:1,4:2,6:3,7:4,8:5,9:$V0,12:8,13:9,14:10,16:14,17:15,19:$V1,20:$V2,24:$V3,25:$V4,26:$V5,31:7},{1:[3]},{5:[1,18]},o($V6,$V7),o($V6,[2,3]),o($V6,$V8,{27:20,28:$V9,29:$Va,30:$Vb,32:$Vc}),{4:25,6:3,7:4,8:5,9:$V0,10:24,12:8,13:9,14:10,16:14,17:27,19:$V1,20:$V2,22:26,24:$V3,25:$V4,26:$V5,31:7},{32:[1,28]},o($Vd,[2,7]),o($Vd,[2,8]),o($Vd,[2,9],{15:[1,29]}),o($Vd,[2,26]),o($Vd,[2,27]),o($Vd,[2,28]),o($Ve,[2,11]),o($Ve,$Vf,{9:$Vg}),o($Ve,[2,16],{9:[1,31]}),o([5,9,11,15,21,23,28,29,30,32,33],[2,17]),{1:[2,1]},{4:32,6:3,7:4,8:5,9:$V0,12:8,13:9,14:10,16:14,17:15,19:$V1,20:$V2,24:$V3,25:$V4,26:$V5,31:7},{8:33,12:8,13:9,14:10,16:14,17:15,19:$V1,20:$V2,24:$V3,25:$V4,26:$V5},o($Vh,[2,29]),o($Vh,[2,30]),o($Vh,[2,31]),{11:[1,34]},{11:[1,35]},{11:[2,24],21:[1,36]},o([11,15,21,28,29,30,32],$Vf,{9:$Vg,23:$Vi}),{4:38,6:3,7:4,8:5,9:$V0,12:8,13:9,14:10,16:14,17:15,19:$V1,20:$V2,24:$V3,25:$V4,26:$V5,31:7},{12:39,14:10,16:14,17:15,19:$V1,20:$V2},{4:43,6:41,7:4,8:42,9:$V0,10:44,11:$Vj,12:8,13:9,14:10,16:14,17:27,18:40,19:$V1,20:$V2,22:26,24:$V3,25:$V4,26:$V5,31:7},{10:45,13:46,17:47,20:$V2,22:26,24:$V3,25:$V4,26:$V5},{33:[1,48]},{32:[2,32]},o($V6,[2,5]),o([5,11,21,33],[2,6]),{10:49,17:47,20:$V2,22:26},{13:50,24:$V3,25:$V4,26:$V5},{33:[1,51]},o($Vd,[2,10]),{11:[1,52]},{11:$V7,21:[1,53]},{11:$V8,21:[1,54],27:20,28:$V9,29:$Va,30:$Vb,32:$Vc},{11:[2,20]},{11:[2,21]},{11:[1,55]},{11:[1,56]},{23:$Vi},{4:57,6:3,7:4,8:5,9:$V0,12:8,13:9,14:10,16:14,17:15,19:$V1,20:$V2,24:$V3,25:$V4,26:$V5,31:7},{11:[2,23]},o([11,21],[2,25]),{4:58,6:3,7:4,8:5,9:$V0,12:8,13:9,14:10,16:14,17:15,19:$V1,20:$V2,24:$V3,25:$V4,26:$V5,31:7},o($Ve,[2,13]),{4:43,6:41,7:4,8:42,9:$V0,10:44,11:$Vj,12:8,13:9,14:10,16:14,17:27,18:59,19:$V1,20:$V2,22:26,24:$V3,25:$V4,26:$V5,31:7},{4:43,6:41,7:4,8:42,9:$V0,10:44,11:$Vj,12:8,13:9,14:10,16:14,17:27,18:60,19:$V1,20:$V2,22:26,24:$V3,25:$V4,26:$V5,31:7},o($Ve,[2,14]),o($Ve,[2,15]),o($V6,[2,34]),o($V6,[2,33]),{11:[2,18]},{11:[2,19]}],
defaultActions: {18:[2,1],33:[2,32],43:[2,20],44:[2,21],49:[2,23],59:[2,18],60:[2,19]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

  var fn_arr_obj = function(arr){ 
     var tmp = {};
     for(var i=0,size=arr.length; i<size; i+=2)
       tmp[arr[i]] = arr[i+1];
     return tmp;
  };
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 24
break;
case 2:return 33
break;
case 3:return 23
break;
case 4:return 32
break;
case 5:return '?'
break;
case 6:return 21
break;
case 7:return 9
break;
case 8:return 11
break;
case 9:return 26
break;
case 10:return 26
break;
case 11:return 25
break;
case 12:return 19
break;
case 13:return 20
break;
case 14:return 15
break;
case 15:return 28
break;
case 16:return 29
break;
case 17:return 30
break;
case 18:return 5
break;
case 19:return 'INVALID'
break;
}
},
rules: [/^(?:\s\s+)/,/^(?:[0-9]+(\.[0-9]+)?\b)/,/^(?:\s+:\s+)/,/^(?::\s*)/,/^(?:\s+\?\s+)/,/^(?:\?)/,/^(?:,\s*)/,/^(?:\()/,/^(?:\))/,/^(?:"(\\"|[^\"])*")/,/^(?:'(\\'|[^\'])*')/,/^(?:(true|false))/,/^(?:[A-Z][\w\d]*)/,/^(?:\w[\w\d]*)/,/^(?:\.)/,/^(?:\s*=\s*)/,/^(?:\s*>\s*)/,/^(?:\s*<\s*)/,/^(?:$)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))
},{"_process":80,"fs":78,"path":79}],54:[function(require,module,exports){
'use strict'
var pi = require('./core');

pi.Compiler = require('./grammar/compiler');

pi.components = require('./components');

pi.export(pi.components, "$c");

pi.klass = require('./components/utils/klass');

pi.renderers = require('./renderers');

pi.Plugin = require('./plugins');

pi.Net = require('./net');

pi.resources = require('./resources');

pi.export(pi.resources, "$r");

pi.controllers = require('./controllers');

pi.views = require('./views');

pi.Initializer = require('./components/utils/initializer');
require('./controllers/initializer');

pi.Guesser = require('./components/utils/guesser');

// setup application
pi.$ = require('./components/utils/setup');

// export pi.$ to global scope
pi.export(pi.$, '$')

var App = require('./core/app')

pi.app = new App();

module.exports = (window.pi = pi);

},{"./components":19,"./components/utils/guesser":21,"./components/utils/initializer":22,"./components/utils/klass":23,"./components/utils/setup":24,"./controllers":28,"./controllers/initializer":29,"./core":39,"./core/app":31,"./grammar/compiler":52,"./net":56,"./plugins":62,"./renderers":65,"./resources":70,"./views":77}],55:[function(require,module,exports){
'use strict';
var IframeUpload, Nod, utils;

Nod = require('../core/nod').Nod;

utils = require('../core/utils');

IframeUpload = (function() {
  function IframeUpload() {}

  IframeUpload._build_iframe = function(id) {
    var iframe;
    iframe = Nod.create('iframe');
    iframe.attrs({
      id: id,
      name: id,
      width: 0,
      height: 0,
      border: 0
    });
    iframe.styles({
      width: 0,
      height: 0,
      border: 'none'
    });
    return iframe;
  };

  IframeUpload._build_input = function(name, value) {
    var input;
    input = Nod.create('input');
    input.node.type = 'hidden';
    input.node.name = name;
    input.node.value = value;
    return input;
  };

  IframeUpload._build_form = function(form, iframe, params, url, method) {
    var i, len, param;
    form.attrs({
      target: iframe,
      action: url,
      method: method,
      enctype: "multipart/form-data",
      encoding: "multipart/form-data"
    });
    for (i = 0, len = params.length; i < len; i++) {
      param = params[i];
      form.append(this._build_input(param.name, param.value));
    }
    form.append(this._build_input('__iframe__', iframe));
    return form;
  };

  IframeUpload.upload = function(form, url, params, method) {
    return new Promise((function(_this) {
      return function(resolve) {
        var iframe, iframe_id;
        iframe_id = "iframe_" + (utils.uid());
        iframe = _this._build_iframe(iframe_id);
        form = _this._build_form(form, iframe_id, params, url, method);
        Nod.body.append(iframe);
        iframe.on("load", function() {
          var response;
          if (iframe.node.contentDocument.readyState === 'complete') {
            response = iframe.node.contentDocument.getElementsByTagName("body")[0];
            utils.after(500, function() {
              return iframe.remove();
            });
            iframe.off();
            return resolve(response);
          }
        });
        return form.node.submit();
      };
    })(this));
  };

  return IframeUpload;

})();

module.exports = IframeUpload;



},{"../core/nod":40,"../core/utils":46}],56:[function(require,module,exports){
'use strict'
module.exports = require('./net');

},{"./net":57}],57:[function(require,module,exports){
'use strict';
var IframeUpload, Net, Nod, i, len, method, ref, utils,
  hasProp = {}.hasOwnProperty;

utils = require('../core/utils');

IframeUpload = require('./iframe.upload');

Nod = require('../core/nod').Nod;

Net = (function() {
  function Net() {}

  Net._prepare_response = function(xhr) {
    var response, type;
    type = xhr.getResponseHeader('Content-Type');
    response = /json/.test(type) ? JSON.parse(xhr.responseText) : xhr.responseText;
    utils.debug('XHR response', xhr.responseText);
    return response;
  };

  Net._prepare_error = function(xhr) {
    var response, type;
    type = xhr.getResponseHeader('Content-Type');
    return response = /json/.test(type) ? JSON.parse(xhr.responseText || ("{\"status\":" + xhr.statusText + "}")) : xhr.responseText || xhr.statusText;
  };

  Net._is_app_error = function(status) {
    return status >= 400 && status < 500;
  };

  Net._is_success = function(status) {
    return (status >= 200 && status < 300) || (status === 304);
  };

  Net._with_prefix = function(prefix, key) {
    if (prefix) {
      return prefix + "[" + key + "]";
    } else {
      return key;
    }
  };

  Net._to_params = function(data, prefix) {
    var i, item, key, len, params, val;
    if (prefix == null) {
      prefix = "";
    }
    params = [];
    if (data == null) {
      return params;
    }
    if (typeof data !== 'object') {
      params.push({
        name: prefix,
        value: data
      });
    } else {
      if (data instanceof Date) {
        params.push({
          name: prefix,
          value: data.getTime()
        });
      } else if (data instanceof Array) {
        prefix += "[]";
        for (i = 0, len = data.length; i < len; i++) {
          item = data[i];
          params = params.concat(this._to_params(item, prefix));
        }
      } else if (!!window.File && ((data instanceof File) || (data instanceof Blob))) {
        params.push({
          name: prefix,
          value: data
        });
      } else {
        for (key in data) {
          if (!hasProp.call(data, key)) continue;
          val = data[key];
          params = params.concat(this._to_params(val, this._with_prefix(prefix, key)));
        }
      }
    }
    return params;
  };

  Net._data_to_query = function(data) {
    var i, len, param, q, ref;
    q = [];
    ref = this._to_params(data);
    for (i = 0, len = ref.length; i < len; i++) {
      param = ref[i];
      q.push(param.name + "=" + (encodeURIComponent(param.value)));
    }
    return q.join("&");
  };

  Net._data_to_form = (!!window.FormData ? function(data) {
    var form, i, len, param, ref;
    form = new FormData();
    ref = Net._to_params(data);
    for (i = 0, len = ref.length; i < len; i++) {
      param = ref[i];
      form.append(param.name, param.value);
    }
    return form;
  } : function(data) {
    return Net._data_to_query(data);
  });

  Net.use_json = true;

  Net.headers = [];

  Net.method_override = false;

  Net.request = function(method, url, data, options, xhr) {
    if (options == null) {
      options = {};
    }
    return new Promise((function(_this) {
      return function(resolve, reject) {
        var _headers, key, q, req, use_json, value;
        req = xhr || new XMLHttpRequest();
        use_json = options.json != null ? options.json : _this.use_json;
        _headers = utils.merge(_this.headers, options.headers || {});
        if (method === 'GET') {
          q = _this._data_to_query(data);
          if (q) {
            if (url.indexOf("?") < 0) {
              url += "?";
            } else {
              url += "&";
            }
            url += "" + q;
          }
          data = null;
        } else {
          if (_this.method_override === true) {
            data._method = method;
            _headers['X-HTTP-Method-Override'] = method;
            method = 'POST';
          }
          if (use_json) {
            _headers['Content-Type'] = 'application/json';
            if (data != null) {
              data = JSON.stringify(data);
            }
          } else {
            data = _this._data_to_form(data);
          }
        }
        req.open(method, url, true);
        req.withCredentials = !!options.withCredentials;
        for (key in _headers) {
          if (!hasProp.call(_headers, key)) continue;
          value = _headers[key];
          req.setRequestHeader(key, value);
        }
        _headers = null;
        if (typeof options.progress === 'function') {
          req.upload.onprogress = function(event) {
            value = event.lengthComputable ? event.loaded * 100 / event.total : 0;
            return options.progress(Math.round(value));
          };
        }
        req.onreadystatechange = function() {
          if (req.readyState !== 4) {
            return;
          }
          if (_this._is_success(req.status)) {
            return resolve(_this._prepare_response(req));
          } else if (_this._is_app_error(req.status)) {
            return reject(Error(_this._prepare_error(req)));
          } else {
            return reject(Error('500 Internal Server Error'));
          }
        };
        req.onerror = function() {
          reject(Error("Network Error"));
        };
        return req.send(data);
      };
    })(this));
  };

  Net.upload = function(url, data, options, xhr) {
    var method;
    if (data == null) {
      data = {};
    }
    if (options == null) {
      options = {};
    }
    if (!this.XHR_UPLOAD) {
      throw Error('File upload not supported');
    }
    method = options.method || 'POST';
    options.json = false;
    return this.request(method, url, data, options, xhr);
  };

  Net.iframe_upload = function(form, url, data, options) {
    var as_json, method;
    if (data == null) {
      data = {};
    }
    if (options == null) {
      options = {};
    }
    as_json = options.as_json != null ? options.as_json : this.use_json;
    if (!(form instanceof Nod)) {
      form = Nod.create(form);
    }
    if (form == null) {
      throw Error('Form is undefined');
    }
    method = options.method || 'POST';
    return new Promise((function(_this) {
      return function(resolve, reject) {
        return IframeUpload.upload(form, url, _this._to_params(data), method).then(function(response) {
          var e;
          if (response == null) {
            reject(Error('Response is empty'));
          }
          if (!as_json) {
            resolve(response.innerHtml);
          }
          response = (function() {
            try {
              return JSON.parse(response.innerHTML);
            } catch (_error) {
              e = _error;
              return JSON.parse(response.innerText);
            }
          })();
          return resolve(response);
        })["catch"](function(e) {
          return reject(e);
        });
      };
    })(this));
  };

  return Net;

})();

Net.XHR_UPLOAD = !!window.FormData;

Net.IframeUpload = IframeUpload;

ref = ['get', 'post', 'patch', 'put', 'delete'];
for (i = 0, len = ref.length; i < len; i++) {
  method = ref[i];
  Net[method] = utils.curry(Net.request, [method.toUpperCase()], Net);
}

module.exports = Net;



},{"../core/nod":40,"../core/utils":46,"./iframe.upload":55}],58:[function(require,module,exports){
'use strict'
require('./selectable');
require('./renderable');
require('./restful');
},{"./renderable":59,"./restful":60,"./selectable":61}],59:[function(require,module,exports){
'use strict';
var Base, Plugin, Renderers, _renderer_reg, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Base = require('../../components/base');

Plugin = require('../plugin');

utils = require('../../core/utils');

Renderers = require('../../renderers');

_renderer_reg = /(\w+)(?:\(([\w\-\/]+)\))?/;

Base.Renderable = (function(superClass) {
  extend(Renderable, superClass);

  function Renderable() {
    return Renderable.__super__.constructor.apply(this, arguments);
  }

  Renderable.prototype.id = 'renderable';

  Renderable.included = function(klass) {
    var self;
    self = this;
    return klass.before_initialize(function() {
      return this.attach_plugin(self);
    });
  };

  Renderable.prototype.initialize = function(target) {
    this.target = target;
    Renderable.__super__.initialize.apply(this, arguments);
    this.target._renderer = this.find_renderer();
    this.target.delegate_to(this, 'render');
    return this;
  };

  Renderable.prototype.render = function(data) {
    var nod;
    this.target.remove_children();
    if (data != null) {
      nod = this.target._renderer.render(data, false);
      if (nod != null) {
        this.target.append(nod);
        this.target.piecify(this.target);
      } else {
        utils.error("failed to render data for: " + this.target.pid + "}", data);
      }
    }
    return this.target;
  };

  Renderable.prototype.find_renderer = function() {
    var _, klass, name, param, ref, renderer, tpl;
    if ((this.target.options.renderer != null) && _renderer_reg.test(this.target.options.renderer)) {
      ref = this.target.options.renderer.match(_renderer_reg), _ = ref[0], name = ref[1], param = ref[2];
      klass = Renderers[utils.camelCase(name)];
      if (klass != null) {
        return new klass(param);
      }
    } else if ((tpl = this.target.find('.pi-renderer'))) {
      renderer = new Renderers.Simple(tpl);
      tpl.remove();
      return renderer;
    }
    return new Renderers.Base();
  };

  return Renderable;

})(Plugin);

module.exports = Base.Renderable;



},{"../../components/base":13,"../../core/utils":46,"../../renderers":65,"../plugin":63}],60:[function(require,module,exports){
'use strict';
var Base, Compiler, Plugin, Renderable, ResourceEvent, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Base = require('../../components/base');

Plugin = require('../plugin');

utils = require('../../core/utils');

Renderable = require('./renderable');

Compiler = require('../../grammar/compiler');

ResourceEvent = require('../../resources/events');

utils = require('../../core/utils');

Base.Restful = (function(superClass) {
  extend(Restful, superClass);

  function Restful() {
    return Restful.__super__.constructor.apply(this, arguments);
  }

  Restful.prototype.id = 'restful';

  Restful.prototype.initialize = function(target) {
    var f, promise, rest;
    this.target = target;
    Restful.__super__.initialize.apply(this, arguments);
    this._uid = utils.uid('r');
    if (!this.target.has_renderable) {
      this.target.attach_plugin(Renderable);
    }
    if ((rest = this.target.options.rest) != null) {
      f = Compiler.str_to_fun(rest);
      promise = f.call(this);
      if (!(promise instanceof Promise)) {
        promise = promise ? utils.promise.resolved(promise) : utils.promise.rejected();
      }
      promise.then((function(_this) {
        return function(resource) {
          return _this.bind(resource, _this.target.children().length === 0);
        };
      })(this), (function(_this) {
        return function() {
          return utils.error("resource not found: " + rest, _this.target.options.rest);
        };
      })(this));
    }
    return this;
  };

  Restful.prototype.bind = function(resource, render) {
    if (render == null) {
      render = false;
    }
    if (this.resource) {
      this.resource.off(ResourceEvent.Update, this.resource_update());
      this.resource.off(ResourceEvent.Create, this.resource_update());
    }
    this.resource = resource;
    if (!this.resource) {
      this.target.render(null);
      return;
    }
    this.resource.on([ResourceEvent.Update, ResourceEvent.Create], this.resource_update());
    if (render) {
      return this.target.render(resource);
    }
  };

  Restful.prototype.resource_update = function(e) {
    utils.debug_verbose('Restful component event', e);
    return this.on_update(e.currentTarget);
  };

  Restful.event_handler('resource_update');

  Restful.prototype.on_update = function(data) {
    return this.target.render(data);
  };

  Restful.prototype.dispose = function() {
    return this.bind(null);
  };

  return Restful;

})(Plugin);

module.exports = Base.Restful;



},{"../../components/base":13,"../../core/utils":46,"../../grammar/compiler":52,"../../resources/events":69,"../plugin":63,"./renderable":59}],61:[function(require,module,exports){
'use strict';
var Base, Events, Klass, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Base = require('../../components/base');

Klass = require('../../components/utils/klass');

Events = require('../../components/events');

Plugin = require('../plugin');

utils = require('../../core/utils');

Base.Selectable = (function(superClass) {
  extend(Selectable, superClass);

  function Selectable() {
    return Selectable.__super__.constructor.apply(this, arguments);
  }

  Selectable.prototype.id = 'selectable';

  Selectable.prototype.initialize = function(target) {
    this.target = target;
    Selectable.__super__.initialize.apply(this, arguments);
    Base.active_property(this.target, 'selected', {
      type: 'bool',
      "default": this.target.hasClass(Klass.SELECTED),
      event: Events.Selected,
      "class": Klass.SELECTED,
      functions: ['select', 'deselect'],
      toggle_select: 'toggle_select'
    });
    this.target.on('click', this.click_handler());
    return this;
  };

  Selectable.prototype.click_handler = function(e) {
    if (!this.target.enabled) {
      return;
    }
    this.toggle_select();
    return false;
  };

  Selectable.event_handler('click_handler');

  return Selectable;

})(Plugin);

module.exports = Base.Selectable;



},{"../../components/base":13,"../../components/events":15,"../../components/utils/klass":23,"../../core/utils":46,"../plugin":63}],62:[function(require,module,exports){
'use strict'
var plugin = require('./plugin');
require('./base');
module.exports = plugin;

},{"./base":58,"./plugin":63}],63:[function(require,module,exports){
'use strict';
var Core, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Core = require('../core/core');

utils = require('../core/utils');

Plugin = (function(superClass) {
  extend(Plugin, superClass);

  function Plugin() {
    return Plugin.__super__.constructor.apply(this, arguments);
  }

  Plugin.prototype.id = "";

  Plugin.included = function(klass) {
    var self;
    self = this;
    return klass.after_initialize(function() {
      return this.attach_plugin(self);
    });
  };

  Plugin.attached = function(instance) {
    return (new this()).initialize(instance);
  };

  Plugin.prototype.initialize = function(instance) {
    instance[this.id] = this;
    instance["has_" + this.id] = true;
    instance.addClass("has-" + this.id);
    return this;
  };

  Plugin.prototype.dispose = utils.truthy;

  return Plugin;

})(Core);

module.exports = Plugin;



},{"../core/core":33,"../core/utils":46}],64:[function(require,module,exports){
'use strict';
var Base, BaseComponent, Nod, utils;

Nod = require('../core/nod').Nod;

utils = require('../core/utils');

BaseComponent = require('../components/base');

Base = (function() {
  function Base() {}

  Base.prototype.render = function(nod, piecified, host) {
    if (!(nod instanceof Nod)) {
      return;
    }
    return this._render(nod, nod.data(), piecified, host);
  };

  Base.prototype._render = function(nod, data, piecified, host) {
    if (piecified == null) {
      piecified = true;
    }
    if (!(nod instanceof BaseComponent)) {
      if (piecified) {
        nod = nod.piecify(host);
      }
    }
    nod.record = data;
    return nod;
  };

  return Base;

})();

module.exports = Base;



},{"../components/base":13,"../core/nod":40,"../core/utils":46}],65:[function(require,module,exports){
'use strict'
var Renderers = {};
Renderers.Base = require('./base');
Renderers.Simple = require('./simple');
module.exports = Renderers;

},{"./base":64,"./simple":66}],66:[function(require,module,exports){
'use strict';
var Base, Nod, Simple, _escape_rxp, _escapes, _reg_partials, _reg_simple, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Nod = require('../core/nod').Nod;

utils = require('../core/utils');

Base = require('./base');

_reg_partials = /\{\>\s*([^\}]+?)\s*\}[\s\S]+?\{\<\s*\1\s*\}/g;

_reg_simple = /\{\{([\s\S]+?)\}\}|\{\?([\s\S]+?)\?\}|\{\!([\s\S]+?)\!\}|$/g;

_escape_rxp = /\\|'|\r|\n|\t|\u2028|\u2029/g;

_escapes = {
  "'": "'",
  '\\': '\\',
  '\r': 'r',
  '\n': 'n',
  '\t': 't',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

Simple = (function(superClass) {
  extend(Simple, superClass);

  function Simple(nod) {
    this.create_templater(nod.html());
  }

  Simple.prototype.create_templater = function(text) {
    var e, source;
    source = this._funstr(text, source);
    try {
      this.templater = new Function('__obj', source);
    } catch (_error) {
      e = _error;
      e.source = source;
      throw e;
    }
  };

  Simple.prototype.escape = function(str) {
    if (!str) {
      return str;
    }
    return str.replace(_escape_rxp, function(match) {
      return '\\' + _escapes[match];
    });
  };

  Simple.prototype.to_hash = function(text) {
    return text.split("").reduce((function(a, b) {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }), 0);
  };

  Simple.prototype.parse_conditional = function(str) {
    var index, res;
    res = '';
    index = 0;
    str.replace(/(['"][^'"]*['"])|$/g, (function(_this) {
      return function(match, literal, offset) {
        res += str.slice(index, offset).replace(/\b([a-zA-Z][\w\(\)]*)\b/g, '__obj.$&');
        index = offset + match.length;
        if (literal) {
          res += literal;
        }
        return match;
      };
    })(this));
    return res;
  };

  Simple.prototype.render = function(data, piecified, host) {
    var nod;
    if (data instanceof Nod) {
      return Simple.__super__.render.apply(this, arguments);
    } else {
      nod = Nod.create(utils.squish(this.templater(data)));
      return this._render(nod, data, piecified, host);
    }
  };

  Simple.prototype._funstr = function(text) {
    var hash, index, source;
    hash = this.to_hash(text);
    index = 0;
    source = '';
    text = text.replace(_reg_partials, (function(_this) {
      return function(partial) {
        var _, content, fun_name, name, partial_source, ref;
        ref = partial.match(/^\{\>\s*(\w+)\s*\}([\s\S]*)\{\<\s*\w+\s*\}$/), _ = ref[0], name = ref[1], content = ref[2];
        partial_source = _this._funstr(content.trim());
        fun_name = "_" + name + "_" + (utils.uid('partial'));
        source += "\nfunction " + fun_name + "(__obj, $parent, $i, $key, $val){" + partial_source + "};\n";
        return "{!\n  __ref = __obj." + name + "\n  if(Array.isArray(__ref)){\n    for(var i=0, len=__ref.length;i<len;i++){\n      __p+=" + fun_name + "(__ref[i], __obj, i, null, __ref[i]);\n    }\n  }else if(typeof __ref === 'object' && __ref){\n    for(var k in __ref){\n      if(!__ref.hasOwnProperty(k)) continue;\n      __p+=" + fun_name + "(__ref[k], __obj, null, k, __ref[k]);\n    }\n  }else if(__ref){\n    __p+=" + fun_name + "(__obj);\n  }\n!}";
      };
    })(this));
    source += "\n__p+='";
    text.replace(_reg_simple, (function(_this) {
      return function(match, escape, conditional, evaluation, offset) {
        var _, no_escape, prefix, prop, ref;
        source += _this.escape(text.slice(index, offset));
        if (escape) {
          ref = escape.match(/^(\=)?\s*([\s\S]+?)\s*$/), _ = ref[0], no_escape = ref[1], prop = ref[2];
          prefix = prop.match(/^\$(i|key|val|parent)/) ? '' : '__obj.';
          escape = prefix + prop;
          if (no_escape) {
            source += "'+(((__t = " + escape + ") == void 0) ? '' : __t)+'";
          } else {
            source += "'+(((__t = pi.utils.escapeHTML(" + escape + ")) == void 0) ? '' : __t)+'";
          }
        }
        if (conditional) {
          conditional = conditional.indexOf(":") > 0 ? conditional : conditional + ' : \'\'';
          conditional = utils.squish(conditional);
          source += "'+(((__t = " + (_this.parse_conditional(conditional)) + ") == void 0) ? '' : __t)+'";
        }
        if (evaluation) {
          source += "';\n" + evaluation + ";\n__p+='";
        }
        index = offset + match.length;
        return match;
      };
    })(this));
    source += "';";
    return source = "var __ref,__t,__p='';__obj = __obj || {};\n" + source + "\nreturn __p;\n//# sourceURL=/simpletemplates/source_" + hash + "\";\n";
  };

  return Simple;

})(Base);

module.exports = Simple;



},{"../core/nod":40,"../core/utils":46,"./base":64}],67:[function(require,module,exports){
'use strict';
var Association, Base, ResourceEvent, View, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Base = require('./base');

View = require('./view');

ResourceEvent = require('./events');

utils = require('../core/utils');

Association = (function(superClass) {
  extend(Association, superClass);

  function Association(resources, scope, options1) {
    this.resources = resources;
    this.options = options1 != null ? options1 : {};
    Association.__super__.constructor.apply(this, arguments);
    this._only_update = false;
    this.owner = this.options.owner;
    if (options.belongs_to === true) {
      if (options.owner._persisted) {
        this.owner_name_id = this.options.key;
      } else {
        this._only_update = true;
        this.options.owner.one(ResourceEvent.Create, ((function(_this) {
          return function() {
            var el, i, len, ref, ref1;
            _this._only_update = false;
            _this.owner = _this.options.owner;
            _this.owner_name_id = _this.options.key;
            ref = _this.__all__;
            for (i = 0, len = ref.length; i < len; i++) {
              el = ref[i];
              el.set(utils.obj.wrap(_this.owner_name_id, _this.owner.id), true);
            }
            if (_this.options._scope !== false) {
              if (((ref1 = _this.options._scope) != null ? ref1[_this.options.key] : void 0) != null) {
                _this.options.scope = utils.merge(_this.options._scope, utils.obj.wrap(_this.options.key, _this.owner.id));
              } else {
                _this.options.scope = utils.obj.wrap(_this.options.key, _this.owner.id);
              }
              return _this.reload();
            }
          };
        })(this)));
      }
    } else {
      if (!this.options.scope) {
        this._only_update = true;
      }
    }
  }

  Association.prototype.clear_all = function() {
    if (this.options.route) {
      this.owner[this.options.name + "_loaded"] = false;
    }
    return Association.__super__.clear_all.apply(this, arguments);
  };

  Association.prototype.reload = function() {
    this.clear_all();
    if (this.options.scope) {
      this._filter = utils.matchers.object_ext(this.options.scope);
      return this.load(this.options.source.where(this.options.scope));
    }
  };

  Association.prototype.build = function(data, silent, params) {
    if (data == null) {
      data = {};
    }
    if (silent == null) {
      silent = false;
    }
    if (params == null) {
      params = {};
    }
    if (this.options.belongs_to === true) {
      if (data[this.owner_name_id] == null) {
        data[this.owner_name_id] = this.owner.id;
      }
      if (!(data instanceof Base)) {
        data = this.resources.build(data, false);
      }
    }
    return Association.__super__.build.call(this, data, silent, params);
  };

  Association.prototype.on_update = function(el) {
    if (this.get(el.id)) {
      if (this.options.copy === false) {
        return this.trigger(ResourceEvent.Update, this._wrap(el));
      } else {
        return Association.__super__.on_update.apply(this, arguments);
      }
    } else if (this._only_update === false) {
      return this.build(el);
    }
  };

  Association.prototype.on_destroy = function(el) {
    if (this.options.copy === false) {
      this.trigger(ResourceEvent.Destroy, this._wrap(el));
      return this.remove(el, true, false);
    } else {
      return Association.__super__.on_destroy.apply(this, arguments);
    }
  };

  Association.prototype.on_create = function(el) {
    var view_item;
    if ((view_item = this.get(el.id) || this.get(el.__tid__))) {
      this.created(view_item, el.__tid__);
      if (this.options.copy === false) {
        return this.trigger(ResourceEvent.Create, this._wrap(el));
      } else {
        return view_item.set(el.attributes());
      }
    } else if (!this._only_update) {
      return this.build(el);
    }
  };

  Association.prototype.on_load = function() {
    if (this._only_update) {
      return;
    }
    if (this.options.scope) {
      this.load(this.resources.where(this.options.scope));
      return this.trigger(ResourceEvent.Load, {});
    }
  };

  return Association;

})(View);

utils.extend(Base, {
  view: function(params) {
    var view;
    view = new Association(this, params, {
      scope: params,
      copy: false,
      source: this
    });
    view.reload();
    return view;
  }
});

module.exports = Association;



},{"../core/utils":46,"./base":68,"./events":69,"./view":75}],68:[function(require,module,exports){
'use strict';
var Base, EventDispatcher, ResourceEvent, _singular, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

EventDispatcher = require('../core/events').EventDispatcher;

utils = require('../core/utils');

ResourceEvent = require('./events');

_singular = function(str) {
  return str.replace(/s$/, '');
};

Base = (function(superClass) {
  extend(Base, superClass);

  Base.set_resource = function(plural, singular) {
    this.__all_by_id__ = {};
    this.__all_by_tid__ = {};
    this.__all__ = [];
    this.resources_name = plural;
    return this.resource_name = singular || _singular(plural);
  };

  Base.register_association = function(name) {
    if (this.prototype.__associations__ != null) {
      this.prototype.__associations__ = this.prototype.__associations__.slice();
    } else {
      this.prototype.__associations__ = [];
    }
    return this.prototype.__associations__.push(name);
  };

  Base.load = function(data, silent) {
    var el, elements;
    if (silent == null) {
      silent = false;
    }
    if (data != null) {
      elements = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = data.length; i < len; i++) {
          el = data[i];
          results.push(this.build(el, true));
        }
        return results;
      }).call(this);
      if (!silent) {
        this.trigger(ResourceEvent.Load, {});
      }
      return elements;
    }
  };

  Base.from_data = function(data) {
    if (data[this.resource_name] != null) {
      data[this.resource_name] = this.build(data[this.resource_name]);
    }
    if (data[this.resources_name] != null) {
      return data[this.resources_name] = this.load(data[this.resources_name]);
    }
  };

  Base.clear_all = function() {
    var el, i, len, ref;
    ref = this.__all__;
    for (i = 0, len = ref.length; i < len; i++) {
      el = ref[i];
      el.dispose();
    }
    this.__all_by_id__ = {};
    this.__all_by_tid__ = {};
    return this.__all__.length = 0;
  };

  Base.get = function(id) {
    return this.__all_by_id__[id] || this.__all_by_tid__[id];
  };

  Base.get_by = function(params) {
    var el, i, len, ref;
    if (params == null) {
      return;
    }
    ref = this.__all__;
    for (i = 0, len = ref.length; i < len; i++) {
      el = ref[i];
      if (utils.matchers.object_ext(params)(el)) {
        return el;
      }
    }
    return null;
  };

  Base.add = function(el) {
    if (this.get(el.id)) {
      return;
    }
    if (el.__temp__ === true) {
      this.__all_by_tid__[el.id] = el;
    } else {
      this.__all_by_id__[el.id] = el;
    }
    return this.__all__.push(el);
  };

  Base.build = function(data, silent, add) {
    var el;
    if (data == null) {
      data = {};
    }
    if (silent == null) {
      silent = false;
    }
    if (add == null) {
      add = true;
    }
    if (!(data.id && (el = this.get(data.id)))) {
      if (!data.id) {
        data.id = "tid_" + (utils.uid());
        data.__temp__ = true;
      }
      el = new this(data);
      if (add) {
        this.add(el);
        if (!(silent || el.__temp__)) {
          this.trigger(ResourceEvent.Create, this._wrap(el));
        }
      }
      return el;
    } else {
      return el.set(data, silent);
    }
  };

  Base.created = function(el, temp_id) {
    if (this.__all_by_tid__[temp_id]) {
      delete this.__all_by_tid__[temp_id];
      return this.__all_by_id__[el.id] = el;
    }
  };

  Base.clear_temp = function(silent) {
    var _, el, ref;
    if (silent == null) {
      silent = false;
    }
    ref = this.__all_by_tid__;
    for (_ in ref) {
      if (!hasProp.call(ref, _)) continue;
      el = ref[_];
      this.remove(el, silent);
    }
    return this.__all_by_tid__ = {};
  };

  Base.remove_by_id = function(id, silent) {
    var el;
    el = this.get(id);
    if (el != null) {
      this.remove(el);
    }
    return false;
  };

  Base.remove = function(el, silent, disposed) {
    if (disposed == null) {
      disposed = true;
    }
    if (this.__all_by_id__[el.id] != null) {
      delete this.__all_by_id__[el.id];
    } else {
      delete this.__all_by_tid__[el.id];
    }
    this.__all__.splice(this.__all__.indexOf(el), 1);
    if (!silent) {
      this.trigger(ResourceEvent.Destroy, this._wrap(el));
    }
    if (disposed) {
      el.dispose();
    }
    return true;
  };

  Base.listen = function(callback, filter) {
    return EventDispatcher.Global.on(this.resources_name + "_update", callback, null, filter);
  };

  Base.trigger = function(event, data, changes) {
    data.type = event;
    data.changes = changes;
    return EventDispatcher.Global.trigger(this.resources_name + "_update", data, false);
  };

  Base.off = function(callback) {
    if (callback != null) {
      return EventDispatcher.Global.off(this.resources_name + "_update", callback);
    } else {
      return EventDispatcher.Global.off(this.resources_name + "_update");
    }
  };

  Base.all = function() {
    return this.__all__.slice();
  };

  Base.first = function() {
    return this.__all__[0];
  };

  Base.second = function() {
    return this.__all__[1];
  };

  Base.where = function(params) {
    var el, i, len, ref, results;
    ref = this.__all__;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      el = ref[i];
      if (utils.matchers.object_ext(params)(el)) {
        results.push(el);
      }
    }
    return results;
  };

  Base._wrap = function(el) {
    if (el instanceof Base) {
      return utils.obj.wrap(el.constructor.resource_name, el);
    } else {
      return el;
    }
  };

  function Base(data) {
    if (data == null) {
      data = {};
    }
    Base.__super__.constructor.apply(this, arguments);
    this._snapshot = data;
    this.changes = {};
    if ((data.id != null) && !data.__temp__) {
      this._persisted = true;
    }
    this.initialize(data);
  }

  Base.prototype.initialize = function(data) {
    if (this._initialized) {
      return;
    }
    this.set(data, true);
    return this._initialized = true;
  };

  Base.register_callback('initialize');

  Base.prototype.created = function(temp_id) {
    this.commit();
    this.constructor.created(this, temp_id);
    return this;
  };

  Base.prototype.commit = function() {
    var i, key, len, params, ref;
    ref = this.changes;
    for (params = i = 0, len = ref.length; i < len; params = ++i) {
      key = ref[params];
      this._snapshot[key] = params[1];
    }
    this.changes = {};
    return this._snapshot;
  };

  Base.prototype.dispose = function() {
    var _, key;
    if (this.disposed) {
      return;
    }
    for (key in this) {
      if (!hasProp.call(this, key)) continue;
      _ = this[key];
      delete this[key];
    }
    this.disposed = true;
    return this;
  };

  Base.register_callback('dispose', {
    as: 'destroy'
  });

  Base.prototype.remove = function(silent) {
    if (silent == null) {
      silent = false;
    }
    return this.constructor.remove(this, silent);
  };

  Base.prototype.attributes = function() {
    var key, ref, res, val;
    res = {};
    ref = this._snapshot;
    for (key in ref) {
      val = ref[key];
      if (!this.changes[key]) {
        res[key] = val;
      } else {
        res[key] = this.changes[key][1];
      }
    }
    return res;
  };

  Base.prototype.association = function(name) {
    var ref;
    return ((ref = this.__associations__) != null ? ref.indexOf(name) : void 0) > -1;
  };

  Base.prototype.set = function(params, silent) {
    var _changed, _old_id, _was_id, key, type, val;
    _changed = false;
    _was_id = !!this.id && !(this.__temp__ === true);
    _old_id = this.id;
    for (key in params) {
      if (!hasProp.call(params, key)) continue;
      val = params[key];
      if (this[key] !== val && !(typeof this[key] === 'function') && !((this.__associations__ != null) && (indexOf.call(this.__associations__, key) >= 0))) {
        _changed = true;
        this.changes[key] = [this[key], val];
        this[key] = val;
      }
    }
    if ((this.id | 0) && !_was_id) {
      delete this.__temp__;
      this._persisted = true;
      this.__tid__ = _old_id;
      type = ResourceEvent.Create;
      this.created(_old_id);
    } else {
      type = ResourceEvent.Update;
    }
    if (_changed && !silent) {
      this.trigger(type, (type === ResourceEvent.Create ? this : this.changes));
    }
    return this;
  };

  Base.register_callback('set', {
    as: 'update'
  });

  Base.prototype.trigger = function(e, data, bubbles) {
    if (bubbles == null) {
      bubbles = false;
    }
    Base.__super__.trigger.apply(this, arguments);
    return this.constructor.trigger(e, this.constructor._wrap(this), data);
  };

  Base.prototype.trigger_assoc_event = function(name, type, data) {
    if (typeof this["on_" + name + "_update"] === 'function') {
      this["on_" + name + "_update"].call(this, type, data);
    }
    return this.trigger(ResourceEvent.Update, utils.obj.wrap(name, true));
  };

  return Base;

})(EventDispatcher);

Base.Event = ResourceEvent;

module.exports = Base;



},{"../core/events":36,"../core/utils":46,"./events":69}],69:[function(require,module,exports){
'use strict';
var ResourceEvent;

ResourceEvent = {
  Update: 'update',
  Create: 'create',
  Destroy: 'destroy',
  Load: 'load'
};

module.exports = ResourceEvent;



},{}],70:[function(require,module,exports){
'use strict'

var utils = require('../core/utils');

var resources = {};
resources.Base = require('./base');
resources.View = require('./view');
resources.Association = require('./association');
resources.REST = require('./rest');

utils.extend(resources, require('./modules'));

module.exports = resources;

},{"../core/utils":46,"./association":67,"./base":68,"./modules":73,"./rest":74,"./view":75}],71:[function(require,module,exports){
'use strict';
var Association, Base, Core, HasMany, ResourceEvent, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Core = require('../../core/core');

ResourceEvent = require('../events');

utils = require('../../core/utils');

Association = require('../association');

Base = require('../base');

HasMany = (function(superClass) {
  extend(HasMany, superClass);

  function HasMany() {
    return HasMany.__super__.constructor.apply(this, arguments);
  }

  HasMany.has_many = function(name, params) {
    var _old, _update_filter;
    if (params == null) {
      throw Error("Has many require at least 'source' param");
    }
    utils.extend(params, {
      path: ":resources/:id/" + name,
      method: 'get'
    });
    this.register_association(name);
    if (typeof params.update_if === 'function') {
      _update_filter = params.update_if;
    } else if (params.update_if === true) {
      _update_filter = utils.truthy;
    }
    this.prototype[name] = function() {
      var default_scope, options;
      if (this["__" + name + "__"] == null) {
        options = {
          name: name,
          owner: this
        };
        if (params.belongs_to === true) {
          options.key = params.key || (this.constructor.resource_name + "_id");
          if (params.copy == null) {
            options.copy = false;
          }
          options._scope = params.scope;
          default_scope = utils.obj.wrap(options.key, this.id);
          if (params.scope == null) {
            options.scope = this._persisted ? default_scope : false;
          } else {
            options.scope = params.scope;
          }
          if (params.params != null) {
            params.params.push(this.constructor.resource_name + "_id");
          }
        }
        utils.extend(options, params);
        this["__" + name + "__"] = new Association(params.source, options.scope, options);
        if (options.scope !== false) {
          this["__" + name + "__"].load(params.source.where(options.scope));
        }
        if (params.update_if) {
          this["__" + name + "__"].listen((function(_this) {
            return function(e) {
              var data;
              data = e.data[params.source.resources_name] || e.data[params.source.resource_name];
              if (_update_filter(e.data.type, data)) {
                return _this.trigger_assoc_event(name, e.data.type, data);
              }
            };
          })(this));
        }
      }
      return this["__" + name + "__"];
    };
    if (params.route === true) {
      this.routes({
        member: [
          {
            action: "load_" + name,
            path: params.path,
            method: params.method
          }
        ]
      });
      this.prototype["on_load_" + name] = function(data) {
        this[name + "_loaded"] = true;
        if (data[name] != null) {
          return this[name]().load(data[name]);
        }
      };
    }
    this.after_update(function(data) {
      if (data instanceof Base) {
        return;
      }
      if (data[name]) {
        this[name + "_loaded"] = true;
        return this[name]().load(data[name]);
      }
    });
    this.after_initialize(function() {
      return this[name]();
    });
    if (params.destroy === true) {
      this.before_destroy(function() {
        return this[name]().clear_all(true);
      });
    }
    if (params.attribute === true) {
      _old = this.prototype.attributes;
      return this.prototype.attributes = function() {
        var data;
        data = _old.call(this);
        data[name] = this[name]().serialize();
        return data;
      };
    }
  };

  return HasMany;

})(Core);

module.exports = HasMany;



},{"../../core/core":33,"../../core/utils":46,"../association":67,"../base":68,"../events":69}],72:[function(require,module,exports){
'use strict';
var Base, Core, HasOne, ResourceEvent, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Core = require('../../core/core');

ResourceEvent = require('../events');

utils = require('../../core/utils');

Base = require('../base');

HasOne = (function(superClass) {
  extend(HasOne, superClass);

  function HasOne() {
    return HasOne.__super__.constructor.apply(this, arguments);
  }

  HasOne.has_one = function(name, params) {
    var _old, _update_filter, bind_fun, resource_name;
    if (params == null) {
      throw Error("Has one require at least 'source' param");
    }
    params.foreign_key || (params.foreign_key = this.resource_name + "_id");
    resource_name = params.source.resource_name;
    bind_fun = "bind_" + name;
    this.register_association(name);
    if (typeof params.update_if === 'function') {
      _update_filter = params.update_if;
    } else if (params.update_if === true) {
      _update_filter = utils.truthy;
    } else {
      _update_filter = utils.falsey;
    }
    params.source.listen((function(_this) {
      return function(e) {
        var el, i, len, ref, results, target;
        if (!_this.all().length) {
          return;
        }
        e = e.data;
        if (e.type === ResourceEvent.Load) {
          ref = params.source.all();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            el = ref[i];
            if (el[params.foreign_key] && (target = _this.get(el[params.foreign_key])) && target.association(name)) {
              results.push(target[bind_fun](el));
            } else {
              results.push(void 0);
            }
          }
          return results;
        } else {
          el = e[resource_name];
          if (el[params.foreign_key] && (target = _this.get(el[params.foreign_key])) && target.association(name)) {
            if (e.type === ResourceEvent.Destroy) {
              delete _this[name];
            } else if (e.type === ResourceEvent.Create) {
              target[bind_fun](el, true);
            }
            if (_update_filter(e, el)) {
              return target.trigger_assoc_event(name, e.type, utils.obj.wrap(name, _this[name]));
            }
          }
        }
      };
    })(this));
    this.prototype[bind_fun] = function(el, silent) {
      if (silent == null) {
        silent = false;
      }
      if (el == null) {
        return;
      }
      this[name] = el;
      if (this._persisted && !this[name][params.foreign_key]) {
        this[name][params.foreign_key] = this.id;
      }
      if (!(silent || !_update_filter(null, el))) {
        return this.trigger_assoc_event(name, ResourceEvent.Create, utils.obj.wrap(name, this[name]));
      }
    };
    this.after_initialize(function() {
      var el;
      if (this._persisted && (el = params.source.get_by(utils.obj.wrap(params.foreign_key, this.id)))) {
        return this[bind_fun](el, true);
      }
    });
    this.after_update(function(data) {
      var el;
      if (data instanceof Base) {
        return;
      }
      if (this._persisted && !this[name] && (el = params.source.get_by(utils.obj.wrap(params.foreign_key, this.id)))) {
        this[bind_fun](el, true);
      }
      if (data[name]) {
        if (this[name] instanceof Base) {
          return this[name].set(data[name]);
        } else {
          return this[bind_fun](params.source.build(data[name]));
        }
      }
    });
    if (params.destroy === true) {
      this.before_destroy(function() {
        var ref;
        return (ref = this[name]) != null ? ref.remove() : void 0;
      });
    }
    if (params.attribute === true) {
      _old = this.prototype.attributes;
      return this.prototype.attributes = function() {
        var data;
        data = _old.call(this);
        data[name] = this[name].attributes();
        return data;
      };
    }
  };

  return HasOne;

})(Core);

module.exports = HasOne;



},{"../../core/core":33,"../../core/utils":46,"../base":68,"../events":69}],73:[function(require,module,exports){
'use strict'
var modules = {};
modules.HasMany = require('./has_many');
modules.HasOne = require('./has_one');
module.exports = modules;

},{"./has_many":71,"./has_one":72}],74:[function(require,module,exports){
'use strict';
var Base, EventDispatcher, Net, REST, ResourceEvent, _double_slashes_reg, _path_reg, _tailing_slash_reg, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

Base = require('./base');

EventDispatcher = require('../core/events').EventDispatcher;

ResourceEvent = require('./events');

utils = require('../core/utils');

Net = require('../net');

_path_reg = /:\w+/g;

_double_slashes_reg = /\/\//;

_tailing_slash_reg = /\/$/;

REST = (function(superClass) {
  extend(REST, superClass);

  function REST() {
    return REST.__super__.constructor.apply(this, arguments);
  }

  REST._rscope = "/:path";

  REST._globals = {};

  REST.prototype.wrap_attributes = false;

  REST.can_create = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return this.__deps__ = (this.__deps__ || (this.__deps__ = [])).concat(args);
  };

  REST.params = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (!this.prototype.hasOwnProperty("__filter_params__")) {
      this.prototype.__filter_params__ = [];
      this.prototype.__filter_params__.push('id');
    }
    return this.prototype.__filter_params__ = this.prototype.__filter_params__.concat(args);
  };

  REST.set_resource = function(plural, singular) {
    REST.__super__.constructor.set_resource.apply(this, arguments);
    this.routes({
      collection: [
        {
          action: 'show',
          path: ":resources/:id",
          method: "get"
        }, {
          action: 'fetch',
          path: ":resources",
          method: "get"
        }
      ],
      member: [
        {
          action: 'update',
          path: ":resources/:id",
          method: "patch"
        }, {
          action: '__destroy',
          path: ":resources/:id",
          method: "delete"
        }, {
          action: 'create',
          path: ":resources",
          method: "post"
        }
      ]
    });
    return this.prototype["destroy_path"] = ":resources/:id";
  };

  REST.set_globals = function(data) {
    return utils.extend(this._globals, data, true);
  };

  REST.routes = function(data) {
    var fn, i, j, len, len1, ref, ref1, results, spec;
    if (data.collection != null) {
      ref = data.collection;
      fn = (function(_this) {
        return function(spec) {
          _this[spec.action] = function(params) {
            if (params == null) {
              params = {};
            }
            return this._request(spec.path, spec.method, params).then((function(_this) {
              return function(response) {
                var dep, j, len1, ref1;
                if (_this.__deps__ != null) {
                  ref1 = _this.__deps__;
                  for (j = 0, len1 = ref1.length; j < len1; j++) {
                    dep = ref1[j];
                    dep.from_data(response);
                  }
                }
                if (_this["on_" + spec.action] != null) {
                  return _this["on_" + spec.action](response);
                } else {
                  return _this.on_all(response);
                }
              };
            })(this));
          };
          return _this[spec.action + "_path"] = spec.path;
        };
      })(this);
      for (i = 0, len = ref.length; i < len; i++) {
        spec = ref[i];
        fn(spec);
      }
    }
    if (data.member != null) {
      ref1 = data.member;
      results = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        spec = ref1[j];
        results.push((function(_this) {
          return function(spec) {
            _this.prototype[spec.action] = function(params) {
              if (params == null) {
                params = {};
              }
              return this.constructor._request(spec.path, spec.method, utils.merge(params, {
                id: this.id
              }), this).then((function(_this) {
                return function(response) {
                  var dep, k, len2, ref2;
                  if (_this.constructor.__deps__ != null) {
                    ref2 = _this.constructor.__deps__;
                    for (k = 0, len2 = ref2.length; k < len2; k++) {
                      dep = ref2[k];
                      dep.from_data(response);
                    }
                  }
                  if (_this["on_" + spec.action] != null) {
                    return _this["on_" + spec.action](response);
                  } else {
                    return _this.on_all(response);
                  }
                };
              })(this));
            };
            return _this.prototype[spec.action + "_path"] = spec.path;
          };
        })(this)(spec));
      }
      return results;
    }
  };

  REST.routes_namespace = function(scope) {
    return this._rscope = scope;
  };

  REST._interpolate_path = function(path, params, target) {
    var vars;
    path = this._rscope.replace(":path", path).replace(_double_slashes_reg, "/").replace(_tailing_slash_reg, '');
    if (this.prototype.wrap_attributes && (params[this.resource_name] != null) && (typeof params[this.resource_name] === 'object')) {
      vars = utils.extend(params[this.resource_name], params, false, [this.resource_name]);
    } else {
      vars = params;
    }
    return path.replace(_path_reg, (function(_this) {
      return function(match) {
        var part, ref, ref1;
        part = match.slice(1);
        return (ref = (ref1 = vars[part]) != null ? ref1 : target != null ? target[part] : void 0) != null ? ref : _this._globals[part];
      };
    })(this));
  };

  REST.error = function(action, message) {
    return EventDispatcher.Global.trigger("net_error", {
      resource: this.resources_name,
      action: action,
      message: message
    });
  };

  REST._request = function(path, method, params, target) {
    path = this._interpolate_path(path, utils.merge(params, {
      resources: this.resources_name,
      resource: this.resource_name
    }), target);
    return Net[method].call(null, path, params)["catch"]((function(_this) {
      return function(error) {
        _this.error(error.message);
        throw error;
      };
    })(this));
  };

  REST.on_all = function(data) {
    if (data[this.resources_name] != null) {
      data[this.resources_name] = this.load(data[this.resources_name]);
    }
    return data;
  };

  REST.on_show = function(data) {
    var el;
    if (data[this.resource_name] != null) {
      el = this.build(data[this.resource_name]);
      return el;
    }
  };

  REST.find = function(id) {
    var el;
    el = this.get(id);
    if (el != null) {
      return utils.promise.resolved(el);
    } else {
      return this.show({
        id: id
      });
    }
  };

  REST.find_by = function(params) {
    var el;
    el = this.get_by(params);
    if (el != null) {
      return utils.promise.resolved(el);
    } else {
      return this.show(params);
    }
  };

  REST.create = function(data) {
    var el;
    el = this.build(data);
    return el.save();
  };

  REST.path = function(name, params, target) {
    var path_scheme;
    if (params == null) {
      params = {};
    }
    path_scheme = this[name + "_path"] || this.prototype[name + "_path"] || name;
    return this._interpolate_path(path_scheme, params, target);
  };

  REST.prototype.destroy = function() {
    if (this._persisted) {
      return this.__destroy();
    } else {
      return utils.promise.resolved(this.remove());
    }
  };

  REST.prototype.on_destroy = function(data) {
    this.constructor.remove(this);
    return data;
  };

  REST.alias('on___destroy', 'on_destroy');

  REST.prototype.on_all = function(data) {
    var params;
    params = data[this.constructor.resource_name];
    if (params != null) {
      this.set(params);
      return this;
    }
  };

  REST.prototype.on_create = function(data) {
    var params;
    params = data[this.constructor.resource_name];
    if (params != null) {
      this.set(params);
      return this;
    }
  };

  REST.prototype.attributes = function() {
    if (this.__attributes__changed__) {
      if (this.__filter_params__) {
        this.__attributes__ = utils.extract(this, this.__filter_params__);
      } else {
        this.__attributes__ = REST.__super__.attributes.apply(this, arguments);
      }
    }
    return this.__attributes__;
  };

  REST.prototype.set = function() {
    this.__attributes__changed__ = true;
    return REST.__super__.set.apply(this, arguments);
  };

  REST.prototype.save = function(params) {
    var attrs;
    if (params == null) {
      params = {};
    }
    attrs = this.attributes();
    utils.extend(attrs, params, true);
    attrs = this.wrap_attributes ? this._wrap(attrs) : attrs;
    if (this._persisted) {
      return this.update(attrs);
    } else {
      return this.create(attrs);
    }
  };

  REST.prototype.rollback = function() {
    var i, key, len, param, ref;
    ref = this.changes;
    for (param = i = 0, len = ref.length; i < len; param = ++i) {
      key = ref[param];
      this[key] = this._snapshot[key];
    }
    this.changes = {};
    return this;
  };

  REST.register_callback('save');

  REST.prototype.path = function(name, params) {
    return this.constructor.path(name, params, this);
  };

  REST.prototype._wrap = function(attributes) {
    var data;
    data = {};
    data[this.constructor.resource_name] = attributes;
    return data;
  };

  return REST;

})(Base);

module.exports = REST;



},{"../core/events":36,"../core/utils":46,"../net":56,"./base":68,"./events":69}],75:[function(require,module,exports){
'use strict';
var Base, EventDispatcher, ResourceEvent, View, ViewItem, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventDispatcher = require('../core/events').EventDispatcher;

utils = require('../core/utils');

ResourceEvent = require('./events');

Base = require('./base');

ViewItem = (function(superClass) {
  extend(ViewItem, superClass);

  function ViewItem(view, data, options) {
    this.view = view;
    this.options = options != null ? options : {};
    ViewItem.__super__.constructor.apply(this, arguments);
    if ((this.options.params != null) && this.options.params.indexOf('id') < 0) {
      this.options.params.push('id');
    }
    this.changes = {};
    this.set(data, true);
  }

  utils.extend(ViewItem.prototype, Base.prototype, false);

  ViewItem.prototype.created = function(tid) {
    return this.view.created(this, tid);
  };

  ViewItem.prototype.trigger = function(e, data, bubbles) {
    if (bubbles == null) {
      bubbles = true;
    }
    ViewItem.__super__.trigger.apply(this, arguments);
    return this.view.trigger(e, this.view._wrap(this));
  };

  ViewItem.prototype.attributes = function() {
    var data;
    if (this.options.params != null) {
      data = utils.extract(this, this.options.params);
      if (this.options.id_alias != null) {
        if (this.options.id_alias) {
          data[this.options.id_alias] = data.id;
        }
        delete data.id;
      }
      return data;
    } else {
      return Base.prototype.attributes.call(this);
    }
  };

  return ViewItem;

})(EventDispatcher);

View = (function(superClass) {
  extend(View, superClass);

  function View(resources, scope, options) {
    this.resources = resources;
    this.options = options != null ? options : {};
    View.__super__.constructor.apply(this, arguments);
    this.__all_by_id__ = {};
    this.__all_by_tid__ = {};
    this.__all__ = [];
    this.resources_name = this.resources.resources_name;
    this.resource_name = this.resources.resource_name;
    this._filter = (scope != null) && scope !== false ? utils.matchers.object_ext(scope) : utils.truthy;
    this.resources.listen((function(_this) {
      return function(e) {
        var el, name;
        el = e.data[_this.resource_name];
        if (el != null) {
          if (!_this._filter(el)) {
            return;
          }
        }
        return typeof _this[name = "on_" + e.data.type] === "function" ? _this[name](el) : void 0;
      };
    })(this));
  }

  utils.extend(View.prototype, Base);

  View.prototype.on_update = function(el) {
    var view_item;
    if ((view_item = this.get(el.id))) {
      return view_item.set(el.attributes());
    }
  };

  View.prototype.on_destroy = function(el) {
    var view_item;
    if ((view_item = this.get(el.id))) {
      return this.remove(view_item);
    }
  };

  View.prototype.clear_all = function(force) {
    var el, i, j, len, len1, ref, ref1;
    if (force == null) {
      force = false;
    }
    if (!((this.options.copy === false) && (force === false))) {
      if (force && !this.options.copy) {
        this.__all_by_id__ = {};
        this.__all_by_tid__ = {};
        ref = this.__all__;
        for (i = 0, len = ref.length; i < len; i++) {
          el = ref[i];
          el.remove();
        }
      } else {
        ref1 = this.__all__;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          el = ref1[j];
          el.dispose();
        }
      }
    }
    this.__all_by_id__ = {};
    this.__all_by_tid__ = {};
    return this.__all__.length = 0;
  };

  View.prototype.build = function(data, silent, params) {
    var el;
    if (data == null) {
      data = {};
    }
    if (silent == null) {
      silent = false;
    }
    if (params == null) {
      params = {};
    }
    if (!(el = this.get(data.id))) {
      if (data instanceof Base && this.options.copy === false) {
        el = data;
      } else {
        if (data instanceof Base) {
          data = data.attributes();
        }
        utils.extend(data, params, true);
        el = new ViewItem(this, data, this.options);
      }
      if (el.id) {
        this.add(el);
        if (!silent) {
          this.trigger(ResourceEvent.Create, this._wrap(el));
        }
      }
      return el;
    } else {
      return el.set(data, silent);
    }
  };

  View.prototype._wrap = function(el) {
    if (el instanceof ViewItem) {
      return utils.obj.wrap(el.view.resource_name, el);
    } else if (el instanceof Base) {
      return utils.obj.wrap(el.constructor.resource_name, el);
    } else {
      return el;
    }
  };

  View.prototype.serialize = function() {
    var el, i, len, ref, res;
    res = [];
    ref = this.all();
    for (i = 0, len = ref.length; i < len; i++) {
      el = ref[i];
      res.push(el.attributes());
    }
    return res;
  };

  View.prototype.listen = function(callback) {
    return this.on("update", callback);
  };

  View.prototype.trigger = function(event, data) {
    data.type = event;
    return View.__super__.trigger.call(this, "update", data);
  };

  View.prototype.off = function(callback) {
    return View.__super__.off.call(this, "update", callback);
  };

  return View;

})(EventDispatcher);

module.exports = View;



},{"../core/events":36,"../core/utils":46,"./base":68,"./events":69}],76:[function(require,module,exports){
'use strict';
var Base, BaseComponent, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

utils = require('../core/utils');

BaseComponent = require('../components/base');

Base = (function(superClass) {
  extend(Base, superClass);

  function Base() {
    return Base.__super__.constructor.apply(this, arguments);
  }

  Base.prototype.is_view = true;

  Base.prototype.initialize = function() {
    return Base.__super__.initialize.apply(this, arguments);
  };

  Base.prototype.postinitialize = function() {
    this.init_modules();
    return Base.__super__.postinitialize.apply(this, arguments);
  };

  Base.prototype.init_modules = function() {
    var _, mod, ref, results;
    ref = this.options.modules;
    results = [];
    for (mod in ref) {
      _ = ref[mod];
      results.push(this.mixin(this.constructor.lookup_module(mod)));
    }
    return results;
  };

  Base.prototype.loaded = function(data) {};

  Base.prototype.activated = function(data) {};

  Base.prototype.deactivated = function() {};

  Base.prototype.unloaded = function() {};

  return Base;

})(BaseComponent);

utils.extend(BaseComponent.prototype, {
  view: function() {
    return this.__view__ || (this.__view__ = this._find_view());
  },
  context: function() {
    var ref;
    return this.__controller__ || (this.__controller__ = (ref = this.view()) != null ? ref.controller : void 0);
  },
  _find_view: function() {
    var comp;
    comp = this;
    while (comp) {
      if (comp.is_view === true) {
        return comp;
      }
      comp = comp.host;
    }
  }
});

module.exports = Base;



},{"../components/base":13,"../core/utils":46}],77:[function(require,module,exports){
'use strict'
var views = {};
views.Base = require('./base');
module.exports = views;

},{"./base":76}],78:[function(require,module,exports){

},{}],79:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":80}],80:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[4]);
