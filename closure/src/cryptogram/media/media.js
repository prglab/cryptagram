goog.provide('cryptogram.media');


/**
 * @constructor
 */
cryptogram.media = function(URL) {
  this.URL = URL;
};

cryptogram.media.prototype.name = goog.abstractMethod;

cryptogram.media.prototype.matchesURL = goog.abstractMethod;

cryptogram.media.prototype.getAlbumName = goog.abstractMethod;

cryptogram.media.prototype.getPhotoName = goog.abstractMethod;

//cryptogram.media.prototype.loadContainer = goog.abstractMethod;

cryptogram.media.prototype.getImages = goog.abstractMethod;


cryptogram.media.prototype.loadContainer = function(URL) {
  var images = this.getImages(URL);
  return new cryptogram.container(images[0]);
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