goog.provide('cryptogram');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('cryptogram.loader');
goog.require('cryptogram.decoder');



cryptogram.decodeContainer = function(container, password) {
  
  var loader = new cryptogram.loader(container);
  loader.getImageData(container.getSrc(), function(data) {
    var decoder = new cryptogram.decoder(container);
    decoder.decodeData(data, password, function(result) {
      container.setSrc(result);
    });
  });
};