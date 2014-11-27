define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:zoom-bar');
var ZoomBar = require('views/zoom-bar');
var bindAll = require('lib/bind-all');

/**
 * Exports
 */

module.exports = function(app) { return new ZoomBarController(app); };
module.exports.ZoomBarController = ZoomBarController;

/**
 * Initialize a new `ZoomBarController`
 *
 * @param {App} app
 */
function ZoomBarController(app) {
  bindAll(this);
  this.app = app;
  this.camera = app.camera;
  this.createView();
  this.bindEvents();
  debug('initialized');
}

ZoomBarController.prototype.createView = function() {
  this.view = this.app.views.zoombar || new ZoomBar();
  this.view.hide();
  this.view.appendTo(this.app.el);
};

ZoomBarController.prototype.bindEvents = function() {
  this.view.on('change', this.app.firer('zoombar:changed'));
  this.app.on('camera:zoomed', this.setZoom);
};

ZoomBarController.prototype.setZoom = function(zoom) {
  this.view.setValue(zoom.percent);
  debug('zoom set');
};

});
