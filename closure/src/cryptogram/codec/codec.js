goog.provide('cryptogram.codec');

/**
 * @constructor
 */
cryptogram.codec = function() {};

cryptogram.codec.prototype.name = goog.abstractMethod;

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

cryptogram.codec.prototype.set_pixel = function(x, y, r, g, b) {
  var idx = 4 * (x + y * this.width);
  //set RGB channels to same level since we're encoding data as grayscale
  this.data[idx] = r;
  this.data[idx + 1] = g;
  this.data[idx + 2] = b;
  this.data[idx + 3] = 255; // alpha channel
};

cryptogram.codec.prototype.set_block = function(x_start, y_start, level) {
  for (var i = 0; i < this.blockSize; i++) {
    for (var j = 0; j < this.blockSize; j++) {
      this.set_pixel(x_start + i, y_start + j, level, level, level);
    }
  }
};

