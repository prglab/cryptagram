// Encoder class for the cryptagram web frontend. This class is intended to
// provide a portable, drag-and-drop medium for creating cryptagram images.

goog.provide('cryptagram.encoder');
goog.provide('cryptagram.encoder.EventType');
goog.provide('cryptagram.encoder.EncoderEvent');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');

goog.require('cryptagram.container');
goog.require('cryptagram.codec.aesthete');
goog.require('cryptagram.loader');
goog.require('cryptagram.RemoteLog');

goog.require('cryptagram.SizeReducer');
goog.require('cryptagram.SizeReducer.Event');
goog.require('cryptagram.SizeReducer.EventType');

goog.require('cryptagram.ReductionEstimator');
goog.require('cryptagram.ReductionEstimator.Event');
goog.require('cryptagram.ReductionEstimator.EventType');

/**
 * This class demonstrates some of the core functionality of cryptagram.
 * @constructor
 */
cryptagram.encoder = function () {
  // this.codec is the codec type, not an instance.
  this.codec = cryptagram.codec.bacchant;
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.encoder, goog.events.EventTarget);

cryptagram.encoder.prototype.logger =
		goog.debug.Logger.getLogger('cryptagram.encoder');

cryptagram.encoder.prototype.setStatus = function (message) {
  console.log(message);
};

/** @enum {string} */
cryptagram.encoder.EventType = {
  IMAGE_DONE: goog.events.getUniqueId('imageDone')
};


cryptagram.encoder.EncoderEvent = function (dat) {
  goog.events.Event.call(this, 'IMAGE_DONE');
  this.dat = dat;
};
goog.inherits(cryptagram.encoder.EncoderEvent, goog.events.Event);


cryptagram.encoder.EncoderEventTarget = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.encoder.EncoderEventTarget, goog.events.EventTarget);

// Changes the state of self.files by splicing.
cryptagram.encoder.prototype.loadFile = function (file) {
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

cryptagram.encoder.prototype.queueFiles = function (files) {
  var self = this;
  self.files = [];
  self.images = [];
  for (var f in files) {
    var type = "" + files[f].type;
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

// Main driver for the encoding of images.
//
// Note: The call the encodeImage() callos encodedOnload() which splices the
// self.images array at every iteration. This is how the self.images.length is
// reduced.
// TODO(tierney): Make the callbacks less prone to altering state / causing
// side-effects implictly.
cryptagram.encoder.prototype.startEncoding = function (options) {
  var self = this;
  self.numImages = self.images.length;
  this.password = options.password;

  goog.events.listen(this, 'IMAGE_DONE', function (event) {
    if (self.images.length > 0) {
      self.createValidImage(self.images[0]);
    }
  }, true, this);
  this.createValidImage(self.images[0]);
};

cryptagram.encoder.prototype.createValidImage = function (image) {
  var self = this;

  // TODO(tierney): Expose this parameter for other programmers.
  var newQuality = 0.9;

  var sizeReducer = new cryptagram.SizeReducer();
  var sizeReducerListenKey = goog.events.listen(
    sizeReducer,
    'SIZE_REDUCER_DONE',
    function (event) {
      self.encodeImage(event.image);
    },
    true,
    this);
  sizeReducer.startWithImage(image, newQuality);
};

// Expects an image (where .src is a data URL) and will embed without any
// modifications.
cryptagram.encoder.prototype.encodeImage = function (image) {
  this.dispatchEvent({type:'ENCODE_START', image:image});

  var self = this;
  var ratio = image.width / image.height;
  var dataToEncode = image.src;

  var codec = new this.codec();

  var encryptedData = codec.encrypt(dataToEncode, this.password);
  var encodedImage = codec.encode(encryptedData, ratio);
  encodedImage.file = image.file;
  encodedImage.onload = function (e) {
    self.encodedOnload(e);
  }
};

// Splices images.
cryptagram.encoder.prototype.encodedOnload = function (loadEvent) {
  var self = this;
  self.images.splice(0,1);
  var encodedImage = loadEvent.target;
  var str = encodedImage.src;
  console.log('String: ' + str.substring(0,100));
  var idx = str.indexOf(',');
  var dat = str.substring(idx+1);
  console.log('Encoded data is this long: ' + str.length);
  this.dispatchEvent({type:'IMAGE_DONE',
                      image:encodedImage,
                      remaining: self.images.length});
};


cryptagram.encoder.show_error = function (msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
  return true;
};

goog.exportSymbol('cryptagram.encoder', cryptagram.encoder);
goog.exportSymbol('cryptagram.encoder.prototype.showEncrypt',
                  cryptagram.encoder.prototype.showEncrypt);
