goog.provide('cryptagram.codec.bacchant');

goog.require('cryptagram.codec');
goog.require('cryptagram.cipher.bacchant');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.codec}
 */
cryptagram.codec.bacchant = function() {
  this.blockSize = 2;
  this.quality = .85;
  this.symbol_thresholds = [0, 36, 72, 109, 145, 182, 218, 255];
  this.cipher = new cryptagram.cipher.bacchant();
};
goog.inherits(cryptagram.codec.bacchant, cryptagram.codec);

cryptagram.codec.bacchant.prototype.logger =
  goog.debug.Logger.getLogger('cryptagram.codec.bacchant');


/** @inheritDoc */
cryptagram.codec.bacchant.prototype.name = function() {
  return "bacchant";
};


cryptagram.codec.bacchant.prototype.encode = function(data,
    width_to_height_ratio, header_string, block_width, block_height) {

  var timeA = new Date().getTime();

  var width_to_height_ratio = typeof width_to_height_ratio !== 'undefined' ?
		width_to_height_ratio : 1.0;
  var header_string = typeof header_string !== 'undefined' ? header_string :
		this.name();
  var block_width = typeof block_width !== 'undefined' ?
    block_width : this.blockSize;
  var block_height = typeof block_height !== 'undefined' ?
    block_height : this.blockSize;

  var n_header_symbols = header_string.length;
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

  var n_header_row_symbols_wide = (width - header_width) / block_width;
  var n_header_row_symbols = n_header_row_symbols_wide *
		(header_height / block_height)
  var n_symbols_in_full_row = width / block_width;
  var x_coord, y_coord, x, y, i2;

  for (var i = 0; i < n_values; i++) {
    var octal = values[i];
    level = this.symbol_thresholds[octal];
    var x_coord, y_coord, x, y;
    if (i < n_header_row_symbols) {
      y_coord = Math.floor(i / n_header_row_symbols_wide);
      x_coord = (i - (y_coord * n_header_row_symbols_wide));
      x = header_width + (x_coord * block_width);
    } else {
     var i2 = i + n_header_values;
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


// TODO(tierney): Make more flexible for the adhoc dimension choice.
cryptagram.codec.bacchant.maxBase64Values = function (width_to_height_ratio,
                                                      largestDim) {
  var smallMaxDim = width_to_height_ratio <= 1.0 ?
    Math.floor(largestDim * width_to_height_ratio) :
    Math.floor(largestDim / width_to_height_ratio);
  var n_pixels = smallMaxDim * largestDim;

  return Math.floor(0.75 * ((n_pixels - 64 - 256 - 736 - 32) / 8.0));
};

/**
 * static method to return an estimate of the required image dimensions given
 * the aspect ratio and the number of base64 values to be embedded.
 */
cryptagram.codec.bacchant.dimensions = function (width_to_height_ratio,
                                                 n_base64_values) {
  if ((typeof width_to_height_ratio !== "number") ||
      (typeof n_base64_values !== "number")) {
    return undefined;
  }

  var width_to_height_ratio = typeof width_to_height_ratio !== 'undefined' ?
		width_to_height_ratio : 1.0;
  var header_string = "bacchant";
  var block_width = typeof block_width !== 'undefined' ? block_width : 2;
  var block_height = typeof block_height !== 'undefined' ? block_height : 2;

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

  // TODO(tierney): This needs to be checked for correctness. It appears to be
  // overestimating the expected values.
  // var n_values = Math.ceil((112 + (1.33 * (8 + n_base64_values))) * 2);
  var n_values = Math.ceil(2 * (8 + 65 + 1.33 * n_base64_values));

  var block_size = block_width * block_height;
  var n_pixels = block_size * n_values + n_pixels_in_header;
  var height = Math.sqrt(n_pixels / width_to_height_ratio);
  var width = Math.ceil(width_to_height_ratio * height);

  // make output height a multiple of block height
  // TODO(tierney): Hack to be conservative...
  height = Math.ceil(Math.ceil(height) / block_height) * block_height;

  // make output width a multiple of twice block width, so that two octal values
  // always encoded on same line
  width = 4 + Math.ceil(width / (2* block_width)) * 2 *  block_width;

  return {width:width, height:height};
};





/**
 */
cryptagram.codec.bacchant.prototype.getHeader = function(img, imageData) {

    var newBase64 = "";
    var headerSize = this.blockSize * 4;
    for (var y = 0; y < headerSize; y+= this.blockSize) {
      for (var x = 0; x < headerSize; x+= 2*this.blockSize) {

        var base8_0 = this.getBase8Value(img, imageData, x, y);
        var base8_1 = this.getBase8Value(img, imageData, x + this.blockSize, y);
        var base64Num = base8_0 * 8 + base8_1 ;

        var base64 = this.base64Values.charAt(base64Num);
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
cryptagram.codec.bacchant.prototype.getBase8Value = function(img, imgData, x, y) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  var inc = (255.0 / 7.0);
  for (var i = 0; i < this.blockSize; i++) {
    for (var j = 0; j < this.blockSize; j++) {

      var base = (y + j) * img.width + (x + i);

      var r = imgData[4*base];
      var g = imgData[4*base + 1];
      var b = imgData[4*base + 2];
      var lum = 0.299 * r + 0.587 * g + 0.114 * b;

      vt += lum;
      count++;
    }
  }

  var v = vt / count;
  var bin = Math.round(v / inc);
  if (bin >= 7) bin = 7;
  return bin;
}

/** @inheritDoc */
cryptagram.codec.bacchant.prototype.decodeProgress = function() {
  return this.y / this.img.height;

}

cryptagram.codec.bacchant.prototype.setDecodeParams = function(img, imageData) {
  this.count = 0;
  this.chunkSize = 10;
  this.y = 0;
  this.img = img;
  this.imageData = imageData;
  this.lengthString = "";
  this.errorCount = 0;
  this.decodeData = '';
};

cryptagram.codec.bacchant.prototype.getChunk = function() {

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

        var base8_0 = this.getBase8Value(this.img, this.imageData, x, this.y);
        var base8_1 = this.getBase8Value(this.img, this.imageData,
                                         x + this.blockSize, this.y);

        var base64Num = base8_0 * 8 + base8_1 ;
        var base64 = this.base64Values.charAt(base64Num);

        if (this.y == 0 && x < headerSize + 16*this.blockSize) {
          this.lengthString += base64;
        } else {

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

    this.y += this.blockSize;
    count++;
  }
  this.decodeData += newBase64;
  return true;
}
