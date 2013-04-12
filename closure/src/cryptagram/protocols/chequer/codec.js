goog.provide('cryptagram.codec.chequer');

goog.require('cryptagram.codec');
goog.require('cryptagram.cipher.chequer');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.codec}
 */
cryptagram.codec.chequer = function(quality) {
  
  this.imageType = 'image/jpeg';
  
  this.imageHeader = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAgACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAP";
  this.imageHeaderLength = this.imageHeader.length;
    
  this.tileSize = 32;
  this.delimiter = "abcd";
  this.blockSize = 1;
  this.base = 4;
  
  this.quality = quality;
  this.symbolThresholds = [];
  this.cipher = new cryptagram.cipher.chequer();

  for (var i = 0; i < this.base; i++) {
    var level = (i / (this.base - 1)) * 255;
    this.symbolThresholds.push(Math.round(level));
  }  
};

goog.inherits(cryptagram.codec.chequer, cryptagram.codec);

cryptagram.codec.chequer.prototype.logger = goog.debug.Logger.getLogger('cryptagram.codec.chequer');


/** @inheritDoc */
cryptagram.codec.chequer.prototype.name = function() {
  return "0chequer";
};


cryptagram.codec.chequer.prototype.encode = function(options, callback) {

  var src = options.src;
  var password = options.password;
  var self = this;
  
  var img = new Image();
    img.onload = function(){

    var aspect = img.width / img.height;

    self.imageToData(img, password, function(result) {

      var newImage = self.dataToImage(result, aspect);
      
      callback(newImage);
    });
  };
  img.src = src;
}

cryptagram.codec.chequer.prototype.imageToData = function(img, password, callback) {

  var self = this;
  var canvas = document.createElement('canvas');
  canvas.width = this.tileSize;
  canvas.height = this.tileSize;

  var ctx = canvas.getContext('2d');

  var lastHeader = this.imageHeader;
  var totalData = 0;
  var result = self.name();
    
  result += "/" + img.width + "/" + img.height;

  var numRows = Math.ceil(img.height / self.tileSize);
  var numCols = Math.ceil(img.width / self.tileSize);
        
  for (var r = 0; r < numRows; r++) {
    for (var c = 0; c < numCols; c++) {
      
      var startX = c * self.tileSize;
      var startY = r * self.tileSize;

      var tileW = self.tileSize;
      var tileH = self.tileSize;
      
      if (startX + tileW > img.width) {
        tileW = img.width - startX;        
      }
      
      if (startY + tileH > img.height) {
        tileH = img.height - startY;        
      }
      
      ctx.clearRect(0, 0, self.tileSize, self.tileSize);
      ctx.drawImage(img, startX, startY, tileW, tileH, 0, 0, tileW, tileH);
      var dat = canvas.toDataURL(self.imageType, self.quality);
      var header = dat.substring(0, self.imageHeaderLength);
      var body = dat.substring(self.imageHeaderLength, dat.length)
      if (header != lastHeader) {
        console.log("Header changed " + r + "," + c);
        self.imageHeader = header;
        alert(header);
      }

      lastHeader = header;
      
      result += self.delimiter;
      result += c + "/" + r + "/";
      result += self.encrypt(body, password);        
      
      totalData +=  body.length;
    }
  }
  result += self.delimiter + self.delimiter;
  callback(result);

};
  



cryptagram.codec.chequer.prototype.dataToImage = function(data, aspect) {

  var timeA = new Date().getTime();

  var aspect = typeof aspect !== 'undefined' ? aspect : 1.0;
 
  var blockWidth = this.blockSize;
  var blockHeight = this.blockSize;

  var self = this;

   // Converts base64 to 3 base4 values
  function add_char(ch, values) {
    var value = self.base64Values.indexOf(ch);
    
    var x = Math.floor(value * (4.0 / 64.0));
    var xr = value - (x * 16);
    var y = Math.floor(xr * (16 / 64.0));
    var z = xr % 4;
    
    values.push(x);
    values.push(y);
    values.push(z);    
  }

  // translate the image data
  var values = new Array();
  for (var i = 0; i < data.length; i++) {
    add_char(data[i], values);
  }

  // how many octal values do we have from our actual image data?
  var nValues = values.length;
  var blockSize = blockWidth * blockHeight;
  var nPixels = blockSize * nValues;
  var height = Math.sqrt(nPixels / aspect);
  var width = Math.ceil(aspect * height);

  // make output height a multiple of block height
  height = Math.ceil(Math.ceil(height) / blockHeight) * blockHeight;

  // make output width a multiple of three block width, so that three octal values
  // always encode on same line
  width = Math.ceil(width / (3* blockWidth)) * 3 *  blockWidth;
  var c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  var cxt = c.getContext('2d');
  var imageData = cxt.createImageData(width, height);

  this.data = imageData.data;
  this.width = width;
  this.height = height;

  var level;

  var symbolsInRow = width / blockWidth;
  var x, y;

  for (var i = 0; i < nValues; i++) {
    var quad = values[i];
    level = this.symbolThresholds[quad];
    y = Math.floor(i / symbolsInRow);
    x = i - (y * symbolsInRow);
    this.set_block( x * blockWidth, y * blockHeight, level);
  }
  
  var fillWidth = width / blockWidth;
  var fillHeight = height / blockHeight;
  var randQuad;
  
  // Fill end of image with random blocks.
  while(1) {
    x++;
    if (x >= fillWidth) {
      x = 0;
      y++;
    }
    
    if (y >= fillHeight) {
      break;
    }
    randQuad = Math.floor(Math.random() * 4);
    level = this.symbolThresholds[randQuad];
    this.set_block(x * blockWidth, y * blockHeight, level);
  }
 
  cxt.putImageData(imageData, 0, 0);
  var img = new Image();

  this.logger.info("JPEG quality " + this.quality);

  img.src = c.toDataURL('image/jpeg', this.quality);

  var timeB = new Date().getTime();
  var elapsed = timeB - timeA;
  this.logger.info("Encoded in: " + elapsed + " ms");
  return img;
};



