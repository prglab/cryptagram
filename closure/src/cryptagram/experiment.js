goog.provide('cryptagram.experiment');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.EventType');

goog.require('cryptagram.container');
goog.require('cryptagram.decoder');
goog.require('cryptagram.cipher');
goog.require('cryptagram.codec.aesthete');
goog.require('cryptagram.codec.bacchant');
goog.require('cryptagram.codec.experimental');
goog.require('cryptagram.loader');
goog.require('cryptagram.RemoteLog');

/**
 * This class demonstrates some of the core functionality of cryptagram.
 * @constructor
 */
cryptagram.experiment = function() {

  document.body.innerHTML += cryptagram.templates.experiment.experiment();
  var self = this;
  
  var selector = goog.dom.getElement('file_selector');
  goog.events.listen(selector, goog.events.EventType.CHANGE, function(e) {
      self.handleFiles(e.target.files);
  }, false, self);
  
  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);

  var remoteLog = new cryptagram.RemoteLog();
  remoteLog.setCapturing(true);
};

cryptagram.experiment.prototype.logger = 
    goog.debug.Logger.getLogger('cryptagram.experiment');

cryptagram.experiment.prototype.setStatus = function(message) {
  console.log(message);
};

/**
 * Runs decryption on the loaded image, replacing it with the
 * decrypted image. If the image is already decrypted, it reverts
 * to the original.
 */
cryptagram.experiment.prototype.runDecrypt = function() {

  if (this.decrypted) {
    this.decrypted = false;
    this.button.value = 'Decrypt';
    this.container.revertSrc();
  } else {
    var self = this;
    var password = 'cryptagram';
    var loader = new cryptagram.loader(self.container);
    
    loader.getImageData(self.container.getSrc(), function(data) {
      var decoder = new cryptagram.decoder(self.container);
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
cryptagram.experiment.prototype.handleFiles = function(files) {

  var output = [];
  var zip;
  var self = this;
  var file = files[0];
  var codices = [];
  
  for (var q = 70; q < 96; q += 2) {
    var quality = q / 100.0;
    codices.push(new cryptagram.codec.experimental(1, quality, 8));
  }
  
  var results = goog.dom.getElement('results');
  results.value = "";
  var cipher = new cryptagram.cipher();
  
    var name = escape(file.name);
    
    var type = file.type || 'n/a';
    var reader = new FileReader();
    var ratio = 1.0;
    reader.onload = function (loadEvent) {
      var originalData = loadEvent.target.result;
      var originalImage = new Image();
      originalImage.onload = function () {
        ratio = originalImage.width / originalImage.height;
      
    		var password = 'cryptagram';
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
          var container = new cryptagram.container(decodedImage);
          var decoder = new cryptagram.decoder(container);
          
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
    reader.onerror = cryptagram.experiment.show_error;
    reader.readAsDataURL(file);
};

cryptagram.experiment.show_error = function(msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber)
  return true;
};

goog.exportSymbol('cryptagram.experiment', cryptagram.experiment);
goog.exportSymbol('cryptagram.experiment.prototype.showDecrypt', cryptagram.experiment.prototype.showDecrypt);
goog.exportSymbol('cryptagram.experiment.prototype.showEncrypt', cryptagram.experiment.prototype.showEncrypt);
