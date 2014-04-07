define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');

/**
 * Exports
 */

module.exports = View.extend({
  name: 'focus-ring',
  className: 'icon',
  setState: function(state) {
    this.el.setAttribute('data-state', state);
  }
});

});
