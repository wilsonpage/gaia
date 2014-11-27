define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('view:face');
var FaceView = require('views/face');
var View = require('view');

/**
 * Exports
 */

module.exports = View.extend({
  name: 'faces',

  initialize: function(options) {
    options = options || {};
    this.el.innerHTML = this.template();
    this.FaceView = options.FaceView || FaceView;
    this.faces = [];
  },

  // It creates the DOM elements that will display circles
  // around the detected faces.
  configure: function(maxNumberFaces) {
    debug('configure', maxNumberFaces);

    var faceView;
    var i;

    for (i = 0; i < maxNumberFaces; ++i) {
      faceView = new this.FaceView();
      faceView.hide();
      this.faces.push(faceView);
      faceView.appendTo(this.el);
    }
  },

  render: function(faces) {
    this.hideFaces();
    faces.forEach((face, index) => {
      var view = this.faces[index];
      this.renderFace(face, view);
    });
  },

  renderFace: function(face, view) {
    // Maximum diameter is 300px as in the visual spec
    var diameter = Math.min(300, face.diameter);
    view.setPosition(face.x, face.y);
    view.setDiameter(diameter);
    view.show();
  },

  hideFaces: function() {
    this.faces.forEach(function(faceView) {
      faceView.hide();
    });
  },

  clear: function() {
    var self = this;
    this.faces.forEach(function(faceView) {
      self.el.removeChild(faceView.el);
    });
    this.faces = [];
  }

});

});
