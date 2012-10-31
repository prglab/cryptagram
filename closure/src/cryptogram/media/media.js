goog.provide('cryptogram.media');


/**
 * @constructor
 */
cryptogram.media = function() {
  this.containers = {};
};

cryptogram.media.prototype.name = goog.abstractMethod;

cryptogram.media.prototype.matchesURL = goog.abstractMethod;

cryptogram.media.prototype.getAlbumName = goog.abstractMethod;

cryptogram.media.prototype.getPhotoName = goog.abstractMethod;

//cryptogram.media.prototype.loadContainer = goog.abstractMethod;

cryptogram.media.prototype.getImages = goog.abstractMethod;


cryptogram.media.prototype.loadContainer = function(URL) {
  if (this.containers[URL]) {
    return this.containers[URL];
  }
  var images = this.getImages(URL);
  var container = new cryptogram.container(images[0]);
  this.containers[URL] = container;
  return container;
};


cryptogram.media.prototype.fixURL = function(URL) {
  return URL;
};

cryptogram.media.prototype.onReady = function(callback) {
  callback();
};

cryptogram.media.prototype.setContainerSrc = function(container, src) {
    container.setSrc(src);
};