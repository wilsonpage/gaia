suite('controllers/storage', function() {
  'use strict';

  suiteSetup(function(done) {
    var self = this;
    req([
      'controllers/storage',
      'lib/setting',
      'lib/storage',
      'app'
    ], function(StorageController, Setting, Storage, App) {
      self.StorageController = StorageController.StorageController;
      self.Setting = Setting;
      self.Storage = Storage;
      self.App = App;
      done();
    });
  });

  setup(function() {
    this.app = sinon.createStubInstance(this.App);
    this.app.storage = sinon.createStubInstance(this.Storage);
    this.app.storage.createVideoFilepath = 'test';
    this.app.camera = {};
    this.app.settings = {
      pictureSizes: sinon.createStubInstance(this.Setting)
    };

    // Aliases
    this.camera = this.app.camera;
    this.settings = this.app.settings;
    this.storage = this.app.storage;

    // Create a test instance
    this.controller = new this.StorageController(this.app);
  });

  suite('StorageController()', function() {
    test('Should set the camera `camera.createVideoFilepath`', function() {
      assert.equal(this.camera.createVideoFilepath, 'test');
    });

    test('Should update maxFileSize when picture size changes', function() {
      var on = this.settings.pictureSizes.on;
      assert.isTrue(on.calledWith('change:selected', this.controller.updateMaxFileSize));
    });

    test('Should update maxFileSize when settings are configured', function() {
      assert.isTrue(this.app.on.calledWith('settings:configured', this.controller.updateMaxFileSize));
    });

    test('Should delete a picture from storage when one is deleted from the preview gallery', function() {
      assert.isTrue(this.app.on.calledWith('previewgallery:deletepicture', this.storage.deletePicture));
    });

    test('Should delete a video from storage when one is deleted from the preview gallery', function() {
      assert.isTrue(this.app.on.calledWith('previewgallery:deletevideo', this.storage.deleteVideo));
    });

    test('Should media when the camera generates it', function() {
      assert.isTrue(this.app.on.calledWith('camera:newimage', this.controller.storePicture));
      assert.isTrue(this.app.on.calledWith('camera:newvideo', this.controller.storeVideo));
    });

    test('Should check storage when the app becomes visible', function() {
      assert.isTrue(this.app.on.calledWith('visible', this.storage.check));
    });
  });
});
