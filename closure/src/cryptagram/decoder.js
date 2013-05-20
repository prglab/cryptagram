goog.provide('cryptagram.decoder');

goog.require('cryptagram.codec.aesthete');
goog.require('cryptagram.codec.bacchant');
goog.require('cryptagram.storage');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventTarget');


/**
 * @constructor
 */
cryptagram.decoder = function(container, options) {
  this.container = container;
  
  if (options && options.password) {
    this.password = options.password;
  }
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.decoder, goog.events.EventTarget);

cryptagram.decoder.prototype.logger = goog.debug.Logger.getLogger('cryptagram.decoder');



/**
 * Decodes the supplied base64 data and applies the callback.
 * @param data The input base64 data.
 * @param callback The function to call on the resulting data.
 */
cryptagram.decoder.prototype.decodeData = function(data, codec, callback) {

  var self = this;
  self.callback = callback;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();

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
      self.data = '';
      self.codec.setDecodeParams(img, imageData);
      self.timeA = new Date().getTime();
      self.processImage();
    }
  };

  img.src = data;
}


/**
 * Decodes the data and applies JPEG again for requality experiments
 */
cryptagram.decoder.prototype.decodeDataWithQuality = function(data, codec, callback) {

  var self = this;
  self.callback = callback;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  
  img.onload = function(){
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0);
    var img2 = new Image();
    img2.onload = function(){
      var canvas2 = document.createElement('canvas');
      var ctx2 = canvas.getContext('2d');
      canvas2.width = img.width;
      canvas2.height = img.height;
      ctx2.drawImage(img2,0,0);
      var imageData = ctx2.getImageData(0, 0, canvas.width, canvas.height).data;

      if (!codec) {
        self.codec = self.getCodec(img, imageData);
      } else {
        self.codec = codec;
      }
  
      if (!self.codec) {
        self.container.setStatus();
      } else {
        self.data = '';
        self.codec.setDecodeParams(img, imageData);
        self.timeA = new Date().getTime();
        self.processImage();
      }
    }
    img2.src = canvas.toDataURL('image/jpeg', self.quality);
  };
  img.src = data;
}


cryptagram.decoder.prototype.getCodec = function(img, imageData) {

  var knownCodecs = [cryptagram.codec.aesthete, cryptagram.codec.bacchant];
  var testCodec;
  for (var i = 0; i < knownCodecs.length; i++) {
    testCodec = new knownCodecs[i]();
    if (testCodec.test(img, imageData)) {
      this.logger.shout('CODEC ' + testCodec.name());
      return testCodec;
    }
  }
  this.logger.severe('UNKNOWN_CODEC');
  return null;
}


/**
 * @private
 */
cryptagram.decoder.prototype.processImage = function() {

  var more = this.codec.getChunk();

  if (more) {
    var percent = Math.round(100 * this.codec.decodeProgress(), 2);
    this.container.setStatus('Decode<br>' + percent + '%');
    var self = this;
    setTimeout(function () { self.processImage() }, 1);

  // Done processing
  } else {
    var timeB = new Date().getTime();
    this.elapsed = timeB - this.timeA;
    this.logger.shout('DECODE_LEN_ELAPSED_MS ' +
                      this.codec.decodeData.length + ' ' +
                      this.elapsed);
    this.container.setStatus();    
    this.logger.shout('PROCESS_IMAGE_DECRYPT_START ' + this.codec.decodeData.length);
    var decrypted = this.codec.decrypt(this.password, this.callback);
    this.logger.shout('PROCESS_IMAGE_DECRYPT_FINISH ' + this.codec.decodeData.length);
    this.callback(decrypted);
 }
}



// Changes the state of self.files by splicing. Loads the self.images array with
// Image objects.
cryptagram.decoder.prototype.loadFile = function (file) {
  var self = this;
  var reader = new FileReader();
  reader.onerror = cryptagram.encoder.show_error;
  reader.onload = function (e) {
    var image = new Image();
    image.src = e.target.result;
    image.file = self.files[0].name;
    self.images.push(image);
    self.files.splice(0,1);
    self.dispatchEvent({type: 'IMAGE_LOADED',
                        image: image,
                        remaining: self.files.length});
  }
  reader.readAsDataURL(file);
}

cryptagram.decoder.prototype.queueFiles = function (files) {
  var self = this;
  self.files = [];
  self.images = [];
  for (var f in files) {
    var type = '' + files[f].type;
    if (type.indexOf('image/') == 0) {
      self.files.push(files[f]);
    }
  }

  goog.events.listen(this, 'IMAGE_LOADED', function (event) {
    if (self.files.length > 0) {
      self.loadFile(self.files[0]);
    }
  }, true, this);

  if (self.files.length > 0) {
    this.loadFile(self.files[0]);
  }
};
