define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('view:timer');
var View = require('vendor/view');

/**
 * Exports
 */

/**
 * Timer
 *
 * @constructor
 */
module.exports = View.extend({
  name:'timer',
  imminent: 3,

  initialize: function() {
    this.render();
  },

  render: function() {
    this.el.innerHTML = this.template();
    this.els.count = this.find('.js-count');
  },

  set: function(time) {
    var isImminent = time <= this.imminent;
    this.els.count.textContent = time;
    this.el.classList.toggle('imminent', isImminent);
    debug('set time: %s, near: %s', time, isImminent);
    return this;
  },

  show: function() {
    this.el.classList.remove('hidden');
    this.el.classList.add('visible');
  },

  hide: function() {
    this.el.classList.remove('visible');
    this.el.classList.add('hidden');
  },

  template: function() {
    return '<div class="timer_count js-count"></div>';
  }
});

});