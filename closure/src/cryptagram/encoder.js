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
goog.require('cryptagram.codec.aesthete');
goog.require('cryptagram.codec.experimental');

goog.require('cryptagram.loader');
goog.require('cryptagram.RemoteLog');

goog.require('cryptagram.Rotator');

goog.require('cryptagram.SizeReducer');
goog.require('cryptagram.SizeReducer.Event');
goog.require('cryptagram.SizeReducer.EventType');

goog.require('cryptagram.ReductionEstimator');
goog.require('cryptagram.ReductionEstimator.Event');
goog.require('cryptagram.ReductionEstimator.EventType');

/**
 * This class demonstrates some of the core functionality of cryptagram.
 * @constructor
 */
cryptagram.encoder = function () {
  // this.codec is the codec type, not an instance.
  this.codec = cryptagram.codec.bacchant;
  goog.events.EventTarget.call(this);
};
goog.inherits(cryptagram.encoder, goog.events.EventTarget);

cryptagram.encoder.prototype.logger =
		goog.debug.Logger.getLogger('cryptagram.encoder');

cryptagram.encoder.prototype.setStatus = function (message) {
  console.log(message);
};

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



cryptagram.encoder.prototype.imageLoaded = function(image) {
  image.file = this.files[0].name;
  this.images.push(image);
  this.files.splice(0,1);
  this.dispatchEvent({type: 'IMAGE_LOADED',
                     image: image,
                 remaining: this.files.length});
};

cryptagram.encoder.prototype.loadBinary = function (file) {
  var self = this;
  var reader = new FileReader();
  reader.onerror = cryptagram.encoder.show_error;
  reader.onload = function (e) {
  
    var jpeg = new JpegMeta.JpegFile(this.result, file.name);
    
    if (jpeg.tiff && jpeg.tiff.Orientation && jpeg.tiff.Orientation != 1) {      
      var rotator = new cryptagram.Rotator();
      rotator.rotateBinary(this.result, jpeg.tiff.Orientation);
      
      goog.events.listenOnce(rotator, 'ROTATE_DONE', function (event) {
        var image = event.image;
        image.file = file.file;
        self.imageLoaded(image);
      }, true, this);
       
    // No need to rotate. Reuse the loaded binary to create JPEG data.
    } else {
      var b64 = "data:image/jpeg;base64," + window.btoa(this.result);
      var image = new Image();
      image.onload = function () { 
        self.imageLoaded(image);
      }
      image.src = b64;
    }
  };
  reader.readAsBinaryString(file);
};


// Changes the state of self.files by splicing. Loads the self.images array with
// Image objects.
cryptagram.encoder.prototype.loadFile = function (file) {

  // If jpeg, switch to binary loading to check headers
  if (file.type.indexOf('image/jpeg') == 0) {
    this.loadBinary(file);
    return;
  }

  var self = this;
  var reader = new FileReader();
  reader.onerror = cryptagram.encoder.show_error;
  reader.onload = function (e) {
    var image = new Image();

    image.onload = function () {
      image.file = self.files[0].name;
      self.images.push(image);
      self.files.splice(0,1);
      self.dispatchEvent({type: 'IMAGE_LOADED',
                          image: image,
                          remaining: self.files.length});
    }

    image.src = e.target.result;
    
  }
  reader.readAsDataURL(file);
}

cryptagram.encoder.prototype.queueFiles = function (files) {
  var self = this;
  self.files = [];
  self.images = [];
  for (var f in files) {
    var type = "" + files[f].type;
    if (type.indexOf('image/') == 0) {
      self.files.push(files[f]);
    }
  }

  goog.events.listen(this, 'IMAGE_LOADED', function (event) {
    if (self.files.length > 0) {
      self.loadFile(self.files[0]);
    }
  }, true, this);

  if (self.files.length > 0) {
    this.loadFile(self.files[0]);
  }
};


cryptagram.encoder.prototype.cancel = function() {
  this.images = [];
}

