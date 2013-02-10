goog.provide('cryptagram.content');

goog.require('cryptagram.container');
goog.require('cryptagram.decoder');
goog.require('cryptagram.cipher');
goog.require('cryptagram.loader');
goog.require('cryptagram.media.facebook');
goog.require('cryptagram.media.googleplus');
goog.require('cryptagram.media.image');
goog.require('cryptagram.media.web');
goog.require('cryptagram.storage');
goog.require('cryptagram.RemoteLog');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('goog.dom');
goog.require('goog.ui.Dialog');
goog.require('goog.Uri');

goog.require('goog.events');


var content_;

/**
 * @constructor
 */
cryptagram.content = function() {

  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);

  this.remoteLog = new cryptagram.RemoteLog();

  this.logger.info('Initializing injected content.');

  var URL = new goog.Uri(window.location);
  var knownMedia = [cryptagram.media.facebook,
                    cryptagram.media.googleplus,
                    cryptagram.media.image,
                    cryptagram.media.web];
  var testMedia;
  for (var i = 0; i < knownMedia.length; i++) {
    testMedia = new knownMedia[i]();
    if (testMedia.matchesURL(URL)) {
      this.media = testMedia;
      break;
    }
  }

  this.logger.info('Found media: ' + this.media.name());
  
  this.loaders = [];
  this.lastAutoDecrypt = '';
  this.storage = new cryptagram.storage(this.media);
  var self = this;
  
  chrome.extension.onMessage.addListener(function(request, sender, callback) {
    self.handleRequest(request, sender, callback);
    return true;
  });
};

cryptagram.content.prototype.logger =
    goog.debug.Logger.getLogger('cryptagram.content');


cryptagram.content.prototype.handleRequest =
    function(request, sender, callback) {
  var self = this;
  var password = null;
  this.callback = callback;

  this.media.determineState(document.URL);

  
  if (request['storage']) {
    this.storage.load(request['storage']);
  }

  // Always check user_study variable in case it has changed
  var remoteCapture = (self.storage.lookup['user_study'] == 'true');
  this.remoteLog.setCapturing(remoteCapture);

  if (request['setUserStudy']) {
    localStorage['user_study'] = self.storage.lookup['user_study'];
  }
  
  if (request['autoDecrypt']) {
    if (this.media.supportsAutodecrypt) {
      if (request['autoDecrypt'] == this.lastAutoDecrypt) {
        this.logger.info('Ignoring redundant autodecrypt request.');
        return;
      }
      this.logger.info('Autodecrypting.');

      this.lastAutoDecrypt = request['autoDecrypt'];
      this.media.onReady(function() {
        self.autoDecrypt(request['autoDecrypt']);
      });
    }
  }

  if (request['decryptURL']) {
    var URL = request['decryptURL'];

    // If already decoded, URL starts with 'data:'
    if (URL.search('data:') == 0) {
      var container = this.media.getContainer(URL);
      if (container) {
        container.revertSrc();
        this.logger.info("Reverted to " + container.img.src);
      }
      return;
    }

    this.media.onReady(function() {
      self.getPassword(URL);
    });
  }
};


cryptagram.content.prototype.setStatus = function(message) {
  this.media.setStatus(message);
};


cryptagram.content.prototype.decryptImage = function(image, password, queue) {

  var container = this.media.loadContainer(image.src);

  var self = this;
  var loader = new cryptagram.loader(container);
  var cipher = new cryptagram.cipher();
  var decoder = new cryptagram.decoder(container, {password: password});

  var fullURL = this.media.fixURL(image.src);
  if (!fullURL) return;

  if (queue) {

    loader.queue(fullURL, function(data) {
      decoder.decodeData(data, null, function(result) {
      loader.state = cryptagram.loader.state.DONE;

        if (result) {
          image.previousSrc = image.src;
          self.media.setContainerSrc(container, result);
        }
      });
    });
    this.loaders.push(loader);

  } else {

    loader.getImageData(fullURL, function(data) {
      decoder.decodeData(data, null, function(result) {
        if (result) {
          image.previousSrc = image.src;
          self.media.setContainerSrc(container, result);
        }
      });
    });

  }

};


cryptagram.content.prototype.decryptByURL = function(URL, password) {

  this.logger.info('Request to decrypt ' + URL + '.');
  var container = this.media.loadContainer(URL);

  var loader = new cryptagram.loader(container);
  var fullURL = this.media.fixURL(URL);

  var self = this;
  loader.getImageData(fullURL, function(data) {
    // TODO(tierney): May not want/need the password option here.
    var decoder = new cryptagram.decoder(container, {password:password});
    decoder.decodeData(data, null, function(result) {
      if (result) {
        self.media.setContainerSrc(container, result);
        var photoName = self.media.getPhotoName(URL);
        var albumName = self.media.getAlbumName(URL);

        var savePassword = (self.storage.lookup['save_passwords'] == 'true');
        if (self.overrideSavePassword != null) {
          savePassword = self.overrideSavePassword;
        }

        var albumPassword = (self.storage.lookup['album_passwords'] == 'true');
        if (self.overrideAlbumPassword != null) {
          albumPassword = self.overrideAlbumPassword;
        }

        if (savePassword) {
          self.logger.info("Saving image password for " + photoName);
          var obj = {'outcome': 'success', 'id' : photoName, 'password' : password};
          if (albumPassword && albumName) {
            self.logger.info("Saving album password for " + albumName);
            obj['album'] = albumName;
          }
          self.callback(obj);
        }
      }
    });
  });
};



