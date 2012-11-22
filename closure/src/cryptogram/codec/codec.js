goog.provide('cryptogram.codec');

/**
 * @constructor
 */
cryptogram.codec = function() {};

cryptogram.codec.prototype.name = goog.abstractMethod;

cryptogram.codec.prototype.processImage = goog.abstractMethod;

cryptogram.codec.prototype.getChunk = goog.abstractMethod;

cryptogram.codec.prototype.getHeader = goog.abstractMethod;

cryptogram.codec.prototype.base64Values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

cryptogram.codec.prototype.quality = .64;

cryptogram.codec.prototype.setImage = function(img) {};

cryptogram.codec.prototype.test = function(img, imageData) {
  var header = this.getHeader(img, imageData);
  return (header == this.name());
};

cryptogram.codec.prototype.decodeProgress = function() {
  return "Unknown";
}
