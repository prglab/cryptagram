goog.provide('cryptogram.decoder');

goog.require('cryptogram.log');
goog.require('cryptogram.storage');

/**
 * @constructor
 */
cryptogram.decoder = function() {};

cryptogram.decoder.URIHeader = "data:image/jpeg;base64,";

/**
 * Decodes the supplied base64 data and applies the callback.
 * @param data The input base64 data.
 * @param password The cryptogram password.
 * @param callback The function to call on the resulting data.
 */
cryptogram.decoder.prototype.decodeData = function(data, password, callback) {

  this.base64Values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var self = this;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  var blockSize = 2;
      
  img.onload = function(){

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0);
    
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;               
  
    self.callback = callback;
    self.img = img;
    self.imageData = imageData;
    self.blockSize = blockSize;
    self.headerSize = blockSize * 4;
    self.password = password;
    self.chunkSize = img.height / 40.0;
    self.y = 0;
    self.newBase64 = "";
        
    var protocol = self.getHeader();
    cryptogram.log("Found '"+ protocol + "' protocol");
    
    
    if (protocol != "aesthete") {
      cryptogram.log("Error: Unknown Protocol");
      cryptogram.context.setStatus();
    } else {
      self.processImage();    
    }
  };
  
  img.src = data;
}


/** 
 * @private
 */
cryptogram.decoder.prototype.getHeader = function() {

    var newBase64 = "";
    
    for (y = 0; y < 8; y+= this.blockSize) {
      for (x = 0; x < 8; x+= 2*this.blockSize) {
        
        base8_0 = this.getBase8Value(x, y);
        base8_1 = this.getBase8Value(x + this.blockSize, y);
  
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);                    
        newBase64 += base64;
      }
    }
    
    return newBase64;       
}

/** 
 * @private
 */
cryptogram.decoder.prototype.processImage = function() {

  var count = 0;
  var y = this.y;
  var done = false;
    
  while (this.chunkSize == 0 || count < this.chunkSize) {
      
    for (x = 0; x < this.img.width; x+= (this.blockSize * 2)) {
        
        // Skip over header super-block
        if (y < this.headerSize && x < this.headerSize) {
          continue;
        }
                        
        base8_0 = this.getBase8Value(x, y);
        base8_1 = this.getBase8Value(x + this.blockSize, y);
        
        // Found black, stop
        if (base8_0 == -1 || base8_1 == -1) break;  
        
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);
        this.newBase64 += base64;
      } 
    count++;  
    y+= this.blockSize;
    
    if (y >= this.img.height) {
      done = true;
      break;
    }
  }
  
  this.y = y;
  _decoder = this;

  if (!done) {
      // Artificially inflate the percent so it gets to 100
      var percent = Math.ceil(100.0 * ((y + (4 * this.blockSize)) / this.img.height));
      if (percent > 100) percent = 100;
      cryptogram.context.setStatus("Decode<br>" + percent + "%");
      setTimeout(function () { _decoder.processImage() }, 1);
  } else {
      cryptogram.context.setStatus();
      cryptogram.log("Decoded " + this.newBase64.length + " Base64 characters:", this.newBase64);
      _decoder.decryptImage();
  }
  
  
}

/** 
 * @private
 */
cryptogram.decoder.prototype.decryptImage = function () {

  var newBase64 = this.newBase64;
  
  var check = newBase64.substring(0,64);
  var iv = newBase64.substring(64,86);
  var salt = newBase64.substring(86,97);
  var ct = newBase64.substring(97,newBase64.length);
  var full = newBase64.substring(64,newBase64.length);
  var bits = sjcl.hash.sha256.hash(full);
  var hexHash = sjcl.codec.hex.fromBits(bits);
    
  if (hexHash != check) {
    cryptogram.log("Checksum failed. Image is corrupted.");
    return;
  } else {
    cryptogram.log("Checksum passed.");
  }
    
  var obj = new Object();
  obj.iv = iv;
  obj.salt = salt;
  obj.ct = ct;
  var base64Decode = JSON.stringify(obj);
  var decrypted;
  
  try {
    decrypted = sjcl.decrypt(this.password, base64Decode);
  } 
  
  catch(err) {
    cryptogram.log("Error decrypting:" , err.toString());
    return;
  }
  
  cryptogram.log("Decrypted " + decrypted.length + " Base64 characters:", decrypted);
  var payload = cryptogram.decoder.URIHeader + decrypted;
  this.callback(payload);
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
  
  for (i = 0; i < this.blockSize; i++) {
    for (j = 0; j < this.blockSize; j++) {
      
      base = (y + j) * this.img.width + (x + i);
      
      //Use green to estimate the luminance
      green = this.imageData[4*base + 1];
  
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
    
