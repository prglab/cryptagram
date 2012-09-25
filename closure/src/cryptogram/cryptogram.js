goog.provide('cryptogram');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('cryptogram.loader');
goog.require('cryptogram.decoder');


cryptogram.decryptByURL = function(URL, password, context, callback) {
  
  cryptogram.log("Request to decrypt:", URL);

  var loader = new cryptogram.loader(context);
  loader.getImageData(URL, function(data) {
    var decoder = new cryptogram.decoder(context);
    decoder.decodeData(data, password, function(result) {
      callback(result);
    });
  });
};


goog.exportSymbol('cryptogram.decryptByURL', cryptogram.decryptByURL);