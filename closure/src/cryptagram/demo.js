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
cryptagram.demo = function () {

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
cryptagram.demo.prototype.showDecrypt = function () {

  var self = this;
  goog.dom.getElement('main').innerHTML =
      cryptagram.templates.decrypt({image: 'images/secret.jpg', id: '1'});

  goog.dom.getElement('main').innerHTML +=
      cryptagram.templates.decrypt({image: 'images/secret2.jpg', id: '2'});

  var button1 = goog.dom.getElement('button1');

  var container1 = new cryptagram.container(goog.dom.getElement('image1'));
  goog.events.listen(button1, goog.events.EventType.CLICK, function() {
    self.runDecrypt(container1, button1);
  }, false, this);

  var button2 = goog.dom.getElement('button2');
  var container2 = new cryptagram.container(goog.dom.getElement('image2'));
  goog.events.listen(button2, goog.events.EventType.CLICK, function() {
    self.runDecrypt(container2, button2);
  }, false, this);

};


/**
 * Shows the encryption demo.
 */
cryptagram.demo.prototype.showEncrypt = function () {
  var self = this;
  self.downloadifyId = 0;
  goog.dom.getElement('main').innerHTML = cryptagram.templates.encrypt();

  var selector = goog.dom.getElement('file_selector');
  goog.events.listen(selector, goog.events.EventType.CHANGE, function (e) {
      self.handleFiles(e.target.files);
  }, false, self);

  var dropZone = goog.dom.getElement('drop_zone');
  var handler = new goog.events.FileDropHandler(dropZone, true);

  goog.events.listen(
    handler, goog.events.FileDropHandler.EventType.DROP,
    function (e) {
      var files = e.getBrowserEvent().dataTransfer.files;
      self.handleFiles(files);
    });
};


cryptagram.demo.prototype.setStatus = function (message) {
  console.log(message);
};



/**
 * Runs decryption on the loaded image, replacing it with the
 * decrypted image. If the image is already decrypted, it reverts
 * to the original.
 */
cryptagram.demo.prototype.runDecrypt = function (container, button) {

  if (container.decrypted) {
    container.decrypted = false;
    button.value = 'Decrypt';
    container.revertSrc();
  } else {
    var self = this;
    var password = 'cryptagram';
    var loader = new cryptagram.loader(container);
    var decoder = new cryptagram.decoder(container, {password: password});

    loader.getImageData(container.getSrc(), function (data) {
      decoder.decodeData(data, null, function (result) {
        container.setSrc(result);
      });

      });

    container.decrypted = true;
    button.value = 'Reset';
  }
};


/**
 * @param{Array} files
 * @private
 */
cryptagram.demo.prototype.handleFiles = function (files) {
  this.encoder = new cryptagram.encoder();
  this.showEncodeDialog();
  this.encoder.queueFiles(files);
};


cryptagram.demo.prototype.showEncodeDialog = function () {
  var self = this;
  self.frames = {};
  var dialog = new goog.ui.Dialog(null, false);

  dialog.setContent(cryptagram.templates.encodeDialog());
  dialog.setTitle('Cryptagram');
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK_CANCEL);
  dialog.setDisposeOnHide(true);
  self.dialog = dialog;
  goog.events.listen(this.encoder, 'IMAGE_LOADED', function (event) {
    var frame = goog.dom.createDom('div', {'class': goog.getCssName('frame')});
    frame.appendChild(event.image);
    goog.dom.getElement('thumbs').appendChild(frame);
    self.frames[event.image.file] = frame;
    if (event.remaining <= 0) {
      dialog.getButtonSet().setAllButtonsEnabled(true);
    }
  }, false, this);

  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function (e) {
    if (e.key == 'ok') {
      
      var password = goog.dom.getElement('password').value;
      if (password == '') {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      var quality = goog.dom.getElement('quality').value;
      var maxSize = goog.dom.getElement('maxSize').value;
      dialog.getButtonSet().setAllButtonsEnabled(false);
      self.showProgress();
      self.encoder.startEncoding({password: password,
                                  quality: quality,
                                  maxSize: maxSize});
    }
  }, false, this);

  dialog.setVisible(true);
  dialog.getButtonSet().setAllButtonsEnabled(false);
  goog.dom.getElement('password').focus();
};



cryptagram.demo.prototype.showProgress = function () {
  var self = this;

  self.zip = new JSZip();
  self.images = self.zip.folder('images');
  self.imageCount = 0;

  goog.dom.getElement('left').innerHTML = cryptagram.templates.progress();
 
  var previousImage;
  goog.events.listen(this.encoder, 'ENCODE_START', function (event) {
    if (previousImage) {
      goog.dom.getElement('preview').removeChild(previousImage);
    }
    previousImage = event.image;
    goog.dom.getElement('status').innerHTML = 'Encoding <b>' +
      event.image.file + '</b>';
    goog.dom.getElement('preview').appendChild(event.image);
   
  }, false, this);
  
  goog.events.listen(this.encoder, 'IMAGE_DONE', function (event) {
    self.imageCount++;
    var frame = self.frames[event.image.file];
    if (frame.firstChild) {
      frame.removeChild(frame.firstChild);
    }
    frame.appendChild(event.image);
  
    var idx = event.image.src.indexOf(',');
    var dat = event.image.src.substring(idx + 1);
    var bin = window.atob(dat);
    self.images.file(event.image.file,
                     bin,
                     { base64: false, binary: true });

    if (event.remaining == 0) {
      goog.events.removeAll(self.encoder);
      self.showDownloadDialog();
      self.dialog.exitDocument();
      return;
    }
  }, false, this);
};

cryptagram.demo.prototype.showDownloadDialog = function () {

  var self = this;
  var dialog = new goog.ui.Dialog(null, false);
  dialog.setContent(cryptagram.templates.downloadDialog({imageCount:self.imageCount, id:self.downloadifyId}));
  dialog.setTitle('Cryptagram');
  dialog.setModal(false);
  dialog.setDisposeOnHide(true);
  dialog.setButtonSet(null);
  dialog.setVisible(true);

  var zip = self.zip.generate();

  this.downloadify = Downloadify.create('downloadify' + self.downloadifyId, {
    filename: "encrypted.zip",
    data: zip,
    onError: function (){
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
  self.downloadifyId++;
};

goog.exportSymbol('cryptagram.demo', cryptagram.demo);
goog.exportSymbol('cryptagram.demo.prototype.showDecrypt', cryptagram.demo.prototype.showDecrypt);
goog.exportSymbol('cryptagram.demo.prototype.showEncrypt', cryptagram.demo.prototype.showEncrypt);
