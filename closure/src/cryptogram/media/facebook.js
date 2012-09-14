goog.provide('cryptogram.media.facebook');

goog.require('cryptogram.media.generic');

/**
 * @constructor
 * @extends {cryptogram.media.generic}
 */
cryptogram.media.facebook = function() {
  cryptogram.media.generic.call(this);
};
goog.inherits(cryptogram.media.facebook, cryptogram.media.generic);

/** @inheritDoc */
cryptogram.media.facebook.prototype.matchesURL = function(URL) {
  var regex=new RegExp(/^http:\/\/www.facebook.com/);
  return regex.test(URL);
}

/** @inheritDoc */
cryptogram.media.facebook.prototype.name = function() {
  return "Facebook context";
};