/** 
 */
cryptagram.codec.chequer.prototype.getHeader = function(img, imageData) {

    var newBase64 = "";
    var headerSize = this.blockSize * 4;
    for (y = 0; y < headerSize; y+= this.blockSize) {
      for (x = 0; x < headerSize; x+= 2*this.blockSize) {
        
        base8_0 = this.getBaseValue(img, imageData, x, y);
        base8_1 = this.getBaseValue(img, imageData, x + this.blockSize, y);
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
cryptagram.codec.chequer.prototype.getBaseValue = function(img, imgData, x, y) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  
  var inc = (255 / (this.base - 1));
  
  for (i = 0; i < this.blockSize; i++) {
    for (j = 0; j < this.blockSize; j++) {
      
      base = (y + j) * img.width + (x + i);
      
      r = imgData[4*base];
      g = imgData[4*base + 1];
      b = imgData[4*base + 2];
      lum = 0.299 * r + 0.587 * g + 0.114 * b;

      vt += lum;
      count++;
    }
  }
  
  v = vt / count;
  var bin = Math.round(v / inc);
  if (bin >= this.base) bin = this.base - 1;
  
  return bin;  
}

/** @inheritDoc */
cryptagram.codec.chequer.prototype.decodeProgress = function() {
  return this.y / this.img.height;
  
}

cryptagram.codec.chequer.prototype.decode = function(img, imageData) {
  this.count = 0;
  this.chunkSize = 10;
  this.y = 0;
  this.img = img;
  this.imageData = imageData;
  this.lengthString = "";
  this.errorCount = 0;
  this.decodeData = "";
  this.newOctal = [];
};


cryptagram.codec.chequer.prototype.getErrorCount = function() {
  var errorCount = 0;
  for (var i = 0; i < this.lastOctal.length; i++) {
    if (this.newOctal[i] != this.lastOctal[i]) {
      errorCount++;
    }
  }
  return errorCount;
}


cryptagram.codec.chequer.prototype.setDecodeParams = function(img, imageData) {
  this.count = 0;
  this.headerSize = this.blockSize * 4;
  this.chunkSize = 10;
  this.y = 0;
  this.img = img;
  this.imageData = imageData;
  this.decodeData = [];
  this.newOctal = [];
  this.length = img.width * img.height;
};


cryptagram.codec.chequer.prototype.getChunk = function() {

  if (this.count >= this.length) {
    return false;
  }
  
  if (this.y >= this.img.height) {
    return false;
  }
  
  var count = 0;
  
  while (count < this.chunkSize) {
      
    if (this.count >= this.length) {
          break;
    }
        
    for (var x = 0; x < this.img.width; x+= this.blockSize) {
        
        if (this.count >= this.length) {
          break;
        }
                    
        base4 = this.getBaseValue(this.img, this.imageData, x, this.y);                                
        this.decodeData.push(base4);
        this.count++;
        
    }
    if (this.y >= this.img.height) {
      break;
    }
    
    this.y += this.blockSize;
    count++;
  }
  return true;
};

cryptagram.codec.chequer.prototype.decrypt = function(password, callback) {
  var newBase64 = "";
  var base4_0;
  var base4_1;
  var base4_2;
  var self = this;
  
  for (var i = 0; i < this.decodeData.length; i+= 3) {
  
    base4_0 = this.decodeData[i];
    base4_1 = this.decodeData[i + 1];
    base4_2 = this.decodeData[i + 2];
    
    var id = base4_0 * 16 + base4_1 * 4 + base4_2;
    var base64 = this.base64Values[id];
    newBase64 += base64;
  }
  
  var errorCount = 0;
  for (var i = 0; i < this.lastOctal.length; i++) {
    if (this.decodeData[i] != this.lastOctal[i]) {
      errorCount++;
    }
  }
  
  console.log("Errors " + errorCount + "/" + this.lastOctal.length);
  
  var parts = newBase64.split(this.delimiter);
  
  var header = parts[0];
  var headerParts = header.split('/');
  var width = parseInt(headerParts[1]);
  var height = parseInt(headerParts[2]);
  
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  var ctx = canvas.getContext('2d');
  
  var tileCount = 0;
  var numberTiles = 0;
  
  for (var p = 1; p < parts.length; p++) {
    
    var part = parts[p];
        
    if (part.length == 0) break;

    var xy = part.split("/",2);
    var ctStart = xy[0].length + xy[1].length + 2;
    var encrypted = part.substring(ctStart, part.length);
    var xIdx = parseInt(xy[0]);
    var yIdx = parseInt(xy[1]);
    console.log("Decoding part " + p + " @ " + xIdx + "," + yIdx);
    var decrypt = this.cipher.decrypt(encrypted, password);
    if (decrypt) {
      numberTiles++;
    }
    
    var img = new Image();
    img.startX = xIdx * self.tileSize;
    img.startY = yIdx * self.tileSize;

    img.onload = function(){
      tileCount++;
      console.log("Drawing # " + tileCount + " @ " + this.startX + "," + this.startY);
      ctx.drawImage(this, 0, 0, self.tileSize, self.tileSize, this.startX, this.startY, self.tileSize, self.tileSize);
      
      
      if (tileCount == numberTiles) {
        var dat = canvas.toDataURL('image/jpeg', 1);
        callback(dat);
      }
      
    }
    img.src = self.imageHeader + decrypt;
  }
}