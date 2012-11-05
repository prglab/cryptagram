goog.provide('cryptogram.media.web');

goog.require('cryptogram.container');
goog.require('cryptogram.media');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptogram.media}
 */
cryptogram.media.web = function() {
  cryptogram.media.call(this);
};
goog.inherits(cryptogram.media.web, cryptogram.media);

cryptogram.media.web.prototype.logger = goog.debug.Logger.getLogger('cryptogram.media.web');



/** @inheritDoc */
cryptogram.media.web.prototype.name = function() {
  return "Webpage";
};


/** @inheritDoc */
cryptogram.media.web.prototype.matchesURL = function() {
  return true;
};


/** @inheritDoc */
cryptogram.media.web.prototype.getImages = function(opt_URL) {
  var images = document.getElementsByTagName("img");
  if (!opt_URL) {
    return images;
  } else {
    var valid = [];
    for (var i = 0; i < images.length; i++) {
      if (opt_URL == images[i].src) {
        valid.push(images[i]);
      }
    }
    return valid;
  }
};


/** @inheritDoc */
cryptogram.media.web.prototype.getPhotoName = function(URL) {
  return URL;
};


/** @inheritDoc */
cryptogram.media.web.prototype.getAlbumName = function() {
  return null;
};


