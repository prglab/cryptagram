goog.provide('cryptogram.codec.octant');

goog.require('cryptogram.codec');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptogram.codec}
 */
cryptogram.codec.octant = function() {
  this.blockSize = 1;
  this.quality = .95;
};

cryptogram.codec.octant.octal_symbol_thresholds = [255, 219, 183, 146, 110, 73, 37, 0];

goog.inherits(cryptogram.codec.octant, cryptogram.codec);

cryptogram.codec.octant.prototype.logger = goog.debug.Logger.getLogger('cryptogram.codec.octant');


/** @inheritDoc */
cryptogram.codec.octant.prototype.name = function() {
  return "oooctant";
};


/** @inheritDoc */
cryptogram.codec.octant.prototype.processImage = function(img) {
};

cryptogram.codec.octant.prototype.set_pixel = function(x, y, r, g, b) {
  var idx = 4 * (x + y * this.width);
  //set RGB channels to same level since we're encoding data as grayscale
  this.data[idx] = r;
  this.data[idx + 1] = g;
  this.data[idx + 2] = b;
  this.data[idx + 3] = 255; // alpha channel
};

cryptogram.codec.octant.prototype.set_block = function(x_start, y_start, level) {
  var r = level;
  var g = level;
  var b = level;
  
  if (this.thumbnail) {
    var x_cell = Math.floor(x_start / 8);
    var max_x = Math.ceil(this.width / 8);
    var y_cell = Math.floor(y_start / 8);
    var max_y = Math.floor(this.height / 8);
    
    var idx = 4 * (x_cell + y_cell * max_x);
    var tr = this.thumbnail[idx];
    var tg = this.thumbnail[idx + 1];
    var tb = this.thumbnail[idx + 2];
      
    var cb = Math.floor(128 + (-0.168736 * tr - 0.331264 * tg + 0.5 * tb));
    var cr = Math.floor(128 + (0.5 * tr - 0.418688 * tg - 0.081312 * tb));
  
    max_c = 148;
    min_c = 108;
    
    if (cb > max_c) cb = max_c;
    if (cb < min_c) cb = min_c;
    
    if (cr > max_c) cr = max_c;
    if (cr < min_c) cr = min_c;
  
    r = level + 1.402 * (cr - 128.0);
    r = Math.round(r,0);
    g = level - 0.34414 * (cb - 128.0) - 0.71414 * (cr - 128.0);
    g = Math.round(g, 0);
    b = level + 1.772 * (cb - 128.0);
    b = Math.round(b, 0);
  }
     
  for (var i = 0; i < this.blockSize; i++) {
    for (var j = 0; j < this.blockSize; j++) {
      this.set_pixel(x_start + i, y_start + j, r, g, b);
    }
  }
};

cryptogram.codec.octant.prototype.setImage = function(img) {
  this.img = img;
};

cryptogram.codec.octant.prototype.loadThumbnail = function() {
  
  if (!this.img) return;
  
  var width = Math.ceil(this.width / 8.0);
  var height = Math.ceil(this.height / 8.0);
  
  var canvas = document.createElement('canvas');  
  var ctx = canvas.getContext("2d");
  
  var canvasCopy = document.createElement("canvas");
  var copyContext = canvasCopy.getContext("2d");

  var ratio = 1;

  /*if(img.width > maxWidth)
    ratio = maxWidth / img.width;
  else if(img.height > maxHeight)
    ratio = maxHeight / img.height;*/
  
  canvas.width = width;
  canvas.height = height;
  
  canvasCopy.width = this.img.width;
  canvasCopy.height = this.img.height;
  
  copyContext.drawImage(this.img, 0, 0);
  ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);
  
  var imageData = ctx.getImageData(0, 0, width, height);
  this.thumbnail = imageData.data;
};

cryptogram.codec.octant.prototype.encode = function(data, 
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
  function add_char(ch,values) {
    var value = self.base64Values.indexOf(ch);
    var x = Math.floor(value / 8);
    var y = value % 8;
    values.push(x);
    values.push(y);
  }

  // first translate the header string
  var header_values = new Array();
  for (var i = 0; i < header_string.length; i++) {
    add_char(header_string[i], header_values);
  }


  // next translate the image data
  var values1 = new Array();
  for (var i = 0; i < data.length; i++) {
    add_char(data[i], values1);
  }
  this.lastOctal = values1;
  this.lastOctalString = values1.join("");

  var payloadLength = data.length;
  var lengthString = "" + payloadLength;
  
  while (lengthString.length < 8) {
    lengthString = "0" + lengthString;
  }
  
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
  
  self.loadThumbnail();

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
        level =  cryptogram.codec.octant.octal_symbol_thresholds[header_values[value_idx]];
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
    level = cryptogram.codec.octant.octal_symbol_thresholds[octal];
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
  var elapsed = timeB - timeA;
  this.logger.info("Encoded in: " + elapsed + " ms");  

  return img;
};



/** 
 */
cryptogram.codec.octant.prototype.getHeader = function(img, imageData) {

    var newBase64 = "";
    var headerSize = this.blockSize * 4;
    for (y = 0; y < headerSize; y+= this.blockSize) {
      for (x = 0; x < headerSize; x+= 2*this.blockSize) {
        
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
cryptogram.codec.octant.prototype.getBase8Value = function(img, imgData, x, y) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  
  var inc = (256 / 7.0);
  
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
  var bin = Math.floor((v / inc) + .5);
  if (bin > 7) bin = 7;
  
  //if (bin == 0) return -1;
  //if (bin > 8) return 0;
  return (7 - bin);  
}

/** @inheritDoc */
cryptogram.codec.octant.prototype.decodeProgress = function() {
  return this.y / this.img.height;
  
}

cryptogram.codec.octant.prototype.decode = function(img, imageData) {
  this.count = 0;
  this.chunkSize = 10;
  this.y = 0;
  this.img = img;
  this.imageData = imageData;
  this.lengthString = "";
  this.errorCount = 0;
};

cryptogram.codec.octant.prototype.getChunk = function() {

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
      
    for (var x = 0; x < this.img.width; x+= (this.blockSize * 2)) {
        
        if (this.count >= this.length) {
          break;   
        }
  
        // Skip over header super-block
        if (this.y < headerSize && x < headerSize) {
          continue;
        }
                        
        base8_0 = this.getBase8Value(this.img, this.imageData, x, this.y);
        base8_1 = this.getBase8Value(this.img, this.imageData, x + this.blockSize, this.y);
        
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);
                                  
        if (this.y == 0 && x < headerSize + 16*this.blockSize) {
          this.lengthString += base64; 
        } else {
            
            var last_0 = this.lastOctal[this.count * 2];
            var last_1 = this.lastOctal[this.count * 2 + 1];
          if (base8_0 != last_0) {
            this.errorCount++;
            //console.log(base8_0 + "/" + last_0);
          }
          
          if (base8_1 != last_1) {
            this.errorCount++;
            //console.log(base8_1 + "/" + last_1);
          }
          

                        
          newBase64 += base64;
          this.count++;
          
          if (this.length == null) {
            this.length = parseInt(this.lengthString);
          }
        }
    
    
    }
    if (this.y >= this.img.height) {
      break;
    }
    
    this.y+= this.blockSize;
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
