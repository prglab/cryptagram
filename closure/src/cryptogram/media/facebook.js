goog.provide('cryptogram.media.facebook');

goog.require('cryptogram.media.generic');

/**
 * @constructor
 * @extends {cryptogram.media.generic}
 */
cryptogram.media.facebook = function(URL) {
  cryptogram.media.generic.call(this, URL);
};
goog.inherits(cryptogram.media.facebook, cryptogram.media.generic);

/** @inheritDoc */
cryptogram.media.facebook.prototype.matchesURL = function() {
  var regex=new RegExp(/^http:\/\/www.facebook.com/);
  return regex.test(this.URL);
}

/** @inheritDoc */
cryptogram.media.facebook.prototype.name = function() {
  return "Facebook context";
};