goog.provide('cryptogram.media.generic');

goog.require('goog.Uri');
goog.require('goog.dom');

/**
 * @constructor
 */
cryptogram.media.generic = function(URL) {
  this.URL = URL;
};

cryptogram.media.generic.prototype.matchesURL = function() {
  return true;
};

cryptogram.media.generic.prototype.name = function() {
  return "Generic";
};

cryptogram.media.generic.prototype.getPhotoName = function() {
  return "untitled image";
};

cryptogram.media.generic.prototype.getAlbumName = function() {
  return "untitled album";
};

cryptogram.media.generic.prototype.getContainers = function(URL) {
  
  
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
  if (status) console.log(status);
};

