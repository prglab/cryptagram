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

// Assumes that options.image is an Image () object that has .src set to a
// DataURL.
cryptagram.SizeReducer.prototype.startWithImage = function (options) {
  var self = this;
  var image = options.image;

  // Will use the maximum number of base64 values to estimate the amount of data
  // that we will be able to pack into the image.
  var width_to_height_ratio = image.width / image.height;

  var limit = options.codec.maxBase64Values(width_to_height_ratio,
                                            options.maxSize);

  if (limit < image.src.length) {
    // TODO(tierney): Develop better model for what fraction to reduce the
    // quality of the image.
    var reduction = limit / image.src.length;
    console.log("Reduction: " + reduction);
    var fraction = 0.9;
    var fudgeFactor = 0.1;
    if (reduction <= 0.65) {
      fraction = .01 * (5 * (-4059+Math.sqrt(345753561+
                                             28608000000*reduction)))/7152;
    }
    this.startWithImageFracQual(image, fraction, options.quality);
  } else {
    this.dispatchEvent({type:"SIZE_REDUCER_DONE", image:image});
  }
};

// Takes an image dataURL, fraction by which to reduce the image size and the
// output quality.
cryptagram.SizeReducer.prototype.startWithImageFracQual = function (image,
                                                                    fraction,
                                                                    quality) {
  console.log("Fraction: " + fraction);
  self = this;
  var imageDataUrl = image.src;
  var imageName = image.file;
  var image = new Image();
  image.onload = function (event) {
    var img = this;

    // Load image into canvas for resize.
    var canvas = document.createElement('canvas');
    var context = canvas.getContext("2d");

    var newWidth = Math.floor(fraction * img.width);
    var newHeight = Math.floor(fraction * img.height);
    canvas.width = newWidth;
    canvas.height = newHeight;
    context.drawImage(img, 0, 0, newWidth, newHeight);

    // Convert to data URL and save at given quality.
    var newImageDataUrl = canvas.toDataURL('image/jpeg', quality);

    // Convert the image data URL to an image and pass that up once it's loaded.
    var newImage = new Image ();

    newImage.onload = function (event) {
      // Send the event.
      newImage.file = imageName;
      self.dispatchEvent({type:"SIZE_REDUCER_DONE", image:newImage});
    };
    newImage.src = newImageDataUrl;
  };
  image.src = imageDataUrl;
};

