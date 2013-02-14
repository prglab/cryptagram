goog.provide('cryptagram.codec.chrominance');

goog.require('cryptagram.codec');
goog.require('cryptagram.codec.experimental');
goog.require('cryptagram.cipher.bacchant');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.codec.experimental}
 */
cryptagram.codec.chrominance = function(blockSize, chromaSize, quality, numberSymbols) {  

  this.chromaSize = chromaSize;
  this.chromaDelta = 12;
  
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



cryptagram.codec.chrominance.prototype.set_pixel = function(x, y, lum) {

  var cbcr = this.getChromininance(x, y);
  var cb = cbcr[0];
  var cr = cbcr[1];
  
  var r = lum + 1.402 * (cr - 128);
  var b = lum + 1.772 * (cb - 128);
  var g = lum - .34414 * (cb - 128) - 0.71414 * (cr - 128);
  
  var idx = 4 * (x + y * this.width);
  this.data[idx] = Math.round(r);
  this.data[idx + 1] = Math.round(g);
  this.data[idx + 2] = Math.round(b);
  this.data[idx + 3] = 255; // alpha channel
};


/** @inheritDoc */
cryptagram.codec.chrominance.prototype.set_block = function(x_start, y_start, level) {
  for (var i = 0; i < this.blockSize; i++) {
    for (var j = 0; j < this.blockSize; j++) {
      this.set_pixel(x_start + i, y_start + j, level);
    }
  }
};


// A test pattern for CbCr by block:  [-1,-1][+1,-1]                   
//                                    [-1,+1][+1,+1]
//
cryptagram.codec.chrominance.prototype.getPattern = function(x,y) {

  var startx = 0;
  var starty = 0;
  var width = this.chromaSize;
  
  var xs = x % (width * 2);
  var ys = y % (width * 2);
  
  var pr = 0;
  var pb = 0;
  
  if (xs >= width) {
    pb = 1;
  } else {
    pb = -1;
  }
  
  if (ys >= width) {
    pr = 1;
  } else {
    pr = -1;
  }
  return [pb, pr];
}

// Shift cb and cr based on the pattern and the chromaDelta
cryptagram.codec.chrominance.prototype.getChromininance = function(x,y) {
  var pbpr = this.getPattern(x,y);
  var cb = 128 + this.chromaDelta * pbpr[0];
  var cr = 128 + this.chromaDelta * pbpr[1];
  return [cb, cr];
}

// See which side of 128 cb and cr fall on to extract pattern
cryptagram.codec.chrominance.prototype.getPatternFromChrominance = function(cbcr) {
  var pb = 0;
  var pr = 0;
  if (cbcr[0] < 128) pb = -1;
  if (cbcr[0] > 128) pb = 1;  
  if (cbcr[1] < 128) pr = -1;
  if (cbcr[1] > 128) pr = 1;
  return [pb, pr];
}

// Loops over whole pattern and checks each chroma block
cryptagram.codec.chrominance.prototype.checkChrominancePattern = function() {
  var xblocks = Math.floor(this.img.width / this.chromaSize);
  var yblocks = Math.floor(this.img.height / this.chromaSize);
  var errorCount = 0;
  var totalCount = 0;
  
  for (var y = 0; y < yblocks; y++) {
    for (var x = 0; x < xblocks; x++) {
      var xx = x * this.chromaSize;
      var yy = y * this.chromaSize;
      var cbcr = this.getAverageChrominance(this.img, this.imageData, xx, yy);
      var pbpr = this.getPatternFromChrominance(cbcr);
      
      var pbprOriginal = this.getPattern(xx,yy);

      totalCount++;
      if (pbpr[0] != pbprOriginal[0] ||
          pbpr[1] != pbprOriginal[1]) {
        errorCount++;
      }
    }
  }
  this.percentChrominanceError = errorCount / totalCount; 
  this.logger.info("Chroma decoding errors: " + errorCount + "/" +
                              totalCount + " = " + this.percentChrominanceError);
}


// Computes average chroma for a block of pixels
cryptagram.codec.chrominance.prototype.getAverageChrominance = function(img, imgData, x, y) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  var r,g,b,rt,gt,bt;
  var rt = 0;
  var gt = 0;
  var bt = 0;
  
  for (var i = 0; i < this.chromaSize; i++) {
    for (var j = 0; j < this.chromaSize; j++) {

      var base = (y + j) * img.width + (x + i);
      rt += imgData[4*base];
      gt += imgData[4*base + 1];
      bt += imgData[4*base + 2];
      count++;
    }
  }
  
  // Average RGB
  r = rt / count;
  g = gt / count;
  b = bt / count;
  var cb = 128 - (0.168736 * r) - (0.331264 * g) + (0.5 * b);
  var cr = 128 + (0.5 * r) - (0.418688 * g) - (0.081312 * b);

  return [cb, cr];
}


/** @inheritDoc */
cryptagram.codec.chrominance.prototype.name = function() {
  return "chromina";
};