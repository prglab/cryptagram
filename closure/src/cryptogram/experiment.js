goog.provide('cryptogram.experiment');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.EventType');

goog.require('cryptogram.container');
goog.require('cryptogram.decoder');
goog.require('cryptogram.cipher');
goog.require('cryptogram.codec.aesthete');
goog.require('cryptogram.codec.bacchant');
goog.require('cryptogram.codec.experimental');
goog.require('cryptogram.loader');


/**
 * This class demonstrates some of the core functionality of Cryptogram.
 * @constructor
 */
cryptogram.experiment = function() {

  document.body.innerHTML += cryptogram.templates.experiment.experiment();
  var self = this;
  
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
  
  this.downloadify = Downloadify.create('downloadify',{
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

  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);
};

cryptogram.experiment.prototype.logger = goog.debug.Logger.getLogger('cryptogram.experiment');

cryptogram.experiment.prototype.setStatus = function(message) {
  console.log(message);
};

/**
 * Runs decryption on the loaded image, replacing it with the
 * decrypted image. If the image is already decrypted, it reverts
 * to the original.
 */
cryptogram.experiment.prototype.runDecrypt = function() {

  if (this.decrypted) {
    this.decrypted = false;
    this.button.value = 'Decrypt';
    this.container.revertSrc();
  } else {
    var self = this;
    var password = 'cryptogram';
    var loader = new cryptogram.loader(self.container);
    
    loader.getImageData(self.container.getSrc(), function(data) {
      var decoder = new cryptogram.decoder(self.container);
      decoder.decodeData(data, password, function(result) {
        self.container.setSrc(result);
      });
    });
    
    this.decrypted = true;
    this.button.value = 'Reset';
  }   
};


cryptogram.experiment.prototype.compareStrings = function(str1, str2) {
  
  var errorCount = 0;
  
  for (var i = 0; i < str1.length; i++) {
    if (str1[i] != str2[i]) {
      errorCount++;
    }
  }
  if (str1.length != str2.length) {
    this.logger.info("Base64 strings are different lengths!");
    this.logger.info(str1.length + "/" + str2.length);
  }

  var percent = errorCount / str1.length; 
  this.logger.info("Base64 errors: " + errorCount + "\t" + str1.length + "\t" + percent);
}


/**
 * @param{Array} files
 * @private
 */
cryptogram.experiment.prototype.handleFiles = function(files) {

  var output = [];
  var zip;
  var images;
  var self = this;
  var codec = new cryptogram.codec.experimental(2, .7, 8);

  var cipher = new cryptogram.cipher();
  
  if (this.zip == null) {
      this.zip = new JSZip();
      this.images = this.zip.folder('images');
      this.numberImages = 0;
  }

  for (var i = 0; i < files.length; i++) {
    f = files[i];
    var name = escape(f.name);
    if (f.size > 700000) {
      console.log('Skipping ' + name);
      continue; 
    }
    var type = f.type || 'n/a';
    var reader = new FileReader();
    var ratio = 1.0;
    reader.onload = function (loadEvent) {
      var originalData = loadEvent.target.result;
      var originalImage = new Image();
      originalImage.onload = function () {
        goog.dom.insertChildAt(goog.dom.getElement('original_image'), originalImage, 0);
        ratio = originalImage.width / originalImage.height;
      
    		var password = 'cryptogram';
        var encryptedData = cipher.encrypt(originalData, password);
        //codec.setImage(originalImage);
        
        var encodedImage = codec.encode(encryptedData, ratio);
        encodedImage.onload = function () {
          goog.dom.insertChildAt(goog.dom.getElement('encoded_image'),encodedImage,0);
          var str = encodedImage.src;
          var idx = str.indexOf(",");
          var dat = str.substring(idx+1);
          self.images.file(self.numberImages + '.jpg', dat, {base64: true});
          self.numberImages++;
          
          // Decode image to make sure it worked
          var decodedImage = new Image();
          goog.dom.insertChildAt(goog.dom.getElement('decoded_image'), decodedImage, 0);
          var container = new cryptogram.container(decodedImage);
          var decoder = new cryptogram.decoder(container);
          //codec.length = encryptedData.length;
          decoder.decodeData(str, codec, function(result) {
            var percent = codec.errorCount / codec.lastOctal.length;
            self.logger.info("Octal decoding errors: " + codec.errorCount + "/" + codec.lastOctal.length + " = " + percent);
            
            var decipher = cipher.decrypt(result, password);
            container.setSrc(decipher);
          });
        };
      }
      originalImage.src = originalData;
    }; 		
    reader.onerror = cryptogram.experiment.show_error;
    reader.readAsDataURL(f);
  }
};

cryptogram.experiment.show_error = function(msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber)
  return true;
};

goog.exportSymbol('cryptogram.experiment', cryptogram.experiment);
goog.exportSymbol('cryptogram.experiment.prototype.showDecrypt', cryptogram.experiment.prototype.showDecrypt);
goog.exportSymbol('cryptogram.experiment.prototype.showEncrypt', cryptogram.experiment.prototype.showEncrypt);