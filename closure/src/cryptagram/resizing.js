// Class that resizes an image.

goog.provide('cryptagram.Resizing');
goog.provide('cryptagram.Resizing.EventType');
goog.provide('cryptagram.Resizing.Event');

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

goog.require('cryptagram.ResizeValidator');
goog.require('cryptagram.ResizeValidator.Event');
goog.require('cryptagram.ResizeValidator.EventType');

goog.require('cryptagram.Thumbnailer');
goog.require('cryptagram.Thumbnailer.EventType');
goog.require('cryptagram.Thumbnailer.Event');

// Resizing constructor. Listen for these events as follows:
// var requal = new cryptagram.Resizing();
// goog.events.listen(requal, 'requalityDone', function (e) {...}, true, this);
cryptagram.Resizing = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.Resizing, goog.events.EventTarget);


// Resizing.Event enum.
cryptagram.Resizing.EventType = {
  REQUALITY_DONE: goog.events.getUniqueId('resizingDone')
};

// Resizing.Event constructor.
cryptagram.Resizing.Event = function (image) {
  goog.events.Event.call(this, 'RESIZING_DONE');
  this.image = image;
};
goog.inherits(cryptagram.Resizing.Event, goog.events.Event);

// Resizing.EventTarget constructor.
cryptagram.Resizing.EventTarget = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.Resizing.EventTarget, goog.events.EventTarget);



cryptagram.Resizing.prototype.logger =
  goog.debug.Logger.getLogger('cryptagram.Resizing');

cryptagram.Resizing.prototype.setStatus = function (message) {
  console.log(message);
};

// Reduces the size of the image.
cryptagram.Resizing.prototype.start = function (image, iter_n) {
  var self = this;
  var canvas = document.createElement('canvas');

  // TODO(tierney): We can come up with a more sophisticated model but this is
  // what we currently do for resizing images.
  var scaled_width = Math.round((1.0 - ((1 + iter_n) * 0.1)) * image.width);
  console.log('scaled_width: ' + scaled_width);

  // This produces lanczos3 but feel free to raise it up to 8. Your client will
  // appreciate that the program makes full use of his machine.
  var thumbnailer = new cryptagram.Thumbnailer(canvas, image, scaled_width, 3);
  goog.events.listen(
    thumbnailer, 'THUMBNAILER_DONE',
    function (event) {

      var resizeValidator = new cryptagram.ResizeValidator();
      goog.events.listen(
        resizeValidator,
        'RESIZE_VALIDATION',
        function (validationEvent) {
          if (validationEvent.valid) {
            console.log('Validated image.');
            this.dispatchEvent({type:'RESIZING_DONE', image:event.image});
          } else {
            console.log('Need to go again');
            this.start(image, iter_n + 1);
          }
        },
        true,
        this);
      console.log('Thumbnailing done.');

      // Check if the image is small enough or if we necessarily must make the
      // image smaller.
      resizeValidator.validate(2048, 2048, event.image);
    },
    true,
    this);
  thumbnailer.start();

  // if (image.length > 600) {
  //   this.logger.info('Must requality.');
	//   img.src = image;
  // } else {
  //   this.logger.info('No need for requality.');
  //   this.dispatchEvent({type:'REQUALITY_DONE', image:image});
  // }
};
