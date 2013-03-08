goog.provide('cryptagram.media.googleplus');

goog.require('cryptagram.media.social');

/**
 * @constructor
 * @extends {cryptagram.media.social}
 */
cryptagram.media.googleplus = function() {
  cryptagram.media.social.call(this);
};

goog.inherits(cryptagram.media.googleplus, cryptagram.media.social);

cryptagram.media.googleplus.prototype.logger = goog.debug.Logger.getLogger('cryptagram.media.googleplus');


/**
 * Enum for possible Google+ states
 * @enum {string}
 */
cryptagram.media.googleplus.state = {
  PHOTO:      'Photo',
  ALBUM:      'Album',
  OTHER:      'Other'
};

cryptagram.media.googleplus.prototype.state = cryptagram.media.googleplus.state.OTHER;

/** @inheritDoc */
cryptagram.media.googleplus.prototype.matchesURL = function(URL) {
  var regex=new RegExp(/^https:\/\/plus.google.com/);
  if (regex.test(URL)) {
    this.determineState(URL);
    return true;
  }
  return false;
}


cryptagram.media.googleplus.prototype.determineState = function(URL) {
  var albumRegex=new RegExp(/^https:\/\/plus.google.com\/(u\/0\/)?photos\/[0-9]*\/albums\/[0-9]+/);
  var photoRegex=new RegExp(/^https:\/\/plus.google.com\/(u\/0\/)?photos\/[0-9]*\/albums\/[0-9]*\/[0-9]+/);

  this.state = cryptagram.media.facebook.state.OTHER;
  
  if (albumRegex.test(URL)) {
    this.state = cryptagram.media.googleplus.state.ALBUM;
    this.supportsAutodecrypt = true;
  }

  if (photoRegex.test(URL)) {
    this.state = cryptagram.media.googleplus.state.PHOTO;
    this.supportsAutodecrypt = true;
  }  
};


/** @inheritDoc */
cryptagram.media.googleplus.prototype.name = function() {
  return "Google Plus";
};


/** @inheritDoc */
cryptagram.media.googleplus.prototype.parseMedia = function() {

  if (this.state == cryptagram.media.googleplus.state.PHOTO) {
    var images = this.getImages();
    if (images.length == 0) {
      return false;
    }
  }
  return true;
}


/** @inheritDoc */
cryptagram.media.googleplus.prototype.onReady = function(callback) {
  this.tries = 0;
  this.maxTries = 6;
  this.delay = 400;
  this.checkIfReady(callback);
}


/** @inheritDoc */
cryptagram.media.googleplus.prototype.loadContainer = function(URL) {
  var images = this.getImages(URL);
  
  
  if (this.state == cryptagram.media.googleplus.state.PHOTO 
   || this.state == cryptagram.media.googleplus.state.OTHER) {
    for (var i = 0; i < images.length; i++) {
      if (images[i].parentElement && images[i].parentElement.style.opacity == "1") {
        return new cryptagram.container.img(images[i]);
      }
    }
  }
    
  return new cryptagram.container.img(images[0]);
};



cryptagram.media.googleplus.prototype.checkIfReady = function(callback) {

  this.determineState(document.URL);

  if (this.parseMedia()) {
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
cryptagram.media.googleplus.prototype.getImages = function(opt_URL) {
  var images = document.getElementsByTagName('img');
  var valid = [];
  var albumRegex = new RegExp(/^https:\/\/.*.googleusercontent.com\/[_\-A-z0-9]*\/[_\-A-z0-9]*\/[_\-A-z0-9]*\/[_\-A-z0-9]*\/w[0-9]*\-h[0-9]*\-[nop\-]*\-k\/[_\-A-z0-9\.]*/);
  var photoRegex = new RegExp(/^https:\/\/.*.googleusercontent.com\/[_\-A-z0-9]*\/[_\-A-z0-9]*\/[_\-A-z0-9]*\/[_\-A-z0-9]*\/s[0-9]*\/[_\-A-z0-9\.]*/);
  

  for (i = 0; i < images.length; i++) {
    if (opt_URL) {
      if (images[i].src == opt_URL) {
        valid.push(images[i]);
      }
    } else {

      if (this.state == cryptagram.media.googleplus.state.ALBUM) {
        if (albumRegex.test(images[i].src)) {        
          valid.push(images[i]);
        }
        
      } else if (this.state == cryptagram.media.googleplus.state.PHOTO && 
         images[i].parentElement && images[i].parentElement.style.opacity == "1") {
         if (photoRegex.test(images[i].src)) {        
          valid.push(images[i]);
        }
      } else {
        // Google+ puts the image in multiple img elements, possibly to speed up load times.
        // Only the one with a parent div opacity=1 is visible.
        if (images[i].parentElement && images[i].parentElement.style.opacity == "1") {
          valid.push(images[i]);
        }
      }
    }
  }  
  return valid;
};


/** @inheritDoc */
cryptagram.media.googleplus.prototype.getPhotoName = function(URL) {
  var URLParts = URL.split("/");
  return "g+_photo://" + URLParts[4];
};


/** @inheritDoc */
cryptagram.media.googleplus.prototype.getAlbumName = function(URL) {
  var browserURL = document.URL;
  var albumIDs = browserURL.match(/\/albums\/([0-9]*)\/?([0-9]*)/);
  if (albumIDs) return "g+_album://" + albumIDs[1];
  return null;
};


/** @inheritDoc */
cryptagram.media.googleplus.prototype.fixURL = function(URL) {
  var parts = URL.split("/");
  parts[7] = "s0";
  return parts.join("/");
};
