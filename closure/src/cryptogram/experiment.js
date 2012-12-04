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


/**
 * @param{Array} files
 * @private
 */
cryptogram.experiment.prototype.handleFiles = function(files) {

  var output = [];
  var zip;
  var self = this;
  var file = files[0];
  var codices = [];
  
  for (var q = 50; q < 96; q += 2) {
    var quality = q / 100.0;
    codices.push(new cryptogram.codec.experimental(1, quality, 8));
  }
  
  for (var q = 50; q < 96; q += 2) {
    var quality = q / 100.0;
    codices.push(new cryptogram.codec.experimental(2, quality, 8));
  }
  
  var results = goog.dom.getElement('results');
  results.value = "";
  var cipher = new cryptogram.cipher();
  
    var name = escape(file.name);
    
    var type = file.type || 'n/a';
    var reader = new FileReader();
    var ratio = 1.0;
    reader.onload = function (loadEvent) {
      var originalData = loadEvent.target.result;
      var originalImage = new Image();
      originalImage.onload = function () {
        ratio = originalImage.width / originalImage.height;
      
    		var password = 'cryptogram';
        var encryptedData = cipher.encrypt(originalData, password);

        for (var c = 0; c < codices.length; c++) {
          var codec = codices[c];
          var encodedImage = codec.encode(encryptedData, ratio);
          self.logger.info("Encoded in: " + codec.elapsed + " ms");  

          var str = encodedImage.src;
          
          var idx = str.indexOf(",");
          var dat = str.substring(idx+1);
          //alert(dat);
          
          // Decode image to make sure it worked
          var decodedImage = new Image();
          var container = new cryptogram.container(decodedImage);
          var decoder = new cryptogram.decoder(container);
          
          codec.length = codec.lastOctal.length;
                    
          decoder.decodeData(str, codec, function(result) {
            var codec = this.codec;
            var percent = codec.errorCount / codec.length;
            
            self.logger.info("Octal decoding errors: " + codec.errorCount + "/" +
                              codec.lastOctal.length + " = " + percent);
                              
            var report = codec.quality.toPrecision(2) + "\t" + codec.base + "\t" + codec.blockSize + "\t" +
              codec.errorCount + "\t" + codec.lastOctal.length + "\t" + percent + "\n";
            results.value += report;
                              
          });
        }
      }
      originalImage.src = originalData;
    };
    reader.onerror = cryptogram.experiment.show_error;
    reader.readAsDataURL(file);
};

cryptogram.experiment.show_error = function(msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber)
  return true;
};

goog.exportSymbol('cryptogram.experiment', cryptogram.experiment);
goog.exportSymbol('cryptogram.experiment.prototype.showDecrypt', cryptogram.experiment.prototype.showDecrypt);
goog.exportSymbol('cryptogram.experiment.prototype.showEncrypt', cryptogram.experiment.prototype.showEncrypt);