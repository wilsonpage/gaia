/* global bridge, View */
'use strict';

/**
 * Mini Logger
 *
 * @type {Function}
 * @private
 */
var debug = View.debug('AlbumDetailView');

var AlbumDetailView = View.extend(function AlbumDetailView() {
  View.call(this); // super();

  this.list = document.getElementById('list');

  this.list.configure({

    // We won't need this after <gaia-fast-list>
    // gets proper dynamic <template> input
    populateItem: function(el, i) {
      var data = this.getRecordAt(i);

      var link = el.querySelector('a');
      var title = el.querySelector('h3');

      link.href = `/player?id=${data.name}`;
      link.dataset.filePath = data.name;

      title.firstChild.data = data.metadata.title;
    }
  });

  // Triggers player service to begin playing the track.
  // This works for now, but we might have the PlayerView
  // take care of this task as it's a big more webby :)
  this.list.addEventListener('click', (evt) => {
    var link = evt.target.closest('a[data-file-path]');
    if (link) {
      this.queueAlbum(link.dataset.filePath);
    }
  });

  View.preserveListScrollPosition(this.list);

  this.client.on('databaseChange', () => this.update());

  this.update();
});

AlbumDetailView.prototype.update = function() {
  this.getAlbum().then((songs) => {
    this.songs = songs;
    this.render();
  });
};

AlbumDetailView.prototype.destroy = function() {
  this.client.destroy();

  View.prototype.destroy.call(this); // super(); // Always call *last*
};

AlbumDetailView.prototype.title = 'Albums';

AlbumDetailView.prototype.render = function() {
  View.prototype.render.call(this); // super();

  this.list.model = this.songs;
};

AlbumDetailView.prototype.getAlbum = function() {
  return this.fetch('/api/albums/info/' + this.params.id)
    .then(response => response.json());
};

AlbumDetailView.prototype.queueAlbum = function(filePath) {
  this.fetch('/api/queue/album/' + filePath);
};

window.view = new AlbumDetailView();
