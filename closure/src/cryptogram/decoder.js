goog.provide('cryptogram.decoder');

goog.require('cryptogram.log');
goog.require('cryptogram.storage');

/**
 * @constructor
 */
cryptogram.decoder = function() {};

cryptogram.decoder.URIHeader = "data:image/jpeg;base64,";

/** @this{cryptogram.decoder} */
cryptogram.decoder.prototype.decodeDataToContainer = function(data, password, container) {

  this.base64Values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var _decoder = this;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  blockSize = 2;
      
  img.onload = function(){

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0);
    
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;               

    _decoder.img = img;
    _decoder.imageData = imageData;
    _decoder.blockSize = blockSize;
    _decoder.headerSize = blockSize * 4;
    _decoder.password = password;
    _decoder.container = container;
    _decoder.chunkSize = img.height / 40.0;
    _decoder.y = 0;
    _decoder.newBase64 = "";
        
    var protocol = _decoder.getHeader();
    cryptogram.log("Found '"+ protocol + "' protocol");
        
    if (protocol != "aesthete") {
      cryptogram.log("Error: Unknown Protocol");
      cryptogram.context.get().setStatus();
    } else {
      _decoder.processImage();    
    }
  };
  
  img.src = data;
}


/** @this{cryptogram.decoder} */
cryptogram.decoder.prototype.getHeader = function() {

    var img = this.img;
    var imageData = this.imageData;
    var blockSize = this.blockSize;
    var newBase64 = "";
    
    for (y = 0; y < 8; y+= this.blockSize) {
      for (x = 0; x < 8; x+= 2*this.blockSize) {
        
        base8_0 = cryptogram.decoder.getBase8Value(imageData, img.width, x, y, blockSize, blockSize);
        base8_1 = cryptogram.decoder.getBase8Value(imageData, img.width, x + blockSize, y, blockSize, blockSize);
  
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);                    
        newBase64 += base64;
      }
    }
    
    return newBase64;       
}

/** @this{cryptogram.decoder} */
cryptogram.decoder.prototype.processImage = function() {

  var img = this.img;
  var imageData = this.imageData;
  var blockSize = this.blockSize;
  var count = 0;
  var y = this.y;
  var done = false;
    
  while (this.chunkSize == 0 || count < this.chunkSize) {
      
    for (x = 0; x < img.width; x+= (blockSize * 2)) {
        
        // Skip over header super-block
        if (y < this.headerSize && x < this.headerSize) {
          continue;
        }
                        
        base8_0 = cryptogram.decoder.getBase8Value(imageData, img.width, x, y, blockSize, blockSize);
        base8_1 = cryptogram.decoder.getBase8Value(imageData, img.width, x + blockSize, y, blockSize, blockSize);
        
        // Found black, stop
        if (base8_0 == -1 || base8_1 == -1) break;  
        
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);
        this.newBase64 += base64;
      } 
    count++;  
    y+= blockSize;
    
    if (y >= img.height) {
      done = true;
      break;
    }
  }
  
  this.y = y;
  _decoder = this;

  if (!done) {
      // Artificially inflate the percent so it gets to 100
      var percent = Math.ceil(100.0 * ((y + (4*blockSize)) / img.height));
      if (percent > 100) percent = 100;
      cryptogram.context.setStatus("Decode<br>" + percent + "%");
      setTimeout(function () { _decoder.processImage() }, 1);
  } else {
      cryptogram.context.setStatus();
      cryptogram.log("Decoded " + this.newBase64.length + " Base64 characters:", this.newBase64);
      _decoder.decryptImage();
  }
  
  
}

/** @this{cryptogram.decoder} */
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
  cryptogram.storage.savePassword(this.container.src, this.password);
  cryptogram.context.setSrc(cryptogram.decoder.URIHeader + decrypted);
}

    
// Takes the average over some block of pixels
//
//  -1 is black
//  0-7 are decoded base8 values. 0 is white, 7 dark gray, etc

cryptogram.decoder.getBase8Value = function(block, width, x, y, blockW, blockH) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  
  for (i = 0; i < blockW; i++) {
    for (j = 0; j < blockH; j++) {
      
      base = (y + j) * width + (x + i);
      
      //Use green to estimate the luminance
      green = block[4*base + 1];
  
      vt += green;
      count++;
    }
  }
  
  v = vt / count;
  var bin = Math.floor(v / 28.0)
    
  if (bin == 0) return -1;
  if (bin > 8) return 0;
  return (8 - bin);   
}
    
