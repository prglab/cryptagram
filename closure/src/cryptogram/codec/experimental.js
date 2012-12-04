goog.provide('cryptogram.codec.experimental');

goog.require('cryptogram.codec');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptogram.codec}
 */
cryptogram.codec.experimental = function(blockSize, quality, numberSymbols) {

  this.quality = quality;
  this.blockSize = blockSize;
  this.symbol_thresholds = [];
  this.base = numberSymbols;
  
  for (var i = 0; i < numberSymbols; i++) {
    var level = (i / (numberSymbols - 1)) * 255;
    this.symbol_thresholds.push(Math.round(level));
  }  
};

goog.inherits(cryptogram.codec.experimental, cryptogram.codec);

cryptogram.codec.experimental.prototype.logger = goog.debug.Logger.getLogger('cryptogram.codec.experimental');


/** @inheritDoc */
cryptogram.codec.experimental.prototype.name = function() {
  return " testing";
};


cryptogram.codec.experimental.prototype.encode = function(data, 
    width_to_height_ratio, header_string, block_width, block_height) {

  var timeA = new Date().getTime();

  width_to_height_ratio = typeof width_to_height_ratio !== 'undefined' ?
		width_to_height_ratio : 1.0;
  header_string = typeof header_string !== 'undefined' ? header_string :
		this.name();
  block_width = typeof block_width !== 'undefined' ? block_width : this.blockSize;
  block_height = typeof block_height !== 'undefined' ? block_height : this.blockSize;

  n_header_symbols = header_string.length;
  var self = this;
  // grow an array of grayscale values and then convert them to an RGB Image
  // afterward (so we don't have to precompute size or worry about the header
  // yet
  
  var self = this;
  function add_char(ch, values) {
    var value = self.base64Values.indexOf(ch);
    var x = Math.floor(value * (self.base / 64.0));
    var y = value % self.base;
    values.push(x);
    values.push(y);
  }

  // first translate the header string
  var header_values = new Array();
  var all_values = new Array();
  for (var i = 0; i < header_string.length; i++) {
    add_char(header_string[i], header_values);
    add_char(header_string[i], all_values);
  }

  var payloadLength = data.length * 2;
  var lengthString = "" + payloadLength;
  
  while (lengthString.length < 8) {
    lengthString = "0" + lengthString;
  }
    
   // next translate the image data
  var values1 = new Array();
  for (var i = 0; i < data.length; i++) {
    add_char(data[i], values1);
  }
  this.lastOctal = values1;

  data = lengthString + data;
  
  // next translate the image data
  var values = new Array();
  for (var i = 0; i < data.length; i++) {
    add_char(data[i], values);
  }

  
  // how many octal values did we get from the header string?
  var n_header_values = header_values.length;
  var n_header_values_in_row = Math.ceil(Math.sqrt(n_header_values));

  // always encode an even number of octal values in a row, don't split a base64
  // character over two rows
  if (n_header_values_in_row % 2 != 0) { n_header_values_in_row++; }
  var header_width = n_header_values_in_row * block_width;
  var header_height = n_header_values_in_row * block_height;
  var n_pixels_in_header = header_width * header_height;

  // how many octal values do we have from our actual image data?
  var n_values = values.length;
  var block_size = block_width * block_height;
  var n_pixels = block_size * n_values + n_pixels_in_header;
  var height = Math.sqrt(n_pixels / width_to_height_ratio);
  var width = Math.ceil(width_to_height_ratio * height);

  // make output height a multiple of block height
  height = Math.ceil(Math.ceil(height) / block_height) * block_height;

  // make output width a multiple of twice block width, so that two octal values
  // always encoded on same line
  width = Math.ceil(width / (2* block_width)) * 2 *  block_width;
  var c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  var cxt = c.getContext('2d');
  var imageData = cxt.createImageData(width, height);
  
  this.data = imageData.data;
  this.width = width;
  this.height = height;
  
  var pix_idx = 0;
  var value_idx;
  var level;

  // fill the header pixels
  for (var y = 0; y < header_height; y += block_height) {
    for (var x = 0; x < header_width; x += block_width) {
      value_idx = x / block_width + (y  / block_height) *
				(header_width / block_width);
			level = 8;
      if (value_idx < n_header_values) {
        level =  this.symbol_thresholds[header_values[value_idx]];
      }
      this.set_block(x, y, level);
    }
  }

  n_header_row_symbols_wide = (width - header_width) / block_width;
  n_header_row_symbols = n_header_row_symbols_wide *
		(header_height / block_height)
  n_symbols_in_full_row = width / block_width;
  var x_coord, y_coord, x, y, i2;
  
  for (var i = 0; i < n_values; i++) {
    octal = values[i];
    level = this.symbol_thresholds[octal];
    if (i < n_header_row_symbols) {
      y_coord = Math.floor(i / n_header_row_symbols_wide);
      x_coord = (i - (y_coord * n_header_row_symbols_wide));
      x = header_width + (x_coord * block_width);
    } else {
     i2 = i + n_header_values;
     y_coord = Math.floor(i2 / n_symbols_in_full_row);
     x_coord = i2 - (y_coord * n_symbols_in_full_row);
     x = x_coord * block_width;
    }
    y = y_coord * block_height;
    this.set_block(x,y,level);
  }
    
  cxt.putImageData(imageData, 0, 0);
  var img = new Image();
  
  this.logger.info("JPEG quality " + this.quality);
  
  img.src = c.toDataURL('image/jpeg', this.quality);
  
  var timeB = new Date().getTime();
  this.elapsed = timeB - timeA;

  this.logger.info("Encoded in: " + this.elapsed + " ms");  

  return img;
};



