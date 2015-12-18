
/**
 * Dependencies
 */

var component = require('fxos-component');

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
