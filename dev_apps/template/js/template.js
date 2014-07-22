'use strict';

window.addEventListener('load', function() {
  var loading = window.performance.timing.domLoading;
  var loaded = window.performance.timing.domComplete;

  console.log('loaded: %s', loaded - loading);
  console.log(window.performance);

});
