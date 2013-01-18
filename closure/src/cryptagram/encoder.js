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
goog.require('cryptagram.Requality');
goog.require('cryptagram.Requality.Event');
goog.require('cryptagram.Requality.EventType');
goog.require('cryptagram.ResizeValidator');
goog.require('cryptagram.ResizeValidator.Event');
goog.require('cryptagram.ResizeValidator.EventType');

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

// Stubbed.
cryptagram.encoder.prototype.reduceSize = function(image, fraction) {
}

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


cryptagram.encoder.prototype.readerOnload = function (loadEvent) {
  var self = this;
  var originalData = loadEvent.target.result;

  // TODO(tierney): Expose this parameter for other programmers.
  var newQuality = 0.8;

  // Setup the requality engine event though we may not use it.
  var requality = new cryptagram.Requality();
  var requalityListenKey = goog.events.listen(
    requality,
    "REQUALITY_DONE",
    function (event) {
      console.log("Got this from the requality: " + event.image.length + " "
                  + event.image.substring(0,100));
      self.encodeImage(event.image);
    },
    true,
    this);

  // Decide whether we should reduce the quality of the image or not.
  var resizer = new cryptagram.ResizeValidator();
  goog.events.listen(
    resizer,
    "RESIZE_VALIDATION",
    function (event) {
      if (event.valid) {
        console.log("Reducing quality.");
        requality.start(originalData, newQuality);
      } else {
        goog.events.unlistenByKey(requalityListenKey);
        this.encodeImage(originalData);
      }
    },
    true,
    this);
  resizer.validate(2048, 2048, originalData);
};

cryptagram.encoder.prototype.encodeImage = function (dataToEncode) {
  var self = this;
  var originalImage = new Image();
  originalImage.onload = function () {
    goog.dom.insertChildAt(goog.dom.getElement('original_image'),
                           originalImage,
                           0);
    ratio = originalImage.width / originalImage.height;

    // TODO(tierney): Prompt from user.
    var password = 'cryptagram';

    var codec = new cryptagram.codec.aesthete();
    var cipher = new cryptagram.cipher();

    var encryptedData = cipher.encrypt(dataToEncode, password);
    var encodedImage = codec.encode(encryptedData, ratio);
    encodedImage.onload = function(e) {
      self.encodedOnload(e);
    }
  }
  originalImage.src = dataToEncode;
};

cryptagram.encoder.prototype.encodedOnload = function (loadEvent) {
  var self = this;
  var encodedImage = loadEvent.target;
  goog.dom.insertChildAt(goog.dom.getElement('encoded_image'),
												 encodedImage,
												 0);
  var str = encodedImage.src;
  console.log("String: " + str.substring(0,100));
  var idx = str.indexOf(",");
  var dat = str.substring(idx+1);

  console.log("Encoded data is this long: " + str.length);
  this.dispatchEvent({type:"IMAGE_DONE", dat:dat});
};

cryptagram.encoder.prototype.startEncoding = function (fin) {
  var self = this;
  var name = escape(fin.name);
  console.log("Name: " + name);
  console.log('Size: ' + fin.size);

  var type = fin.type || 'n/a';
  var reader = new FileReader();
  var ratio = 1.0;

  reader.onload = function(e) {
    self.readerOnload(e);
  }
  reader.onerror = cryptagram.encoder.show_error;
  console.log("Reading image.");
  reader.readAsDataURL(fin);
  console.log("Read image.");
}

cryptagram.encoder.show_error = function(msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
  return true;
};

goog.exportSymbol('cryptagram.encoder', cryptagram.encoder);
goog.exportSymbol('cryptagram.encoder.prototype.showEncrypt',
                  cryptagram.encoder.prototype.showEncrypt);
