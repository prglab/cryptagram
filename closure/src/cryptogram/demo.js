goog.provide('cryptogram.demo');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.EventType');

goog.require('cryptogram.container');
goog.require('cryptogram.decoder');
goog.require('cryptogram.encoder');
goog.require('cryptogram.loader');


/**
 * This class demonstrates some of the core functionality of Cryptogram.
 * @constructor
 */
cryptogram.demo = function() {

  document.body.innerHTML += cryptogram.templates.demo();
        
  goog.events.listen(goog.dom.getElement('encrypt_link'),
                     goog.events.EventType.CLICK, this.showEncrypt, false, this);
    
  goog.events.listen(goog.dom.getElement('decrypt_link'),
                     goog.events.EventType.CLICK, this.showDecrypt, false, this);

  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);
};


/**
 * Shows the decryption demo.
 */
cryptogram.demo.prototype.showDecrypt = function() {
  this.settings = {image: 'images/secret.jpg'};
  goog.dom.getElement('main').innerHTML = cryptogram.templates.decrypt(this.settings);
  this.decrypted = false;
  this.button = goog.dom.getElement('decrypt_button');
  this.container = new cryptogram.container(goog.dom.getElement('image'));
  goog.events.listen(this.button, goog.events.EventType.CLICK, this.runDecrypt, false, this);
};


/**
 * Shows the encryption demo. 
 */
cryptogram.demo.prototype.showEncrypt = function() {
  var self = this;  
  goog.dom.getElement('main').innerHTML = cryptogram.templates.encrypt();
  
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
};


cryptogram.demo.prototype.setStatus = function(message) {
  console.log(message);
};


/**
 * Runs decryption on the loaded image, replacing it with the
 * decrypted image. If the image is already decrypted, it reverts
 * to the original.
 */
cryptogram.demo.prototype.runDecrypt = function() {

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
cryptogram.demo.prototype.handleFiles = function(files) {
  
  // Files is a FileList of File objects. List some properties.
  var output = [];
  var zip;
  var images;
  var self = this;
  var encoder = new cryptogram.encoder();
  
  if (this.zip == null) {
      this.zip = new JSZip();
      this.images = this.zip.folder('images');
      this.numberImages = 0;
  }

  for (var i = 0; i < files.length; i++) {
    f = files[i];
    var name = escape(f.name);
    if (f.size > 500000) {
      console.log('Skipping ' + name);  
    }
    var type = f.type || 'n/a';
    var reader = new FileReader();
    
    reader.onload = function (loadEvent) {
      var originalData = loadEvent.target.result;
      var originalImage = new Image();
      originalImage.onload = function () {
        goog.dom.insertChildAt(goog.dom.getElement('original_image'), originalImage, 0);
      }
      originalImage.src = originalData;
      
      // TODO(tierney): Accept user-chosen password.
  		var password = 'cryptogram';
      var encryptedData = encoder.encrypt(originalData, password);
      var encodedImage = encoder.encode(encryptedData);
      encodedImage.onload = function () {
        goog.dom.insertChildAt(goog.dom.getElement('encoded_image'),encodedImage,0);
        var str = encodedImage.src;
        var idx = str.indexOf(",");
        var dat = str.substring(idx+1);
        self.images.file(self.numberImages + '.jpg', dat, {base64: true});
        self.numberImages++;
      };
    };  		
    reader.onerror = cryptogram.encoder.show_error;
    reader.readAsDataURL(f);
  }
};

goog.exportSymbol('cryptogram.demo', cryptogram.demo);
goog.exportSymbol('cryptogram.demo.prototype.showDecrypt', cryptogram.demo.prototype.showDecrypt);
goog.exportSymbol('cryptogram.demo.prototype.showEncrypt', cryptogram.demo.prototype.showEncrypt);