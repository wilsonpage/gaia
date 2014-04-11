define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:storage');
var bindAll = require('lib/bind-all');
var Storage = require('lib/storage');

/**
 * Exports
 */

module.exports = function(app) { return new StorageController(app); };
module.exports.StorageController = StorageController;

/**
 * Initialize a new `StorageController`
 *
 * @param {App} app
 */
function StorageController(app) {
  bindAll(this);
  this.app = app;
  this.camera = app.camera;
  this.settings = app.settings;
  this.storage = app.storage || new Storage();
  this.configure();
  this.bindEvents();
}

StorageController.prototype.configure = function() {

  // Give the camera a way to create video filepaths. This
  // is so that the camera can record videos directly to
  // the final location without us having to move the video
  // file from temporary, to final location at recording end.
  this.camera.createVideoFilepath = this.storage.createVideoFilepath;
};

StorageController.prototype.bindEvents = function() {
  debug('bind events');

  // App
  this.app.settings.on('settings:configured', this.updateMaxFileSize);
  this.app.on('previewgallery:deletepicture', this.storage.deletePicture);
  this.app.on('previewgallery:deletevideo', this.storage.deleteVideo);
  this.app.on('settings:configured', this.updateMaxFileSize);
  this.app.on('camera:newimage', this.storePicture);
  this.app.on('camera:newvideo', this.storeVideo);
  this.app.on('focus', this.storage.check);

  // Storage
  this.storage.on('itemdeleted', this.app.firer('storage:itemdeleted'));
  this.storage.on('statechange', this.onStateChange);

  debug('events bound');
};

StorageController.prototype.onStateChange = function(state) {
  this.app.emit('storage:statechange', state);
  this.app.emit('storage:' + state);
};

StorageController.prototype.storePicture = function(image) {
  var memoryBlob = image.blob;
  var self = this;

  // In either case, save the memory-backed photo blob to
  // device storage, retrieve the resulting File (blob) and
  // pass that around instead of the original memory blob.
  // This is critical for "pick" activity consumers where
  // the memory-backed Blob is either highly inefficent or
  // will almost-immediately become inaccesible, depending
  // on the state of the platform. https://bugzil.la/982779
  this.storage.addImage(memoryBlob, function(filepath, abspath, fileBlob) {
    image.blob = fileBlob;
    image.filepath = filepath;
    debug('stored image', image);
    self.app.emit('newmedia', image);
  });
};

/**
 * Store the poster image,
 * then emit the app 'newvideo'
 * event. This signifies the video
 * fully ready.
 *
 * We don't store the video blob like
 * we do for images, as it is recorded
 * directly to the final location.
 * This is for memory reason.
 *
 * @param  {Object} video
 */
StorageController.prototype.storeVideo = function(video) {
  debug('new video', video);
  var poster = video.poster;
  var self = this;

  // Add the poster image to the image storage
  poster.filepath = video.filepath.replace('.3gp', '.jpg');
  video.isVideo = true;

  this.storage.addImage(
    poster.blob, { filepath: poster.filepath },
    function(path, absolutePath, fileBlob) {
      // Replace the memory-backed Blob with the DeviceStorage file-backed File.
      // Note that "video" references "poster", so video previews will use this
      // File.
      poster.blob = fileBlob;
      debug('new video', video);
      self.app.emit('newmedia', video);
    });
};

StorageController.prototype.updateMaxFileSize = function() {
  var pictureSize = this.settings.pictureSizes.selected('data');
  var bytes = (pictureSize.width * pictureSize.height * 4);
  var exif = 4096;
  var total = bytes + exif;
  this.storage.setMaxFileSize(total);
};

});