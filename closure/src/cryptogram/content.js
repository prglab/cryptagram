goog.provide('cryptogram.content');

goog.require('cryptogram.container');
goog.require('cryptogram.decoder');
goog.require('cryptogram.loader');
goog.require('cryptogram.media.image');
goog.require('cryptogram.media.facebook');
goog.require('cryptogram.media.googleplus');
goog.require('cryptogram.storage');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.ui.Dialog');
goog.require('goog.Uri');


var content_;

/**
 * @constructor
 */
cryptogram.content = function() {

  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);
  
  this.logger.info('Initializing injected content.');
  
  var URL = new goog.Uri(window.location);
  var knownMedia = [cryptogram.media.facebook,
                    cryptogram.media.googleplus,
                    cryptogram.media.image];
  var testMedia;
  for (var i = 0; i < knownMedia.length; i++) {
    testMedia = new knownMedia[i](URL);
    if (testMedia.matchesURL()) {
      this.media = testMedia;
      break;
    }
  }
  this.loaders = [];
  this.lastAutoDecrypt = '';
  this.storage = new cryptogram.storage(this.media);
  var self = this;
      
  chrome.extension.onMessage.addListener(function(request, sender, callback) {
    self.handleRequest(request, sender, callback);
    return true;
  });
};

cryptogram.content.prototype.logger = goog.debug.Logger.getLogger('cryptogram.content');

cryptogram.content.prototype.handleRequest = function(request, sender, callback) {
  
  var self = this;
  var password = null;
  this.callback = callback;

  if (request['storage']) {
    this.storage.load(request['storage']);
  }

  if (request['autoDecrypt']) {
      
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

  if (request['decryptURL']) {
    var URL = request['decryptURL'];
    if (URL.search('data:') == 0) {
      this.container.revertSrc();
      return;
    }
  
    password = this.storage.getPasswordForURL((URL));

    if (!password) {
      password = prompt('Enter password for\n' + URL, 'cryptogram');
    }
    if (!password) return;
    
    this.decryptByURL(request['decryptURL'], password);
  }
};


cryptogram.content.prototype.setStatus = function(message) {
  this.media.setStatus(message);
};


cryptogram.content.prototype.decryptImage = function(image, password, queue) {

  var container = new cryptogram.container(image);
  var self = this;
  var loader = new cryptogram.loader(container);
  
  
  var fullURL = this.media.fixURL(image.src);
  if (!fullURL) return;
  
  if (queue) {
  
    loader.queue(fullURL, function(data) {
      var decoder = new cryptogram.decoder(container);
      decoder.decodeData(data, password, function(result) {
      loader.state = cryptogram.loader.state.DONE;

        if (result) {
          self.media.setContainerSrc(container, result);
        }
      });
    });
    this.loaders.push(loader);
    
  } else {
  
    loader.getImageData(fullURL, function(data) {
      var decoder = new cryptogram.decoder(container);
      decoder.decodeData(data, password, function(result) {
        if (result) {
          self.media.setContainerSrc(container, result);
        }
      });
    });

  }
  
};


cryptogram.content.prototype.decryptByURL = function(URL, password) {
  
  this.logger.info('Request to decrypt ' + URL + '.');
    
  var container = this.media.loadContainer(URL);
  var loader = new cryptogram.loader(container);
  var fullURL = this.media.fixURL(URL);
  
  var self = this;
  loader.getImageData(fullURL, function(data) {
    var decoder = new cryptogram.decoder(container);
    decoder.decodeData(data, password, function(result) {
      if (result) {
        container.setSrc(result);
        self.callback({'outcome': 'success', 'id' : self.photoId, 'password' : password, 'album' : self.albumId});
      }
    });
  });
};



cryptogram.content.prototype.checkQueue = function() {
  
  if (this.loaders.length == 0) return;
    
  var maxLoading = 3;
  var loadingCount = 0;
  
  for (var i = this.loaders.length - 1; i >= 0; i--) {
  
      if (this.loaders[i].state == cryptogram.loader.state.LOADING) {
        loadingCount++;
      }
      if (this.loaders[i].state == cryptogram.loader.state.DONE) {
        var pop = this.loaders.splice(i,1);
        delete pop;
      }
  }
  
  for (var i = 0; i < this.loaders.length; i++) {
      if (this.loaders[i].state == cryptogram.loader.state.WAITING &&
            loadingCount < maxLoading) {
        this.loaders[i].start();     
        loadingCount++;
      }
  }
  
  var self = this;
  setTimeout(function() { self.checkQueue(); }, 1000);
};



cryptogram.content.prototype.autoDecrypt = function() {
      
  var images = this.media.getImages();
  
  if (images) {
    this.logger.info('Checking '+ images.length +' images against saved passwords.');
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


content_ = new cryptogram.content();
