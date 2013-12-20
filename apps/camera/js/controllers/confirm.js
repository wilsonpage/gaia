define(function(require, exports, module) {
/*jshint laxbreak:true*/

'use strict';

/**
 * Module Dependencies
 */

var ConfirmView = require('views/confirm');
var bindAll = require('utils/bindAll');

/**
 * Locals
 */

var proto = ConfirmController.prototype;

/**
 * Exports
 */

module.exports = function(options) {
  return new ConfirmController(options);
};

/**
 * Initialize a new `ConfirmController`
 *
 * @param {Object} options
 */
function ConfirmController(options) {
  this.activity = options.activity;
  this.camera = options.camera;
  this.container = options.el;

  // Allow these dependencies
  // to be injected if need be.
  this.ConfirmView = options.ConfirmView || ConfirmView;

  // Bind methods
  bindAll(this);

  // Attach events
  this.bindEvents();
}

/**
 * Bind callbacks to required events.
 *
 * @api private
 */
proto.bindEvents = function() {
  this.camera.on('newimage', this.onNewImage);
  this.camera.on('newvideo', this.onNewVideo);
};

/**
 * When inside a 'pick' activity
 * will present the user with a
 * confirm overlay where they can
 * decide to 'select' or 'retake'
 * the photo.
 *
 * @param  {Object} data
 * @api private
 */
proto.onNewImage = function(data) {
  if (!this.activity.active) { return; }

  var activity = this.activity;
  var confirm = new this.ConfirmView();
  var camera = this.camera;
  var blob = data.blob;

  confirm
    .render()
    .appendTo(this.container)
    .setupMediaFrame()
    .showImage(data)
    .on('click:select', onSelectClick)
    .on('click:retake', onRetakeClick);

  function onSelectClick() {
    camera._resizeBlobIfNeeded(blob, function(resized) {
      activity.postResult({
        type: 'image/jpeg',
        blob: resized
      });
    });
  }

  function onRetakeClick() {
    confirm.destroy();
    camera.resumePreview();
  }
};

proto.onNewVideo = function(data) {
  if (!this.activity.active) { return; }

  var ConfirmView = this.ConfirmView;
  var confirm = new ConfirmView();
  var activity = this.activity;
  var camera = this.camera;

  confirm
    .render()
    .appendTo(this.container)
    .setupMediaFrame()
    .showVideo(data)
    .on('click:select', onSelectClick)
    .on('click:retake', onRetakeClick);

  function onSelectClick() {
    activity.postResult({
      type: 'video/3gpp',
      blob: data.blob,
      poster: data.poster.blob
    });
  }

  function onRetakeClick() {
    camera.resumePreview();
    confirm.destroy();
  }
};

});