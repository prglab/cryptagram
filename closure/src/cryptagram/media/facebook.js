goog.provide('cryptagram.media.facebook');

goog.require('cryptagram.media.social');
goog.require('cryptagram.container.img');
goog.require('cryptagram.container.div');

goog.require('goog.dom');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.media.social}
 */
cryptagram.media.facebook = function() {
  this.ready = false;
  cryptagram.media.social.call(this);
};
goog.inherits(cryptagram.media.facebook, cryptagram.media.social);

cryptagram.media.facebook.prototype.logger = goog.debug.Logger.getLogger('cryptagram.media.facebook');

/**
 * Enum for possible Facebook states
 * @enum {string}
 */
cryptagram.media.facebook.state = {
  PHOTO:      'Photo',
  SPOTLIGHT:  'Spotlight',
  ALBUM:      'Album',
  OTHER:      'Other',
  TIMELINE:   'Timeline'
};


/** @inheritDoc */
cryptagram.media.facebook.prototype.name = function() {
  return 'Facebook';
};


/** @inheritDoc */
cryptagram.media.facebook.prototype.matchesURL = function(URL) {
  var regex=new RegExp(/^https?:\/\/www.facebook.com/);
  if (regex.test(URL)) {
    this.determineState(URL);
    return true;  
  }
  return false;
};

cryptagram.media.facebook.prototype.determineState = function(URL) {
  var albumRegex=new RegExp(/^https?:\/\/www.facebook.com\/media\/set\/\?set=a\.[0-9]*\.[0-9]*\.[0-9]*/);
  var photoRegex=new RegExp(/^https?:\/\/www.facebook.com\/photo.php/);
 
  this.state = cryptagram.media.facebook.state.OTHER;
  this.ready = true;
  
  if (albumRegex.test(URL)) {
      this.state = cryptagram.media.facebook.state.ALBUM;
      this.supportsAutodecrypt = true;
  }
    
  if (photoRegex.test(URL)) {
    this.state = cryptagram.media.facebook.state.PHOTO;
    this.ready = false;
    this.supportsAutodecrypt = true;
  }
};


/** @inheritDoc */
cryptagram.media.facebook.prototype.loadContainer = function(URL) {
  var images = this.getImages(URL);
  var image = images[0];
  if (this.state == cryptagram.media.facebook.state.ALBUM) {
    return new cryptagram.container.div(image);
  } else {
    return new cryptagram.container.img(image);
  }
};

/** @inheritDoc */
cryptagram.media.facebook.prototype.getImages = function(opt_URL) {

  if (this.state == cryptagram.media.facebook.state.OTHER) {
    return goog.base(this, 'getImages', opt_URL);
  }

  var valid = [];
  var images = [];

  if (this.state == cryptagram.media.facebook.state.SPOTLIGHT) {
    images = goog.dom.getElementsByClass('spotlight');
  } else if (this.state == cryptagram.media.facebook.state.PHOTO) {
    images = goog.dom.getElementsByClass('fbPhotoImage');
    
  // Album Mode
  } else {

    var thumbs = goog.dom.getElementsByClass('uiMediaThumbImg');

    for (var i = 0; i < thumbs.length; i++) {
      var testURL = thumbs[i].style.backgroundImage;
      
      // Skip anything already decoded
      if (testURL.indexOf('url(data:') == 0) {
        continue;
      }
      
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


cryptagram.media.facebook.prototype.parseMedia = function() {

  this.actions = null;
  this.fullURL = null;
  var URL = new goog.Uri(window.location);

  var spotlight = document.getElementsByClassName('spotlight');
  if (goog.isDef(spotlight[0]) &&
      spotlight[0].className.indexOf('hidden_elem') == -1) {

    this.state = cryptagram.media.facebook.state.SPOTLIGHT;

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
    this.state = cryptagram.media.facebook.state.PHOTO;
    return true;
  }
  return false;
};


cryptagram.media.facebook.prototype.checkIfReady = function(callback) {
  
  // Need to check every time
  this.determineState(document.URL);

  if (this.ready || this.parseMedia()) {
    this.logger.shout("FACEBOOK_MODE " + this.state);
    callback();
    return;
  }

  var self = this;
  this.tries++;
  if (this.tries < this.maxTries) {
    this.logger.info("Facebook not ready. Trying again. #" + this.tries);
    setTimeout(function() { self.checkIfReady(callback); }, self.delay);
  }  else {
    this.logger.info("Facebook failed.");
  }
};


/** @inheritDoc */
cryptagram.media.facebook.prototype.onReady = function(callback) {
  this.tries = 0;
  this.maxTries = 5;
  this.delay = 250;
  this.checkIfReady(callback);
}


/** @inheritDoc */
cryptagram.media.facebook.prototype.getPhotoName = function(URL) {
  var FBURLParts = URL.split("/");
  var FBFilename = FBURLParts[FBURLParts.length-1];
  var FBFilenameParts = FBFilename.split("_");
  return "fb_photo://" + FBFilenameParts[1];
};


/** @inheritDoc */
cryptagram.media.facebook.prototype.getAlbumName = function(URL) {
  var browserURL = document.URL;
  var albumIDParts = browserURL.match(/set=a.([0-9a.]*)/);

  if (!albumIDParts) {
    var info = document.getElementById('fbPhotoPageMediaInfo');
    if (info) {
      var URL = info.children[0].children[1].children[1].href;
      albumIDParts = URL.match(/set=a.([0-9a.]*)/);
       this.logger.info('Extracted album name from album link.');
    } else {
      return null;
    }
  }
  var albumID = albumIDParts[1];
  var albumParts = albumID.split(".");
  return "fb_album://" + albumParts[0] + "." + albumParts[1];
};


/** @inheritDoc */
cryptagram.media.facebook.prototype.fixURL = function(URL) {

  if (URL.search('_o.jpg') != -1) {
    this.logger.info('Facebook URL is already full size.')
    return URL;
  }

  if (this.state == cryptagram.media.facebook.state.SPOTLIGHT) {
    if (this.fullURL) {
      this.logger.info('Extracted full URL from Spotlight Download.');
      return this.fullURL;
    }
  }

  if (this.state == cryptagram.media.facebook.state.PHOTO) {
    if (this.fullURL) {
      this.logger.info('Extracted full URL from Photo Download.');
      return this.fullURL;
    }
  }
  
  // For profile and other images 
  var imageRegex = new RegExp(/^https:\/\/[\-A-z0-9\.]*fbcdn[\-A-z0-9\.]*\/[\-A-z0-9]*\/c[\.0-9]*\/[sp][0-9x]*\/[_0-9]*n\.jpg/);
  if (imageRegex.test(URL)) {
  
    var imageParts = URL.split('/');
    imageParts[4] = 'c0';
    imageParts[5] = 's0';
    var newURL = imageParts.join('/');
    return newURL;
  }
  
  var imageRegex2 = new RegExp(/^https:\/\/fbcdn[\-A-z0-9\.]*\/[\-A-z0-9]*\/s[0-9x]*\/[_0-9a-z]*\.jpg/);
  if (imageRegex2.test(URL)) {
    var imageParts = URL.split('/');
    imageParts[4] = 's0';
    var filenameParts = imageParts[5].split('_');
    filenameParts[filenameParts.length - 1] = 'o.jpg';
    imageParts[5] = filenameParts.join('_');
    var newURL = imageParts.join('/');
    return newURL;
  }  

  return URL;
};
