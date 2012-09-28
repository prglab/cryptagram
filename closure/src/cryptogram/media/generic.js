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

cryptogram.media.generic.prototype.getAlbumName = function() {
  return "untitled album";
};

cryptogram.media.generic.prototype.loadContainer = function(URL) {
  
  var images = this.getImages(URL);
  this.container = new cryptogram.container(images[0]);
  return this.container;
};

cryptogram.media.generic.prototype.getImages = function(URL) {
  
  if (URL.search("http") != 0 && URL.search("data:") != 0) {
    URL = this.URL.getScheme() + "://" + this.URL.getDomain() + ":" + this.URL.getPort() + "/" + URL;
  }
   
  var elements = document.getElementsByTagName('img');
  var ret = new Array(); 
    for (i = 0; i < elements.length; i++) {
      var testSrc = elements[i].src;      
      if (testSrc == URL) {
        ret.push(elements[i]);
      }
    }
  return ret;
};

cryptogram.media.generic.prototype.setContainerSrc = function(container, src) {
    container.previousSrc = container.src;
    container.src = src;
};

cryptogram.media.generic.prototype.revertContainer = function(container) {
    if (!container.previousSrc) return;
    container.src = container.previousSrc;
    container.previousSrc = null;
};

cryptogram.media.generic.prototype.setStatus = function(status) {
  
  if (!status) {
    status = '';
  }
  if (this.status) {
    this.status.innerHTML = status;  
  } else {
    console.log(status);
  }   
};

