goog.provide('cryptogram.media.facebook');

goog.require('cryptogram.media.generic');


/**
 * @constructor
 * @extends {cryptogram.media.generic}
 */
cryptogram.media.facebook = function(URL) {
  cryptogram.media.generic.call(this, URL);
};
goog.inherits(cryptogram.media.facebook, cryptogram.media.generic);


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
cryptogram.media.facebook.prototype.getImages = function(URL) {
  
  var valid = [];
  var images = goog.dom.getElementsByClass('fbPhotoImage');
  
  if (!images.length) {
    images = goog.dom.getElementsByClass('spotlight');
  }
    
  for (var i = 0; i < images.length; i++) {
    var testURL = images[i].src;
    
    if (URL) {
      if (testURL == URL) {
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

  this.spotlight = null;
  this.actions = null;
  this.projector = null;
  this.album = null;
    
  var regex=new RegExp(/^https?:\/\/www.facebook.com\/media\/set\/\?set=a\.[0-9]*\.[0-9]*\.[0-9]*/);
  var URL = new goog.Uri(window.location);
  
  if (regex.test(URL)) {
    this.album = true;
    return true;
  }

  var spotlight = document.getElementsByClassName('spotlight');  
  if (goog.isDef(spotlight[0])) {
    this.spotlight = spotlight[0];
    var FBURLParts = this.spotlight.src.split("/");      
    var FBFilename = FBURLParts[FBURLParts.length-1];
    var FBFilenameParts = FBFilename.split("_");
    var FBFileID = FBFilenameParts[1];
    var FBAName = "pic_" + FBFileID;
    this.projector = document.getElementById(FBAName);
    if (this.projector) return true;
  }
         
  var actions = document.getElementsByClassName('fbPhotosPhotoActionsItem');
  if (goog.isDef(actions[5])) {
    this.actions = actions;
    return true;
  }

  return false;
};


cryptogram.media.facebook.prototype.checkIfReady = function(callback) {
  
  if (this.parseMedia()) {
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
      console.log(info);
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

    cryptogram.log("Trying to fix:", URL);
    
    if (URL.search('_o.jpg') != -1) {
      cryptogram.log('Facebook URL appears to be full size.')
      return URL;
    }    
    
    if (this.spotlight && this.spotlight.src == URL && this.projector) {
        
      var ajax = this.projector.getAttribute("ajaxify");
      // Ajaxify parameter contains the full src, but escaped
      if (ajax) {
        var ajaxParts = ajax.split("&");
        var escapedSrc = ajaxParts[3];
        var escapedURL = escapedSrc.substring(4,escapedSrc.length);
        var fullURL = unescape(escapedURL);
        cryptogram.log("Extracted Facebook URL from Ajax:", fullURL);
        return fullURL;
      }
    }
    
    if (this.actions) {
          
      for (var i = 0; i < this.actions.length; i++) {
        var fullURL = this.actions[i].href;
        if (fullURL) {
          if (fullURL.search('_o.jpg') != -1 || fullURL.search('_n.jpg') != -1) {
            cryptogram.log('Extracted full URL from Download link:', fullURL);
            return fullURL;
          }
        }   
      }
    }
    return URL;
};