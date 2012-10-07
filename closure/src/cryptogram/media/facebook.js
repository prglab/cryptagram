goog.provide('cryptogram.media.facebook');

goog.require('cryptogram.media.generic');
goog.require('goog.dom');


/**
 * @constructor
 * @extends {cryptogram.media.generic}
 */
cryptogram.media.facebook = function(URL) {
  cryptogram.media.generic.call(this, URL);
};
goog.inherits(cryptogram.media.facebook, cryptogram.media.generic);



/**
 * Enum for possible Facebook states
 * @enum {string}
 */
cryptogram.media.facebook.state = {
  PHOTO:      'Photo',
  SPOTLIGHT:  'Photo Spotlight',
  ALBUM:      'Album',
  TIMELINE:   'Timeline'
};


/** @inheritDoc */
cryptogram.media.facebook.prototype.matchesURL = function() {
  var regex=new RegExp(/^https?:\/\/www.facebook.com/);
  return regex.test(this.URL);
}


/** @inheritDoc */
cryptogram.media.facebook.prototype.name = function() {
  return 'Facebook';
};


/** @inheritDoc */
cryptogram.media.facebook.prototype.getImages = function(opt_URL) {
    
  var valid = [];
  var images;
  
  if (this.state == cryptogram.media.facebook.state.SPOTLIGHT) {
    images = goog.dom.getElementsByClass('spotlight');
  } else if (this.state == cryptogram.media.facebook.state.PHOTO) {
    images = goog.dom.getElementsByClass('fbPhotoImage');
  } else {
    return [];
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


cryptogram.media.facebook.prototype.parseMedia = function() {

  this.actions = null;
  this.state = null;
  this.downloadSrc = null;
  
  var albumRegex=new RegExp(/^https?:\/\/www.facebook.com\/media\/set\/\?set=a\.[0-9]*\.[0-9]*\.[0-9]*/);
  var URL = new goog.Uri(window.location);
  
  if (albumRegex.test(URL)) {
    this.state = cryptogram.media.facebook.state.ALBUM;
    return true;
  }
  
  

  var spotlight = document.getElementsByClassName('spotlight');  
  if (goog.isDef(spotlight[0])) {
  
    if (spotlight[0].className.indexOf('hidden_elem') != -1) {
      this.state = cryptogram.media.facebook.state.PHOTO;
      return true;
    }
    
    this.state = cryptogram.media.facebook.state.SPOTLIGHT;
    
    var s = document.getElementById("snowliftStageActions");    
    var child = goog.dom.findNode(s, function(n) {
      return n.className == 'uiButtonText';
    });
    
    // Ultimate hack! Click the Options button to trigger the creation of Download button
    if (child) {
        child.click();
        child.click();
    }
    
    var menu = document.getElementsByClassName('uiMenuX');
    if (goog.isDef(menu[0])) {
      var download = goog.dom.findNode(menu[menu.length-1], function(n) {
        return n.className == 'itemLabel' && n.innerHTML == 'Download';
      });
    
      if (download) {
        this.fullURL = download.parentNode.href;
        return true;
      } else {
        return false;
      }
    }
     
    return true;
  }
 
  var actions = document.getElementsByClassName('fbPhotosPhotoActionsItem');
  if (goog.isDef(actions[0])) {     
    for (var i = 0; i < actions.length; i++) {
      var fullURL = actions[i].href;
      if (fullURL) {
        if (fullURL.search('_o.jpg') != -1 || fullURL.search('_n.jpg') != -1) {
          this.fullURL = fullURL;
        }
      }  
    }
    this.state = cryptogram.media.facebook.state.PHOTO;
    return true;
  }

  return false;
};


cryptogram.media.facebook.prototype.checkIfReady = function(callback) {
  
  if (this.parseMedia()) {
    cryptogram.log("Media found: " + this.name() + ":" + this.state);
    callback();
    return;
  }
  
  var self = this;
  this.tries++;
  if (this.tries < this.maxTries) {
    cryptogram.log("Media not ready. Trying again. #" + this.tries);
    setTimeout(function() { self.checkIfReady(callback); }, self.delay);
  }  else {
    cryptogram.log("Media failed.");
  }  
};

/** @inheritDoc */
cryptogram.media.facebook.prototype.onReady = function(callback) {
    
  this.tries = 0;
  this.maxTries = 5;
  this.delay = 100;
  this.checkIfReady(callback);
}


/** @inheritDoc */
cryptogram.media.facebook.prototype.getPhotoName = function(URL) {
  var FBURLParts = URL.split("/");
  var FBFilename = FBURLParts[FBURLParts.length-1];
  var FBFilenameParts = FBFilename.split("_");
  return "fb_photo://" + FBFilenameParts[1];
};


/** @inheritDoc */
cryptogram.media.facebook.prototype.getAlbumName = function(URL) {
  var browserURL = document.URL;
  var albumIDParts = browserURL.match(/set=a.([0-9a.]*)/);
  
  if (!albumIDParts) {
    var info = document.getElementById('fbPhotoPageMediaInfo');
    if (info) {
      var URL = info.children[0].children[1].children[1].href;
      albumIDParts = URL.match(/set=a.([0-9a.]*)/);
       cryptogram.log('Extracted album name from album link.');
    } else {
      return null;
    }
  }
  
  var albumID = albumIDParts[1];
  var albumParts = albumID.split(".");
  return "fb_album://" + albumParts[0] + "." + albumParts[1];
};


/** @inheritDoc */
cryptogram.media.facebook.prototype.fixURL = function(URL) {
  
  if (URL.search('_o.jpg') != -1) {
    cryptogram.log('Facebook URL is already full size.')
    return URL;
  }    
  
  if (this.state == cryptogram.media.facebook.state.SPOTLIGHT) {
    if (this.fullURL) {
      cryptogram.log('Extracted full URL from Download link:', this.fullURL);
      return this.fullURL;
    }
  }
  
  if (this.state == cryptogram.media.facebook.state.PHOTO) {
    if (this.fullURL) {
      cryptogram.log('Extracted full URL from Download link:', this.fullURL);
      return this.fullURL;
    }
  }

  return URL;
};