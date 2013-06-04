// Class that rotates an image.

goog.provide('cryptagram.Rotator');
goog.provide('cryptagram.Rotator.EventType');
goog.provide('cryptagram.Rotator.Event');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');


cryptagram.Rotator = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.Rotator, goog.events.EventTarget);


// Rotator.Event enum.
cryptagram.Rotator.EventType = {
  ROTATE_DONE: goog.events.getUniqueId('rotateDone')
};

// Rotator.Event constructor.
cryptagram.Rotator.Event = function (image) {
  goog.events.Event.call(this, 'ROTATE_DONE');
  this.image = image;
};
goog.inherits(cryptagram.Rotator.Event, goog.events.Event);

// Rotator.EventTarget constructor.
cryptagram.Rotator.EventTarget = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.Rotator.EventTarget, goog.events.EventTarget);

cryptagram.Rotator.prototype.logger =
  goog.debug.Logger.getLogger('cryptagram.Rotator');

cryptagram.Rotator.prototype.rotateBinary = function (binary, orientation) {
  var self = this;
  var jpegImg = document.createElement('img');
  
  jpegImg.onload = function(event) {
    var canvas = document.createElement('canvas');
    
    canvas.width = jpegImg.naturalWidth;
    canvas.height =  jpegImg.naturalHeight;
    var offsetX = 0;
    var offsetY = 0;
    var rotate = 0;
    self.logger.info('Found orientation flag ' + orientation);

    if (orientation == 6) {
      canvas.width = jpegImg.naturalHeight;
      canvas.height =  jpegImg.naturalWidth;
      offsetY = -jpegImg.naturalHeight;
      rotate = Math.PI / 2.0;
      self.logger.info('Rotating 90 degrees clockwise');
    } else if (orientation == 8) {
      canvas.width = jpegImg.naturalHeight;
      canvas.height =  jpegImg.naturalWidth;
      offsetY = jpegImg.naturalHeight;
      rotate = -Math.PI / 2.0;
      self.logger.info('Rotating 90 degrees counterclockwise');
    } else if (orientation == 3) {
      rotate = Math.PI;
      offsetY = -jpegImg.naturalHeight;
      offsetX = -jpegImg.naturalWidth;
      self.logger.info('Rotating 180 degrees');
    }
    var context = canvas.getContext('2d');
    context.rotate(rotate);
    context.translate(offsetX, offsetY);
    context.drawImage(jpegImg, 0, 0, jpegImg.naturalWidth, jpegImg.naturalHeight);
    
    var rotatedImg = document.createElement('img');
    rotatedImg.onload = function(event) {
      self.dispatchEvent({type:'ROTATE_DONE',
                         image:rotatedImg});
    }
    rotatedImg.src = canvas.toDataURL('image/jpeg', 0.90);
  }
  
  var data = 'data:image/jpeg;base64,' + window.btoa(binary);
  jpegImg.src = data;
};
