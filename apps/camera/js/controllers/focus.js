define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var cameraCoordinates = require('lib/camera-coordinates');
var debug = require('debug')('controller:focus');
var FocusView = require('views/focus');
var bindAll = require('lib/bind-all');

/**
 * Exports
 */

module.exports = function(app) { return new FocusController(app); };
module.exports.FocusController = FocusController;

/**
 * Initialize a new `FocusController`
 *
 * @param {App} app
 */
function FocusController(app) {
  bindAll(this);
  this.app = app;
  this.camera = app.camera;
  this.settings = app.settings;
  this.createView();
  this.bindEvents();
  this.configure();
  debug('initialized');
}

/**
 * Create and inject the views.
 *
 * @private
 */
FocusController.prototype.createView = function() {
  this.view = this.app.views.focus || new FocusView();
  this.view.appendTo(this.camera);
};

/**
 * Bind to relavant events.
 *
 * @private
 */
FocusController.prototype.bindEvents = function() {
  this.app.on('camera:autofocuschanged', this.view.showAutoFocusRing);
  this.app.on('camera:focusstatechanged', this.view.setFocusState);
  this.app.on('camera:focusconfigured', this.onFocusConfigured);
  this.app.on('camera:frameclicked', this.onViewfinderClicked);
};

/**
 * Initial configuration.
 *
 * @private
 */
FocusController.prototype.configure = function() {

};

/**
 *  Sets appropiate flags when the camera focus is configured
 */
FocusController.prototype.onFocusConfigured = function(config) {
  debug('focus configured');
  this.view.setFocusMode(config.mode);
  this.touchFocusEnabled = config.touchFocus;
};

FocusController.prototype.onViewfinderClicked = function(data) {
  debug('viewfinder click', data);
  if (!this.touchFocusEnabled || this.app.get('timerActive')) {
    return;
  }
  this.changeFocusPoint(data.x, data.y);
};

FocusController.prototype.changeFocusPoint = function(x, y) {
  debug('change focus point', x, y);
  var viewfinderSize =  this.camera.viewfinderSize;
  var viewportHeight = viewfinderSize.height;
  var viewportWidth = viewfinderSize.width;
  var sensorAngle = this.camera.getSensorAngle();
  var focusAreaSize = 10;
  var focusAreaHalfSide = Math.round(focusAreaSize / 2);
  // Top Left corner of the area and its size
  var focusAreaPixels = {
    left: x - focusAreaHalfSide,
    top: y - focusAreaHalfSide,
    right: x + focusAreaHalfSide,
    bottom: y + focusAreaHalfSide,
    width: focusAreaSize,
    height: focusAreaSize
  };
  var camera = this.app.settings.cameras.selected('key');
  var isFrontCamera = camera === 'front';
  var focusArea = cameraCoordinates.faceToCamera(
    focusAreaPixels, viewportWidth, viewportHeight, sensorAngle, isFrontCamera);
  var focusPoint = {
    x: x,
    y: y,
    area: focusArea
  };

  this.view.setPosition(x, y);
  this.app.emit('viewfinder:focuspointchanged', focusPoint);
};


});