goog.provide('cryptagram.loader');

goog.require('goog.debug.Logger');
goog.require('goog.net.XhrIo');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.net.EventType');

/**
 * @constructor
 */
cryptagram.loader = function(container) {
  this.container = container;
  this.state = cryptagram.loader.state.WAITING;
};

cryptagram.loader.prototype.logger = goog.debug.Logger.getLogger('cryptagram.loader');

/**
 * Enum for possible loader states
 * @enum {string}
 */
cryptagram.loader.state = {
  WAITING:      'Waiting',
  LOADING:  'Loading',
  LOADED:  'Loaded',
  CANCELED:  'Canceled',
  DONE:      'Done'
};



/**
 * @private
 */
cryptagram.loader.prototype.updateProgress = function(e) {
  if (e.lengthComputable) {
    var percentComplete = Math.ceil(100.0 * (e.loaded / e.total));
    this.container.setStatus("Download<br>" + percentComplete + "%");
  }
}


/**
 * @private
 */
cryptagram.loader.prototype.createRequest = function() {
  this.oHTTP = null;
  var self = this;
  if (window.XMLHttpRequest) {
    this.oHTTP = new XMLHttpRequest();
    this.oHTTP.responseType = "arraybuffer";
    this.oHTTP.addEventListener("progress", function(e){ self.updateProgress(e) }, false);
  } else if (window.ActiveXObject) {
    this.oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
  }
}


cryptagram.loader.prototype.cancel = function() {
  if (this.state != cryptagram.loader.state.DONE) {
    this.state = cryptagram.loader.state.CANCELED;
    this.container.setStatus();
  }
}

/**
 * Converts the loader's raw bytes into base64.
 * Binary parsing code borrowed from http://jsperf.com/encoding-xhr-image-data
 * @private
 */
cryptagram.loader.prototype.bytesToBase64 = function() {

  var base64 = '';
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  var bytes = new Uint8Array(this.bytes);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1
    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 16128) >> 8; // 16128 = (2^6 - 1) << 8
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + '=';
  }

  this.base64 = "data:image/jpeg;base64," + base64;
}

/**
 * Retrieves image data from a URL and applies the callback.
 * @param src The URL of the image
 * @param callback The function to call on the resulting data
 */
cryptagram.loader.prototype.queue = function(src, callback) {

  this.logger.info("Queued " + src);
  this.src = src;
  this.container.setStatus("Waiting");

  this.createRequest();
  var self = this;
  self.oHTTP.onreadystatechange = function() {
    if (self.oHTTP.readyState == 4) {
      if (self.oHTTP.status == "200" || self.oHTTP.status == "206") {
        self.bytes = self.oHTTP.response;
        self.bytesToBase64();
        self.logger.info("Downloaded " + self.base64.length + " base64 characters.");
        callback(self.base64);
        self.state = cryptagram.loader.state.LOADED;
      } else {
        self.logger.severe("DOWNLOAD_FAILED " + sjcl.hash.sha256.hash(src));
      }
      //self.oHTTP = null;
    }
  };
};

/**
 *
 */
cryptagram.loader.prototype.start = function() {
  var self = this;

  /*
  var io = new goog.net.XhrIo();
  console.log(io.getBinaryMode);

  goog.events.listen(io, goog.net.EventType.COMPLETE, function(e) {
    console.log(e);
    var xhr = e.target;
    var obj = xhr.getResponseText();
    console.log(obj.substring(0,100));
  }, 'GET', null, {'mimeType':'text/plain; charset=x-user-defined'});

  io.send(this.src);*/

  this.logger.info("Downloading " + this.src);
  this.state = cryptagram.loader.state.LOADING;
  this.oHTTP.open("GET", this.src, true);
  if (this.oHTTP.overrideMimeType) this.oHTTP.overrideMimeType('text/plain; charset=x-user-defined');
  this.oHTTP.send(null);
};





/**
 * Retrieves image data from a URL and applies the callback.
 * @param src The URL of the image
 * @param callback The function to call on the resulting data
 */
cryptagram.loader.prototype.getImageData = function(src, callback) {

  this.logger.info("Downloading " + src);

  this.container.setStatus("Download<br>...");

  this.createRequest();
  var self = this;
  self.oHTTP.onreadystatechange = function() {
    if (self.oHTTP.readyState == 4) {
      if (self.oHTTP.status == "200" || self.oHTTP.status == "206") {
        //var arrayBuffer = oHTTP.response;
        self.bytes = self.oHTTP.response;
        self.bytesToBase64();
        self.logger.info("Downloaded " + self.base64.length + " base64 characters.");
        callback(self.base64);
      } else {
        self.logger.severe("DOWNLOAD_FAILED " + sjcl.hash.sha256.hash(src));
      }
      self.oHTTP = null;
    }
  };

  self.oHTTP.open("GET", src, true);
  if (self.oHTTP.overrideMimeType) self.oHTTP.overrideMimeType('text/plain; charset=x-user-defined');
  self.oHTTP.send(null);
};
