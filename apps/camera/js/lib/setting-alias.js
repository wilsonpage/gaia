define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var evt = require('vendor/evt');
var on = evt.prototype.on;

/**
 * Exports
 */

module.exports = SettingAlias;

// Mixin emitter
evt(SettingAlias.prototype);

function SettingAlias(options) {
  mixin(this, options);
  this.map = this.map || {};
  this.get = this.get.bind(this);
}

SettingAlias.prototype.value = function() {
  var setting = this.get();
  return setting.value.apply(setting, arguments);
};

SettingAlias.prototype.next = function() {
  var setting = this.get();
  return setting.next.apply(setting, arguments);
};

SettingAlias.prototype.selected = function() {
  var setting = this.get();
  return setting.selected.apply(setting, arguments);
};

SettingAlias.prototype.resetOptions = function() {
  var setting = this.get();
  return setting.resetOptions.apply(setting, arguments);
};

SettingAlias.prototype.on = function(name, fn) {
  on.call(this, name, fn);
  for (var key in this.map) {
    var setting = this.settings[this.map[key]];
    var fire = this.firer(name);
    setting.on(name, fire);
  }
};

function mixin(a, b) {
  for (var key in b) { a[key] = b[key]; }
}

});
