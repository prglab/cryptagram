// Encoder class for the cryptagram web frontend. This class is intended to
// provide a portable, drag-and-drop medium for creating cryptagram images.

goog.provide('cryptagram.encoder');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.EventType');

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
cryptagram.encoder = function() {

  document.body.innerHTML += cryptagram.templates.demo();

  goog.events.listen(goog.dom.getElement('encrypt_link'),
                     goog.events.EventType.CLICK, this.showEncrypt, false, this);

  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);

  var remoteLog = new cryptagram.RemoteLog();
  remoteLog.setCapturing(true);
};

cryptagram.encoder.prototype.logger = goog.debug.Logger.getLogger('cryptagram.encoder');


/**
 * Shows the encryption encoder.
 */
cryptagram.encoder.prototype.showEncrypt = function() {
  var self = this;
  goog.dom.getElement('main').innerHTML = cryptagram.templates.encrypt();

  var selector = goog.dom.getElement('file_selector');
  goog.events.listen(selector, goog.events.EventType.CHANGE, function(e) {
      self.handleFiles(e.target.files);
  }, false, self);

  var dropZone = goog.dom.getElement('drop_zone');
  var handler = new goog.events.FileDropHandler(dropZone, true);

  goog.events.listen(handler, goog.events.FileDropHandler.EventType.DROP, function(e) {
    var files = e.getBrowserEvent().dataTransfer.files;
    self.handleFiles(files);
  });

  this.downloadify = Downloadify.create('downloadify', {
    filename: "encrypted.zip",
    data: function(){
      return self.zip.generate();
    },
    onError: function(){
      alert('Nothing to save.');
    },
    dataType: 'base64',
    swf: 'media/downloadify.swf',
    downloadImage: 'images/download.png',
    width: 100,
    height: 30,
    transparent: false,
    append: false,
    enabled: true
  });
};


cryptagram.encoder.prototype.setStatus = function(message) {
  console.log(message);
};

// Reduces the quality of the image @image to level @quality.
cryptagram.encoder.prototype.reduceQuality = function(image, quality) {
		var img = new Image();
		img.onload = function () {
				var width = img.width;
				var height = img.height;
				context.drawImage(img, 0, 0, width, height);
				document.images[0].src = canvas.toDataUrl('image/jpeg', quality);
		}
		img.src = image;
		return img;
}

cryptagram.encoder.prototype.reduceSize = function(image, fraction) {
}

/**
 * @param{Array} files
 * @private
 */
cryptagram.encoder.prototype.handleFiles = function(files) {

  // Files is a FileList of File objects. List some properties.
  var output = [];
  var zip;
  var images;
  var self = this;
  var codec = new cryptagram.codec.bacchant();
  var cipher = new cryptagram.cipher();

  if (this.zip == null) {
      this.zip = new JSZip();
      this.images = this.zip.folder('images');
      this.numberImages = 0;
  }

  for (var i = 0; i < files.length; i++) {
    f = files[i];
    var name = escape(f.name);
    console.log("Name: " + name);
    // TODO(tierney): Resize large images instead of punting.
    // if (f.size > 600000) {
    //   console.log('Skipping ' + name);
    //   continue;
    // }
    console.log('Size: ' + f.size);

    var type = f.type || 'n/a';
    var reader = new FileReader();
    var ratio = 1.0;
    reader.onload = function (loadEvent) {
      var originalData = loadEvent.target.result;
			console.log("Data: " + originalData);

      console.log("Reducing quality.");
      var reduced = self.reduceQuality(originalData, 0.77);
      console.log("Reduced: " + reduced.src);

      // Insert the reduced here to test the reduceQuality function.

      var originalImage = new Image();
      originalImage.onload = function () {
        goog.dom.insertChildAt(goog.dom.getElement('original_image'), originalImage, 0);
        ratio = originalImage.width / originalImage.height;

				// var str = originalData;
				console.log("Size: " + originalData.split('base64,')[1].length);
				// Prompt from user.
        var password = 'cryptagram';
        var encryptedData = cipher.encrypt(originalData, password);

        var encodedImage = codec.encode(encryptedData, ratio);
        encodedImage.onload = function () {
          goog.dom.insertChildAt(goog.dom.getElement('encoded_image'),encodedImage,0);
          var str = encodedImage.src;
          var idx = str.indexOf(",");
          var dat = str.substring(idx+1);
          self.images.file(self.numberImages + '.jpg', dat, {base64: true});
          self.numberImages++;

          // Decode image to make sure it worked
          // var decodedImage = new Image();
          // goog.dom.insertChildAt(goog.dom.getElement('decoded_image'), decodedImage, 0);
          // var container = new cryptagram.container(decodedImage);
          // var decoder = new cryptagram.decoder(container);
          // //codec.length = encryptedData.length;
          // decoder.decodeData(str, codec, function(result) {
          //   var percent = codec.errorCount / codec.lastOctal.length;
          //   //this.logger.info("Octal decoding errors: " + codec.errorCount +
          //     // "\t" + codec.lastOctal.length + "\t" + percent);
          //   var decipher = cipher.decrypt(result, password);
          //   container.setSrc(decipher);
          // });

        };
      }
      originalImage.src = originalData;
    };
    reader.onerror = cryptagram.encoder.show_error;
    reader.readAsDataURL(f);
  }
};

cryptagram.encoder.show_error = function(msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
  return true;
};

goog.exportSymbol('cryptagram.encoder', cryptagram.encoder);
goog.exportSymbol('cryptagram.encoder.prototype.showDecrypt',
                  cryptagram.encoder.prototype.showDecrypt);
goog.exportSymbol('cryptagram.encoder.prototype.showEncrypt',
                  cryptagram.encoder.prototype.showEncrypt);