// Main driver for the encoding of images.
//
// Note: The call the encodeImage() callos encodedOnload() which splices the
// self.images array at every iteration. This is how the self.images.length is
// reduced.
// TODO(tierney): Make the callbacks less prone to altering state / causing
// side-effects implicitly.
cryptagram.encoder.prototype.startEncoding = function (options) {
  var self = this;
  self.numImages = self.images.length;
  this.password = options.password;
  this.quality = options.quality;
  this.maxSize = options.maxSize;

  goog.events.listen(this, 'IMAGE_DONE', function (event) {
    if (self.images.length > 0) {
      self.createValidImage(self.images[0]);
    }
  }, true, this);
  this.createValidImage(self.images[0]);
};

// Reloads image and converts to a jpeg at a specific quality. Then proceeds to
// reduce the size of the image as necessary. After all of this, the image is
// read to be encoded so is sent to encodeImage().
cryptagram.encoder.prototype.createValidImage = function (image) {
  var self = this;

  var sizeReducer = new cryptagram.SizeReducer();
  var sizeReducerListenKey = goog.events.listenOnce(
    sizeReducer,
    'SIZE_REDUCER_DONE',
    function (event) {
      this.logger.info("Image len:" + event.image.src.length);
      var est = self.codec.dimensions(image.naturalWidth / image.naturalHeight,
                                      event.image.src.length);
      this.logger.info("Image est:" + est.width + " " + est.height);
      self.encodeImage(event.image);
      self.images[0].original = event.image;
    },
    true,
    this);

  // Provide the canvas on which to draw the image so that we can requality the
  // image appropriately.
  var canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  var context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

  var imageFilename = image.file;

  var jpegImg = new Image ();
  jpegImg.onload = function (event) {
    jpegImg.file = imageFilename;
    var reducerOptions = {
      image: jpegImg,
      quality: self.quality,
      maxSize: self.maxSize,
      codec: self.codec
    };
    sizeReducer.startWithImage(reducerOptions);
  };

  // TODO(tierney): Remove magic number and make it possible for the model
  // function that we use in the resizing to be associated with the chosen
  // quality here.
  jpegImg.src = canvas.toDataURL('image/jpeg', 0.90);
};

// Expects an image (where .src is a data URL) and will embed without any
// modifications.
cryptagram.encoder.prototype.encodeImage = function (image) {
  this.dispatchEvent({type:'ENCODE_START', image:image});

  var self = this;
  var ratio = image.width / image.height;
  var dataToEncode = image.src;
  this.logger.info("Encoding this size: " + dataToEncode.length);
  //var codec = new this.codec();
  var codec = new cryptagram.codec.experimental(1, .85, 8);    

  var encryptedData = codec.encrypt(dataToEncode, this.password);
  this.logger.info("Encoding this: " + encryptedData.length);
  var encodedImage = codec.encode(encryptedData, ratio);
  encodedImage.file = image.file;
  encodedImage.onload = function (e) {
    self.encodedOnload(e);
  }
};

// Splices images.
cryptagram.encoder.prototype.encodedOnload = function (loadEvent) {
  var self = this;
  var encodedImage = loadEvent.target;
  
  // Assign image to .original for filesize experiment
  encodedImage.original = self.images[0].original;
  
  self.images.splice(0,1);

  var str = encodedImage.src;
  var idx = str.indexOf(',');
  var dat = str.substring(idx+1);
  var remaining = [];
  for (var i = 0; i < self.images.length; i++) {
    remaining.push(self.images[i].file);
  }

  this.dispatchEvent({type:'IMAGE_DONE',
                      image:encodedImage,
                      remaining: remaining});
};


cryptagram.encoder.show_error = function (msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
  return true;
};

goog.exportSymbol('cryptagram.encoder', cryptagram.encoder);
goog.exportSymbol('cryptagram.encoder.prototype.showEncrypt',
                  cryptagram.encoder.prototype.showEncrypt);
