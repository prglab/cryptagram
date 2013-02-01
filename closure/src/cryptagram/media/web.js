goog.provide('cryptagram.media.web');

goog.require('cryptagram.container');
goog.require('cryptagram.media');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.media}
 */
cryptagram.media.web = function() {
  cryptagram.media.call(this);
};
goog.inherits(cryptagram.media.web, cryptagram.media);

cryptagram.media.web.prototype.logger = goog.debug.Logger.getLogger('cryptagram.media.web');



/** @inheritDoc */
cryptagram.media.web.prototype.name = function() {
  return "Webpage";
};


/** @inheritDoc */
cryptagram.media.web.prototype.matchesURL = function() {
  return true;
};


/** @inheritDoc */
cryptagram.media.web.prototype.getPhotoName = function(URL) {
  return URL;
};


/** @inheritDoc */
cryptagram.media.web.prototype.getAlbumName = function() {
  return null;
};


