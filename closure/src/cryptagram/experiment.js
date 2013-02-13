goog.provide('cryptagram.experiment');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.EventType');

goog.require('cryptagram.container');
goog.require('cryptagram.decoder');
goog.require('cryptagram.cipher');
goog.require('cryptagram.codec.bacchant');
goog.require('cryptagram.codec.experimental');
goog.require('cryptagram.codec.chrominance');
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
};

cryptagram.experiment.prototype.logger = 
    goog.debug.Logger.getLogger('cryptagram.experiment');

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
  
  for (var q = 60; q < 100; q += 5) {
    var quality = q / 100.0;
    codices.push(new cryptagram.codec.chrominance(1, quality, 8));    
  }
  
  codices.push(new cryptagram.codec.bacchant());
  
  var results = goog.dom.getElement('results');
  results.value = "";
  
    var name = escape(file.name);
    
    var type = file.type || 'n/a';
    var reader = new FileReader();
    var ratio = 1.0;
    reader.onload = function (loadEvent) {
      var originalData = loadEvent.target.result;
      var originalImage = new Image();
      originalImage.onload = function () {
        ratio = originalImage.width / originalImage.height;
      
        var frame = goog.dom.createDom('div', {'class': goog.getCssName('frame')});
        frame.appendChild(originalImage);
        document.getElementById('original_image').appendChild(frame);
       
        
    		var password = 'cryptagram';       
        
        for (var c = 0; c < codices.length; c++) {
          var codec = codices[c];

          var encryptedData = codec.encrypt(originalData, password);
          var encodedImage = codec.encode(encryptedData, ratio);
          self.logger.info("Encoded in: " + codec.elapsed + " ms");  
          
          var frame = goog.dom.createDom('div', {'class': goog.getCssName('frame')});
          frame.appendChild(encodedImage);
          document.getElementById('decoded_image').appendChild(frame);
          
          var str = encodedImage.src;
          
          var idx = str.indexOf(",");
          var dat = str.substring(idx+1);
          
          // Decode image to make sure it worked
          var decodedImage = new Image();
          var container = new cryptagram.container(decodedImage);
          var decoder = new cryptagram.decoder(container, {password: password});
          
          //codec.length = codec.lastOctal.length;
                    
          decoder.decodeData(str, codec, function(result) {
            var codec = this.codec;
            var errorCount = codec.getErrorCount();
            var percent = errorCount / codec.lastOctal.length;
            
            self.logger.info("Octal decoding errors: " + errorCount + "/" +
                              codec.lastOctal.length + " = " + percent);
                        
            var report = codec.quality.toPrecision(2) + "\t" + codec.blockSize + "\t" +
              errorCount + "\t" + codec.lastOctal.length + "\t" + percent + "\n";
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
