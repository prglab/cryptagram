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
  
  //if (cryptogram.context.media) return;
    
  var URL = new goog.Uri(window.location);
  
  var knownMedia = [cryptogram.media.facebook,
                    cryptogram.media.googleplus,
                    cryptogram.media.generic];
  var testMedia;
  for (var i = 0; i < knownMedia.length; i++) {
    testMedia = new knownMedia[i](URL);
    if (testMedia.matchesURL()) {
      this.media = testMedia;
    }
  }
};


cryptogram.context.prototype.handleRequest = function(request, sender, callback) {
      

  //if (request['checkForSaved'] == "1") {
    //cryptogram.storage.load(request.storage);
    //cryptogram.storage.autoDecrypt();
  //}
  var self = this;

  var password = null;
  
  if (request['decryptURL']) {
    
    if (request['decryptURL'].search('data:') == 0) {
      var containers = self.media.getContainers(request['decryptURL']);
      self.media.revertContainer(containers[0]);
      return;
    }
  
    //if (request['storage']) {
    //  cryptogram.storage.load(request['storage']);
    //}
                
    //if (cryptogram.storage) {    
    //  password = cryptogram.storage.getPasswordForURL(request.decryptURL);
    //}
    
    if (!password) {
      password = prompt("Enter password for\n" + request['decryptURL'], "cryptogram");
    }
    if (!password) return;
 
    cryptogram.decryptByURL(request['decryptURL'], password, self, function(result) {
      var containers = self.media.getContainers(request['decryptURL']);  
      self.media.setContainerSrc(containers[0], result);
    });
  }
};


cryptogram.context.prototype.setStatus = function(message) {
  this.media.setStatus(message);
};


chrome.extension.onRequest.addListener(function(request, sender, callback) {
  context_.handleRequest(request, sender, callback);
});


context_ = new cryptogram.context();



/*cryptogram.revertByURL = function(URL) {
  
  cryptogram.log("Reverting:", URL);
    
  var containers = cryptogram.context.getContainers(URL);  
  cryptogram.context.revertContainer(containers[0]);
};


cryptogram.decryptByURL = function(URL, password) {
  
  cryptogram.log("Request to decrypt:", URL);

  var loader = new cryptogram.loader();
  loader.getImageData(URL, function(data) {
    var decoder = new cryptogram.decoder();
    decoder.decodeData(data, password, function(result) {
      var containers = cryptogram.context.getContainers(URL);
      cryptogram.context.setContainerSrc(containers[0],result);
    });
  });
};
*/