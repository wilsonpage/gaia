define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var GaiaCameraGrid = require('lib/camera/gaia-camera-grid');
var debug = require('debug')('controller:grid');

/**
 * Exports
 */

module.exports = function(app) { return new GridController(app); };
module.exports.GridController = GridController;

/**
 * Initialize a new `GridController`
 *
 * @param {App} app
 */
function GridController(app) {
  this.app = app;
  this.camera = app.camera;
  this.settings = app.settings;
  this.bindEvents();
  debug('initialized');
}

/**
 * Create and inject the views.
 *
 * @private
 */
GridController.prototype.createView = function() {
  this.grid = new GaiaCameraGrid();
  this.configureGrid();
  this.camera.appendChild(this.grid);
};

/**
 * Bind to relavant events.
 *
 * @private
 */
GridController.prototype.bindEvents = function() {
  this.settings.grid.on('change:selected', () => this.configureGrid());
  this.app.once('camera:configured', () => this.createView());
  this.app.on('settings:closed', () => this.configureGrid());
  this.app.on('settings:opened', () => this.hideGrid());
};

/**
 * Show/hide grid depending on
 * currently selected option.
 *
 * @private
 */
GridController.prototype.configureGrid = function() {
  var grid = this.app.settings.grid.selected('key');
  this.grid.hidden = grid === 'off';
};

/**
 * Hides the viewfinder frame-grid.
 *
 * @private
 */
GridController.prototype.hideGrid = function() {
  this.grid.hidden = true;
};

});