goog.provide('cryptogram.media.googleplus');

goog.require('cryptogram.media.social');

/**
 * @constructor
 * @extends {cryptogram.media.social}
 */
cryptogram.media.googleplus = function() {
  cryptogram.media.social.call(this);
};

goog.inherits(cryptogram.media.googleplus, cryptogram.media.social);


/** @inheritDoc */
cryptogram.media.googleplus.prototype.matchesURL = function(URL) {
  var regex=new RegExp(/^http:\/\/plus.google.com/);
  return regex.test(URL);
}


/** @inheritDoc */
cryptogram.media.googleplus.prototype.name = function() {
  return "Google Plus";
};


/** @inheritDoc */
cryptogram.media.googleplus.prototype.getImages = function(opt_URL) {
  var images = document.getElementsByTagName('img');
  var valid = [];
    
  for (i = 0; i < images.length; i++) {
    if (images[i].parentNode) {
      var parentClass = images[i].parentNode.className;
      if (parentClass.contains("photo-container")) {
        valid.push(images[i]);  
      }
    }
  }
  return valid;
};


/** @inheritDoc */
cryptogram.media.googleplus.getPhotoName = function(URL) {
      var URLParts = URL.split("/");
      return "g+_photo://" + URLParts[4];
};
  

/** @inheritDoc */
cryptogram.media.googleplus.getAlbumName = function(URL) {
  var browserURL = document.URL;
  var albumIDs = browserURL.match(/\/albums\/([0-9]*)/);
  if (albumIDs) return "g+_album://" + albumIDs[1];
  return null;
};