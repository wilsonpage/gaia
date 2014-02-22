suite('lib/setting', function() {
  'use strict';
  var require = window.req;

  suiteSetup(function(done) {
    var self = this;
    require(['lib/setting'], function(Setting) {
      self.Setting = Setting;
      done();
    });
  });

  suite('Setting()', function() {
    test('Should store the key on self', function() {
      var setting = new this.Setting({ key: 'mykey', options: [] });
      assert.ok(setting.key === 'mykey');
    });

    test('Should save when selection is change, only if marked as `persistent`', function() {
      var on = sinon.spy(this.Setting.prototype, 'on');
      var settings1 = new this.Setting({
        key: 'key',
        persistent: true,
        options: []
      });

      assert.ok(on.calledWith('change:selected', settings1.save));
      on.reset();

      var settings2 = new this.Setting({ key: 'key', options: [] });
      assert.ok(!on.calledWith('change:selected', settings2.save));
    });

    test('Should default to selecting first option if ' +
    '`selected` is undefined', function() {
      var setting = new this.Setting({
        key: 'key',
        options: [
          { key: 'a' },
          { key: 'b' }
        ]
      });

      assert.ok(setting.get('selected') === 'a');
    });
  });

  suite('Setting#select()', function() {
    setup(function() {
      this.setting = new this.Setting({
        key: 'key',
        options: [
          { key: 'a' },
          { key: 'b' }
        ]
      });
    });

    test('Should select the first option if no key match', function() {
      this.setting.select('b');
      assert.ok(this.setting.get('selected') === 'b');

      // Fallback to first
      this.setting.select('c');
      assert.ok(this.setting.get('selected') === 'a');
      this.setting.select(3);
      assert.ok(this.setting.get('selected') === 'a');
    });
  });

  suite('Setting#resetOptions()', function() {
    setup(function() {
      this.setting = new this.Setting({
        key: 'key',
        options: [
          { key: 'a' },
          { key: 'b' },
          { key: 'c' }
        ]
      });
    });

    test('Should filter the list down be just suppled keys', function() {
      this.setting.resetOptions(['a', 'c']);

      var list = this.setting.get('options');
      var found = {};

      list.forEach(function(item) { found[item.key] = true; });

      assert.ok(!found.b);
      assert.ok(found.a);
      assert.ok(found.c);
    });

    test('Should accept an Object as well as an Array', function() {
      this.setting.resetOptions({
        a: {},
        c: {}
      });

      var list = this.setting.get('options');
      var found = {};

      list.forEach(function(item) { found[item.key] = true; });

      assert.ok(!found.b);
      assert.ok(found.a);
      assert.ok(found.c);
    });

    test('Should accept an Array of Objects with `key` properties', function() {
      this.setting.resetOptions([
        { key: 'a' },
        { key: 'c' }
      ]);

      var list = this.setting.get('options');
      var found = {};

      list.forEach(function(item) { found[item.key] = true; });

      assert.ok(!found.b);
      assert.ok(found.a);
      assert.ok(found.c);
    });

    test('Should sort the options list by the original config index', function() {
      this.setting.resetOptions([
        { key: 'b' },
        { key: 'a' }
      ]);

      var list = this.setting.get('options');
      assert.ok(list[0].key === 'a');
      assert.ok(list[1].key === 'b');
    });

    test('Should fire a `optionsreset` event', function() {
      var spy = sinon.spy();
      this.setting.on('optionsreset', spy);
      this.setting.resetOptions(['a', 'b']);
      assert.ok(spy.called);
    });
  });

  suite('Setting#selected()', function() {
    setup(function() {
      this.setting = new this.Setting({
        key: 'key',
        options: [
          { key: 'a', title: 'i am a' },
          { key: 'b', title: 'i am b'  },
          { key: 'c', title: 'i am c'  }
        ]
      });
    });

    test('Should return the currently selected option', function() {
      var selected = this.setting.selected();
      assert.ok(selected.title === 'i am a');

      this.setting.select('b');

      selected = this.setting.selected();
      assert.ok(selected.title === 'i am b');
    });
  });

  suite('Setting#value()', function() {
    setup(function() {
      this.setting = new this.Setting({
        key: 'key',
        options: [
          { key: 'a' },
          { key: 'b', value: 'detail'  }
        ]
      });
    });

    test('Should return the `key` if no value was defined', function() {
      var value = this.setting.value();
      assert.ok(value === 'a');
    });

    test('Should return the `value` if defined', function() {
      this.setting.select(1);
      var value = this.setting.value();
      assert.ok(value === 'detail');
    });
  });

  suite('Setting#next()', function() {
    setup(function() {
      this.setting = new this.Setting({
        key: 'key',
        options: [
          { key: 'a' },
          { key: 'b' },
          { key: 'c' }
        ]
      });
    });

    test('Should set the `selected` value to the next option', function() {
      this.setting.next();
      assert.ok(this.setting.selected().key === 'b');
      this.setting.next();
      assert.ok(this.setting.selected().key === 'c');
      this.setting.next();
      assert.ok(this.setting.selected().key === 'a');
    });
  });
});
