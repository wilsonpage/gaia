define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var cameraCoordinates = require('lib/camera-coordinates');
var debug = require('debug')('controller:faces');
var FacesView = require('views/faces');

/**
 * Exports
 */

module.exports = function(app) { return new FacesController(app); };
module.exports.FacesController = FacesController;

/**
 * Initialize a new `FacesController`
 *
 * @param {App} app
 */
function FacesController(app) {
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
FacesController.prototype.createView = function() {
  this.view = this.app.view || new FacesView();
  this.view.appendTo(this.camera);
};

/**
 * Initial configuration.
 *
 * @private
 */
FacesController.prototype.configure = function() {

};

/**
 * Bind to relavant events.
 *
 * @private
 */
FacesController.prototype.bindEvents = function() {
  this.app.on('camera:focusconfigured', config => this.onFocusConfigured(config));
  this.app.on('camera:facesdetected', faces => this.onFacesDetected(faces));
};

/**
 *  Sets appropiate flags when the camera focus is configured
 */
FacesController.prototype.onFocusConfigured = function(config) {
  debug('focus configured', config);
  this.view.clear();
  if (config.maxDetectedFaces > 0) {
    this.view.configure(config.maxDetectedFaces);
  }
};

FacesController.prototype.onFacesDetected = function(faces) {
  if (faces.length) { this.renderFaces(faces); }
  else { this.view.hideFaces(); }
};

FacesController.prototype.renderFaces = function(faces) {
  debug('faces detected', faces);

  var viewfinderSize =  this.camera.viewfinderSize;
  var viewportHeight = viewfinderSize.height;
  var viewportWidth = viewfinderSize.width;
  var sensorAngle = this.camera.getSensorAngle();
  var camera = this.app.settings.cameras.selected('key');
  var isFrontCamera = camera === 'front';

  var circles = faces.map((face, index) => {
    var faceInPixels = cameraCoordinates.faceToPixels(
      face.bounds,
      viewportWidth,
      viewportHeight,
      sensorAngle,
      isFrontCamera);

    return this.calculateFaceCircle(faceInPixels);
  });

  this.view.show();
  this.view.render(circles);
  debug('face circles', circles);
};

FacesController.prototype.calculateFaceCircle = function(face) {
  return {
    x: face.left,
    y: face.top,
    diameter: Math.max(face.width, face.height)
  };
};

});