/** 
 */
cryptogram.codec.experimental.prototype.getHeader = function(img, imageData) {

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
cryptogram.codec.experimental.prototype.getBaseValue = function(img, imgData, x, y) {

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
cryptogram.codec.experimental.prototype.decodeProgress = function() {
  return this.y / this.img.height;
  
}

cryptogram.codec.experimental.prototype.decode = function(img, imageData) {
  this.count = 0;
  this.chunkSize = 10;
  this.y = 0;
  this.img = img;
  this.imageData = imageData;
  this.lengthString = "";
  this.errorCount = 0;
  
  this.newOctal = [];
};

cryptogram.codec.experimental.prototype.getChunk = function() {

  var newBase64 = "";
  
  if (this.count >= this.length) {
    return false;
  }
  
  
  if (this.y >= this.img.height) {
    return false;
  }
  
  var count = 0;
  var headerSize = this.blockSize * 4;
  
  while (count < this.chunkSize) {
      
    if (this.count >= this.length) {
          break;
    }
        
    for (var x = 0; x < this.img.width; x+= (this.blockSize * 2)) {
        
        if (this.count >= this.length) {
          break;
        }
        
        // Skip over header super-block
        if (this.y < headerSize && x < headerSize) {           
          continue;
        }
                        
        base8_0 = this.getBaseValue(this.img, this.imageData, x, this.y);
        base8_1 = this.getBaseValue(this.img, this.imageData, x + this.blockSize, this.y);
        
        this.newOctal.push(base8_0);
        this.newOctal.push(base8_1);
        
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);
                           
       
        // Next super-block contains the length
        if (this.y == 0 && x < headerSize + 16 * this.blockSize) {
          this.lengthString += base64;
        } else {
          
          var last_0 = this.lastOctal[this.count];
          var last_1 = this.lastOctal[this.count + 1];
                    
          if (base8_0 != last_0) {
            this.errorCount++;
          }
          
          if (base8_1 != last_1) {
            this.errorCount++;
          }
                       
          newBase64 += base64;
                    
          if (this.length == null) {
            this.length = parseInt(this.lengthString);
          }
        
        
           this.count += 2;

        }
    
    
    }
    if (this.y >= this.img.height) {
      break;
    }
    
    this.y += this.blockSize;
    count++;
  }
  return newBase64;
}
  




/*  
    var stripeX = Math.floor(x_start / 16) % 3;
    var stripeY = Math.floor(y_start / 16) % 3;
    
    if (stripeX == 0) {
      r = level + 25;
    } else if (stripeX == 1) {
      r = level - 25;
    }
    
    
    if (stripeY == 0) {
      b = level + 25;
    } else if (stripeY == 1) {
      b = level - 25;
    }
*/   
