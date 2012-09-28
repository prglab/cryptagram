goog.provide('cryptogram.context');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('cryptogram');
goog.require('cryptogram.media.generic');
goog.require('cryptogram.media.facebook');
goog.require('cryptogram.media.googleplus');


var context_;

/**
 * @constructor
 */
cryptogram.context = function() {
    
  var URL = new goog.Uri(window.location);
 
  var knownMedia = [cryptogram.media.facebook,
                    cryptogram.media.googleplus,
                    cryptogram.media.generic];
  var testMedia;
  for (var i = 0; i < knownMedia.length; i++) {
    testMedia = new knownMedia[i](URL);
    if (testMedia.matchesURL()) {
      this.media = testMedia;
      return;
    }
  }  
};


cryptogram.context.prototype.handleRequest = function(request, sender, callback) {
        
  var password = null;
  
  if (request['decryptURL']) {
         
    if (request['decryptURL'].search('data:') == 0) {
      this.container.revertSrc();
      return;
    }
    
    if (!password) {
      password = prompt("Enter password for\n" + request['decryptURL'], "cryptogram");
    }
    if (!password) return;
 
    this.decryptByURL(request['decryptURL'], password);
    
  }
};


cryptogram.context.prototype.setStatus = function(message) {
  this.media.setStatus(message);
};


cryptogram.context.prototype.decryptByURL = function(URL, password) {
  
  cryptogram.log("Request to decrypt:", URL);
    
  var self = this;
  if (this.container) {
    this.container.remove();
    this.container = null;
  }
  this.container = this.media.loadContainer(URL);
  var loader = new cryptogram.loader(this.container);
  var fullURL = this.media.fixURL(URL);
  loader.getImageData(fullURL, function(data) {
    var decoder = new cryptogram.decoder(self.container);
    decoder.decodeData(data, password, function(result) {
      self.container.setSrc(result);
    });
  });
};


chrome.extension.onRequest.addListener(function(request, sender, callback) {
  context_.handleRequest(request, sender, callback);
});


context_ = new cryptogram.context();