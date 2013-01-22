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
goog.require('cryptagram.decoder');
goog.require('cryptagram.cipher');
goog.require('cryptagram.codec.bacchant');
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
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.encoder, goog.events.EventTarget);

cryptagram.encoder.prototype.logger =
		goog.debug.Logger.getLogger('cryptagram.encoder');

cryptagram.encoder.prototype.setStatus = function(message) {
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


cryptagram.encoder.prototype.loadFile = function(file) {
  var self = this;
  var reader = new FileReader();
  reader.onerror = cryptagram.encoder.show_error;
  reader.onload = function(e) {
    
    var image = new Image();
    image.src = e.target.result;
    self.images.push(image);
    self.files.splice(0,1);
    self.dispatchEvent({type: 'IMAGE_LOADED', image: image, remaining: self.files.length});
  }
  reader.readAsDataURL(file);
}

cryptagram.encoder.prototype.queueFiles = function(files) {
 
  var self = this;
  self.files = [];
  self.images = [];
  for (var f in files) {
    if (files[f].type == 'image/jpeg') {
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




cryptagram.encoder.prototype.startEncoding = function(options) {
  var self = this;
  this.password = options.password;
  goog.events.listen(this, 'IMAGE_DONE', function (event) {
    if (self.images.length > 0) {
      self.encodeImage(self.images[0]);
    }
  }, true, this);
  this.encodeImage(self.images[0]);
};

cryptagram.encoder.prototype.encodeImage = function (image) {

  this.dispatchEvent({type:"DECODE_START", image:image});

  var self = this;
  var ratio = image.width / image.height;
  var dataToEncode = image.src;
  
  var codec = new cryptagram.codec.bacchant();
  var cipher = new cryptagram.cipher();

  var encryptedData = cipher.encrypt(dataToEncode, this.password);
  var encodedImage = codec.encode(encryptedData, ratio);
  encodedImage.onload = function(e) {
    self.encodedOnload(e);
  }
};

cryptagram.encoder.prototype.encodedOnload = function (loadEvent) {
  var self = this;
  self.images.splice(0,1);
  var encodedImage = loadEvent.target;
  var str = encodedImage.src;
  console.log("String: " + str.substring(0,100));
  var idx = str.indexOf(",");
  var dat = str.substring(idx+1);
  console.log("Encoded data is this long: " + str.length);
  this.dispatchEvent({type:"IMAGE_DONE", image:encodedImage});
};




cryptagram.encoder.prototype.readerOnload = function (loadEvent) {
  var self = this;
  var originalImgDataUrl = loadEvent.target.result;
  var image = new Image();
  image.src = loadEvent.target.result;
  this.dispatchEvent({type: 'IMAGE_LOADED', image: image});

  // TODO(tierney): Expose this parameter for other programmers.
  var newQuality = 0.8;

  // Setup the requality engine event though we may not use it.
  var sizeReducer = new cryptagram.SizeReducer();
  var sizeReducerListenKey = goog.events.listen(
    sizeReducer,
    "SIZE_REDUCER_DONE",
    function (event) {
      console.log("Got this from the sizeReducer: " + event.image.length + " "
                  + event.image.substring(0,100));
      self.encodeImage(event.image);
    },
    true,
    this);

  // Get from model the size reduction that we need.
  var reductionEstimator = new cryptagram.ReductionEstimator();
  goog.events.listen(
    reductionEstimator,
    "REDUCTION_ESTIMATOR_DONE",
    function (event) {
      if (event.fraction < 1.0) {
        sizeReducer.start(originalImgDataUrl, event.fraction, newQuality);
      } else {
        self.encodeImage(originalImgDataUrl);
      }
    },
    true,
    this);
  reductionEstimator.getEstimate(originalImgDataUrl, newQuality);
};


cryptagram.encoder.show_error = function(msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
  return true;
};

goog.exportSymbol('cryptagram.encoder', cryptagram.encoder);
goog.exportSymbol('cryptagram.encoder.prototype.showEncrypt',
                  cryptagram.encoder.prototype.showEncrypt);
