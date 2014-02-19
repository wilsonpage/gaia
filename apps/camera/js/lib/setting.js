define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('setting');
var storage = require('vendor/cookies');
var model = require('vendor/model');

/**
 * Exports
 */

module.exports = Setting;

// Mixin Model methods
model(Setting.prototype);

/**
 * Initialize a new `Setting` model.
 *
 * @param {Object} data
 */
function Setting(data) {
  this.key = data.key;
  this.configure(data);
  this.reset(data, { silent: true });
  this.updateSelected({ silent: true });
  this.anyOptions = data.options.length === 0;
  this.select = this.select.bind(this);
}

Setting.prototype.configure = function(data) {
  this.options = { filtered: {} };
  this.options.normalize = this.normalizeOptions;
  this.options.config = this.optionsToHash(data.options);
  this.options.filtered.hash = this.options.config;
  this.options.filtered.list = data.options;
  if (data.persistent) { this.on('change:selected', this.save); }
};

Setting.prototype.optionsToHash = function(options) {
  var hash = {};

  options.forEach(function(option, index) {
    var key = option.key;
    option.index = index;
    option.value = 'value' in option ? option.value : key;
    hash[key] = option;
  });

  return options.length && hash;
};

/**
 * Get the selected option,
 * or just a particular key
 * if given.
 *
 * @param  {String} key
 * @return {Object|*}
 */
Setting.prototype.selected = function(key) {
  var selected = this.get('selected');
  var hash = this.options.filtered.hash;
  var option = hash[selected];
  return key ? option && option[key] : option;
};

/**
 * Select an option.
 *
 * Accepts an string key to select,
 * or an integer index relating to
 * the current options list.
 *
 * Options:
 *
 *  - {Boolean} silent
 *
 * @param {String|Number} key
 * @param {Object} opts  Model#set() options
 */
Setting.prototype.select = function(key, options) {
  var isIndex = typeof key === 'number';
  var hash = this.options.filtered.hash;
  var list = this.options.filtered.list;
  var selected = isIndex ? list[key] : hash[key];

  // If there are no options, exit
  if (!list.length) { return; }

  // If an option was not found,
  // default to selecting the first.
  if (!selected) { return this.select(0, options); }

  // Store the new choice
  this.set('selected', selected.key, options);
};

/**
 * Add each matched option key to the
 * new options array.
 *
 * We make these updates silently so that
 * other parts of the app, can make alterations
 * to options before the UI is updated.
 *
 * @param  {Array} options
 */
Setting.prototype.configureOptions = function(options) {
  var filtered = this.options.filtered;
  var silent = { silent: true };

  // Reset
  filtered.hash = {};
  filtered.list = [];

  // Normalize the list passed in.
  options = this.options.normalize(options || []);
  options.filter(this.isValidOption, this).forEach(this.addOption, this);
  filtered.list.sort(function(a, b) { return a.index - b.index; });

  // Store the revised options
  this.set('options', filtered.list, silent);
  this.updateSelected(silent);

  debug('options configured key: %s', this.key);
};

Setting.prototype.normalizeOptions = function(options) {
  var isArray = Array.isArray(options);
  var normalized = [];

  each(options, function(value, key) {
    var option = {};
    option.key = isArray ? (value.key || value) : key;
    option.value = value.value || value;
    normalized.push(option);
  });

  return normalized;
};

Setting.prototype.isValidOption = function(option) {
  return this.options.config[option.key] || !this.options.config;
};

Setting.prototype.addOption = function(option) {
  var config = this.options.config;
  var key = option.key;

  // If an option by this key is found in
  // the config, we use that, else, we take
  // what was given to us.
  var chosen = config && config[key] || option;

  // If the passed option has a value, take it.
  if ('value' in option) { chosen.value = option.value; }

  // Update our lists.
  this.options.filtered.hash[key] = chosen;
  this.options.filtered.list.push(chosen);
};

// NOTE: This could prove to be problematic as
// the selected option may be different to what
// was specified in the app config if the
// length of the list has changed.
//
// Solutions:
//
// 1. The key should be specified instead of an index,
//    but that doesn't give the option for
// 2. The order of the options could define preference,
//    although this could result in incorrectly ordered
//    options in the settings menu.
Setting.prototype.updateSelected = function(options) {
  this.select(this.get('selected') || 0, options);
};

/**
 * Set the `selected` option to
 * the next option in the list.
 *
 * First option is chosen if
 * there is no next option.
 */
Setting.prototype.next = function() {
  var list = this.get('options');
  var selected = this.selected();
  var index = list.indexOf(selected);
  var newIndex = (index + 1) % list.length;
  this.select(newIndex);
  debug('set \'%s\' to index: %s', this.key, newIndex);
};

/**
 * Get the value of the currently
 * selected option.
 *
 * @return {*}
 */
Setting.prototype.value = function() {
  return this.selected('value');
};

/**
 * Persists the current selection
 * to storage for retreval in the
 * next session.
 *
 * @public
 */
Setting.prototype.save = function() {
  var selected = this.get('selected');
  debug('saving key: %s, selected: %s', this.key, selected);
  storage.setItem('setting_' + this.key, selected, Infinity);
  debug('saved key: %s, value: %s', this.key, selected);
};

/**
 * Fetches the persisted selection
 * from storage, updating the
 * `selected` key.
 *
 * Leaving in the `done` callback in-case
 * storage goes async again in future.
 *
 * @param  {Function} done
 * @public
 */
Setting.prototype.fetch = function() {
  if (!this.get('persistent')) { return; }
  debug('fetch value key: %s', this.key);
  var value = storage.getItem('setting_' + this.key);
  debug('fetched %s value: %s', this.key, value);
  if (value) { this.select(value, { silent: true }); }
};

/**
 * Loops arrays or objects.
 *
 * @param  {Array|Object}   obj
 * @param  {Function} fn
 */
function each(obj, fn) {
  if (Array.isArray(obj)) { obj.forEach(fn); }
  else { for (var key in obj) { fn(obj[key], key, true); } }
}

});
