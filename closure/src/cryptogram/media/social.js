goog.provide('cryptogram.media.social');

goog.require('goog.Uri');
goog.require('goog.dom');

goog.require('cryptogram.container');
goog.require('cryptogram.media');

/**
 * @constructor
 */
cryptogram.media.social = function() {
  cryptogram.media.call(this);
};

goog.inherits(cryptogram.media.social, cryptogram.media);


cryptogram.media.social.prototype.logger = goog.debug.Logger.getLogger('cryptogram.media.social');

/** @inheritDoc */
cryptogram.media.social.prototype.getAlbumName = function() {
  return "untitled album";
};

/** @inheritDoc */
cryptogram.media.social.prototype.getPhotoName = function() {
  return "untitled image";
};


cryptogram.media.social.prototype.getImages = function(URL) {

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


cryptogram.media.social.prototype.onReady = function(callback) {
  callback();
};


cryptogram.media.social.prototype.getPhotoName = function(URL) {
  return URL;
};