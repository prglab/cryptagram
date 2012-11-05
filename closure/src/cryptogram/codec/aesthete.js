goog.provide('cryptogram.codec.aesthete');

goog.require('cryptogram.codec');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptogram.codec}
 */
cryptogram.codec.aesthete = function() {
  this.blockSize = 2;
  this.base64Values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
};

goog.inherits(cryptogram.codec.aesthete, cryptogram.codec);

cryptogram.codec.aesthete.prototype.logger = goog.debug.Logger.getLogger('cryptogram.codec.aesthete');


/** @inheritDoc */
cryptogram.codec.aesthete.prototype.name = function() {
  return "aesthete";
};

/** @inheritDoc */
cryptogram.codec.aesthete.prototype.test = function(img, imageData) {
  var header = this.getHeader(img, imageData);
  return (header == "aesthete");
};

/** @inheritDoc */
cryptogram.codec.aesthete.prototype.processImage = function(img) {
};


/** 
 * @private
 */
cryptogram.codec.aesthete.prototype.getHeader = function(img, imageData) {

    var newBase64 = "";

    for (y = 0; y < 8; y+= this.blockSize) {
      for (x = 0; x < 8; x+= 2*this.blockSize) {
        
        base8_0 = this.getBase8Value(img, imageData, x, y);
        base8_1 = this.getBase8Value(img, imageData, x + this.blockSize, y);
  
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);                    
        newBase64 += base64;
      }
    }
    return newBase64;       
}


// Takes the average over some block of pixels
//
//  -1 is black
//  0-7 are decoded base8 values. 0 is white, 7 dark gray, etc

/** 
 * @private
 */
cryptogram.codec.aesthete.prototype.getBase8Value = function(img, imgData, x, y) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  
  for (i = 0; i < this.blockSize; i++) {
    for (j = 0; j < this.blockSize; j++) {
      
      base = (y + j) * img.width + (x + i);
      
      //Use green to estimate the luminance
      green = imgData[4*base + 1];
  
      vt += green;
      count++;
    }
  }
  
  v = vt / count;
  var bin = Math.floor(v / 28.0);
    
  if (bin == 0) return -1;
  if (bin > 8) return 0;
  return (8 - bin);   
}

