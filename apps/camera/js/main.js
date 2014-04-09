require(['config/require', 'config'], function() {
  'use strict';

  define('boot', function(require) {
    var debug = require('debug')('main');
    var timing = window.performance.timing;
    debug('domloaded in %s', (timing.domComplete - timing.domLoading) + 'ms');

    /**
     * Module Dependencies
     */

    var App = require('app');
    var Camera = require('lib/camera');
    var Settings = require('lib/settings');
    var settings = new Settings(require('config/settings'));
    var GeoLocation = require('lib/geo-location');
    var Activity = require('lib/activity');
    var Storage = require('lib/storage');

    // Attach navigator.mozL10n
    require('l10n');

    /**
     * Create new `App`
     */

    var app = window.app = new App({
      win: window,
      doc: document,
      el: document.body,
      geolocation: new GeoLocation(),
      activity: new Activity(),
      storage: new Storage(),
      settings: settings,

      camera: new Camera({
        maxFileSizeBytes: 0,
        maxWidth: 0,
        maxHeight: 0,
        container: document.body,
        cafEnabled: settings.caf.enabled()
      }),

      controllers: {
        hud: require('controllers/hud'),
        controls: require('controllers/controls'),
        viewfinder: require('controllers/viewfinder'),
        recordingTimer: require('controllers/recording-timer'),
        overlay: require('controllers/overlay'),
        confirm: require('controllers/confirm'),
        settings: require('controllers/settings'),
        activity: require('controllers/activity'),
        camera: require('controllers/camera'),
        timer: require('controllers/timer'),
        zoomBar: require('controllers/zoom-bar'),
        indicators: require('controllers/indicators'),

        // Lazy loaded
        previewGallery: 'controllers/preview-gallery',
        battery: 'controllers/battery',
        sounds: 'controllers/sounds'
      }
    });

    debug('created app');

    // Fetch persistent settings
    app.settings.fetch();

    // Check for activities, then boot
    app.activity.check(app.boot);
  });

  require(['boot']);
});
