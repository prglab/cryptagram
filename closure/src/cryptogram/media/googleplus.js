goog.provide('cryptogram.media.googleplus');

goog.require('cryptogram.media.generic');

/**
 * @constructor
 * @extends {cryptogram.media.generic}
 */
cryptogram.media.googleplus = function(URL) {
  cryptogram.media.generic.call(this, URL);
};
goog.inherits(cryptogram.media.googleplus, cryptogram.media.generic);

/** @inheritDoc */
cryptogram.media.googleplus.prototype.matchesURL = function() {
  var regex=new RegExp(/^http:\/\/plus.google.com/);
  return regex.test(this.URL);
}

/** @inheritDoc */
cryptogram.media.googleplus.prototype.name = function() {
  return "Google Plus";
};