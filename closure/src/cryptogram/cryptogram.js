goog.provide('cryptogram');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('cryptogram.media.generic');
goog.require('cryptogram.media.facebook');
goog.require('cryptogram.media.googleplus');
goog.require('cryptogram.storage');


/**
 * Iterates through known media types to find the best match.
 */
cryptogram.init = function(){

  if (cryptogram.context != null) return;

  var URL = new goog.Uri(window.location);
  
  var knownMedia = [cryptogram.media.facebook,
                    cryptogram.media.googleplus,
                    cryptogram.media.generic];
  var testMedia;
  for (var i = 0; i < knownMedia.length; i++) {
    testMedia = new knownMedia[i](URL);
    if (testMedia.matchesURL()) {
      cryptogram.context = testMedia;
    }
  }
  
  if (chrome && chrome.extension) {
    cryptogram.initExtension();
  }
  
};

cryptogram.initExtension = function() {
  if (!chrome.extension.onRequest.hasListeners()) {
    chrome.extension.onRequest.addListener(cryptogram.handleRequest);
  }
}

cryptogram.handleRequest = function(request, sender, callback) {
            
  if (request.sendDebugReport == "1") {
    cryptogram.log.sendDebugReport();   
    return;
  }  
  
  cryptogram.storage.callback = callback;
  
  if (request.checkForSaved == "1") {
    cryptogram.storage.load(request.storage);
    cryptogram.storage.autoDecrypt();
  }
  
  var password = null;
  
  if (request['decryptURL']) {
    
    if (request['decryptURL'].search('data:') == 0) {
      cryptogram.revertByURL(request['decryptURL']);
      return;
    }
  
    if (request['storage']) {
      cryptogram.storage.load(request['storage']);
    }
                
    if (cryptogram.storage) {    
      password = cryptogram.storage.getPasswordForURL(request.decryptURL);
    }
    
    if (!password) {
      password = prompt("Enter password for\n" + request['decryptURL'], "cryptogram");
    }
    
    if (!password) return;
    
    cryptogram.decryptByURL(request['decryptURL'], password);
  }
};

cryptogram.revertByURL = function(URL) {
  
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

cryptogram.init();

goog.exportSymbol('cryptogram.init', cryptogram.init);
goog.exportSymbol('cryptogram.initExtension', cryptogram.initExtension);
goog.exportSymbol('cryptogram.handleRequest', cryptogram.handleRequest);
