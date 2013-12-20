define(function(require, exports, module) {
'use strict';

/**
 * Module Dependencies
 */

var parseJpegMetadata = require('jpegMetaDataParser');

/**
 * Exports
 */

module.exports = function(image, done) {
  if (!image.preview) {
    done(null, {});
    return;
  }

  var start = image.preview.start;
  var end = image.preview.end;
  var previewBlob = image.blob.slice(start, end, 'image/jpeg');
  parseJpegMetadata(previewBlob, onSuccess, onError);

  // If we parsed the preview image, add its
  // dimensions to the metdata.preview
  // object, and then let the MediaFrame
  // object display the preview instead of
  // the full-size image.
  function onSuccess(metadata) {
    done(null, {
      blob: previewBlob,
      width: metadata.width,
      height: metadata.height
    });
   }

  // If we couldn't parse the preview image,
  // just display full-size.
  function onError() {
    done('could not parse blob');
  }
};

});