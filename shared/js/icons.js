'use strict';

window.addEventListener('load', function() {
  // setTimeout(function() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/shared/style/icons.css';
    document.head.appendChild(link);
    // link.addEventListener('load', function() {
    //   document.body.classList.add('icons-loaded');
    // });
  // }, 1000);
});
