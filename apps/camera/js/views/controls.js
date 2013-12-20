define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');
var bind = require('utils/bind');
var find = require('utils/find');
// var formatTimer = require('utils/formattimer');

/**
 * Locals
 */

var raf = window.requestAnimationFrame;

/**
 * Exports
 */

module.exports = View.extend({
  className: 'controls js-controls',
  buttonsDisabledClass: 'buttons-disabled',
  initialize: function() {
    this.render();
  },

  render: function() {
    this.el.innerHTML = this.template();

    // Find elements
    this.els.toggle = this.find('.js-toggle');
    this.els.capture = this.find('.js-capture');
    this.els.timer = this.find('.js-video-timer');
    this.els.thumbnail = this.find('.js-thumbnail');
    this.els.galleryButton = this.find('.js-gallery');
    this.els.cancelPickButton = this.find('.js-cancel-pick');

    // Bind events
    bind(this.els.toggle, 'change', this.onModeToggle);
    bind(this.els.capture, 'click', this.onButtonClick);
    // bind(this.els.galleryButton, 'click', this.onButtonClick);
    // bind(this.els.cancelPickButton, 'click', this.onButtonClick);
  },

  template: function() {
    /*jshint maxlen:false*/
    return '' +
    '<div class="controls_left">' +
      '<div class="controls_thumbnail js-thumbnail"></div>' +
    '</div>' +
    '<div class="controls_middle">' +
      '<div class="capture-button js-capture" name="capture">' +
        '<div class="circle outer-circle"></div>' +
        '<div class="circle middle-circle"></div>' +
        '<div class="circle inner-circle"></div>' +
        '<div class="center"></div>' +
      '</div>' +
    '</div>' +
    '<div class="controls_right">' +
      '<label class="mode-toggle">' +
        '<input class="js-toggle" type="checkbox"/>' +
        '<div class="mode-toggle_switch"></div>' +
      '</label>' +
    '</div>';
  },

  data: function(key, value) {
    switch (arguments.length) {
      case 1:
        value = this.el.getAttribute('data-' + key);
        return value === 'false' ? false : value;
      case 2: this.el.setAttribute('data-' + key, value);
    }
  },

  /**
   * Disable an element(s).
   *
   * If no element is given, all
   * elements are disabled.
   *
   * @param {String|Array} names
   * @api public
   */
  disable: function(names) {
    var els = this.els;
    names = names || Object.keys(els);
    names = [].concat.call(names);
    names.forEach(function(name) {
      var el = els[name];
      if (el) {
        el.disabled = true;
      }
    });
  },

  /**
   * Enable an element(s).
   *
   * If no element is given, all
   * elements are enabled.
   *
   * @param {String|Array} names
   * @api public
   */
  enable: function(names) {
    var els = this.els;
    names = names || Object.keys(els);
    names = [].concat.call(names);
    names.forEach(function(name) {
      var el = els[name];
      if (el) {
        el.disabled = true;
      }
    });
  },

  setThumbnail: function(blob) {
    if (!this.els.image) {
      this.els.image = new Image();
      this.els.thumbnail.appendChild(this.els.image);
    }
    this.els.image.src = window.URL.createObjectURL(blob);
  },

  enableButtons: function() {
    this.el.classList.remove(this.buttonsDisabledClass);
  },

  disableButtons: function() {
    this.el.classList.add(this.buttonsDisabledClass);
  },

  setVideoTimer: function(ms) {
    // var formatted = formatTimer(ms);
    // this.els.timer.textContent = formatted;
  },

  onButtonClick: function(event) {
    var el  = event.currentTarget;
    var name = el.getAttribute('name');
    this.emit('click:' + name);
  },

  onModeToggle: function(e) {
    var mode = this.els.toggle.checked ? 'video' : 'camera';
    this.data('mode', mode);
    this.emit('change:mode', mode);
  }
});

});