goog.provide('cryptagram.codec.chrominance');

goog.require('cryptagram.codec');
goog.require('cryptagram.codec.experimental');
goog.require('cryptagram.cipher.bacchant');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.codec.experimental}
 */
cryptagram.codec.chrominance = function(blockSize, quality, numberSymbols) {

  console.log('Chrominance');
  

  this.quality = quality;
  this.blockSize = blockSize;
  this.symbol_thresholds = [];
  this.base = numberSymbols;
  this.cipher = new cryptagram.cipher.bacchant();

  for (var i = 0; i < numberSymbols; i++) {
    var level = (i / (numberSymbols - 1)) * 255;
    this.symbol_thresholds.push(Math.round(level));
  }  
};

goog.inherits(cryptagram.codec.chrominance, cryptagram.codec.experimental);

cryptagram.codec.chrominance.prototype.logger = goog.debug.Logger.getLogger('cryptagram.codec.chrominance');



/** @inheritDoc */
cryptagram.codec.chrominance.prototype.set_pixel = function(x, y, r, g, b) {
  var idx = 4 * (x + y * this.width);
  //set RGB channels to same level since we're encoding data as grayscale
  this.data[idx] = r;
  this.data[idx + 1] = g * 1.1;
  this.data[idx + 2] = b;
  this.data[idx + 3] = 255; // alpha channel
};

/** @inheritDoc */
cryptagram.codec.chrominance.prototype.set_block = function(x_start, y_start, level) {

  for (var i = 0; i < this.blockSize; i++) {
    for (var j = 0; j < this.blockSize; j++) {
      this.set_pixel(x_start + i, y_start + j, level, level, level);
    }
  }
};

/** @inheritDoc */
cryptagram.codec.chrominance.prototype.name = function() {
  return "chromina";
};