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
goog.require('cryptagram.codec.chequer');
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
  
  var sampleImage = document.getElementById('sampleImage');
  if (sampleImage) {
  
    var loader = new cryptagram.loader();
    loader.queue(sampleImage.src, function(result) {
      sampleImage.src = result;
      self.imageExperiment(sampleImage);
    });
    loader.start();
  }
  
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



cryptagram.experiment.prototype.handleFiles = function(files) {

  var file = files[0];
  var self = this;
  var reader = new FileReader();
  reader.onload = function (loadEvent) {
      var originalData = loadEvent.target.result;
      var originalImage = document.createElement('img');
      originalImage.onload = function () {
        self.imageExperiment(originalImage);
      };
      originalImage.src = originalData;
    };
  reader.onerror = cryptagram.experiment.show_error;
  reader.readAsDataURL(file);
}



cryptagram.experiment.prototype.imageExperiment = function(image) {
  
  var output = [];
  var self = this;
  var codices = [];
  var quality = .76;
  //codices = new Array(new cryptagram.codec.chequer(quality));    

  for (var q = 70; q<= 96; q+=2) {
  var quality = q / 100.0;
   codices.push(new cryptagram.codec.experimental(quality, 1, 8));    
  }


  var results = goog.dom.getElement('results');
  results.value = '';

 	var password = 'cryptagram';       
        
  for (var c = 0; c < codices.length; c++) {
  
    var codec = codices[c];
    var originalData = image.src;
    var aspect = image.width / image.height;
    codec.encode({src:originalData, password:password, aspect: aspect}, function(encodedImage) {
                
      var frame = goog.dom.createDom('div', {'class': goog.getCssName('frame')});
      frame.appendChild(encodedImage);
      document.getElementById('decoded_image').appendChild(frame);

      var decodedImage = document.createElement('img');
      var container = new cryptagram.container(decodedImage);
      var decoder = new cryptagram.decoder(container, {password: password});
      decoder.inputLength = encodedImage.src.length;

      decoder.decodeData(encodedImage.src, codec, function(result) {
        decodedImage.src = result;
        document.body.appendChild(decodedImage);
        codec = this.codec;
        var inputK = ((this.inputLength * (3/4)) / 1000).toPrecision(5);
        var errorCount = codec.getErrorCount();
        var percent = errorCount / codec.lastOctal.length;
              
        self.logger.info('Octal decoding errors: ' + errorCount + '/' +
                                codec.lastOctal.length + ' = ' + percent);
                          
        var report = codec.quality.toPrecision(2) + '\t' + codec.blockSize + '\t' +
          errorCount + '\t' + codec.lastOctal.length + '\t' + percent + '\t' + inputK + '\n';
          results.value += report;

      });

      
    });
          
    // Decode image to make sure it worked
/*
    var decodedImage = document.createElement('img');
    var container = new cryptagram.container(decodedImage);
    var decoder = new cryptagram.decoder(container, {password: password});
                              
    decoder.decodeData(str, codec, function(result) {
      var codec = this.codec;
      codec.checkChrominancePattern();
  
      var errorCount = codec.getErrorCount();
      var percent = errorCount / codec.lastOctal.length;
              
      self.logger.info('Octal decoding errors: ' + errorCount + '/' +
                                codec.lastOctal.length + ' = ' + percent);
                          
      var report = codec.quality.toPrecision(2) + '\t' + codec.blockSize + '\t' +
          errorCount + '\t' + codec.lastOctal.length + '\t' + percent + '\t' + codec.percentChrominanceError + '\n';
      results.value += report;
    });     
*/
  }
};

cryptagram.experiment.show_error = function(msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber)
  return true;
};

goog.exportSymbol('cryptagram.experiment', cryptagram.experiment);
goog.exportSymbol('cryptagram.experiment.prototype.showDecrypt', cryptagram.experiment.prototype.showDecrypt);
goog.exportSymbol('cryptagram.experiment.prototype.showEncrypt', cryptagram.experiment.prototype.showEncrypt);
