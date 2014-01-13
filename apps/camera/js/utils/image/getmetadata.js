define (function(require, exports, module) {
'use strict';

/**
 * Module Dependencies
 */

var parseJpegMetadata = require('jpegMetaDataParser');

module.exports = function(blob, done) {
  parseJpegMetadata(blob, function(metadata) {
    metadata.rotation = metadata.rotation || 0;
    metadata.mirrored = metadata.mirrored || false;
    done(metadata);
  });
};

});