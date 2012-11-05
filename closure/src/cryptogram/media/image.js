goog.provide('cryptogram.media.image');

goog.require('cryptogram.container');
goog.require('cryptogram.media');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptogram.media}
 */
cryptogram.media.image = function() {};
goog.inherits(cryptogram.media.image, cryptogram.media);

cryptogram.media.image.prototype.logger = goog.debug.Logger.getLogger('cryptogram.media.image');



/** @inheritDoc */
cryptogram.media.image.prototype.name = function() {
  return "JPEG Image";
};


/** @inheritDoc */
cryptogram.media.image.prototype.matchesURL = function(URL) {
  var regex=new RegExp(/jpg$/i);
  return regex.test(URL);
};


/** @inheritDoc */
cryptogram.media.image.prototype.getImages = function(opt_URL) {
  return document.getElementsByTagName("img");
};


/** @inheritDoc */
cryptogram.media.image.prototype.getPhotoName = function() {
  return window.location.toString();
};


/** @inheritDoc */
cryptogram.media.image.prototype.getAlbumName = function() {
  return null;
};


/** @inheritDoc */
cryptogram.media.image.prototype.setContainerSrc = function(container, src) {
    window.location = src;
};


/** @inheritDoc */
cryptogram.media.image.prototype.loadContainer = function(URL) {
  var container =  cryptogram.media.loadContainer.call(this, URL);
  container.singleImageMode();
  return container;
};
