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
  var regex=new RegExp(/^https:\/\/www.facebook.com/);
  return regex.test(this.URL);
}


/** @inheritDoc */
cryptogram.media.facebook.prototype.name = function() {
  return "Facebook";
};


/** @inheritDoc */
cryptogram.media.facebook.prototype.fixURL = function(URL) {

      
    if (URL.search("_o.jpg") != -1) {
      cryptogram.log("Facebook URL appears to be full size.")
      return URL;
    }
      
    var FBURLParts = URL.split("/");
    var FBFilename = FBURLParts[FBURLParts.length-1];
    var FBFilenameParts = FBFilename.split("_");
    var FBFileID = FBFilenameParts[1];
    var FBAName = "pic_" + FBFileID;
    var projectorA = document.getElementById(FBAName);
      
    // In projector mode
    if (projectorA) {
        
      var ajax = projectorA.getAttribute("ajaxify");
        
      // Ajaxify parameter contains the full src, but escaped
      if (ajax) {
        var ajaxParts = ajax.split("&");
        var escapedSrc = ajaxParts[3];
        var escapedURL = escapedSrc.substring(4,escapedSrc.length);
        var fullURL = unescape(escapedURL);
        cryptogram.log("Extracted Facebook URL from Ajax:", fullURL);
        return fullURL;
      }
          
    // Regular image page 
    } else {
    
          
      var elements = document.getElementsByClassName('fbPhotosPhotoActionsItem');
  
      if (elements.length > 0) {
        this.needsRescale = true;
      }
      
      
      for (i = 0; i < elements.length; i++) {
        var fullURL = elements[i].href;
        
        // If we got to the photos from a wall/feed, the structure is different
        // Now we need to extract the href from the first child of the fbPhotosPhotoActionsItem
        if (!fullURL) {
          var childAnchor = elements[i].childNodes[0];
          if (childAnchor) fullURL = childAnchor.href;
        }
        
        if (fullURL) {
          if (fullURL.contains("_o.jpg") || fullURL.contains("_n.jpg")) {
            cryptogram.log("Extracted full Facebook URL from Download Link:", fullURL);
            return fullURL;
          }
        } 
          
      }
    }
    return URL;
};