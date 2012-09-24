goog.provide('cryptogram.storage');


/**
 * @constructor
 */
cryptogram.storage = function() {};

cryptogram.storage.callback = null;
cryptogram.storage.lookup = {};

cryptogram.storage.load = function(localStorage) {
  cryptogram.storage.lookup = localStorage;
}

cryptogram.storage.getPasswordForURL = function(URL) {
        
    var photoId = cryptogram.context.getPhotoName(URL);
    var albumId = cryptogram.context.getAlbumName(URL);
    
    var password = null;
    var albumPassword = null;
    
    if (photoId) password = cryptogram.storage.lookup[photoId];
    if (albumId) albumPassword = cryptogram.storage.lookup[albumId];

    if (password) {
        cryptogram.log("Found saved photo password for photo:", URL);        
        return password;
		}
		
		if (albumPassword) {
        cryptogram.log("Found saved album password for photo:", URL);
        cryptogram.log("Album id:", albumId);
        return albumPassword;
		}
		
		return null;
};

cryptogram.storage.savePassword = function(id, password) {
  if (cryptogram.storage.callback && 
    cryptogram.storage.lookup['save_passwords'] == "true") {
        
    var photoId = cryptogram.context.getPhotoName(id);
    var albumId = cryptogram.context.getAlbumName(id);
    
    if (albumId && cryptogram.storage.lookup[albumId]) return;
    
    cryptogram.log("Saving password for photo: ", photoId);

    if (albumId && cryptogram.storage.lookup['album_passwords'] == "true" &&
        !cryptogram.storage.lookup[albumId]) { 
      var saveAlbum = confirm("Save password for current album?");
      if (!saveAlbum) {
        albumId = null;
      } else {
        cryptogram.log("Saving password for album: ", albumId);
      }
    } else {
      albumId = null;
    }
    
    cryptogram.storage.callback({outcome: "success", "id" : photoId, "password" : password, "album" : albumId});
  }
};

cryptogram.storage.autoDecrypt = function() {
        
  var images = cryptogram.context.getImages();
  
  if (images) {
    cryptogram.log("Checking "+ images.length +" images against saved passwords.");
  }
  
  for (i = 0; i < images.length; i++) {
    
    var testURL = images[i].src;
    
    var password = cryptogram.storage.getPasswordForURL(testURL);
      
    if (password) {
        cryptogram.decryptByURL(testURL, password);
        return;
		}		
  }
};



