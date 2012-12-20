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

cryptogram.media.googleplus.prototype.logger = goog.debug.Logger.getLogger('cryptogram.media.googleplus');


/**
 * Enum for possible Google+ states
 * @enum {string}
 */
cryptogram.media.googleplus.state = {
  PHOTO:      'Photo',
  ALBUM:      'Album'
};


/** @inheritDoc */
cryptogram.media.googleplus.prototype.matchesURL = function(URL) {
  var regex=new RegExp(/^https:\/\/plus.google.com/);
  return regex.test(URL);
}


/** @inheritDoc */
cryptogram.media.googleplus.prototype.name = function() {
  return "Google Plus";
};


/** @inheritDoc */
cryptogram.media.googleplus.prototype.parseMedia = function() {
    
  var albumRegex=new RegExp(/^https:\/\/plus.google.com\/photos\/[0-9]*\/albums\/[0-9]+/);
  var photoRegex=new RegExp(/^https:\/\/plus.google.com\/photos\/[0-9]*\/albums\/[0-9]*\/[0-9]+/);

  var URL = new goog.Uri(window.location);
  this.state = null;
  
  if (albumRegex.test(URL)) {
    this.state = cryptogram.media.googleplus.state.ALBUM;
  }
  
  if (photoRegex.test(URL)) {
    this.state = cryptogram.media.googleplus.state.PHOTO;
    var images = this.getImages();
    if (images.length == 0) {
      return false;
    }
  }
  
  return true;
}


/** @inheritDoc */
cryptogram.media.googleplus.prototype.onReady = function(callback) {
  this.tries = 0;
  this.maxTries = 5;
  this.delay = 250;
  this.checkIfReady(callback);
}


cryptogram.media.googleplus.prototype.checkIfReady = function(callback) {
  
  if (this.parseMedia()) {
    this.logger.info("Google+ media is ready: " + this.state + " mode");
    callback();
    return;
  }
  
  var self = this;
  this.tries++;
  if (this.tries < this.maxTries) {
    this.logger.info("Google+ not ready. Trying again. #" + this.tries);
    setTimeout(function() { self.checkIfReady(callback); }, self.delay);
  }  else {
    this.logger.info("Google+ failed.");
  }  
};

/** @inheritDoc */
cryptogram.media.googleplus.prototype.getImages = function(opt_URL) {
  var images = document.getElementsByTagName('img');
  var valid = [];
  var albumRegex = new RegExp(/^https:\/\/.*.googleusercontent.com\/[_\-a-zA-Z0-9]*\/[_\-a-zA-Z0-9]*\/[_\-a-zA-Z0-9]*\/[_\-a-zA-Z0-9]*\/[_\-a-zA-Z0-9]*\/[_\-a-zA-Z0-9\.]*/);
    
  for (i = 0; i < images.length; i++) { 
    if (opt_URL) {
      if (images[i].src == opt_URL) {
        valid.push(images[i]);        
      }
    } else {
    
      if (this.state == cryptogram.media.googleplus.state.ALBUM) {
        if (albumRegex.test(images[i].src)) {
          valid.push(images[i]);
        }     
      } else {
        if (images[i].parentElement && images[i].parentElement.style.opacity == "1") {
          valid.push(images[i]);
        }
      }
    }
  }
  return valid;
};


/** @inheritDoc */
cryptogram.media.googleplus.prototype.getPhotoName = function(URL) {
      var URLParts = URL.split("/");
      return "g+_photo://" + URLParts[4];
};
  

/** @inheritDoc */
cryptogram.media.googleplus.prototype.getAlbumName = function(URL) {
  var browserURL = document.URL;
  var albumIDs = browserURL.match(/\/albums\/([0-9]*)\/?([0-9]*)/);  
  if (albumIDs) return "g+_album://" + albumIDs[1];
  return null;
};


/** @inheritDoc */
cryptogram.media.googleplus.prototype.fixURL = function(URL) {
  
  var parts = URL.split("/");
  parts[7] = "s0";
  return parts.join("/");
};