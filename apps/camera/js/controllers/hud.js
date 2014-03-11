define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:hud');
var bindAll = require('lib/bind-all');

/**
 * Exports
 */

exports = module.exports = function(app) { return new HudController(app); };
exports.HudController = HudController;

/**
 * Initialize a new `HudController`
 *
 * @param {AppController} app
 * @constructor
 *
 */
function HudController(app) {
  bindAll(this);
  this.app = app;
  this.hud = app.views.hud;
  this.settings = app.settings;
  this.configure();
  this.bindEvents();
  debug('initialized');
}

/**
 * Initially configure state.
 *
 * @private
 */
HudController.prototype.configure = function() {
  var hasDualCamera = this.settings.cameras.get('options').length > 1;
  var showSettings = this.settings.showSettings.selected('key');
  this.hud.enable('settings', showSettings);
  this.hud.enable('camera', hasDualCamera);
};

/**
 * Bind callbacks to events.
 *
 * @return {HudController} for chaining
 * @private
 */
HudController.prototype.bindEvents = function() {
  this.app.settings.flashModes.on('change:selected', this.updateFlash);
  this.app.settings.on('change:mode', this.updateFlash);
  this.app.on('settings:configured', this.onSettingsConfigured);
  this.app.on('change:recording', this.onRecordingChange);

  // View
  this.hud.on('click:settings', this.app.firer('settings:toggle'));
  this.hud.on('click:camera', this.onCameraClick);
  this.hud.on('click:flash', this.onFlashClick);

  // Camera
  this.app.on('camera:ready', this.hud.setter('camera', 'ready'));
  this.app.on('camera:busy', this.hud.setter('camera', 'busy'));

  // Timer
  this.app.on('timer:cleared', this.hud.setter('timer', 'inactive'));
  this.app.on('timer:started', this.hud.setter('timer', 'active'));
  this.app.on('timer:ended', this.hud.setter('timer', 'inactive'));
};

HudController.prototype.onSettingsConfigured = function() {
  this.updateFlash();
};

HudController.prototype.onCameraClick = function() {
  this.app.settings.get('cameras').next();
};

HudController.prototype.onFlashClick = function() {
  this.settings.flashModes.next();
};

HudController.prototype.updateFlash = function() {
  var setting = this.settings.flashModes;
  var selected = setting && setting.selected();
  var hasFlash = !!selected;
  this.hud.enable('flash', hasFlash);
  this.hud.setFlashMode(selected);
};

/**
 * Toggles the visibility of the view
 * depending on recording state.
 *
 * @param  {Boolean} recording
 * @private
 */
HudController.prototype.onRecordingChange = function(recording) {
  this.hud.toggle(!recording);
};

});
