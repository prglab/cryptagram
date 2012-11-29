goog.provide('cryptogram.decoder');

goog.require('cryptogram.codec.aesthete');
goog.require('cryptogram.codec.bacchant');
goog.require('cryptogram.storage');
goog.require('goog.debug.Logger');


/**
 * @constructor
 */
cryptogram.decoder = function(container) {
  this.container = container;
};

cryptogram.decoder.prototype.logger = goog.debug.Logger.getLogger('cryptogram.decoder');


/**
 * Decodes the supplied base64 data and applies the callback.
 * @param data The input base64 data.
 * @param callback The function to call on the resulting data.
 */
cryptogram.decoder.prototype.decodeData = function(data, codec, callback) {

  var self = this;
  self.callback = callback;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  var blockSize = 2;
      
  img.onload = function(){

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;               
  
    if (!codec) {
      self.codec = self.getCodec(img, imageData);
    } else {
      self.codec = codec;
    }
  
    if (!self.codec) {
      self.container.setStatus();
    } else {
      self.data = "";
      self.codec.decode(img, imageData);
      self.timeA = new Date().getTime();
      self.processImage();
    }
  };
  
  img.src = data;
}


cryptogram.decoder.prototype.getCodec = function(img, imageData) {

  var knownCodecs = [cryptogram.codec.aesthete, cryptogram.codec.bacchant];
  var testCodec;
  for (var i = 0; i < knownCodecs.length; i++) {
    testCodec = new knownCodecs[i]();
    if (testCodec.test(img, imageData)) {
      this.logger.info("Found codec: " + testCodec.name());
      return testCodec;
    }
  }
  this.logger.severe("Unknown codec.");
  return null;
}


/** 
 * @private
 */
cryptogram.decoder.prototype.processImage = function() {
    
  var done = false;
  var chunk = this.codec.getChunk();

  if (chunk) {
    this.data += chunk;
    var percent = Math.round(100 * this.codec.decodeProgress(), 2);
    this.container.setStatus("Decode<br>" + percent + "%");
    var self = this;
    setTimeout(function () { self.processImage() }, 1);
  
  // Done processing
  } else {

    var timeB = new Date().getTime();
    var elapsed = timeB - this.timeA;
 
    this.logger.info("Decoded in: " + elapsed + " ms");

    this.container.setStatus();
    this.logger.info("Decoded image. " + this.data.length + " base64 characters.");  
    this.callback(this.data);
 }  
}



    
// Takes the average over some block of pixels
//
//  -1 is black
//  0-7 are decoded base8 values. 0 is white, 7 dark gray, etc

/** 
 * @private
 */
cryptogram.decoder.prototype.getBase8Value = function(x, y) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  var r;
  var g;
  var b;
  var Y;
  
  for (i = 0; i < this.blockSize; i++) {
    for (j = 0; j < this.blockSize; j++) {
      
      base = (y + j) * this.img.width + (x + i);
      
      //Use green to estimate the luminance
      
      r = this.imageData[4*base];
      g = this.imageData[4*base + 1];
      b = this.imageData[4*base + 2];
      Y = 0.299 * r + 0.587 * g + 0.114 * b;
      
      vt += g;
      count++;
    }
  }
  
  v = vt / count;
  var bin = Math.floor(v / 28.0);
    
  if (bin == 0) return -1;
  if (bin > 8) return 0;
  return (8 - bin);   
}
    
