goog.provide('cryptagram.media.image');

goog.require('cryptagram.container.url');
goog.require('cryptagram.media');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.media}
 */
cryptagram.media.image = function() {};
goog.inherits(cryptagram.media.image, cryptagram.media);

cryptagram.media.image.prototype.logger = goog.debug.Logger.getLogger('cryptagram.media.image');



/** @inheritDoc */
cryptagram.media.image.prototype.name = function() {
  return "JPEG Image";
};


/** @inheritDoc */
cryptagram.media.image.prototype.matchesURL = function(URL) {
  var regex=new RegExp(/jpg$/i);
  return regex.test(URL);
};


/** @inheritDoc */
cryptagram.media.image.prototype.getImages = function(opt_URL) {
  return document.getElementsByTagName("img");
};


/** @inheritDoc */
cryptagram.media.image.prototype.getPhotoName = function() {
  return window.location.toString();
};


/** @inheritDoc */
cryptagram.media.image.prototype.getAlbumName = function() {
  return null;
};


/** @inheritDoc */
cryptagram.media.image.prototype.loadContainer = function(URL) {
  var images = this.getImages(URL);  
  var container = new cryptagram.container.url(images[0]);
  return container;
};
