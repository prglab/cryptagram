goog.provide('cryptogram.storage');


/**
 * @constructor
 */
cryptogram.storage = function(media) {
  this.callback = null;
  this.lookup = null;
  this.media = media;
};

cryptogram.storage.prototype.load = function(localStorage) {
  this.lookup = localStorage;
}

/*
cryptogram.storage.prototype.getPasswordForImage = function(photoId, albumId) {
    var password = null;
    var albumPassword = null;
    
    if (photoId) password = this.lookup[photoId];
    if (albumId) albumPassword = this.lookup[albumId];

    if (password) {
        cryptogram.log('Found saved photo password for photo:', photoId);        
        return password;
		}
		
		if (albumPassword) {
        cryptogram.log('Found saved album password for photo:', photoId);
        cryptogram.log('Album id:', albumId);
        return albumPassword;
		}
		
		return null;
};
*/

cryptogram.storage.prototype.getPasswordForURL = function(URL) {    
    var photoId = this.media.getPhotoName(URL);
    var albumId = this.media.getAlbumName(URL);
        
    var password = null;
    var albumPassword = null;
    
    if (photoId) password = this.lookup[photoId];
    if (albumId) albumPassword = this.lookup[albumId];

    if (password) {
        cryptogram.log('Found saved photo password for photo:', photoId);        
        return password;
		}
		
		if (albumPassword) {
        cryptogram.log('Found saved album password for photo:', URL);
        cryptogram.log('Album id:', albumId);
        return albumPassword;
		}
		
		return null;
};

cryptogram.storage.prototype.savePassword = function(id, password) {
  if (this.lookup['save_passwords'] == 'true') {
        
    var photoId = this.media.getPhotoName(id);
    var albumId = this.media.getAlbumName(id);
    
    if (albumId && this.lookup[albumId]) return;
    
    cryptogram.log('Saving password for photo: ', photoId);

    if (albumId && this.lookup['album_passwords'] == 'true' &&
        !this.lookup[albumId]) { 
      var saveAlbum = confirm('Save password for current album?');
      if (!saveAlbum) {
        albumId = null;
      } else {
        cryptogram.log('Saving password for album: ', albumId);
      }
    } else {
      albumId = null;
    } 
  }
};

cryptogram.storage.prototype.autoDecrypt = function() {
        
  var images = this.media.getImages();
  
  if (images) {
    cryptogram.log('Checking '+ images.length +' images against saved passwords.');
  }
  
  for (i = 0; i < images.length; i++) {
    
    var testURL = images[i].src;
    
    var password = this.getPasswordForURL(testURL);
      
    if (password) {
        cryptogram.decryptByURL(testURL, password);
        return;
		}		
  }
};



