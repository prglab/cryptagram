
octal_symbol_thresholds = [238, 210, 182, 154, 126, 98, 70, 42, 14];
// Each base-64 character gets split into two octal symbols, so we have one
// function to turn an octal symbol into a single threshold and a base-64
// character into a short array of thresholds.
base64_values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function resize( imagewidth, imageheight, thumbwidth, thumbheight ) {
  var w = 0, h = 0, x = 0, y = 0,
  widthratio  = imagewidth / thumbwidth,
  heightratio = imageheight / thumbheight,
  maxratio    = Math.max( widthratio, heightratio );

  if ( maxratio > 1 ) {
    w = imagewidth / maxratio;
    h = imageheight / maxratio;
  } else {
   w = imagewidth;
   h = imageheight;
  }
  x = ( thumbwidth - w ) / 2;
  y = ( thumbheight - h ) / 2;
  return { w:w, h:h, x:x, y:y };
}


function encrypt (data, password) {
  var encrypted_data = JSON.parse(sjcl.encrypt(password, data));
  var iv = encrypted_data['iv'];
  var salt = encrypted_data['salt'];
  var ct = encrypted_data['ct'];
  var to_hash = iv + salt + ct;

	var bits = sjcl.hash.sha256.hash(to_hash);
  var integrity_check_value = sjcl.codec.hex.fromBits(bits);
  return integrity_check_value + to_hash;
}

function write(text) {
  $("#alerts").append($('<p>').html(text))
}
function clear_alerts() {
  $("#alerts").html("");
}


function encode(data, width_to_height_ratio, header_string, block_width,
								block_height) {
  width_to_height_ratio = typeof width_to_height_ratio !== 'undefined' ?
		width_to_height_ratio : 1.0;
  header_string = typeof header_string !== 'undefined' ? header_string :
		'aesthete';
  block_width = typeof block_width !== 'undefined' ? block_width : 2;
  block_height = typeof block_height !== 'undefined' ? block_height : 2;

  n_header_symbols = header_string.length;

  // grow an array of grayscale values and then convert them to an RGB Image
  // afterward (so we don't have to precompute size or worry about the header
  // yet
  function add_char(ch,values) {
    var value = base64_values.indexOf(ch);
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
  var d = imageData.data;

  function set_pixel(x, y, level) {
    idx = 4 * (x + y * width);
    // set RGB channels to same level since we're encoding data as grayscale
    d[idx] = level;
    d[idx + 1] = level;
    d[idx + 2] = level;
    d[idx + 3] = 255; // alpha channel
  }

  function set_block(x_start, y_start, level) {
    for (var i = 0; i < block_width; i++) {
      for (var j = 0; j < block_height; j++) {
        set_pixel(x_start+i, y_start+j, level);
      }
    }
  }
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
        level =  octal_symbol_thresholds[header_values[value_idx]];
      }
      set_block(x, y, level);
    }
  }

  n_header_row_symbols_wide = (width - header_width) / block_width;
  n_header_row_symbols = n_header_row_symbols_wide *
		(header_height / block_height)
  n_symbols_in_full_row = width / block_width;
  var x_coord, y_coord, x, y, i2;
  for (var i = 0; i < n_values; i++) {
    octal = values[i];
    level = octal_symbol_thresholds[octal];
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
    set_block(x,y,level);
  }
  cxt.putImageData(imageData, 0, 0);
  var img = new Image();
  return c.toDataURL('image/jpeg', 0.95);
}

// Draw image onto canvas and optionally resize it into a thumbnail.
function image_to_canvas( img, thumb_width, thumb_height) {
  var c = document.getElementById('cancan');
  var cx = c.getContext('2d');
  if (thumb_width && thumb_height) {
    c.width = thumb_width;
    c.height = thumb_height;
    var dimensions = resize( img.width, img.height, thumb_width, thumb_height );
    cx.drawImage(
      img, dimensions.x, dimensions.y, dimensions.w, dimensions.h
    );
  }
  else {
    c.width = img.width;
    c.height = img.height;
    cx.drawImage(img, 0, 0);
  }
}

function show_error(msg, url, linenumber) {
  write('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber)
  return true;
}

// When the user selects a file, draw it on the canvas as an image.
function handleFileSelect(evt) {
  clear_alerts();
  var files = evt.target.files; // FileList object

  // Files is a FileList of File objects. List some properties.
  var output = [];
  f = files[0];
  var name = escape(f.name);
  var type = f.type || 'n/a';
  var output = ['<li><strong>', name, '</strong> (', type, ') - ', f.size,
								' bytes</li>'];
  var reader = new FileReader();
  reader.onload = function ( loadEvent ) {
    originalData = loadEvent.target.result;
    originalImage = new Image();
    originalImage.onload= function () {
      $('#original_image').html(originalImage);
    }
    originalImage.src = originalData;

    // Get rid of data type information (for now assuming always JPEG.
    var withoutMimeHeader = originalData.split('base64,')[1];

		// TODO(tierney): Accept user-chosen password.
		var password = 'cryptogram';
    encryptedData = encrypt(withoutMimeHeader, password);
    width_to_height_ratio = 1.0; // TODO(iskandr): Actually use the image.
    encodedImage = encode(encryptedData, width_to_height_ratio );
    encodedImage.onload = function () {
      $('#encoded_image').html(encodedImage);
    }
  };
  reader.onerror = show_error;
  reader.readAsDataURL(f);
  var info = document.getElementById('file_info');
  info.innerHTML = '<ul>' + output.join('') + '</ul>';
}

