
window.GaiaSlider = (function(win) {
  /*global ComponentUtils*/
  /*jshint maxlen:false*/
  'use strict';

  // Extend from the HTMLElement prototype
  var proto = Object.create(HTMLElement.prototype);

  // Allow baseurl to be overridden (used for demo page)
  var baseurl = window.GaiaSliderBaseurl ||
    '/shared/elements/gaia_slide/';

  /**
   * Runs when an instance of the
   * element is first created.
   *
   * When use this moment to create the
   * shadow-dom, inject our template
   * content, setup event listeners
   * and set the draw state to match
   * the initial `open` attribute.
   *
   * @private
   */
  proto.createdCallback = function() {
    var shadow = this.createShadowRoot();
    this._template = template.content.cloneNode(true);

    // Fetch some els
    this._els = {};

    this._attachEvents();

    // Put content in the shadow-dom
    shadow.appendChild(this._template);
    ComponentUtils.style.call(this, baseurl);
  };

  proto.attributeChangedCallback = function(attr, oldVal, newVal) {

  };

  proto._attachEvents = function() {

  };

  // HACK: Create a <template> in memory at runtime.
  // When the custom-element is created we clone
  // this template and inject into the shadow-root.
  // Prior to this we would have had to copy/paste
  // the template into the <head> of every app that
  // wanted to use <gaia-switch>, this would make
  // markup changes complicated, and could lead to
  // things getting out of sync. This is a short-term
  // hack until we can import entire custom-elements
  // using HTML Imports (bug 877072).
  // var stylesheet = baseurl + 'style.css';
  var template = document.createElement('template');
  template.innerHTML = '<div class="inner" id="inner">' +
      '<input type="range"/>' +
    '</div>';

  // Register and return the constructor
  return document.registerElement('gaia-slider', { prototype: proto });
})(window);
