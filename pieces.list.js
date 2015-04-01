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

Base = pi.components.Base;

ListEvent = require('./events/list_events');

Nod = pi.Nod;

utils = pi.utils;

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



},{"./events/list_events":1,"./utils/klass":3}],3:[function(require,module,exports){
'use strict';
var Klass;

Klass = pi.klass;

Klass.LIST = 'list';

Klass.LIST_ITEM = 'item';

Klass.NESTED_LIST = 'pi-list';

Klass.FILTERED = 'is-filtered';

Klass.SEARCHING = 'is-searhing';

module.exports = Klass;



},{}],4:[function(require,module,exports){
'use strict'
var pi = window.pi;
pi.components.List = require('./components/list');
require('./plugins/list');
module.exports = pi.components.List;

},{"./components/list":2,"./plugins/list":6}],5:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Plugin, _is_continuation, utils,
  hasProp = {}.hasOwnProperty,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Plugin = pi.Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = pi.utils;

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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3}],6:[function(require,module,exports){
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

Plugin = pi.Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = pi.utils;

Selectable = require('./selectable');

Nod = pi.Nod;

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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3,"./selectable":11}],8:[function(require,module,exports){
'use strict';
var Compiler, Events, Klass, List, ListEvent, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = pi.Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = pi.utils;

Events = pi.components.Events;

Compiler = pi.Compiler;

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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3}],9:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Nod, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = pi.Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = pi.utils;

Nod = pi.Nod;

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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3}],10:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Nod, Plugin, _clear_mark_regexp, _is_continuation, _selector_regexp, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = pi.Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = pi.utils;

Nod = pi.Nod;

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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3}],11:[function(require,module,exports){
'use strict';
var Klass, List, ListEvent, Nod, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = pi.Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

Klass = require('../../components/utils/klass');

utils = pi.utils;

Nod = pi.Nod;

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



},{"../../components/events/list_events":1,"../../components/list":2,"../../components/utils/klass":3}],12:[function(require,module,exports){
'use strict';
var List, ListEvent, Plugin, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Plugin = pi.Plugin;

List = require('../../components/list');

ListEvent = require('../../components/events/list_events');

utils = pi.utils;

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



},{"../../components/events/list_events":1,"../../components/list":2}]},{},[4]);
