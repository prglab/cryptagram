goog.provide('cryptogram.codec');

/**
 * @constructor
 */
cryptogram.codec = function() {};

cryptogram.codec.prototype.name = goog.abstractMethod;

cryptogram.codec.prototype.processImage = goog.abstractMethod;

cryptogram.codec.prototype.test = goog.abstractMethod;