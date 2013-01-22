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
goog.require('cryptagram.encoder');

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
  
 /*
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
*/
  
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
  this.encoder = new cryptagram.encoder();
  this.showEncodeDialog();
  this.encoder.queueFiles(files);
  //this.encoder.loadFiles();
 };
/*
cryptagram.DragAndDropHandler.prototype.handleFiles = function (files) {
  // Files is a FileList of File objects. List some properties.
  var output = [];
  var zip;
  var self = this;

  if (this.zip == null) {
    this.zip = new JSZip();
    this.images = this.zip.folder('images');
    this.numberImages = 0;
  }

  var numFiles = files.length;
  var completed = 0;

  var encoder = new cryptagram.encoder();
  goog.events.listen(encoder, "IMAGE_DONE", function (event) {
    console.log ("Got a message back with this much dat: " + event.dat.length);
    completed++;
    self.images.file(completed + '.jpg',
                     event.dat,
                     { base64: true });
    event.preventDefault();
    event.stopPropagation();

    if (completed < numFiles) {
      console.log("More to go!");
      encoder.startEncoding(files[completed]);
    } else {
      // TODO(tierney): Downloadify kick start?
    }
  },
										true,
										this);

  encoder.startEncoding(files[completed]);
  console.log("Going out of scope.");
};


*/


cryptagram.demo.prototype.showEncodeDialog = function() {

  var self = this;
  var dialog = new goog.ui.Dialog(null, false);

  dialog.setContent(cryptagram.templates.encodeDialog());
  dialog.setTitle('Cryptagram');
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK_CANCEL);
  dialog.setDisposeOnHide(true);
  
  goog.events.listen(this.encoder, 'IMAGE_LOADED', function (event) {
      
      var frame = goog.dom.createDom('div', {'class': 'frame'});
      frame.appendChild(event.image);
      goog.dom.getElement('thumbs').appendChild(frame);
      
      if (event.remaining == 0) {
        dialog.getButtonSet().setAllButtonsEnabled(true);
      }
  });
  
  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
    if (e.key == 'ok') {
      var password = goog.dom.getElement('password').value;
      if (password == "") {
        return;
      }
      var quality = goog.dom.getElement('quality').value;
      var maxSize = goog.dom.getElement('maxSize').value;
      self.showProgressDialog();
      self.encoder.startEncoding({password: password, quality: quality, maxSize: maxSize});
    }
  });
  
  dialog.setVisible(true);
  dialog.getButtonSet().setAllButtonsEnabled(false);
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
  goog.events.listen(this.encoder, "DECODE_START", function (event) {
    if (previousImage) {
      goog.dom.getElement('preview').removeChild(previousImage);
    }
    previousImage = event.image;
    goog.dom.getElement('preview').appendChild(event.image);  
  });
  
  goog.events.listen(this.encoder, "IMAGE_DONE", function (event) {
    var frame = goog.dom.createDom('div', {'class': 'frame'});
    frame.appendChild(event.image);
    goog.dom.getElement('thumbs').appendChild(frame);
  });
  
  //goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {});
  
  dialog.setVisible(true);
};



goog.exportSymbol('cryptagram.demo', cryptagram.demo);
goog.exportSymbol('cryptagram.demo.prototype.showDecrypt', cryptagram.demo.prototype.showDecrypt);
goog.exportSymbol('cryptagram.demo.prototype.showEncrypt', cryptagram.demo.prototype.showEncrypt);
