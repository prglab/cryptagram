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


cryptagram.storage.prototype.savePassword = function(id, password) {
  if (this.lookup['save_passwords'] == 'true') {
        
    var photoId = this.media.getPhotoName(id);
    var albumId = this.media.getAlbumName(id);
    
    if (albumId && this.lookup[albumId]) return;
    
    this.logger.info('Saving password for photo: ' + photoId);

    if (albumId && this.lookup['album_passwords'] == 'true' &&
        !this.lookup[albumId]) { 
      var saveAlbum = confirm('Save password for current album?');
      if (!saveAlbum) {
        albumId = null;
      } else {
        this.logger.info('Saving password for album: ' + albumId);
      }
    } else {
      albumId = null;
    } 
  }
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



