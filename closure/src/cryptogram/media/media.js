goog.provide('cryptogram.media');

goog.require('cryptogram.util');


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


cryptogram.media.prototype.containers = {};

cryptogram.media.prototype.setContainerSrc = function(container, src) {
  var check = cryptogram.util.SHA1(src);
  this.containers[check] = container;
  container.setSrc(src);
};


cryptogram.media.prototype.getContainer = function(data) {
  var check = cryptogram.util.SHA1(data);

  if (this.containers[check]) {
    return this.containers[check];
  }
  return null;
};