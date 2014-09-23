;(function(define){'use strict';define(function(require,exports,module){

/**
 * Module Dependencies
 */

var CameraUtils = require('lib/camera-utils');
var getVideoMetaData = require('lib/get-video-meta-data');
var orientation = require('lib/orientation');
var debug = require('debug')('gaia-camera');
var Focus = require('lib/camera/focus');
var debounce = require('lib/debounce');
var bindAll = require('lib/bind-all');
var mix = require('lib/mixin');

console.log('foooo');

var camera = Object.create(HTMLElement.prototype);

camera.template = require('./template');

camera.emit = function() { this.dispatchEvent(new CustomEvent(name)); };
camera.off = camera.removeEventListener;
camera.on = camera.addEventListener;

camera.createdCallback = function() {
  debug('initializing');
  bindAll(this);

  var self = this;

  // this.cameraList = navigator.mozCameras.getListOfCameras();
  // this.mozCamera = null;

  this.createShadowRoot().innerHTML = '<video/>';

  // this.els = {
  //   video: this.shadowRoot.querySelector('video')
  // };

  // navigator.mozCameras.getCamera('back', {}, function(mozCamera) {
  //   self.els.video.mozSrcObject = mozCamera;
  // });
};

module.exports = document.registerElement('gaia-camera', { prototype: camera });

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-camera',this));