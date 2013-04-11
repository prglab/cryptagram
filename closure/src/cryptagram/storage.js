goog.provide('cryptagram.storage');

goog.require('goog.debug.Logger');


/**
 * @constructor
 */
cryptagram.storage = function(media) {
  this.callback = null;
  this.lookup = null;
  this.media = media;
};

cryptagram.storage.prototype.logger = goog.debug.Logger.getLogger('cryptagram.storage');

cryptagram.storage.prototype.load = function(localStorage) {
  this.lookup = localStorage;
}


cryptagram.storage.prototype.getPasswordForURL = function(URL) {    
    var photoId = this.media.getPhotoName(URL);
    var albumId = this.media.getAlbumName(URL);
    
    this.logger.info('Looking up password for photo: ' + photoId + " (" + albumId +")");        

    var password = null;
    var albumPassword = null;
    
    if (photoId) password = this.lookup[photoId];
    if (albumId) albumPassword = this.lookup[albumId];

    if (password) {
        this.logger.info('Found photo password.');        
        return password;
		}
		
		if (albumPassword) {
        this.logger.info('Found album password.');
        return albumPassword;
		}
		return null;
};


cryptagram.storage.prototype.autoDecrypt = function() {
        
  var images = this.media.getImages();
  
  if (images) {
    this.logger.info('Checking '+ images.length +' images against saved passwords.');
  }
  
  for (i = 0; i < images.length; i++) {
    
    var testURL = images[i].src;
    var password = this.getPasswordForURL(testURL);

    if (password) {
      cryptagram.decryptByURL(testURL, password);
      return;
		}		
  }
};

cryptagram.storage.prototype.demoAlbums = { "fb_album://10100510996964783.2462710":"cat",
                                            "fb_album://10100511600280733.2462712":"cryptagram",
                                            "fb_album://10100516285860793.2462807":"cryptagram",
                                            "g+_album://5842300427612841233":"cat",
                                            "g+_album://5842299216653911073":"cryptagram",
                                            "g+_album://5856782804715437921":"cryptagram"};

cryptagram.storage.prototype.demoPhotos = { "http://cryptagr.am/encoded_1.jpg":"cryptagram",
                                            "http://cryptagr.am/encoded_2.jpg":"cryptagram"};


cryptagram.storage.prototype.getDemoPasswordForURL = function(URL) {    

    var photoId = this.media.getPhotoName(URL);
    var albumId = this.media.getAlbumName(URL);
        
    if (albumId) {
      var albumPassword = this.demoAlbums[albumId];
     	if (albumPassword) {
        this.logger.info('Found demo album password.');
        return albumPassword;
		  }
		}
		
		if (photoId) {
      var photoPassword = this.demoPhotos[photoId];
     	if (photoPassword) {
        this.logger.info('Found demo photo password.');
        return photoPassword;
		  }
		}
		
		return null;
};

