goog.provide('cryptogram.media');


/**
 * @constructor
 */
cryptogram.media = function() {};

cryptogram.media.prototype.name = goog.abstractMethod;

cryptogram.media.prototype.matchesURL = goog.abstractMethod;

cryptogram.media.prototype.getAlbumName = goog.abstractMethod;

cryptogram.media.prototype.getPhotoName = goog.abstractMethod;

cryptogram.media.prototype.getImages = goog.abstractMethod;

cryptogram.media.prototype.loadContainer = function(URL) {
  
  var images = this.getImages(URL);
  var container = new cryptogram.container(images[0]);
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