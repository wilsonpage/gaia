(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSToast"] = factory(require("fxos-component"));
	else
		root["FXOSToast"] = factory(root["fxosComponent"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Dependencies
	 */

	var component = __webpack_require__(1);

	/**
	 * Exports
	 */

	module.exports = component.register('fxos-toast', {
	  created() {
	    this.setupShadowRoot();

	    this.els = {
	      inner: this.shadowRoot.querySelector('.inner'),
	      bread: this.shadowRoot.querySelector('.bread')
	    };

	    this.timeout = this.getAttribute('timeout');
	  },

	  show() {
	    this.els.bread.removeEventListener('animationend', this.onAnimateOutEnd);
	    clearTimeout(this.hideTimeout);

	    this.els.inner.classList.add('visible');
	    var reflow = this.els.inner.offsetTop; // jshint ignore: line
	    this.els.bread.classList.remove('animate-out');
	    this.els.bread.classList.add('animate-in');
	    this.hideTimeout = setTimeout(this.hide.bind(this), this.timeout);
	  },

	  hide() {
	    clearTimeout(this.hideTimeout);
	    this.els.bread.classList.remove('animate-in');
	    this.els.bread.classList.add('animate-out');

	    this.els.bread.removeEventListener('animationend', this.onAnimateOutEnd);

	    this.onAnimateOutEnd = () => {
	      this.els.bread.removeEventListener('animationend', this.onAnimateOutEnd);
	      this.els.bread.classList.remove('animate-out');
	      this.els.inner.classList.remove('visible');
	    };

	    this.els.bread.addEventListener('animationend', this.onAnimateOutEnd);
	  },

	  animateOut() {},

	  attrs: {
	    timeout: {
	      get: function() { return this.getAttribute('timeout') || 1000; },
	      set: function(value) {
	        var current = this.getAttribute('timeout');
	        if (current == value) { return; }
	        else if (!value) { this.removeAttribute('timeout'); }
	        else { this.setAttribute('timeout', value); }
	      }
	    }
	  },

	  template: `
	    <div class="inner" role="alert">
	      <div class="bread">
	        <content></content>
	      </div>
	    </div>
	    <style>
	      :host {
	        position: fixed;
	        left: 0;
	        bottom: 0;
	        z-index: 100;

	        width: 100%;

	        font-size: 17px;
	        font-weight: 300;
	        font-style: italic;
	        text-align: center;
	        color: var(--fxos-toast-color, #4d4d4d);
	      }

	      .inner {
	        display: none;
	        padding: 16px;
	      }

	      .inner.visible {
	        display: block;
	      }

	      .bread {
	        max-width: 600px;
	        margin: 0 auto;
	        padding: 16px;

	        box-shadow: 0px 1px 0px 0px rgba(0, 0, 0, 0.15);
	        transform: translateY(100%);

	        background:
	          var(--fxos-toast-background,
	          #fff);
	      }

	      .bread.animate-in {
	        animation-name: fxos-toast-enter;
	        animation-fill-mode: forwards;
	        animation-duration: 200ms;
	      }

	      .bread.animate-out {
	        animation-name: fxos-toast-leave;
	        animation-duration: 600ms;
	        transform: translateY(0%);
	      }
	    </style>`,

	  globalCss: `
	    @keyframes fxos-toast-enter {
	      0% {
	        transform: translateY(100%);
	        opacity: 0;
	      }

	      40% { opacity: 0; }

	      100% {
	        transform: translateY(0%);
	        opacity: 1;
	      }
	    }

	    @keyframes fxos-toast-leave {
	      0% { opacity: 1 }
	      100% { opacity: 0 }
	    }`
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }
/******/ ])
});
;