// Class that estimates how much to reduce the size of an image to fit within
// the given boundaries.

goog.provide('cryptagram.ReductionEstimator');
goog.provide('cryptagram.ReductionEstimator.Event');
goog.provide('cryptagram.ReductionEstimator.EventType');

goog.require('goog.debug.Logger');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');

cryptagram.ReductionEstimator = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.ReductionEstimator, goog.events.EventTarget);

cryptagram.ReductionEstimator.prototype.logger =
	goog.debug.Logger.getLogger('cryptagram.ReductionEstimator');

cryptagram.ReductionEstimator.EventType = {
  REDUCTION_ESTIMATOR_DONE: goog.events.getUniqueId('reductionEstimatorDone')
};

cryptagram.ReductionEstimator.Event = function (fraction) {
  goog.events.Event.call(this, 'REDUCTION_ESTIMATOR_DONE');
  this.fraction = fraction;
};
goog.inherits(cryptagram.ReductionEstimator.Event, goog.events.Event);

cryptagram.ReductionEstimator.EventTarget = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.ReductionEstimator.EventTarget,
              goog.events.EventTarget);

cryptagram.ReductionEstimator.prototype.getEstimate = function (imageDataUrl,
                                                                quality) {
  var self = this;
  // Assumes 2048 x 2048 limits in call to maxBase64Values();
  var image = new Image();

  image.onload = function (event) {
    var img = this;
    var width_to_height_ratio = img.width / img.height;
    var limit = cryptagram.codec.aesthete.maxBase64Values(width_to_height_ratio);

    var fraction = 1.0;
    if (limit < imageDataUrl.length) {
      fraction = limit / imageDataUrl.length;
    }

    self.dispatchEvent({type:'REDUCTION_ESTIMATOR_DONE', fraction:fraction});
  };
  image.src = imageDataUrl;
};