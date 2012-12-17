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



/*
cryptogram.media.facebook.prototype.getImages = function(opt_URL) {
    
  var valid = [];
  var images = [];
  
  if (this.state == cryptogram.media.facebook.state.SPOTLIGHT) {
    images = goog.dom.getElementsByClass('spotlight');
  } else if (this.state == cryptogram.media.facebook.state.PHOTO) {
    images = goog.dom.getElementsByClass('fbPhotoImage');
  } else {
  
    var thumbs = goog.dom.getElementsByClass('uiMediaThumbImg');
    
    for (var i = 0; i < thumbs.length; i++) {
      var testURL = thumbs[i].style.backgroundImage;
      testURL = testURL.substr(4,testURL.length - 5);
      var ajaxNode = thumbs[i].parentNode.parentNode;
      
      
      if (ajaxNode.tagName == 'A') {
      
        var ajaxify = ajaxNode.getAttribute('ajaxify')
        var ajaxParts = ajaxify.split("&");
        var src = ajaxParts[3];
              
        if (src.substring(0,4)=="src=") {
          var fullSrc = unescape(src.substring(4,src.length));
          this.logger.info("Extracted src from ajaxify: " + fullSrc);
          thumbs[i].src = fullSrc;
          images.push(thumbs[i]);
        }
      }
    }
  }
    
  for (var i = 0; i < images.length; i++) {
    var testURL = images[i].src;
        
    if (opt_URL) {
      if (testURL == opt_URL) {
        valid.push(images[i]);
      }
    } else {  
      if (testURL.search('_o.jpg') != -1  || testURL.search('_n.jpg') != -1 ) {
        valid.push(images[i]);  
      }
    }
  }
  return valid;
};
*/

/** @inheritDoc */
cryptogram.media.googleplus.prototype.getImages = function(opt_URL) {
  var images = document.getElementsByTagName('img');
  var valid = [];
  
  for (i = 0; i < images.length; i++) { 
    if (opt_URL) {
      if (images[i].src == opt_URL) {
        valid.push(images[i]);        
      }
    } else {
      if (images[i].parentElement && images[i].parentElement.style.opacity == "1") {
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