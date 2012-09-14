goog.provide('cryptogram.demo');

goog.require('goog.dom');
goog.require('cryptogram');
goog.require('cryptogram.loader');
goog.require('cryptogram.decoder');

cryptogram.demo = function() {
  var settings = {image: 'http://ianspiro.com/secret.jpg'};
  cryptogram.demo.settings = settings;
  goog.dom.getElement('main').innerHTML = cryptogram.templates.demo(settings);
  cryptogram.discoverMedia();
};

cryptogram.demo.decrypt = function() {

  if (cryptogram.demo.decrypted) {
    cryptogram.demo.decrypted = false;
    goog.dom.getElement('button').value = "Decrypt"; 
    cryptogram.context.setSrc(cryptogram.context.container.previousSrc);
  } else {
    cryptogram.demo.decrypted = true;
    goog.dom.getElement('button').value = "Reset"; 
    cryptogram.loader.getImageData(cryptogram.demo.settings.image, function(data) {
     var containers = cryptogram.context.getContainers();
     var password = "cryptogram";      
     var decoder = new cryptogram.decoder();
      decoder.decodeDataToContainer(data, password, containers[0]);
   });
  }  

  
};

goog.exportSymbol('cryptogram.demo', cryptogram.demo);
goog.exportSymbol('cryptogram.demo.decrypt', cryptogram.demo.decrypt);
