// Class that enables checking if an imageUrl produces an image within the
// provided dimension constraints. The results are event driven so any listener
// must be configured for the RESIZE_VALIDATION event type.

goog.provide('cryptagram.ResizeValidator');
goog.provide('cryptagram.ResizeValidator.Event');
goog.provide('cryptagram.ResizeValidator.EventType');

goog.require('goog.debug.Logger');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');

cryptagram.ResizeValidator = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.ResizeValidator, goog.events.EventTarget);

cryptagram.ResizeValidator.EventType = {
  RESIZE_VALIDATION: goog.events.getUniqueId('resizeValidation')
};

cryptagram.ResizeValidator.Event = function (valid, image) {
  goog.events.EventTarget.call(this);
  this.valid = valid;
  this.image = image;
};
goog.inherits(cryptagram.ResizeValidator.Event, goog.events.Event);

cryptagram.ResizeValidator.prototype.logger =
    goog.debug.Logger.getLogger('cryptagram.ResizeValidator');

cryptagram.ResizeValidator.prototype.validate = function (bound_w,
                                                          bound_h,
                                                          imageUrl) {
  var self = this;
  var image = new Image();
  image.onload = function (event) {
    var loadedImage = this;

    var widthToHeightRatio = image.width / image.height;

    console.log("widthToHeightRatio: " + widthToHeightRatio);
    console.log("loadedImage.src: " + loadedImage.src.length);

    var maxNumValues = cryptagram.codec.aesthete.maxBase64Values(
      widthToHeightRatio);
    var valid = maxNumValues > loadedImage.src.length;

    self.logger.info("Validation: " + valid);
    self.logger.info(newDims.width + ' ' + bound_w + ' ' +
                     newDims.height + ' ' + bound_h);
    self.dispatchEvent({type:'RESIZE_VALIDATION',
                        valid:valid,
                        image:image});
  };
  image.src = imageUrl;
};