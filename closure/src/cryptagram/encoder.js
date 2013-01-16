// Encoder class for the cryptagram web frontend. This class is intended to
// provide a portable, drag-and-drop medium for creating cryptagram images.

goog.provide('cryptagram.encoder');
goog.provide('cryptagram.encoder.EventType');
goog.provide('cryptagram.encoder.EncoderEvent');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');

goog.require('cryptagram.container');
goog.require('cryptagram.decoder');
goog.require('cryptagram.cipher');
goog.require('cryptagram.codec.bacchant');
goog.require('cryptagram.loader');
goog.require('cryptagram.RemoteLog');

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

// Reduces the quality of the image @image to level @quality.
cryptagram.encoder.prototype.reduceQuality = function(image, quality) {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
	var img = new Image();
	var newImg = img.onload = function () {
		var width = img.width;
		var height = img.height;
		context.drawImage(img, 0, 0, width, height);
		var outImg = canvas.toDataURL('image/jpeg', quality);
    console.log("outImg: " + outImg);
	}();
	img.src = image;
	return newImg;
}

// Stubbed.
cryptagram.encoder.prototype.reduceSize = function(image, fraction) {
}

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
  // self.images.file(self.numberImages + '.jpg', dat, {base64: true});
  // self.numberImages++;

  // Trigger it!
  console.log("Dispatching with this much data: " + dat.length);
  // var source = new goog.events.EventTarget();

  this.dispatchEvent("IMAGE_DONE");
  // myelement.dispatchEvent(myEvent);
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

  console.log(this);

  var originalData = loadEvent.target.result;

  // console.log("Data: " + originalData);
  console.log("Reducing quality.");
  // var reduced = self.reduceQuality(originalData, 0.77);
  // if (reduced) {
  //   console.log("Reduced: " + reduced.src);
  // }

  // Insert the reduced here to test the reduceQuality function.

  var originalImage = new Image();
  originalImage.onload = function () {
    goog.dom.insertChildAt(goog.dom.getElement('original_image'), originalImage, 0);
    ratio = originalImage.width / originalImage.height;

    // var str = originalData;
    console.log("Size: " + originalData.split('base64,')[1].length);

    // TODO(tierney): Prompt from user.
    var password = 'cryptagram';

    var codec = new cryptagram.codec.bacchant();
    var cipher = new cryptagram.cipher();

    var encryptedData = cipher.encrypt(originalData, password);
    var encodedImage = codec.encode(encryptedData, ratio);
    encodedImage.onload = function(e) {
      self.encodedOnload(e);
    }
  }
  originalImage.src = originalData;
}

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