cryptagram.content.prototype.checkQueue = function() {

  if (this.loaders.length == 0) return;

  var maxLoading = 1;
  var loadingCount = 0;

  for (var i = this.loaders.length - 1; i >= 0; i--) {

      if (this.loaders[i].state == cryptagram.loader.state.LOADING) {
        loadingCount++;
      }
      if (this.loaders[i].state == cryptagram.loader.state.DONE) {
        var pop = this.loaders.splice(i,1);
        delete pop;
      }
  }

  for (var i = 0; i < this.loaders.length; i++) {
      if (this.loaders[i].state == cryptagram.loader.state.WAITING &&
            loadingCount < maxLoading) {
        this.loaders[i].start();
        loadingCount++;
      }
  }

  var self = this;
  setTimeout(function() { self.checkQueue(); }, 1000);
};



cryptagram.content.prototype.autoDecrypt = function() {

  var images = this.media.getImages();

  if (images) {
    this.logger.info('Checking ' + images.length +
                     ' images against saved passwords.');
  }

  var needsQueue = true;
  if (images.length < 4) needsQueue = false;

  for (var i = 0; i < images.length; i++) {
    var password = this.storage.getPasswordForURL(images[i].src);
    if (password) {
      this.decryptImage(images[i], password, needsQueue);
    }
  }
  this.checkQueue();
};


cryptagram.content.prototype.getPassword = function(URL) {
  var password = this.storage.getPasswordForURL(URL);
  var demoPassword;
  if (password) {
  
    if (this.storage.lookup['auto_decrypt'] == 'true') {
      this.overrideSavePassword = false;
      this.overrideAlbumPassword = false;
      this.decryptByURL(URL, password);
      return;
    }
    
  } else {
    password = this.storage.getDemoPasswordForURL(URL);
    demoPassword = password;
  }

  var self = this;
  var dialog = new goog.ui.Dialog(null, false);
  
  // Check if we're in image mode, in which case the CSS
  // hack is necessary.
  if (this.media.cssHack) {
    this.media.cssHack(dialog);
  }

  dialog.setContent(cryptagram.templates.passwordDialog({'URL':URL}));
  dialog.setTitle('Cryptagram');
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK_CANCEL);
  dialog.setDisposeOnHide(true);
  dialog.setModal(true);
  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
    if (e.key == "ok") {
      var password = document.getElementById('password').value;
      if (password.length > 0) {
        self.decryptByURL(URL, password);
      }
    }
  });
  dialog.setVisible(true);
  goog.dom.getElement('password').focus();

  if (password) {
    goog.dom.getElement('password').value = password;
    goog.dom.getElement('password').select();
  }
  
  dialog.getBackgroundElement().addEventListener('click', function(e) {
    e.stopPropagation();
  }, false);
  
  dialog.getDialogElement().addEventListener('click', function(e) {
    e.stopPropagation();
  }, false); 
    
  var hidePassword = goog.dom.getElement('hidePassword');
  if (this.storage.lookup['hide_passwords'] == 'true' && !demoPassword) {
    hidePassword.checked = true;
  } else {
    goog.dom.getElement('password').type = 'text';
  }
  goog.events.listen(hidePassword, goog.events.EventType.CHANGE, function(e) {
    if (hidePassword.checked) {
      goog.dom.getElement('password').type = 'password';
    } else {
      goog.dom.getElement('password').type = 'text';
    }

  }, false);

  self.overrideSavePassword = null;
  self.overrideAlbumPassword = null;
  var savePassword = goog.dom.getElement('savePassword');
  var albumPassword = goog.dom.getElement('albumPassword');

  if (this.storage.lookup['save_passwords'] == 'true') {
    savePassword.checked = true;
    albumPassword.disabled = false;
  }
  goog.events.listen(savePassword, goog.events.EventType.CHANGE, function(e) {
    self.overrideSavePassword = savePassword.checked;
    if (savePassword.checked) {
      albumPassword.disabled = false;
    } else {
      albumPassword.disabled = true;
    }
  }, false);

  if (this.storage.lookup['album_passwords'] == 'true') {
    albumPassword.checked = true;
  }
  goog.events.listen(albumPassword, goog.events.EventType.CHANGE, function(e) {
    self.overrideAlbumPassword = albumPassword.checked;
  }, false);
};


content_ = new cryptagram.content();
