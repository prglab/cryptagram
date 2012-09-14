goog.provide('cryptogram.media.generic');

goog.require('goog.Uri');

/**
 * @constructor
 */
cryptogram.media.generic = function() {
};

cryptogram.media.generic.prototype.matchesURL = function(URL) {
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

cryptogram.media.generic.prototype.getContainers = function() {
  var elements = document.getElementById('img');  
  var element = goog.dom.getElement('image');
  this.container = element;
  var ret = new Array();
  ret.push(element);
  return ret;
 };

cryptogram.media.generic.prototype.setSrc = function(src) {
  
    this.container.previousSrc = this.container.src;
    this.container.src = src;
};

cryptogram.media.generic.prototype.setStatus = function(status) {
  if (status) console.log(status);
};

