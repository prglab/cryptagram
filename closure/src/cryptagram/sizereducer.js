// Class to reduce the size of an image.

goog.provide('cryptagram.SizeReducer');
goog.provide('cryptagram.SizeReducer.Event');
goog.provide('cryptagram.SizeReducer.EventType');

goog.require('goog.debug.Logger');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');

cryptagram.SizeReducer = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.SizeReducer, goog.events.EventTarget);

cryptagram.SizeReducer.prototype.logger =
	goog.debug.Logger.getLogger('cryptagram.SizeReducer');

cryptagram.SizeReducer.EventType = {
  SIZE_REDUCER_DONE: goog.events.getUniqueId('sizeReducerDone')
};

cryptagram.SizeReducer.Event = function (imageDataUrl) {
  goog.events.Event.call(this, 'SIZE_REDUCER_DONE');
  this.imageDataUrl = imageDataUrl;
};
goog.inherits(cryptagram.SizeReducer.Event, goog.events.Event);

cryptagram.SizeReducer.EventTarget = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.SizeReducer.EventTarget, goog.events.EventTarget);

// Assumes that @image is an Image () object that has .src set to a DataURL.
cryptagram.SizeReducer.prototype.startWithImage = function (image, quality) {
  var self = this;

  // Will use the maximum number of base64 values to estimate the amount of data
  // that we will be able to pack into the image.
  var width_to_height_ratio = image.width / image.height;
  var limit = cryptagram.codec.aesthete.maxBase64Values(width_to_height_ratio);

  var fraction = 1.0;
  if (limit < image.src.length) {
    var fraction = limit / image.src.length;
    this.startWithDataURLFractionQuality(image.src, fraction, quality);
  } else {
    this.dispatchEvent({type:"SIZE_REDUCER_DONE", image:image});
  }
};

// Takes an image dataURL, fraction by which to reduce the image size and the
// output quality.
cryptagram.SizeReducer.prototype.startWithDataURLFractionQuality =
  function (imageDataUrl,
            fraction,
            quality) {
  var self = this;

  var image = new Image();
  image.onload = function (event) {
    var img = this;

    // Load image into canvas for resize.
    var canvas = document.createElement('canvas');
    var context = canvas.getContext("2d");

    var newWidth = Math.floor(img.width);
    var newHeight = Math.floor(img.height);
    context.drawImage(img, 0, 0, newWidth, newHeight);

    // Convert to data URL and save at given quality.
    var newImageDataUrl = canvas.toDataURL('image/jpeg', quality);

    // Convert the image data URL to an image and pass that up once it's loaded.
    var newImage = new Image ();
    newImage.onload = function (event) {
      // Send the event.
      self.dispatchEvent({type:"SIZE_REDUCER_DONE", image:newImage});
    };
    newImage.src = newImageDataUrl;
  };
  image.src = imageDataUrl;
};

