suite('ScreenLockPasscode > ', function() {
  'use strict';

  var realMozSettings;
  var screenLockPanel;
  var PasscodeHelper;
  var mockPromise;
  var modules = [
    'shared_mocks/mock_navigator_moz_settings',
    'shared_mocks/mock_promise',
    'panels/screen_lock_passcode/panel',
    'shared/passcode_helper'
  ];
  var maps = {
    '*': {
      'modules/settings_service': 'unit/mock_settings_service',
      'shared/passcode_helper': 'MockPasscodeHelper',
      'modules/dialog_panel': 'MockDialogPanel'
    }
  };

  suiteSetup(function() {
    realMozSettings = window.navigator.mozSettings;
  });

  suiteTeardown(function() {
    window.navigator.mozSettings = realMozSettings;
  });

  setup(function(done) {
    var requireCtx = testRequire([], maps, function() {});

    var MockPasscodeHelper = {
      set: function() {},
      check: function() {}
    };
    define('MockPasscodeHelper', function() {
      return MockPasscodeHelper;
    });

    define('MockDialogPanel', function() {
      // we directly pass out the whole options !
      return function(options) {
        options.cancel = function() {};
        options.submit = function() {};
        return options;
      };
    });

    requireCtx(modules, function(MockNavigatorSettings, MockPromise,
      ScreenLockPanel, MockPasscodeHelper) {
        window.navigator.mozSettings = MockNavigatorSettings;
        mockPromise = MockPromise;
        PasscodeHelper = MockPasscodeHelper;
        screenLockPanel = ScreenLockPanel();
        screenLockPanel.onInit(getFakePanelElement());
        done();
    });
  });

  suite('when clicking on passcodeContainer', function() {
    setup(function() {
      this.sinon.stub(screenLockPanel._elements.passcodeInput, 'focus');
      screenLockPanel._elements.passcodeContainer.click();
    });

    test('we would focus passcodeInput', function() {
      assert.ok(screenLockPanel._elements.passcodeInput.focus.called);
    });
  });

  suite('_checkPasscode > ', function() {
    suiteSetup(function() {
      screenLockPanel._passcodeBuffer = '';
    });

    setup(function() {
      this.sinon.stub(screenLockPanel, '_showErrorMessage');
      this.sinon.stub(screenLockPanel, '_hideErrorMessage');
    });

    suite('passcode is different', function() {
      setup(function() {
        this.sinon.stub(PasscodeHelper, 'check')
          .returns(Promise.resolve(false));
      });
      test('we would show error message', function(done) {
        screenLockPanel._checkPasscode().then(() => {
          assert.ok(screenLockPanel._showErrorMessage.called);
        }).then(done, done);
      });
    });

    suite('passcode is the same', function() {
      setup(function() {
        this.sinon.stub(PasscodeHelper, 'check')
          .returns(Promise.resolve(true));
      });
      test('we would hide error message', function(done) {
        screenLockPanel._checkPasscode().then(() => {
          assert.ok(screenLockPanel._hideErrorMessage.called);
        }).then(done, done);
      });
    });
  });

  suite('_onPasscodeInputKeypress > ', function() {
    var cachedSetOptions;
    var cachedSetPromise;
    // var cachedSetResolve;

    setup(function() {
      this.sinon.stub(screenLockPanel, '_showErrorMessage');
      this.sinon.stub(screenLockPanel, '_showDialogInMode');
      this.sinon.stub(screenLockPanel, '_updatePassCodeUI');
      this.sinon.stub(screenLockPanel, 'cancel');

      this.sinon.stub(window.navigator.mozSettings, 'createLock', function() {
        return {
          set: function(options) {
            cachedSetOptions = options;
            cachedSetPromise = new mockPromise();
            return cachedSetPromise;
          }
        };
      });
    });

    suite('basic check > ', function() {
      suite('only accepts events from the keypad', function() {
        var fakeEvent;
        setup(function() {
          fakeEvent = {
            preventDefault: sinon.spy()
          };
        });

        test('numbers', function() {
          fakeEvent.keyCode = 0;
          screenLockPanel._onPasscodeInputKeypress(fakeEvent);
          assert.ok(fakeEvent.preventDefault.called);
        });

        test('backspace', function() {
          fakeEvent.keyCode = 8;
          screenLockPanel._onPasscodeInputKeypress(fakeEvent);
          assert.ok(fakeEvent.preventDefault.called);
        });

        test('others', function() {
          fakeEvent.keyCode = 100;
          screenLockPanel._onPasscodeInputKeypress(fakeEvent);
          assert.ok(fakeEvent.preventDefault.notCalled);
        });
      });
    });

    suite('create/new lock > ', function() {
      suite('with right passcode', function() {
        setup(function() {
          // we would add one more 0 (charCode = 48)
          screenLockPanel._passcodeBuffer = '0000000';
          screenLockPanel._mode = 'create';
          screenLockPanel._onPasscodeInputKeypress({
            charCode: 48,
            keyCode: 0,
            preventDefault: function() {}
          });
        });
        test('enable button', function() {
          assert.isFalse(screenLockPanel._elements.submitButton.disabled);
        });
      });

      suite('with wrong passcode', function() {
        setup(function() {
          // we would add one more 1 (charCode = 49)
          screenLockPanel._passcodeBuffer = '0000000';
          screenLockPanel._mode = 'create';
          screenLockPanel._onPasscodeInputKeypress({
            charCode: 49,
            keyCode: 0,
            preventDefault: function() {}
          });
        });
        test('show error message, clean passcodeBuffer', function() {
          assert.ok(screenLockPanel._showErrorMessage.called);
          assert.equal(screenLockPanel._passcodeBuffer, '');
        });
      });
    });

    suite('confirm > ', function() {
      suite('with right passcode', function() {
        setup(function() {
          var promise = new mockPromise();
          this.sinon.stub(screenLockPanel, '_checkPasscode')
            .returns(promise);
          // we would add one more 0 (charCode = 48)
          screenLockPanel._passcodeBuffer = '000';
          screenLockPanel._mode = 'confirm';
          screenLockPanel._onPasscodeInputKeypress({
            charCode: 48,
            keyCode: 0,
            preventDefault: function() {}
          });
          promise.mFulfillToValue(true);
          cachedSetPromise.mFulfillToValue(true);
        });
        // check resolve promise here
        test('passcode is turned off', function() {
          assert.deepEqual(cachedSetOptions, {
            'lockscreen.passcode-lock.enabled': false
          });
        });
        test('we would back to screenLock', function() {
          assert.ok(screenLockPanel.cancel.called);
        });
      });

      suite('with wrong passcode', function() {
        setup(function() {
          var promise = new mockPromise();
          this.sinon.stub(screenLockPanel, '_checkPasscode')
            .returns(promise);
          // we would add one more 0 (charCode = 48)
          screenLockPanel._passcodeBuffer = '000';
          screenLockPanel._mode = 'confirm';
          screenLockPanel._onPasscodeInputKeypress({
            charCode: 48,
            keyCode: 0,
            preventDefault: function() {}
          });
          promise.mFulfillToValue(false);
        });
        test('we would reset passcodeBuffer', function() {
          assert.equal(screenLockPanel._passcodeBuffer, '');
        });
      });
    });

    suite('confirmLock > ', function() {
      suite('with right passcode', function() {
        setup(function() {
          var promise = new mockPromise();
          this.sinon.stub(screenLockPanel, '_checkPasscode')
            .returns(promise);
          // we would add one more 0 (charCode = 48)
          screenLockPanel._passcodeBuffer = '000';
          screenLockPanel._mode = 'confirmLock';
          screenLockPanel._onPasscodeInputKeypress({
            charCode: 48,
            keyCode: 0,
            preventDefault: function() {}
          });
          promise.mFulfillToValue(true);
          cachedSetPromise.mFulfillToValue(false);
        });
        test('passcode and lockscreen are turned off', function() {
          assert.deepEqual(cachedSetOptions, {
            'lockscreen.enabled': false,
            'lockscreen.passcode-lock.enabled': false
          });
        });
        test('we would back to screenLock', function() {
          assert.ok(screenLockPanel.cancel.called);
        });
      });

      suite('with wrong passcode', function() {
        setup(function() {
          var promise = new mockPromise();
          this.sinon.stub(screenLockPanel, '_checkPasscode')
            .returns(promise);
          // we would add one more 0 (charCode = 48)
          screenLockPanel._passcodeBuffer = '000';
          screenLockPanel._mode = 'confirmLock';
          screenLockPanel._onPasscodeInputKeypress({
            charCode: 48,
            keyCode: 0,
            preventDefault: function() {}
          });
          promise.mFulfillToValue(false);
        });
        test('we would reset passcodeBuffer', function() {
          assert.equal(screenLockPanel._passcodeBuffer, '');
        });
      });
    });

    suite('edit > ', function() {
      suite('with right passcode', function() {
        setup(function() {
          var promise = new mockPromise();
          this.sinon.stub(screenLockPanel, '_checkPasscode')
            .returns(promise);
          // we would add one more 0 (charCode = 48)
          screenLockPanel._passcodeBuffer = '000';
          screenLockPanel._mode = 'edit';
          screenLockPanel._onPasscodeInputKeypress({
            charCode: 48,
            keyCode: 0,
            preventDefault: function() {}
          });
          promise.mFulfillToValue(true);
        });
        test('we would do a lot', function() {
          assert.ok(screenLockPanel._updatePassCodeUI.called);
          assert.ok(screenLockPanel._showDialogInMode.calledWith('new'));
          assert.equal(screenLockPanel._passcodeBuffer, '');
        });
      });

      suite('with wrong passcode', function() {
        setup(function() {
          var promise = new mockPromise();
          this.sinon.stub(screenLockPanel, '_checkPasscode')
            .returns(promise);
          // we would add one more 0 (charCode = 48)
          screenLockPanel._passcodeBuffer = '000';
          screenLockPanel._mode = 'edit';
          screenLockPanel._onPasscodeInputKeypress({
            charCode: 48,
            keyCode: 0,
            preventDefault: function() {}
          });
          promise.mFulfillToValue(false);
        });
        test('we would reset passcodeBuffer', function() {
          assert.equal(screenLockPanel._passcodeBuffer, '');
        });
      });
    });
  });

  suite('onBeforeShow > ', function() {
    setup(function() {
      this.sinon.stub(screenLockPanel, '_showDialogInMode');
    });

    suite('if users left panel by home', function() {
      setup(function() {
        screenLockPanel._leftApp = true;
        screenLockPanel.onBeforeShow({}, 'create');
      });

      test('we would not re-show dialog again', function() {
        assert.isFalse(screenLockPanel._showDialogInMode.called);
      });
    });

    suite('if users left panel by back button', function() {
      setup(function() {
        screenLockPanel._leftApp = false;
        screenLockPanel.onBeforeShow({}, 'create');
      });

      test('we would re-show dialog again', function() {
        assert.isTrue(screenLockPanel._showDialogInMode.called);
      });
    });
  });

  suite('onHide > ', function() {
    var realDocumentHidden = document.hidden;
    var isLeavingByHomeButton = true;

    setup(function() {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: function() {
          return isLeavingByHomeButton;
        }
      });

      screenLockPanel._mode = 'edit';
      screenLockPanel._passcodeBuffer = '012';
    });

    teardown(function() {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: function() {
          return realDocumentHidden;
        }
      });
    });

    test('we won\'t clean up the buffer if users click on home key',
      function() {
        isLeavingByHomeButton = true;
        screenLockPanel.onHide();
        assert.equal(screenLockPanel._passcodeBuffer, '012');
    });

    test('we will clean up the buffer if users leave by clicking button',
      function() {
        isLeavingByHomeButton = false;
        screenLockPanel.onHide();
        assert.equal(screenLockPanel._passcodeBuffer, '');
    });
  });

  function getFakePanelElement() {
    var fakePanel = document.createElement('div');

    var gaiaHeader = document.createElement('fxos-header');
    var h1 = document.createElement('h1');
    gaiaHeader.appendChild(h1);

    var passcodeInput = document.createElement('input');
    passcodeInput.classList.add('passcode-input');
    var passcodeContainer = document.createElement('div');
    passcodeContainer.classList.add('passcode-container');

    var submitButton = document.createElement('button');
    submitButton.type = 'submit';
    var submitButtonText = document.createElement('span');
    submitButton.appendChild(submitButtonText);

    for (var i = 0; i < 8; i++) {
      var passcodeDigit = document.createElement('div');
      passcodeDigit.classList.add('passcode-digit');
      fakePanel.appendChild(passcodeDigit);
    }

    fakePanel.appendChild(gaiaHeader);
    fakePanel.appendChild(passcodeInput);
    fakePanel.appendChild(passcodeContainer);
    fakePanel.appendChild(submitButton);

    return fakePanel;
  }
});
