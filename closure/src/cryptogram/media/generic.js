goog.provide('cryptogram.media.generic');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('cryptogram.container');

/**
 * @constructor
 */
cryptogram.media.generic = function(URL) {
  this.URL = URL;
};

cryptogram.media.generic.prototype.matchesURL = function() {
  return true;
};

cryptogram.media.generic.prototype.fixURL = function(URL) {
  return URL;
};

cryptogram.media.generic.prototype.getAlbumName = function() {
  return "untitled album";
};

cryptogram.media.generic.prototype.getPhotoName = function() {
  return "untitled image";
};

cryptogram.media.generic.prototype.loadContainer = function(URL) {
  var images = this.getImages(URL);  
  return new cryptogram.container(images[0]);
};

cryptogram.media.generic.prototype.getImages = function(URL) {

  var elements = document.getElementsByTagName('img');
  var ret = new Array(); 
    for (var i = 0; i < elements.length; i++) {
      var testSrc = elements[i].src;
      if (URL == null || testSrc == URL) {
        ret.push(elements[i]);
      }
    }
  return ret;
};


cryptogram.media.generic.prototype.onReady = function(callback) {
  callback();
};

cryptogram.media.generic.prototype.setContainerSrc = function(container, src) {
    container.setSrc(src);
};

cryptogram.media.generic.prototype.getPhotoName = function(URL) {
  return URL;
};

cryptogram.media.generic.prototype.getAlbumName = function(URL) {
  return URL;
};


