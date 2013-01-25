goog.provide('cryptagram.media');

goog.require('cryptagram.util');
goog.require('cryptagram.container.img');


/**
 * @constructor
 */
cryptagram.media = function() {};

cryptagram.media.prototype.name = goog.abstractMethod;

cryptagram.media.prototype.matchesURL = goog.abstractMethod;

cryptagram.media.prototype.getAlbumName = goog.abstractMethod;

cryptagram.media.prototype.getPhotoName = goog.abstractMethod;

cryptagram.media.prototype.getImages = goog.abstractMethod;

cryptagram.media.prototype.supportsAutodecrypt = false;

cryptagram.media.prototype.loadContainer = function(URL) {
  var images = this.getImages(URL);
  var container = new cryptagram.container.img(images[0]);
  return container;
};

cryptagram.media.prototype.fixURL = function(URL) {
  return URL;
};

cryptagram.media.prototype.onReady = function(callback) {
  callback();
};

cryptagram.media.prototype.containers = {};

cryptagram.media.prototype.setContainerSrc = function(container, src) {
  var check = CryptoJS.MD5(src);
  this.containers[check] = container;
  container.setSrc(src);
};


cryptagram.media.prototype.getContainer = function(data) {
  var check = CryptoJS.MD5(data);

  if (this.containers[check]) {
    return this.containers[check];
  }
  return null;
};