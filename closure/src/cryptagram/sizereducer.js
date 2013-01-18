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


cryptagram.SizeReducer.prototype.start = function (imageDataUrl,
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

    // Send the event.
    self.dispatchEvent({type:"SIZE_REDUCER_DONE", image:newImageDataUrl});
  };
  image.src = imageDataUrl;
};