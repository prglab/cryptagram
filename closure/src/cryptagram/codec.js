goog.provide('cryptagram.codec');

/**
 * @constructor
 */
cryptagram.codec = function() {};

cryptagram.codec.prototype.name = goog.abstractMethod;

cryptagram.codec.prototype.getChunk = goog.abstractMethod;

cryptagram.codec.prototype.getHeader = goog.abstractMethod;

cryptagram.codec.dimensions = goog.abstractMethod;

cryptagram.codec.maxBase64Values = goog.abstractMethod;

cryptagram.codec.prototype.base64Values = 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

cryptagram.codec.prototype.quality = .74;

cryptagram.codec.prototype.setImage = function(img) {};

cryptagram.codec.prototype.test = function(img, imageData) {
  var header = this.getHeader(img, imageData);
  this.logger.info('Header string: ' + header);

  return (header == this.name());
};

cryptagram.codec.prototype.decodeProgress = function() {
  return 'Unknown';
};

cryptagram.codec.prototype.decrypt = function(password) {
  return this.cipher.decrypt(this.decodeData, password);
};

cryptagram.codec.prototype.encrypt = function(data, password) {
  return this.cipher.encrypt(data, password);
};

cryptagram.codec.prototype.set_pixel = function(x, y, r, g, b) {
  var idx = 4 * (x + y * this.width);
  //set RGB channels to same level since we're encoding data as grayscale
  this.data[idx] = r;//Math.floor(Math.random() * 256);
  this.data[idx + 1] = g;//Math.floor(Math.random() * 256);
  this.data[idx + 2] = b;//Math.floor(Math.random() * 256);
  this.data[idx + 3] = 255;//r; // alpha channel
};

cryptagram.codec.prototype.set_block = function(x_start, y_start, level) {
  for (var i = 0; i < this.blockSize; i++) {
    for (var j = 0; j < this.blockSize; j++) {
      this.set_pixel(x_start + i, y_start + j, level, level, level);
    }
  }
};

cryptagram.codec.prototype.getErrorCount = function() {
  return 'unknown';
}

