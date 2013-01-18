goog.provide('cryptagram.codec.aesthete');

goog.require('cryptagram.codec');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.codec}
 */
cryptagram.codec.aesthete = function() {
  this.blockSize = 2;
  this.symbol_thresholds = [238, 210, 182, 154, 126, 98, 70, 42, 14];
};

//cryptagram.codec.aesthete.base64Values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
//cryptagram.codec.aesthete.octal_symbol_thresholds = [238, 210, 182, 154, 126, 98, 70, 42, 14];

goog.inherits(cryptagram.codec.aesthete, cryptagram.codec);

cryptagram.codec.aesthete.prototype.logger = goog.debug.Logger.getLogger('cryptagram.codec.aesthete');


/** @inheritDoc */
cryptagram.codec.aesthete.prototype.name = function() {
  return "aesthete";
};


/** @inheritDoc */
cryptagram.codec.aesthete.prototype.processImage = function(img) {
};

cryptagram.codec.aesthete.prototype.set_pixel = function(x, y, r, g, b) {
  var idx = 4 * (x + y * this.width);
  //set RGB channels to same level since we're encoding data as grayscale
  this.data[idx] = r;
  this.data[idx + 1] = g;
  this.data[idx + 2] = b;
  this.data[idx + 3] = 255; // alpha channel
};

cryptagram.codec.aesthete.prototype.set_block = function(x_start, y_start, level) {
  for (var i = 0; i < this.blockSize; i++) {
    for (var j = 0; j < this.blockSize; j++) {
      this.set_pixel(x_start + i, y_start + j, level, level, level);
    }
  }
};

/**
 * Static method to return an estimate of the required image dimensions given
 * the aspect ratio and the number of base64 values to be embedded.
 */
cryptagram.codec.aesthete.dimensions = function (width_to_height_ratio,
                                                 n_base64_values) {
  if ((typeof width_to_height_ratio !== "number") ||
      (typeof n_base64_values !== "number")) {
    return undefined;
  }

  width_to_height_ratio = typeof width_to_height_ratio !== 'undefined' ?
		width_to_height_ratio : 1.0;
  header_string = typeof header_string !== 'undefined' ? header_string :
		'aesthete';
  block_width = typeof block_width !== 'undefined' ? block_width : 2;
  block_height = typeof block_height !== 'undefined' ? block_height : 2;

  // how many octal values did we get from the header string?
  var n_header_values = 2 * (header_string.length);
  var n_header_values_in_row = Math.ceil(Math.sqrt(n_header_values));

  // always encode an even number of octal values in a row, don't split a base64
  // character over two rows
  if (n_header_values_in_row % 2 != 0) { n_header_values_in_row++; }
  var header_width = n_header_values_in_row * block_width;
  var header_height = n_header_values_in_row * block_height;
  var n_pixels_in_header = header_width * header_height;

  // how many octal values do we have from our actual image data?
  var n_values = 4 + Math.ceil((92 + (1.33 * n_base64_values)) * 2);
  var block_size = block_width * block_height;
  var n_pixels = block_size * n_values + n_pixels_in_header;
  var height = Math.sqrt(n_pixels / width_to_height_ratio);
  var width = Math.ceil(width_to_height_ratio * height);

  // make output height a multiple of block height
  height = Math.ceil(Math.ceil(height) / block_height) * block_height;

  // make output width a multiple of twice block width, so that two octal values
  // always encoded on same line
  width = Math.ceil(width / (2* block_width)) * 2 *  block_width;

  return {width:width, height:height};
};

cryptagram.codec.aesthete.prototype.encode = function(data,
    width_to_height_ratio, header_string, block_width, block_height) {

  width_to_height_ratio = typeof width_to_height_ratio !== 'undefined' ?
		width_to_height_ratio : 1.0;
  header_string = typeof header_string !== 'undefined' ? header_string :
		'aesthete';
  block_width = typeof block_width !== 'undefined' ? block_width : 2;
  block_height = typeof block_height !== 'undefined' ? block_height : 2;

  n_header_symbols = header_string.length;
  var self = this;

  // Grow an array of grayscale values and then convert them to an RGB Image
  // afterward (so we don't have to precompute size or worry about the header
  // yet).
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
  img.src = c.toDataURL('image/jpeg', this.quality);

  return img;
};



/**
 */
cryptagram.codec.aesthete.prototype.getHeader = function(img, imageData) {

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
cryptagram.codec.aesthete.prototype.getBase8Value = function(img, imgData, x, y) {

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

/** @inheritDoc */
cryptagram.codec.aesthete.prototype.decodeProgress = function() {
  return this.y / this.img.height;

}

cryptagram.codec.aesthete.prototype.decode = function(img, imageData) {
  this.count = 0;
  this.headerSize = this.blockSize * 4;
  this.chunkSize = 10;
  this.y = 0;
  this.img = img;
  this.imageData = imageData;

};

cryptagram.codec.aesthete.prototype.getChunk = function() {

  var newBase64 = "";

  if (this.y >= this.img.height) {
    return false;
  }
  var count = 0;

  while (count < this.chunkSize) {

    for (var x = 0; x < this.img.width; x+= (this.blockSize * 2)) {

        // Skip over header super-block
        if (this.y < this.headerSize && x < this.headerSize) {
          continue;
        }

        base8_0 = this.getBase8Value(this.img, this.imageData, x, this.y);
        base8_1 = this.getBase8Value(this.img, this.imageData, x + this.blockSize, this.y);

        // Found black, stop
        if (base8_0 == -1 || base8_1 == -1) {
          this.y = this.img.height;
          return newBase64;
        };

        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);
        newBase64 += base64;
      }
    this.y+= this.blockSize;
    count++;

    if (this.y >= this.img.height) {
      break;
    }
  }
  return newBase64;
}
