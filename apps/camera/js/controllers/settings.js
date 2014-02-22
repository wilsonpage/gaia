define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:settings');
var SettingsView = require('views/settings');
var bindAll = require('lib/bind-all');

/**
 * Exports
 */

module.exports = function(app) { return new SettingsController(app); };
module.exports.SettingsController = SettingsController;

/**
 * Initialize a new `SettingsController`
 *
 * @constructor
 * @param {App} app
 */
function SettingsController(app) {
  bindAll(this);
  this.app = app;
  this.settings = app.settings;
  this.configure();
  this.bindEvents();
  debug('initialized');
}

SettingsController.prototype.configure = function() {
  this.settings.pictureSizesFront.format = formatters.pictureSizes;
  this.settings.pictureSizesBack.format = formatters.pictureSizes;
  this.configureAliases();
};

/**
 * Bind to app events.
 *
 * @private
 */
SettingsController.prototype.bindEvents = function() {
  this.app.on('change:capabilities', this.onCapabilitiesChange);
  this.app.on('settings:toggle', this.toggleSettings);
};

/**
 * Render and display the settings menu.
 *
 * We use settings.menu() to retrieve
 * and ordered list of settings that
 * have a `menu` property.
 *
 * @private
 */
SettingsController.prototype.openSettings = function() {
  if (this.view) { return; }
  debug('open settings');

  var items = this.menuItems();
  this.view = new SettingsView({ items: items })
    .render()
    .appendTo(this.app.el)
    .on('tap:close', this.closeSettings)
    .on('tap:option', this.onOptionTap);

  debug('settings opened');
};

/**
 * Destroy the settings menu.
 *
 * @private
 */
SettingsController.prototype.closeSettings = function() {
  if (this.view) {
    this.view.destroy();
    this.view = null;
  }
};

/**
 * Selects the option that was
 * tapped on the setting.
 *
 * @param  {String} key
 * @param  {Setting} setting
 * @private
 */
SettingsController.prototype.onOptionTap = function(key, setting) {
  setting.select(key);
};

/**
 * Toggle the settings menu open/closed.
 *
 * @private
 */
SettingsController.prototype.toggleSettings = function() {
  if (this.view) { this.closeSettings(); }
  else { this.openSettings(); }
};

/**
 * When the hardware capabilities change
 * we update the available options for
 * each setting to match what is available.
 *
 * The rest of the app should listen for
 * the 'settings:configured' event as an
 * indication to update UI etc.
 *
 * We fire the 'settings:beforeconfigured'
 * event to allow other parts of the app
 * a last chance to manipulate options
 * before they are rendered to the UI.
 *
 * @param  {Object} capabilities
 */
SettingsController.prototype.onCapabilitiesChange = function(capabilities) {
  var aliases = this.settings.aliases;

  this.settings.options(capabilities);

  // Reset both picture and video flash modes
  this.settings.flashModesPicture.resetOptions(capabilities.flashModes);
  this.settings.flashModesVideo.resetOptions(capabilities.flashModes);

  // Only reset the current alias
  aliases.recorderProfiles.resetOptions(capabilities.recorderProfiles);
  aliases.pictureSizes.resetOptions(capabilities.pictureSizes);

  this.app.emit('settings:configured');
};

SettingsController.prototype.configureAliases = function() {
  this.settings.alias('recorderProfiles', aliases.recorderProfiles);
  this.settings.alias('pictureSizes', aliases.pictureSizes);
  this.settings.alias('flashModes', aliases.flashModes);
};

SettingsController.prototype.menuItems = function() {
  var items = this.settings.settingsMenu.get('items');
  var settings = this.settings;

  return items.filter(function(item) {
    return item.condition ? conditionMatches(item.condition) : true;
  }).map(function(item) {
    return settings[item.key];
  });

  function conditionMatches(condition) {
    for (var key in condition) {
      var value = condition[key];
      var setting = settings[key];
      if (setting.value() !== value) { return false; }
    }
    return true;
  }
};


/**
 * Settings aliases provide
 * convenient pointers to
 * specific settings based on
 * the state of other settings.
 *
 * @type {Object}
 */
var aliases = {
  recorderProfiles: {
    map: {
      back: 'recorderProfilesBack',
      front: 'recorderProfilesFront'
    },
    get: function() {
      var camera = this.settings.cameras.value();
      return this.settings[this.map[camera]];
    }
  },
  pictureSizes: {
    map: {
      back: 'pictureSizesBack',
      front: 'pictureSizesFront'
    },
    get: function() {
      var camera = this.settings.cameras.value();
      return this.settings[this.map[camera]];
    }
  },
  flashModes: {
    map: {
      video: 'flashModesVideo',
      picture: 'flashModesPicture'
    },
    get: function() {
      var mode = this.settings.mode.value();
      return this.settings[this.map[mode]];
    }
  }
};

var formatters = {
  pictureSizes: function(options) {
    var getMP = function(w, h) { return Math.round((w * h) / 1000000); };
    var maxBytes = this.get('maxBytes');
    var normalized = [];

    options.forEach(function(option) {
      var w = option.width;
      var h = option.height;
      var bytes = w * h;

      // Don't allow pictureSizes above the maxBytes limit
      if (maxBytes && bytes > maxBytes) { return; }

      option.aspect = getAspect(w, h);
      option.mp = getMP(w, h);

      var mp = option.mp ? option.mp + 'MP ' : '';

      normalized.push({
        key: w + 'x' + h,
        title: mp + w + 'x' + h + ' ' + option.aspect,
        value: option
      });
    });

    return normalized;
  }
};

function getAspect(w, h) {
  var getDevisor = function(a, b) {
    return (b === 0) ? a : getDevisor(b, a % b);
  };
  var devisor = getDevisor(w, h);
  return (w / devisor) + ':' + (h / devisor);
}

});
