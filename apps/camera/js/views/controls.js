define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');
var bind = require('utils/bind');
var find = require('utils/find');
var formatTimer = require('utils/formattimer');

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
    this.els.switchButton = find('.js-switch', this.el);
    this.els.capture = find('.js-capture', this.el);
    this.els.galleryButton = find('.js-gallery', this.el);
    this.els.cancelPickButton = find('.js-cancel-pick', this.el);
    this.els.timer = find('.js-video-timer', this.el);

    // Bind events
    // bind(this.els.switchButton, 'click', this.onButtonClick);
    bind(this.els.capture, 'click', this.onCaptureClick);
    // bind(this.els.galleryButton, 'click', this.onButtonClick);
    // bind(this.els.cancelPickButton, 'click', this.onButtonClick);
  },

  template: function() {
    return '' +
    '<div class="controls_left"></div>' +
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
        '<input type="checkbox"/>' +
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

  enableButtons: function() {
    this.el.classList.remove(this.buttonsDisabledClass);
  },

  disableButtons: function() {
    this.el.classList.add(this.buttonsDisabledClass);
  },

  setVideoTimer: function(ms) {
    var formatted = formatTimer(ms);
    this.els.timer.textContent = formatted;
  },

  onButtonClick: function(event) {
    var el  = event.currentTarget;
    var name = el.getAttribute('name');
    this.emit('click:' + name);
  },

  onCaptureClick: function() {
    this.data('capturing', !this.data('capturing'));
    //this.emit('click:capture');
  }
});

});