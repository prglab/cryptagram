// Class to requality an image.

goog.provide('cryptagram.Requality');
goog.provide('cryptagram.Requality.EventType');
goog.provide('cryptagram.Requality.Event');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');

goog.require('cryptagram.container');
goog.require('cryptagram.decoder');
goog.require('cryptagram.cipher');
goog.require('cryptagram.codec.bacchant');
goog.require('cryptagram.loader');
goog.require('cryptagram.RemoteLog');
goog.require('cryptagram.Resizing');
goog.require('cryptagram.Resizing.EventType');
goog.require('cryptagram.Resizing.Event');

// Requality constructor. Listen for these events as follows:
// var requal = new cryptagram.Requality();
// goog.events.listen(requal, 'requalityDone', function (e) {...}, true, this);
cryptagram.Requality = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.Requality, goog.events.EventTarget);


// Requality.Event enum.
cryptagram.Requality.EventType = {
  REQUALITY_DONE: goog.events.getUniqueId('requalityDone')
};

// Requality.Event constructor.
cryptagram.Requality.Event = function (image) {
  goog.events.Event.call(this, 'REQUALITY_DONE');
  this.image = image;
};
goog.inherits(cryptagram.Requality.Event, goog.events.Event);

// Requality.EventTarget constructor.
cryptagram.Requality.EventTarget = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.Requality.EventTarget, goog.events.EventTarget);



cryptagram.Requality.prototype.logger =
  goog.debug.Logger.getLogger('cryptagram.Requality');

cryptagram.Requality.prototype.setStatus = function (message) {
  console.log(message);
};

cryptagram.Requality.prototype.imageOnload = function (img, quality) {
  // Check the size and then pass to either the encoder or to resize.
  var self = this;

	var width = img.width;
	var height = img.height;

  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  var context = canvas.getContext('2d');
	context.drawImage(img, 0, 0, width, height);

  var origQualityLength = canvas.toDataURL('image/jpeg', 1.0);
  console.log('Image ORIG quality length: ' + origQualityLength.length);
	var outUrl = canvas.toDataURL('image/jpeg', quality);

  console.log('Image NEW quality: ' + quality + ' ' + width + ' ' + height);
  console.log('outUrl Length: ' + outUrl.length);

  // We pass the image to the resizer, regardless of the need. The reason is
  // that decision to continue resizing the image is necessarily simplified by
  // putting the logic for that condition in the resizer.
  var resizer = new cryptagram.Resizing();
  goog.events.listen(
    resizer,
    'RESIZING_DONE',
    function (event) {
      console.info('Resizing done.');
      this.dispatchEvent({type:'REQUALITY_DONE', image:event.image});
    },
    true,
    this);

  var newImg = document.createElement('img');
  newImg.src = outUrl;
  newImg.onload = function (event) {
    resizer.start(newImg, 0);
  };
};

// Reduces the quality of the image @image to level @quality.
cryptagram.Requality.prototype.start = function (image, quality) {
  var self = this;
  this.logger.info('Started with: ' + image.length);
	var img = document.createElement('img');
	img.onload = function (event) {
    self.imageOnload(img, quality);
  }

  if (image.length > 600) {
    this.logger.info('Must requality.');
	  img.src = image;
  } else {
    this.logger.info('No need for requality.');
    this.dispatchEvent({type:'REQUALITY_DONE', image:image});
  }
};
