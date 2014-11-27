define(function(require, exports, module) {
'use strict';

/**
 * Module Dependencies
 */

var CameraUtils = require('lib/camera-utils');
var getVideoMetaData = require('lib/get-video-meta-data');
var orientation = require('lib/orientation');
var component = require('gaia-component');
var Focus = require('lib/camera/focus');
var debug = require('debug')('camera');
var debounce = require('lib/debounce');
var bindAll = require('lib/bind-all');
var model = require('model');

var scaleSizeTo = {
  fill: CameraUtils.scaleSizeToFillViewport,
  fit: CameraUtils.scaleSizeToFitViewport
};

/**
 * Initialize a new 'Camera'
 *
 * Options:
 *
 *   - {object} `focus`
 *
 * @param {Object} options
 */
// function Camera(options) {
//   debug('initializing');
//   bindAll(this);

//   // Options
//   options = options || {};

//   // mozCamera config is cached by default
//   this.cacheConfig = options.cacheConfig !== false;

//   // Minimum video duration length for creating a
//   // video that contains at least few samples, see bug 899864.
//   this.minRecordingTime = options.minRecordingTime  || 1000;

//   // Number of bytes left on disk to let us stop recording.
//   this.recordSpacePadding = options.recordSpacePadding || 1024 * 1024 * 1;

//   // The minimum available disk space to start recording a video.
//   this.recordSpaceMin = options.recordSpaceMin || 1024 * 1024 * 2;

//   // The number of times to attempt
//   // hardware request before giving up
//   this.requestAttempts = options.requestAttempts || 3;

//   // Test hooks
//   this.getVideoMetaData = options.getVideoMetaData || getVideoMetaData;
//   this.orientation = options.orientation || orientation;
//   this.configStorage = options.configStorage || localStorage;

//   this.cameraList = navigator.mozCameras.getListOfCameras();
//   this.mozCamera = null;

//   this.storage = {};

//   // Video config
//   this.video = {
//     filepath: null,
//     minSpace: this.recordSpaceMin,
//     spacePadding : this.recordSpacePadding
//   };

//   this.focus = new Focus(options.focus);
//   this.suspendedFlashCount = 0;

//   // Indicate this first
//   // load hasn't happened yet.
//   this.isFirstLoad = true;

//   // Always boot in 'picture' mode
//   // with 'back' camera. This may need
//   // to be configurable at some point.
//   this.mode = 'picture';
//   this.selectedCamera = 'back';

//   // Allow `configure` to be called multiple
//   // times in the same frame, but only ever run once.
//   this.configure = debounce(this.configure);

//   debug('initialized');
// }


module.exports = component.register('gaia-camera', {
  created: function() {
    debug('initializing');

    bindAll(this);
    model(this);

    this.createShadowRoot().innerHTML = this.template;

    this.els = {
      inner: this.shadowRoot.querySelector('.inner'),
      frame: this.shadowRoot.querySelector('.frame'),
      wrapper: this.shadowRoot.querySelector('.wrapper'),
      video: this.shadowRoot.querySelector('video')
    };

    this.zoom = { value: 1 };
    this.mozCameraConfig = {};

    // Minimum video duration length for creating a
    // video that contains at least few samples, see bug 899864.
    this.minRecordingTime = 1000;

    // Number of bytes left on disk to let us stop recording.
    this.recordSpacePadding = 1024 * 1024 * 1;

    // The minimum available disk space to start recording a video.
    this.recordSpaceMin = 1024 * 1024 * 2;

    // The number of times to attempt
    // hardware request before giving up
    this.requestAttempts = 3;

    // Test hooks
    this.getVideoMetaData = this.getVideoMetaData || getVideoMetaData;
    this.orientation = this.orientation || orientation;
    this.configStorage = this.configStorage || localStorage;

    this.cameraList = navigator.mozCameras.getListOfCameras();
    this.mozCamera = null;

    this.storage = {};

    // Video config
    this.video = {
      filepath: null,
      minSpace: this.recordSpaceMin,
      spacePadding : this.recordSpacePadding
    };

    this.focus = new Focus({
      continuousAutoFocus: true,
      touchFocus: true,
      faceDetection: true
    });

    this.suspendedFlashCount = 0;

    // Indicate this first
    // load hasn't happened yet.
    this.isFirstLoad = true;

    // Always boot in 'picture' mode
    // with 'back' camera. This may need
    // to be configurable at some point.
    this.mode = 'picture';
    this.selectedCamera = 'back';

    // Allow `configure` to be called multiple
    // times in the same frame, but only ever run once.
    this.configure = debounce(this.configure);

    this.load();

    debug('initialized');
  },

  /**
   * Loads the currently selected camera.
   *
   * There are cases whereby the camera
   * may still be 'releasing' its hardware.
   * If this is the case we wait for the
   * release process to finish, then attempt
   * to load again.
   *
   * @public
   */
  load: function() {
    debug('load camera');

    var loadingNewCamera = this.selectedCamera !== this.lastLoadedCamera;
    var self = this;

    // If hardware is still being released
    // we're not allowed to request the camera.
    if (this.releasing) {
      debug('wait for camera release');
      this.once('released', function() { self.load(); });
      return;
    }

    // Don't re-load hardware if selected camera is the same.
    if (this.mozCamera && !loadingNewCamera) {
      this.setupNewCamera(this.mozCamera);
      debug('camera not changed');
      return;
    }

    // If a camera is already loaded,
    // it must be 'released' first.
    // We also discard the `mozCameraConfig`
    // as the previous camera config
    // won't apply to the new camera.
    if (this.mozCamera) {
      this.release(ready);
    } else {
      ready();
    }

    // Once ready we request the camera
    // with the currently `selectedCamera`
    // and any `mozCameraConfig` that may
    // be in memory.
    //
    // The only time there should be a
    // valid `mozCameraConfig` in memory
    // is when the app becomes visible again
    // after being hidden. and we wish to
    // request the camera again in exactly
    // the same state it was previously in.
    function ready() {
      self.requestCamera(self.selectedCamera);
      self.lastLoadedCamera = self.selectedCamera;
    }
  },

  /**
   * Requests the mozCamera object,
   * then configures it.
   *
   * @private
   */
  requestCamera: function(camera) {
    debug('request camera', camera);
    if (this.isBusy) { return; }

    var attempts = this.requestAttempts;
    var config = { mode: this.mode };
    var self = this;


    // Indicate 'busy'
    this.busy('requestingCamera');

    // Make initial request
    request();

    /**
     * Requests the camera hardware.
     *
     * @private
     */
    function request() {
      navigator.mozCameras.getCamera(camera, config)
        .then(onSuccess)
        .catch(onError);

      self.emit('requesting');
      debug('camera requested', camera, config);
      attempts--;
    }

    function onSuccess(result) {
      debug('successfully got mozCamera', arguments);

      // Store the Gecko's final configuration
      self.updateConfig(result.configuration);

      // release camera when press power key
      // as soon as you open a camera app
      if (document.hidden) {
        self.mozCamera = result.camera;
        self.release();
        return;
      }

      self.setupNewCamera(result.camera);
      self.configureFocus();
      self.emit('focusconfigured', {
        mode: self.mozCamera.focusMode,
        touchFocus: self.focus.touchFocus,
        faceDetection: self.focus.faceDetection,
        maxDetectedFaces: self.focus.maxDetectedFaces
      });

      self.loadStreamInto(self.els.video);
      self.updatePreviewPosition();

      // If the camera was configured in the
      // `mozCamera.getCamera()` call, we can
      // fire the 'configured' event now.
      self.emit('configured');
      self.ready();
    }

    /**
     * Called when the request for camera
     * hardware fails.
     *
     * If the hardware is 'closed' we attempt
     * to re-request it one second later, until
     * all our attempts have run out.
     *
     * @param  {String} err
     */
    function onError(err) {
      debug('error requesting camera', err);

      if (err === 'HardwareClosed' && attempts) {
        self.cameraRequestTimeout = setTimeout(request, 1000);
        return;
      }

      self.emit('error', 'request-fail');
      self.ready();
    }
  },

  /**
   * Configures the newly recieved
   * mozCamera object.
   *
   * Setting the 'cababilities' key
   * triggers 'change' callback inside
   * the CameraController that sets the
   * app up for the new camera.
   *
   * @param  {MozCamera} mozCamera
   * @private
   */
  setupNewCamera: function(mozCamera) {
    debug('configuring camera');
    var capabilities = mozCamera.capabilities;
    this.mozCamera = mozCamera;

    // Bind to some events
    this.mozCamera.onShutter = this.onShutter;
    this.mozCamera.onClosed = this.onClosed;
    this.mozCamera.onPreviewStateChange = this.onPreviewStateChange;
    this.mozCamera.onRecorderStateChange = this.onRecorderStateChange;

    this.capabilities = this.formatCapabilities(capabilities);
    this.configureZoom();

    this.emit('newcamera', this.capabilities);
    debug('configured new camera');
  },

  /**
   * Camera capablities need to be in
   * a consistent format.
   *
   * We shallow clone to make sure the
   * app doesnt' make changes to the
   * original `capabilities` object.
   *
   * @param  {Object} capabilities
   * @return {Object}
   */
  formatCapabilities: function(capabilities) {
    var hasHDR = capabilities.sceneModes.indexOf('hdr') > -1;
    var hdr = hasHDR ? ['on', 'off'] : undefined;
    return mixin({ hdr: hdr }, capabilities);
  },

  /**
   * Configure the camera hardware
   * with the current `mode`, `previewSize`
   * and `recorderProfile`.
   *
   * @private
   */
  configure: function() {
    debug('configuring hardware...');
    var self = this;

    // Ensure that any requests that
    // come in whilst busy get run once
    // camera is ready again.
    if (this.isBusy) {
      debug('defering configuration');
      this.once('ready', this.configure);
      return;
    }

    // Exit here if there is no camera
    if (!this.mozCamera) {
      debug('no mozCamera');
      return;
    }

    var config = {
      mode: this.mode,
      recorderProfile: this.recorderProfile,
      pictureSize: this.pictureSize
    };

    // Check if the new config is different
    // from the last camera configuration
    if (this.configMatches(config)) {
      debug('hardware configuration not required');
      return;
    }

    // In some extreme cases the mode can
    // get changed and configured whilst
    // video recording is in progress.
    this.stopRecording();

    // Indicate 'busy'
    this.busy();

    this.fadeOut()
      .then(() => this.mozCamera.setConfiguration(config))
      .then(onSuccess)
      .then(() => this.fadeIn())
      .catch(onError);

    debug('mozCamera configuring', config);

    function onSuccess(config) {
      debug('configuration success', config);
      if (!self.mozCamera) { return; }
      self.updateConfig(config);
      self.updatePreviewPosition();
      self.configureFocus();
      self.emit('configured');
      self.ready();
    }

    function onError(err) {
      debug('Error configuring camera');
      self.ready();
    }
  },

  configMatches: function(newConfig) {
    return newConfig.mode === this.mozCameraConfig.mode &&
      newConfig.pictureSize === this.mozCameraConfig.pictureSize &&
      newConfig.recorderProfile === this.mozCameraConfig.recorderProfile;
  },

  updateConfig: function(config) {
    this.mozCameraConfig = config;
    this.pictureSize = config.pictureSize;
    this.recorderProfile = config.recorderProfile;
    this.previewSize = config.previewSize;
    this.mode = config.mode;
  },

  configureFocus: function() {
    this.focus.configure(this.mozCamera, this.mode);
    this.focus.onFacesDetected = this.onFacesDetected;
    this.focus.onAutoFocusChanged = this.onAutoFocusChanged;
  },

  shutdown: function() {
    this.stopRecording();
    this.set('previewActive', false);
    this.set('focus', 'none');
    this.release();
  },

  onAutoFocusChanged: function(state) {
    this.set('focus', state);
  },

  onFacesDetected: function(faces) {
    this.emit('facesdetected', faces);
  },

  /**
   * Plugs Video Stream into Video Element.
   *
   * @param  {Elmement} videoElement
   * @public
   */
  loadStreamInto: function(videoElement) {
    debug('loading stream into element');
    if (!this.mozCamera) {
      debug('error - `mozCamera` is undefined or null');
      return;
    }

    // REVIEW: Something is wrong if we are
    // calling this without a video element.
    if (!videoElement) {
      debug('error - `videoElement` is undefined or null');
      return;
    }

    // Don't load the same camera stream again
    var isCurrent = videoElement.mozSrcObject === this.mozCamera;
    if (isCurrent) { return debug('camera didn\'t change'); }

    videoElement.mozSrcObject = this.mozCamera;
    videoElement.play();
    debug('stream loaded into video');
  },

  /**
   * Return available preview sizes.
   *
   * @return {Array}
   * @private
   */
  previewSizes: function() {
    if (!this.mozCamera) { return; }
    return this.mozCamera.capabilities.previewSizes;
  },

  /**
   * Return the current optimal preview size.
   *
   * @return {Object}
   * @private
   */
  // previewSize: function() {
  //   var sizes = this.previewSizes();
  //   var size = CameraUtils.getOptimalPreviewSize(sizes);
  //   debug('get optimal previewSize', size);
  //   return size;
  // };

  /**
   * Get the current recording resolution.
   *
   * @return {Object}
   */
  resolution: function() {
    switch (this.mode) {
      case 'picture': return this.pictureSize;
      case 'video': return this.getRecorderProfile().video;
    }
  },

  /**
   * Set the picture size.
   *
   * If the given size is the same as the
   * currently set pictureSize then no
   * action is taken.
   *
   * The camera is 'configured' a soon as the
   * pictureSize is changed. `.configure` is
   * debounced so it will only ever run once
   * per turn.
   *
   * Options:
   *
   *   - {Boolean} `configure`
   *
   * @param {Object} size
   */
  setPictureSize: function(size, options) {
    debug('set picture size', size);
    if (!size) { return; }

    // Configure unless `false`
    var configure = options && options.configure !== false;

    // Don't do waste time re-configuring the
    // hardware if the pictureSize hasn't changed.
    if (this.isPictureSize(size)) {
      debug('pictureSize didn\'t change');
      return;
    }

    this.pictureSize = size;
    this.setThumbnailSize();

    // Configure the hardware only when required
    if (configure) { this.configure(); }

    debug('pictureSize changed');
    return this;
  },

  isPictureSize: function(size) {
    if (!this.pictureSize) { return false; }
    var sameWidth = size.width === this.pictureSize.width;
    var sameHeight = size.height === this.pictureSize.height;
    return sameWidth && sameHeight;
  },

  /**
   * Set the recorder profile.
   *
   * If the given profile is the same as
   * the current profile, no action is
   * taken.
   *
   * The camera is 'configured' a soon as the
   * recorderProfile is changed (`.configure()` is
   * debounced so it will only ever run once
   * per turn).
   *
   * Options:
   *
   *   - {Boolean} `configure`
   *
   * @param {String} key
   */
  setRecorderProfile: function(key, options) {
    debug('set recorderProfile: %s', key);
    if (!key) { return; }

    this.recorderProfile = key;

    // Only re-configure in 'video' mode
    if (this.mode === 'video') { this.configure(); }
    debug('recorderProfile changed: %s', key);
  },

  isRecorderProfile: function(key) {
    return key === this.recorderProfile;
  },

  /**
   * Returns the full profile of the
   * currently set recordrProfile.
   *
   * @return {Object}
   */
  getRecorderProfile: function() {
    var key = this.recorderProfile;
    return this.mozCamera.capabilities.recorderProfiles[key];
  },

  setThumbnailSize: function() {
    var sizes = this.mozCamera.capabilities.thumbnailSizes;
    var pictureSize = this.mozCamera.getPictureSize();
    var picked = this.pickThumbnailSize(sizes, pictureSize);
    if (picked) { this.mozCamera.setThumbnailSize(picked); }
  },

  /**
   * Sets the current flash mode,
   * both on the Camera instance
   * and on the cameraObj hardware.
   * If flash is suspended, it
   * updates the cached state that
   * will be restored.
   *
   * @param {String} key
   */
  setFlashMode: function(key) {
    if (this.mozCamera) {
      // If no key was provided, set it to 'off' which is
      // a valid flash mode.
      key = key || 'off';

      if (this.suspendedFlashCount > 0) {
        this.suspendedFlashMode = key;
        debug('flash mode set while suspended: %s', key);
      } else {
        this.mozCamera.flashMode = key;
        debug('flash mode set: %s', key);
      }
    }

    return this;
  },

  /**
   * Releases the camera hardware.
   *
   * @param  {Function} done
   */
  release: function(done) {
    debug('release');
    done = done || function() {};
    var self = this;

    // Clear any pending hardware requests
    clearTimeout(this.cameraRequestTimeout);

    // Ignore if there is no loaded camera
    if (!this.mozCamera) {
      done();
      return;
    }

    this.busy();
    this.stopRecording();
    this.set('focus', 'none');
    this.mozCamera.release(onSuccess, onError);
    this.releasing = true;
    this.mozCamera = null;

    // Reset cached parameters
    delete this.pictureSize;

    function onSuccess() {
      debug('successfully released');
      self.ready();
      self.releasing = false;
      self.emit('released');
      done();
    }

    function onError(err) {
      debug('failed to release hardware');
      self.ready();
      self.releasing = false;
      done(err);
    }
  },

  // TODO: Perhaps this function should be moved into a separate lib
  pickThumbnailSize: function(thumbnailSizes, pictureSize) {
    var screenWidth = window.innerWidth * window.devicePixelRatio;
    var screenHeight = window.innerHeight * window.devicePixelRatio;
    var pictureAspectRatio = pictureSize.width / pictureSize.height;
    var currentThumbnailSize;
    var i;

    // Coping the array to not modify the original
    thumbnailSizes = thumbnailSizes.slice(0);
    if (!thumbnailSizes || !pictureSize) {
      return;
    }

    function imageSizeFillsScreen(pixelsWidth, pixelsHeight) {
      return ((pixelsWidth >= screenWidth || // portrait
               pixelsHeight >= screenHeight) &&
              (pixelsWidth >= screenHeight || // landscape
               pixelsHeight >= screenWidth));
    }

    // Removes the sizes with the wrong aspect ratio
    thumbnailSizes = thumbnailSizes.filter(function(thumbnailSize) {
      var thumbnailAspectRatio = thumbnailSize.width / thumbnailSize.height;
      return Math.abs(thumbnailAspectRatio - pictureAspectRatio) < 0.05;
    });

    if (thumbnailSizes.length === 0) {
      console.error('Error while selecting thumbnail size. ' +
        'There are no thumbnail sizes that match the ratio of ' +
        'the selected picture size: ' + JSON.stringify(pictureSize));
      return;
    }

    // Sorting the array from smaller to larger sizes
    thumbnailSizes.sort(function(a, b) {
      return a.width * a.height - b.width * b.height;
    });

    for (i = 0; i < thumbnailSizes.length; ++i) {
      currentThumbnailSize = thumbnailSizes[i];
      if (imageSizeFillsScreen(currentThumbnailSize.width,
                               currentThumbnailSize.height)) {
        return currentThumbnailSize;
      }
    }

    return thumbnailSizes[thumbnailSizes.length - 1];
  },

  /**
   * Takes a photo, or begins/ends
   * a video capture session.
   *
   * Options:
   *
   *   - `position` {Object} - geolocation to store in EXIF
   *
   * @param  {Object} options
   *  public
   */
  capture: function(options) {
    switch (this.mode) {
      case 'picture': this.takePicture(options); break;
      case 'video': this.toggleRecording(options); break;
    }
  },

  /**
   * Take a picture.
   *
   * Options:
   *
   *   - {Number} `position` - geolocation to store in EXIF
   *
   * @param  {Object} options
   */
  takePicture: function(options) {
    debug('take picture');
    this.busy();

    var rotation = this.orientation.get();
    var selectedCamera = this.selectedCamera;
    var self = this;
    var position = options && options.position;
    var config = {
      dateTime: Date.now() / 1000,
      pictureSize: self.pictureSize,
      fileFormat: 'jpeg'
    };

    // If position has been passed in,
    // add it to the config object.
    if (position) {
      config.position = position;
    }

    // Front camera is inverted, so flip rotation
    config.rotation = selectedCamera === 'front' ? -rotation : rotation;

    // If the camera focus is 'continuous' or 'infinity'
    // we can take the picture straight away.
    if (this.focus.getMode() === 'auto') {
      this.focus.focus(onFocused);
    } else {
      takePicture();
    }

    function onFocused(state) {
      takePicture();
    }

    function takePicture() {
      self.busy('takingPicture');
      self.mozCamera.takePicture(config, onSuccess, onError);
    }

    function onError(error) {
      var title = navigator.mozL10n.get('error-saving-title');
      var text = navigator.mozL10n.get('error-saving-text');

      // if taking a picture fails because there's
      // already a picture being taken we ignore it.
      if (error === 'TakePictureAlreadyInProgress') {
        complete();
      } else {
        alert(title + '. ' + text);
        debug('error taking picture');
        complete();
      }
    }

    function onSuccess(blob) {
      var image = { blob: blob };
      self.resumePreview();
      self.set('focus', 'none');
      self.emit('newimage', image);
      debug('success taking picture');
      complete();
    }

    function complete() {
      self.set('focus', 'none');
      self.ready();
    }
  },

  updateFocusArea: function(rect, done) {
    this.focus.updateFocusArea(rect, focusDone);
    function focusDone(state) {
      if (done) {
        done(state);
      }
    }
  },

  /**
   * Start/stop recording.
   *
   * @param  {Object} options
   */
  toggleRecording: function(options) {
    var recording = this.get('recording');
    if (recording) { this.stopRecording(); }
    else { this.startRecording(options); }
  },

  /**
   * Seet the storage for video.
   *
   * @public
   */
  setVideoStorage: function(storage) {
    this.storage.video = storage;
  },

  /**
   * Start recording a video.
   *
   * @public
   */
  startRecording: function(options) {
    debug('start recording');
    var frontCamera = this.selectedCamera === 'front';
    var rotation = this.orientation.get();
    var storage = this.storage.video;
    var video = this.video;
    var self = this;

    // Rotation is flipped for front camera
    if (frontCamera) { rotation = -rotation; }

    this.set('recording', true);
    this.busy();

    // Lock orientation during video recording
    //
    // REVIEW: This should *not* be here. This
    // is an App concern and should live in
    // the `CameraController`.
    this.orientation.stop();

    // First check if there is enough free space
    this.getFreeVideoStorageSpace(gotStorageSpace);

    function gotStorageSpace(err, freeBytes) {
      if (err) { return self.onRecordingError(); }

      var notEnoughSpace = freeBytes < self.video.minSpace;
      var remaining = freeBytes - self.video.spacePadding;
      var targetFileSize = self.get('maxFileSizeBytes');
      var maxFileSizeBytes = targetFileSize || remaining;

      // Don't continue if there
      // is not enough space
      if (notEnoughSpace) {
        self.onRecordingError('nospace2');
        return;
      }

      // TODO: Callee should
      // pass in orientation
      var config = {
        rotation: rotation,
        maxFileSizeBytes: maxFileSizeBytes
      };

      self.createVideoFilepath(createVideoFilepathDone);

      function createVideoFilepathDone(errorMsg, filepath) {
        if (typeof filepath === 'undefined') {
          debug(errorMsg);
          self.onRecordingError('error-video-file-path');
          return;
        }

        video.filepath = filepath;
        self.emit('willrecord');
        self.mozCamera.startRecording(
          config,
          storage,
          filepath,
          onSuccess,
          onError);
      }
    }

    function onError(err) {
      // Ignore err as we use our own set of error
      // codes; instead trigger using the default
      self.onRecordingError();
    }

    function onSuccess() {
      self.startVideoTimer();
      self.ready();

      // User closed app while
      // recording was trying to start
      //
      // TODO: Not sure this should be here
      if (document.hidden) {
        self.stopRecording();
      }
    }
  },

  /**
   * Stop recording the video.
   *
   * Once we have told the camera to stop recording
   * the video we attach a 'change' listener to the
   * video storage and wait. Once the listener fires
   * we know that the video file has been saved.
   *
   * At this point we fetch the file Blob from
   * storage and then call the `.onNewVideo()`
   * method to handle the final stages.
   *
   * @public
   */
  stopRecording: function() {
    debug('stop recording');

    var notRecording = !this.get('recording');
    var filepath = this.video.filepath;
    var storage = this.storage.video;
    var self = this;

    if (notRecording) { return; }

    this.busy();
    this.stopVideoTimer();
    this.mozCamera.stopRecording();
    this.set('recording', false);

    // Unlock orientation when stopping video recording.
    // REVIEW:WP This logic is out of scope of the
    // Camera hardware. Only the App should be
    // making such high level decicions.
    this.orientation.start();

    // Register a listener for writing
    // completion of current video file
    storage.addEventListener('change', onStorageChange);

    function onStorageChange(e) {
      // If the storage becomes unavailable
      // For instance when yanking the SD CARD
      if (e.reason === 'unavailable') {
        storage.removeEventListener('change', onStorageChange);
        self.emit('ready');
        return;
      }
      debug('video file ready', e.path);
      var matchesFile = e.path.indexOf(filepath) > -1;

      // Regard the modification as video file writing
      // completion if e.path matches current video
      // filename. Note e.path is absolute path.
      if (e.reason !== 'modified' || !matchesFile) { return; }

      // We don't need the listener anymore.
      storage.removeEventListener('change', onStorageChange);

      // Re-fetch the blob from storage
      var req = storage.get(filepath);
      req.onerror = self.onRecordingError;
      req.onsuccess = onSuccess;

      function onSuccess() {
        debug('got video blob');
        self.onNewVideo({
          blob: req.result,
          filepath: filepath
        });
      }
    }
  },

  /**
   * Once we have got the new video blob
   * from storage we assemble the video
   * object and then get video meta data
   * to add to it.
   *
   * If the video was too short, we delete
   * it from storage and abort to prevent
   * the app from ever knowing a new
   * (potentially corrupted) video file
   * was recorded.
   *
   * @param  {Object} video
   * @private
   */
  onNewVideo: function(video) {
    debug('got new video', video);

    var elapsedTime = this.get('videoElapsed');
    var tooShort = elapsedTime < this.minRecordingTime;
    var self = this;

    // Discard videos that are too
    // short and possibly corrupted.
    if (tooShort) {
      debug('video too short, deleting...');
      this.storage.video.delete(video.filepath);
      this.ready();
      return;
    }

    // Finally extract some metadata before
    // telling the app the new video is ready.
    this.getVideoMetaData(video.blob, gotVideoMetaData);

    function gotVideoMetaData(error, data) {
      if (error) {
        self.onRecordingError();
        return;
      }

      // Bolt on additional metadata
      video.poster = data.poster;
      video.width = data.width;
      video.height = data.height;
      video.rotation = data.rotation;

      // Tell the app the new video is ready
      self.emit('newvideo', video);
      self.ready();
    }
  },

  // TODO: This is UI stuff, so
  // shouldn't be handled in this file.
  onRecordingError: function(id) {
    id = id && id !== 'FAILURE' ? id : 'error-recording';
    var title = navigator.mozL10n.get(id + '-title');
    var text = navigator.mozL10n.get(id + '-text');
    alert(title + '. ' + text);
    this.set('recording', false);
    this.ready();
  },

  /**
   * Emit a 'shutter' event so that
   * app UI can respond with shutter
   * animations and sounds effects.
   *
   * @private
   */
  onShutter: function() {
    this.emit('shutter');
  },

  /**
   * Emit a 'closed' event when camera controller
   * closes
   *
   * @private
   */
  onClosed: function(reason) {
    this.shutdown();
    this.emit('closed', reason);
  },

  /**
   * The preview state change events come
   * from the camera hardware. If 'stopped'
   * or 'paused' the camera must not be used.
   *
   * @param  {String} state ['stopped', 'paused']
   * @private
   */
  onPreviewStateChange: function(state) {
    debug('preview state change: %s', state);
    this.previewState = state;
    this.emit('preview:' + state);
  },

  /**
   * Emit useful event hook.
   *
   * @param  {String} msg
   * @private
   */
  onRecorderStateChange: function(msg) {
    if (msg === 'FileSizeLimitReached') {
      this.emit('filesizelimitreached');
    }
  },

  /**
   * Get the number of remaining
   * bytes in video storage.
   *
   * @param  {Function} done
   * @async
   * @private
   */
  getFreeVideoStorageSpace: function(done) {
    debug('get free storage space');

    var storage = this.storage.video;
    var req = storage.freeSpace();
    req.onerror = onError;
    req.onsuccess = onSuccess;

    function onSuccess() {
      var freeBytes = req.result;
      debug('%d free space found', freeBytes);
      done(null, freeBytes);
    }

    function onError() {
      done('error');
    }
  },

  /**
   * Get a unique video filepath
   * to record a new video to.
   *
   * Your application can overwrite
   * this method with something
   * so that you can record directly
   * to final location. We do this
   * in CameraController.
   *
   * Callback function signature used
   * so that an async override can
   * be used if you wish.
   *
   * @param  {Function} done
   */
  createVideoFilepath: function(done) {
    done(null, Date.now() + '_tmp.3gp');
  },

  /**
   * Resume the preview stream.
   *
   * After a photo has been taken the
   * preview stream freezes on the
   * taken frame. We call this function
   * to start the stream flowing again.
   *
   * @private
   */
  resumePreview: function() {
    this.mozCamera.resumePreview();
    // After calling takePicture(Camera.ShutterCallback, Camera.PictureCallback,
    // Camera.PictureCallback) or stopPreview(), and then resuming preview with
    // startPreview(), the apps should call this method again to resume face
    // detection. See Bug 1070791.
    this.focus.startFaceDetection();
    this.emit('previewresumed');
  },

  /**
   * Sets the selected camera to the
   * given string and then reloads
   * the camera.
   *
   * If the given camera is already
   * selected, no action is taken.
   *
   * @param {String} camera 'front'|'back'
   * @public
   */
  setCamera: function(camera) {
    debug('set camera: %s', camera);
    if (this.selectedCamera === camera) { return; }
    this.selectedCamera = camera;
    this.load();
  },

  /**
   * Toggles between 'picture'
   * and 'video' capture modes.
   *
   * @return {String}
   * @public
   */
  setMode: function(mode) {
    debug('setting mode to: %s', mode);
    if (this.isMode(mode)) { return; }
    this.mode = mode;
    this.configure();
    return this;
  },

  /**
   * States if the camera is currently
   * set to the passed mode.
   *
   * @param  {String}  mode  ['picture'|'video']
   * @return {Boolean}
   * @public
   */
  isMode: function(mode) {
    return this.mode === mode;
  },

  /**
   * Sets a start time and begins
   * updating the elapsed time
   * every second.
   *
   * @private
   */
  startVideoTimer: function() {
    this.set('videoStart', new Date().getTime());
    this.videoTimer = setInterval(this.updateVideoElapsed, 1000);
    this.updateVideoElapsed();
  },

  /**
   * Clear the video timer interval.
   *
   * @private
   */
  stopVideoTimer: function() {
    clearInterval(this.videoTimer);
    this.videoTimer = null;
  },

  /**
   * Calculates the elapse time
   * and updateds the 'videoElapsed'
   * value.
   *
   * We listen for the 'change:'
   * event emitted elsewhere to
   * update the UI accordingly.
   *
   */
  updateVideoElapsed: function() {
    var now = new Date().getTime();
    var start = this.get('videoStart');
    this.set('videoElapsed', (now - start));
  },

  /**
   * Set ISO value.
   *
   * @param {String} value
   * @public
   */
  setISOMode: function(value) {
    var isoModes = this.mozCamera.capabilities.isoModes;
    if (isoModes && isoModes.indexOf(value) > -1) {
      this.mozCamera.isoMode = value;
    }
  },

  /**
   * Set the mozCamera white-balance value.
   *
   * @param {String} value
   * @public
   */
  setWhiteBalance: function(value){
    var capabilities = this.mozCamera.capabilities;
    var modes = capabilities.whiteBalanceModes;
    if (modes && modes.indexOf(value) > -1) {
      this.mozCamera.whiteBalanceMode = value;
    }
  },

  /**
   * Set HDR mode.
   *
   * HDR is a scene mode, so we
   * transform the hdr value to
   * the appropriate scene value.
   *
   * @param {String} value
   * @public
   */
  setHDR: function(value){
    debug('set hdr: %s', value);
    if (!value) { return; }
    var scene = value === 'on' ? 'hdr' : 'auto';
    this.setSceneMode(scene);
  },

  /**
   * Set scene mode.
   *
   * @param {String} value
   * @public
   */
  setSceneMode: function(value){
    var modes = this.mozCamera.capabilities.sceneModes;
    if (modes.indexOf(value) > -1) {
      this.mozCamera.sceneMode = value;
    }
  },

  /**
   * Retrieves the angle of orientation of the camera hardware's
   * image sensor. This value is calculated as the angle that the
   * camera image needs to be rotated (clockwise) so that it appears
   * correctly on the display in the device's natural (portrait)
   * orientation
   *
   * Reference:
   * http://developer.android.com/reference/android/hardware/Camera.CameraInfo.html#orientation
   *
   * @return {Number}
   * @public
   */
  getSensorAngle: function() {
    return this.mozCamera && this.mozCamera.sensorAngle;
  },

  /**
   * A central place to indicate
   * the camera is 'busy'.
   *
   * @private
   */
  busy: function(type) {
    debug('busy %s', type || '');
    this.isBusy = true;
    this.emit('busy', type);
    clearTimeout(this.readyTimeout);
  },

  /**
   * A central place to indicate
   * the camera is 'ready'.
   *
   * @private
   */
  ready: function() {
    var self = this;
    this.isBusy = false;
    clearTimeout(this.readyTimeout);
    this.readyTimeout = setTimeout(function() {
      debug('ready');
      self.emit('ready');
    }, 150);
  },

  updatePreviewPosition: function() {
    var mirrored = this.selectedCamera === 'front';
    var sensorAngle = this.getSensorAngle();
    var previewSize = this.previewSize;
    var container;
    var aspect;

    // Invert dimensions if the camera's `sensorAngle` is
    // 0 or 180 degrees.
    if (sensorAngle % 180 === 0) {
      container = {
        width: this.clientWidth,
        height: this.clientHeight,
        aspect: this.clientWidth / this.height
      };

      aspect = previewSize.height / previewSize.width;
    } else {
      container = {
        width: this.clientHeight,
        height: this.clientWidth,
        aspect: this.clientHeight / this.clientWidth
      };

      aspect = previewSize.width / previewSize.height;
    }

    var shouldFill = aspect > container.aspect;
    var scaleType = this.scaleType || (shouldFill ? 'fill' : 'fit');

    // Calculate the correct scale to apply to the
    // preview to either 'fill' or 'fit' the viewfinder
    // container (always preserving the aspect ratio).
    var landscape = scaleSizeTo[scaleType](container, previewSize);
    var portrait = { width: landscape.height, height: landscape.width };

    // Set the size of the frame to match 'portrait' dimensions
    this.els.frame.style.width = portrait.width + 'px';
    this.els.frame.style.height = portrait.height + 'px';

    var transform = '';

    if (mirrored) {
      transform += 'scale(-1, 1) ';
    }

    transform += 'rotate(' + sensorAngle + 'deg)';

    // Set the size of the video container to match the
    // 'landscape' dimensions (CSS is used to rotate
    // the 'landscape' video stream to 'portrait')
    this.els.wrapper.style.width = landscape.width + 'px';
    this.els.wrapper.style.height = landscape.height + 'px';
    this.els.wrapper.style.transform = transform;

    // CSS aligns the contents slightly
    // differently depending on the scaleType
    this.setAttr('scaleType', scaleType);

    debug('updated preview size/position', landscape, transform);
  },

  /**
   * Zoom
   */

  /**
   * Check if the hardware supports zoom.
   *
   * @return {Boolean}
   */
  isZoomSupported: function() {
    return this.mozCamera && this.mozCamera.capabilities.zoomRatios.length > 1;
  },

  enableZoom: function(value) {
    this.zoom.enabled = value !== false;
  },

  configureZoom: function() {
    var previewSize = this.previewSize;
    var maxPreviewSize =
      CameraUtils.getMaximumPreviewSize(this.previewSizes());

    // Calculate the maximum amount of zoom that the hardware will
    // perform. This calculation is determined by taking the maximum
    // supported preview size *width* and dividing by the current preview
    // size *width*.
    this.zoom.maxHardware = maxPreviewSize.width / previewSize.width;
    this.zoom.min = this.getMinZoom();
    this.zoom.max = this.getMaxZoom();
    this.zoom.range = this.zoom.max - this.zoom.min;

    this.setZoom(this.getMinZoom());
  },

  getMinZoom: function() {
    var zoomRatios = this.mozCamera.capabilities.zoomRatios;
    if (zoomRatios.length === 0) { return 1.0; }
    return zoomRatios[0];
  },

  getMaxZoom: function() {
    var zoomRatios = this.mozCamera.capabilities.zoomRatios;
    if (zoomRatios.length === 0) { return 1.0; }
    return zoomRatios[zoomRatios.length - 1];
  },

  getZoom: function() {
    return this.mozCamera.zoom;
  },

  setZoom: function(zoom) {
    debug('set zoom: %s', zoom);
    if (!this.zoom.enabled) { return; }

    zoom = clamp(zoom, this.zoom.min, this.zoom.max);
    this.zoom.percent = (zoom - this.zoom.min) / this.zoom.range * 100;
    this.zoom.value = zoom;

    debug('set zoom clamped: %s', this.zoom.value, this.zoom);

    this.emit('zoomed', this.zoom);

    // Stop here if we're already waiting for
    // `mozCamera.zoom` to be updated.
    if (this.zoom.changeTimeout) { return; }

    // Throttle to prevent hammering the Camera API.
    this.zoom.changeTimeout = setTimeout(()=>  {
      this.zoom.changeTimeout = null;
      this.mozCamera.zoom = this.zoom.value;
    }, 50);
  },

  disableZoom: function() {
    this.zoom.enabled = false;
    this.setZoom(1);
  },

  enableZoomPreviewAdjustment: function(value) {
    this.zoom.usePreviewAdjustment = value;
  },

  getZoomPreviewAdjustment: function() {
    var zoom = this.getZoom();
    if (zoom <= this.zoom.maxHardware) { return 1; }
    return zoom / this.zoom.maxHardware;
  },

  /**
   * Adjust the scale of the <video/> tag to compensate for the inability
   * of the Camera API to zoom the preview stream beyond a certain point.
   * This gets called when the `Camera` emits a `zoomchanged` event and is
   * calculated by `Camera.prototype.getZoomPreviewAdjustment()`.
   */
  setZoomPreviewAdjustment: function(scale) {
    if (this.zoom.usePreviewAdjustment) {
      this.els.video.style.transform = 'scale(' + scale + ')';
    }
  },

  fadeTime: 360,

  fadeOut: function(done) {
    debug('fade-out');
    return new Promise((resolve) => {
      this.classList.add('hidden');
      document.body.classList.remove('no-background');
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = setTimeout(() => {
        this.emit('fadedout');
        resolve();
      }, this.fadeTime);
    });
  },

  fadeIn: function() {
    debug('fade-in');
    return new Promise((resolve) => {
      this.classList.remove('hidden');
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = setTimeout(() => {
        document.body.classList.add('no-background');
        this.emit('fadedin');
        resolve();
      }, this.fadeTome);
    });
  },

  template: `<div class="inner">
    <div class="frame">
      <div class="wrapper">
        <video></video>
      </div>
      <content></content>
    </div>
  </div>
  <style>

    :host {
      position: relative;

      display: block;
      width: 100%;
      height: 100%;

      opacity: 1;
      transition: opacity 360ms ease-in-out;
    }

    :host.hidden {
      opacity: 0;
    }

    .inner {
      position: absolute;
      top: 0;
      left: 0;

      display: flex;
      width: 100%;
      height: 100%;

      justify-content: center;
      overflow: hidden;
      transition: opacity 360ms ease-in-out;
    }

    /**
     * scale-type=fill
     */

    .inner[scale-type=fill] {
      align-items: center;
    }

    /**
     * .shutter
     */

    .shutter {
      animation: 400ms shutter-animation;
    }

    /** Frame
     ---------------------------------------------------------*/

    /**
     * 1. The grid should never overflow the viewport.
     */

    .frame {
      display: flex;
      position: relative;
      max-width: 100%; /* 1 */
      max-height: 100%; /* 1 */
      justify-content: center;
      align-items: center;
    }

    /** Video wrapper
     ---------------------------------------------------------*/

    .wrapper {
      flex-shrink: 0;
    }

    /** Video
     ---------------------------------------------------------*/

    video {
      width: 100%;
      height: 100%;
      outline: none;
    }
  </style>`,

  globalCss: `
    @keyframes shutter-animation {
      0% { opacity: 1; }
      1% { opacity: 0.2; }
      100% { opacity: 1 }
    }`
});

function mixin(a, b) {
  for (var key in b) { a[key] = b[key]; }
  return a;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wait(ms) {
  return () => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
}


});

