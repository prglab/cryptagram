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

/**
 * This class demonstrates some of the core functionality of cryptagram.
 * @constructor
 */
cryptagram.encoder = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.encoder, goog.events.EventTarget);

cryptagram.encoder.prototype.logger = goog.debug.Logger.getLogger('cryptagram.encoder');

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

  // console.log("Data: " + originalData);
  var threshold_ = 6000000;
  var new_quality_ = 0.2;

  var requality = new cryptagram.Requality();
  goog.events.listen(requality, "REQUALITY_DONE", function (event) {
    console.log("Got it: " + event.image.length);
    console.log("Image text: " + event.image.substring(0,100));
    self.encodeImage(event.image);
  },
                     true, this);
  requality.start(originalData, new_quality_);

  // if (originalData.length > threshold_) {
  //   console.log("Reducing quality.");
  //   this.reduceQuality(originalData, new_quality_);
  // } else {
  //   this.encodeImage(originalData);
  // }

  // var reduced = self.reduceQuality(originalData, 0.77);
  // if (reduced) {
  //   console.log("Reduced: " + reduced.src);
  // }

  // Insert the reduced here to test the reduceQuality function.
};

cryptagram.encoder.prototype.encodeImage = function (dataToEncode) {
  var self = this;
  var originalImage = new Image();
  originalImage.onload = function () {
    // goog.dom.insertChildAt(goog.dom.getElement('original_image'), originalImage, 0);
    ratio = originalImage.width / originalImage.height;

    // var str = dataToEncode;
    console.log("Size: " + dataToEncode.split('base64,')[1].length);

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
  console.log("Loaded");

  var encodedImage = loadEvent.target;
  goog.dom.insertChildAt(goog.dom.getElement('encoded_image'),
												 encodedImage,
												 0);
  var str = encodedImage.src;
  var idx = str.indexOf(",");
  var dat = str.substring(idx+1);

  // Trigger it!
  console.log("Dispatching with this much data: " + dat.length);
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

