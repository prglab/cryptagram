goog.provide('cryptagram.codec.chrominance');

goog.require('cryptagram.codec');
goog.require('cryptagram.codec.experimental');
goog.require('cryptagram.cipher.bacchant');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.codec.experimental}
 */
cryptagram.codec.chrominance = function(quality, blockSize, numberSymbols, chromaSize, chromaDelta, numberChromaB, numberChromaR) {  

  this.chromaSize = chromaSize;
  this.chromaDelta = chromaDelta;
  
  this.quality = quality;
  this.blockSize = blockSize;
  this.symbol_thresholds = [];
  this.chromaBthresholds = [];
  this.chromaRthresholds = [];
  this.numberChromaB = numberChromaB;
  this.numberChromaR = numberChromaR;
  this.symbol_thresholds = [];
  this.base = numberSymbols;
  this.cipher = new cryptagram.cipher.bacchant();
  this.pattern = [];

  for (var i = 0; i < numberSymbols; i++) {
    var level = (i / (numberSymbols - 1)) * 255;
    this.symbol_thresholds.push(Math.round(level));
  }  
  
  console.log(this.symbol_thresholds);
  
  var bInc = this.chromaDelta / (this.numberChromaB-1);
  
  for (var i = 0; i < numberChromaB; i++) {
    var level = 128 + bInc * (i - ((this.numberChromaB) / 2) + .5);    
    this.chromaBthresholds.push(Math.round(level));
  }
  
  var rInc = this.chromaDelta / (this.numberChromaR-1);
  
  for (var i = 0; i < numberChromaR; i++) {
    var level = 128 + rInc * (i - ((this.numberChromaR) / 2) + .5);    
    this.chromaRthresholds.push(Math.round(level));
  } 
  
  if (numberChromaB == 2) {
    this.chromaBthresholds = [128 - this.chromaDelta / 2, 128 + this.chromaDelta / 2];
  }
  
  if (numberChromaR == 2 || numberChromaR == 0) {
    this.chromaRthresholds = [128 - this.chromaDelta / 2, 128 + this.chromaDelta / 2];
  }

};

goog.inherits(cryptagram.codec.chrominance, cryptagram.codec.experimental);

cryptagram.codec.chrominance.prototype.logger = goog.debug.Logger.getLogger('cryptagram.codec.chrominance');



cryptagram.codec.chrominance.prototype.set_pixel = function(x, y, lum) {

  var cbcr = this.getChromininance(x, y, true);
  var cb = cbcr[0];
  var cr = cbcr[1];
  
  var buffer = 10;
  if (lum > (255-buffer) || lum < buffer) {
    cb = cr = 128;
  }  
  //lum = 128;
  
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


// A test pattern for CbCr
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


cryptagram.codec.chrominance.prototype.getRandom = function(xx,yy,set) {
  
  //return this.getPattern(x,y);
  var x = Math.floor(xx / this.chromaSize);
  var y = Math.floor(yy / this.chromaSize);
  
  if (this.pattern && this.pattern[x] && this.pattern[x][y]) {
    return this.pattern[x][y];
  }
  
  var pb = -1;
  var pr = -1;
  
  pb = Math.floor(Math.random() * this.numberChromaB);
  pr = Math.floor(Math.random() * this.numberChromaR);
  
  if (!this.pattern) {
    this.pattern = [];
  }
  
  if (!this.pattern[x]) {
    this.pattern[x] = [];
  }
  
  if (this.numberChromaR == 0) {
    pr = 0;
   // if (pb == 0) pr = 1;
    pr = pb;
  }
  
  var randomBits = [pb,pr];
  this.pattern[x][y] = randomBits;
  
  return randomBits;
}



// Shift cb and cr based on the pattern and the chromaDelta
cryptagram.codec.chrominance.prototype.getChromininance = function(x,y,set) {
  var pbpr = this.getRandom(x,y,set);
  var cb = this.chromaBthresholds[pbpr[0]];
  var cr = this.chromaRthresholds[pbpr[1]];
  return [cb, cr];
}

// Loops over whole pattern and checks each chroma block
cryptagram.codec.chrominance.prototype.checkChrominancePattern = function() {
  var xblocks = Math.floor(this.img.width / this.chromaSize);
  var yblocks = Math.floor(this.img.height / this.chromaSize);
  var errorCount = 0;
  var totalCount = 0;
  
  for (var y = 0; y < yblocks - 1; y++) {
    for (var x = 0; x < xblocks - 1; x++) {
      var xx = x * this.chromaSize;
      var yy = y * this.chromaSize;
      var cbcr = this.getAverageChrominance(this.img, this.imageData, xx, yy);
      var pbpr = this.getChromaValue(cbcr);
      var pbprOriginal = this.getRandom(xx,yy,false);
      totalCount++;

      if (pbpr[0] != pbprOriginal[0]) {
        errorCount++;
      }

      if (this.numberChromaR != 0) {
        totalCount++;
        if (pbpr[1] != pbprOriginal[1]) {
        errorCount++;
        }
      
      }       
    }
  }
  this.percentChrominanceError = errorCount / totalCount; 
  this.logger.info('Chroma decoding errors: ' + errorCount + '/' +
                              totalCount + ' = ' + this.percentChrominanceError);
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


cryptagram.codec.experimental.prototype.getChromaValue = function(cbcr) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  var bBin = 0;
  var rBin = 0;
  
  if (this.numberChromaB == 2) {
    if (cbcr[0] > 128) {
      bBin = 1;
    } 
  } else {
  
    var bInc = this.chromaDelta / (this.numberChromaB - 1);
    var bDelta = cbcr[0] - 128;
    bBin = Math.round((bDelta / bInc) + ((this.numberChromaB-1)/2.0)); // -
    if (bBin >= this.numberChromaB) bBin = this.numberChromaB - 1;
    if (bBin < 0) bBin = 0;
  }


  if (this.numberChromaR == 2) {
    if (cbcr[1] > 128) {
      rBin = 1;
    } 
  } else {
    var rInc = this.chromaDelta / (this.numberChromaR - 1);
    var rDelta = cbcr[1] - 128;
    var rBin = Math.round((rDelta / rInc) + ((this.numberChromaR-1)/2.0)); // -
    if (rBin >= this.numberChromaR) rBin = this.numberChromaR - 1;
    if (rBin < 0) rBin = 0;
  }
  
  return [bBin, rBin];
}


/** @inheritDoc */
cryptagram.codec.chrominance.prototype.name = function() {
  return 'chromina';
};