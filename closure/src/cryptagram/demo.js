goog.provide('cryptagram.demo');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.EventType');
goog.require('goog.ui.ProgressBar');
goog.require('goog.ui.Dialog');


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
cryptagram.demo = function() {

  document.body.innerHTML += cryptagram.templates.demo();

  goog.events.listen(goog.dom.getElement('encrypt_link'),
                     goog.events.EventType.CLICK, this.showEncrypt, false, this);

  goog.events.listen(goog.dom.getElement('decrypt_link'),
                     goog.events.EventType.CLICK, this.showDecrypt, false, this);

  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);

//  var remoteLog = new cryptagram.RemoteLog();
//  remoteLog.setCapturing(true);
};

cryptagram.demo.prototype.logger = goog.debug.Logger.getLogger('cryptagram.demo');


/**
 * Shows the decryption demo.
 */
cryptagram.demo.prototype.showDecrypt = function() {
  this.settings = {image: 'images/secret.jpg'};
  goog.dom.getElement('main').innerHTML = cryptagram.templates.decrypt(this.settings);
  this.decrypted = false;
  this.button = goog.dom.getElement('decrypt_button');
  this.container = new cryptagram.container(goog.dom.getElement('image'));
  goog.events.listen(this.button, goog.events.EventType.CLICK, this.runDecrypt, false, this);
};


/**
 * Shows the encryption demo.
 */
cryptagram.demo.prototype.showEncrypt = function() {
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
  
  window['downloadify'] = this.downloadify;
  
};


cryptagram.demo.prototype.setStatus = function(message) {
  console.log(message);
};



/**
 * Runs decryption on the loaded image, replacing it with the
 * decrypted image. If the image is already decrypted, it reverts
 * to the original.
 */
cryptagram.demo.prototype.runDecrypt = function() {

  if (this.decrypted) {
    this.decrypted = false;
    this.button.value = 'Decrypt';
    this.container.revertSrc();
  } else {
    var self = this;
    var password = 'cryptagram';
    var loader = new cryptagram.loader(self.container);
    var decoder = new cryptagram.decoder(self.container);

    loader.getImageData(self.container.getSrc(), function(data) {
      decoder.decodeData(data, null, function(result) {
        var cipher = new cryptagram.cipher();
        var decryptedData = cipher.decrypt(result, password);
        self.container.setSrc(decryptedData);
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
cryptagram.demo.prototype.handleFiles = function(files) {

  // Files is a FileList of File objects. List some properties.
  var output = [];
  var zip;
  var self = this;
  
  if (this.zip == null) {
      this.zip = new JSZip();
      this.numberImages = 0;
  }

  this.showEncodeDialog();
  self.images = [];
  self.data = [];
  for (var i = 0; i < files.length; i++) {
  
    var f = files[i];
    var name = escape(f.name);

    // TODO(tierney): Resize large images instead of punting.
    if (f.size > 600000) {
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
        self.images.push(originalImage);
        self.data.push(originalData);
        var frame = goog.dom.createDom('div', {'class': 'frame'});
        frame.appendChild(originalImage);
        goog.dom.insertChildAt(goog.dom.getElement('thumbs'), frame, 0);
        goog.dom.getElement('status').innerHTML = "Encode <b>" + self.images.length + "</b> images";
      };
      originalImage.src = originalData;
    };
    reader.onerror = cryptagram.demo.showError;
    reader.readAsDataURL(f);
  }
};


cryptagram.demo.prototype.startEncode = function() {
  this.showProgressDialog();
  for (var i = 0; i < this.images.length; i++) {
                      
    var image = this.images[i];
    this.dialog.dispatchEvent({type:'NEW_PREVIEW',
                      image:image});                      
    var imageData = this.data[i];
    var codec = new cryptagram.codec.bacchant();
    var cipher = new cryptagram.cipher();
    var ratio = image.width / image.height;
    var encryptedData = cipher.encrypt(imageData, this.password);
    var encodedImage = codec.encode(encryptedData, ratio);
    encodedImage.onload = function () {
      var frame = goog.dom.createDom('div', {'class': 'frame'});
      frame.appendChild(this);
      goog.dom.insertChildAt(goog.dom.getElement('thumbs'), frame, 0);     
    }
  }
};
        // Decode image to make sure it worked
          /*var decodedImage = new Image();
          var frame2 = goog.dom.createDom('div', {'class': 'frame'});
          frame2.appendChild(decodedImage);

          goog.dom.insertChildAt(goog.dom.getElement('decoded_image'), frame2, 0);
          var container = new cryptagram.container(decodedImage);
          var decoder = new cryptagram.decoder(container);
          
          var codec = new cryptagram.codec.bacchant();
          decoder.decodeData(str, codec, function(result) {
            var percent = codec.errorCount / codec.lastOctal.length;
            var decipher = cipher.decrypt(result, password);
            container.setSrc(decipher);
          });*/
  
  
cryptagram.demo.showError = function(msg, url, linenumber) {
  console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber)
  return true;
};


cryptagram.demo.prototype.showEncodeDialog = function() {

  var self = this;
  var dialog = new goog.ui.Dialog(null, false);
    
  dialog.setContent(cryptagram.templates.encodeDialog());
  dialog.setTitle('Cryptagram');
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK_CANCEL);
  dialog.setDisposeOnHide(true);
  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
    if (e.key == 'ok') {
      self.password = goog.dom.getElement('password').value;
      self.quality = goog.dom.getElement('quality').value;
      self.maxSize = goog.dom.getElement('maxSize').value;
      self.startEncode();  
    }
  });
  dialog.setVisible(true);
  goog.dom.getElement('password').focus();
};


cryptagram.demo.prototype.showProgressDialog = function() {

  var self = this;
  var dialog = new goog.ui.Dialog(null, false);
  this.dialog = dialog;
  dialog.setContent(cryptagram.templates.progressDialog());
  dialog.setTitle('Cryptagram');
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.CANCEL);
  dialog.setDisposeOnHide(true);
  
  var previousImage;
  goog.events.listen(dialog, "NEW_PREVIEW", function (event) {
    console.log(event);
    if (previousImage) {
      goog.dom.getElement('preview').removeChild(previousImage);
    }
    previousImage = event.image;
    goog.dom.getElement('preview').appendChild(event.image);
    
  });
  
  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
    
  });
  dialog.setVisible(true);
};



goog.exportSymbol('cryptagram.demo', cryptagram.demo);
goog.exportSymbol('cryptagram.demo.prototype.showDecrypt', cryptagram.demo.prototype.showDecrypt);
goog.exportSymbol('cryptagram.demo.prototype.showEncrypt', cryptagram.demo.prototype.showEncrypt);
