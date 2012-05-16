// ############################## CRYPTOGRAM ##############################


var cryptogram = {};


cryptogram.decryptByURL = function(URL, password) {
  
  cryptogram.log("Request to decrypt:", URL);
  _context = this.context;
  _context.init(URL);

  cryptogram.loader.getImageData( cryptogram.context.fullURL, 
    function(data) {
      cryptogram.decoder.decodeDataToContainer(data, password, _context.getContainer());
    });

};


cryptogram.revertByURL = function(URL) {
  
  cryptogram.log("Reverting URL: ", URL);
    
  cryptogram.context.removeStatusDiv();
  cryptogram.context.init();
  cryptogram.context.container.src = cryptogram.context.container.previousSrc;
};

      
      
cryptogram.init = function() {
  
  if (chrome.extension.onRequest.hasListeners()) return;
  chrome.extension.onRequest.addListener(cryptogram.handleRequest);
  
};


cryptogram.handleRequest = function(request, sender, callback) {
      
        if (request.sendDebugReport == "1") {
          //alert(cryptogram.log.report);
          cryptogram.log.sendDebugReport();   
          return;
        }  
        
        cryptogram.storage.callback = callback;
      
        if (request.checkForSaved == "1") {
          cryptogram.storage.load(request.storage);
          cryptogram.storage.autoDecrypt();
        }
      
        var password = null;
      
        if (request.decryptURL) {
  
          if (request.storage) {
            cryptogram.storage.load(request.storage);
          }
                      
          if (cryptogram.storage) {    
            password = cryptogram.storage.getPasswordForURL(request.decryptURL);
          }
          
          if (!password) {
            password = prompt("Enter password for\n" + request.decryptURL, "cryptogram");
          }
          
          if (!password) return;
                    
          cryptogram.decryptByURL(request.decryptURL, password);
        }
        
        if (request.revertURL) {
          cryptogram.revertByURL(request.revertURL);
      }
};









// ############################## CONTEXT ##############################


cryptogram.context = {
  
  init: function(imageURL) {
    URL = document.URL;
    
    if (URL.contains("facebook.com/")) {
      this._media = cryptogram.context.facebook;
    } else if (URL.contains("plus.google.com/")) {
      this._media = cryptogram.context.googleplus;
    } else {
      this._media = cryptogram.context.web;
    }
    
    if (imageURL) {
      this.setURL(imageURL);
    }
  },
  
  setURL: function(URL) {
  
    this.URL = URL;
    this.fullURL = this._media.fixURL(URL);
    this.container = this.getContainer();
    this.createStatusDiv();
  },
    
  removeStatusDiv: function() {  
      var status = document.getElementById("cryptogramStatus");
      if (!status) return;
      status.parentNode.removeChild(status); 
      cryptogram.context.status = null;
  },
  
  createStatusDiv: function() {
        
    if (cryptogram.context.status != null) {
      this.removeStatusDiv();
    }
    
    var div = document.createElement("div");
    div.id = "cryptogramStatus";
    div.style.position = "absolute";
    div.style.top = "0px";
    div.style.left = "50%";
    div.style.margin = "5px";
    div.style.marginLeft = "-25px";
    div.style.padding = "5px";
    div.style.color = "black";
    div.style.background = "white";
    div.style.opacity = "0.8";
    div.style.font = "10px arial";
    div.style.width = "50px";
    div.style.textAlign = "center";
    div.style.borderRadius = "3px";
    div.innerHTML = "Download<br>...";
    div.style.display = "none";
    cryptogram.context.status = div;
    this.container.parentNode.appendChild(div);
  },
  
  setStatus: function(message) {
    
    cryptogram.context.status = document.getElementById("cryptogramStatus");
    
    if (!cryptogram.context.status) return;
    
    if (!message) {
      cryptogram.context.status.style.display = "none";
    } else {
      cryptogram.context.status.style.display = "block";
      cryptogram.context.status.innerHTML = message;    
    }
  },
  
  fixURL: function(URL) {
    return _media.fixURL(URL);
  },
  
  getContainer: function() {
    var elements = document.getElementsByTagName('img');  
    for (i = 0; i < elements.length; i++) {
      if (elements[i].src == this.URL) {
        return elements[i];
      }
    }
    return null;
  },

  getPhotoName: function(URL) {
    this.init();
    return this._media.getPhotoName(URL);
  },

  getAlbumName: function(URL) {
    this.init();
    return this._media.getAlbumName(URL);
  },
  
  getImages: function() {
    this.init();
    return this._media.getImages();
  },
  
  setSrc: function(src) {
  
    this.container.previousSrc = this.container.src;

    if (this._media.needsRescale) {
  
      if (this.container.height > this.container.width) {
        this.container.style.height = "720px";
      } else {
        this.container.style.width = "720px";
      }
    }
  
    this.container.src = src;
  
  },
  
  facebook: {},
  googleplus: {},
  web: {}
};


cryptogram.context.facebook = {

  fixURL: function(URL) {
      
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
  },

  getPhotoName: function(URL) {
      var FBURLParts = URL.split("/");
      var FBFilename = FBURLParts[FBURLParts.length-1];
      var FBFilenameParts = FBFilename.split("_");
      return "fb_photo://" + FBFilenameParts[1];
  },

  getAlbumName: function(URL) {
    var browserURL = document.URL;
    var albumIDParts = browserURL.match(/set=a.([0-9a.]*)/);
  
    if (!albumIDParts) return null;
    var albumID = albumIDParts[1];
    
    var albumParts = albumID.split(".");
    return "fb_album://" + albumParts[0] + "." + albumParts[1];
  },

  getImages: function() {
    var images = document.getElementsByTagName('img');
    var valid = [];
    
    for (i = 0; i < images.length; i++) {
      var URL = images[i].src;
      if (URL.contains("_o.jpg") || URL.contains("_n.jpg")) {
        valid.push(images[i]);  
      }
    }
    return valid;
  }
};


cryptogram.context.googleplus = {
  fixURL: function(URL) {
    // URL is like: https://a1.googleusercontent.com/-a/B/C/E/<size>/0.jpg
    // By swapping the <size> parameter with 's0' we get the full size image
    GURLParts = URL.split("/");
    GURLParts[7] = "s0";
    var fullURL = GURLParts.join("/");
    cryptogram.log("Modified Google+ URL with s0:", fullURL);
    return fullURL;
  },
  
  getPhotoName: function(URL) {
      var URLParts = URL.split("/");
      return "g+_photo://" + URLParts[4];
  },
  
  getAlbumName: function(URL) {
    var browserURL = document.URL;
    var albumIDs = browserURL.match(/\/albums\/([0-9]*)/);
    if (albumIDs) return "g+_album://" + albumIDs[1];
    return null;
  },
  
  getImages: function() {
    var images = document.getElementsByTagName('img');
    var valid = [];
    
    for (i = 0; i < images.length; i++) {
      if (images[i].parentNode) {
        var parentClass = images[i].parentNode.className;
        if (parentClass.contains("photo-container")) {
          valid.push(images[i]);  
        }
      }
    }
    return valid;
  }
};


cryptogram.context.web = {

  fixURL: function(URL) {
    return URL;
  },
  
  getPhotoName: function(URL) {
      return URL;
  },

  getAlbumName: function(URL) {
    return null;
  },
  
  getImages: function() {
    var images = document.getElementsByTagName('img');
    return images;
  }
};






// ############################## STORAGE ##############################

cryptogram.storage = {};
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









// ############################## DECODER ##############################

cryptogram.decoder = {};
cryptogram.decoder.URIHeader = "data:image/jpeg;base64,";
cryptogram.decoder.decodeDataToContainer = function(data, password, container) {

  this.base64Values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var _decoder = this;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  blockSize = 2;
      
  img.onload = function(){

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0);
    
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;               

    _decoder.img = img;
    _decoder.imageData = imageData;
    _decoder.blockSize = blockSize;
    _decoder.headerSize = blockSize * 4;
    _decoder.password = password;
    _decoder.container = container;
    _decoder.chunkSize = img.height / 40.0;
    _decoder.y = 0;
    _decoder.newBase64 = "";
    
    var protocol = _decoder.getHeader();
    cryptogram.log("Found '"+ protocol + "' protocol");
    
    if (protocol != "aesthete") {
      cryptogram.log("Error: Unknown Protocol");
      cryptogram.context.setStatus();
    } else {
      _decoder.processImage();    
    }
    
    
  };
  
  img.src = data;
}



cryptogram.decoder.getHeader = function() {

    var img = this.img;
    var imageData = this.imageData;
    var blockSize = this.blockSize;
    var newBase64 = "";
    
    for (y = 0; y < 8; y+= this.blockSize) {
      for (x = 0; x < 8; x+= 2*this.blockSize) {
        
        base8_0 = cryptogram.decoder.getBase8Value(imageData, img.width, x, y, blockSize, blockSize);
        base8_1 = cryptogram.decoder.getBase8Value(imageData, img.width, x + blockSize, y, blockSize, blockSize);
  
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);                    
        newBase64 += base64;

      
      }
    }
    
    return newBase64;       
}

cryptogram.decoder.processImage = function() {

  var img = this.img;
  var imageData = this.imageData;
  var blockSize = this.blockSize;
  var count = 0;
  var y = this.y;
  var done = false;
  
  while (this.chunkSize == 0 || count < this.chunkSize) {
      
    for (x = 0; x < img.width; x+= (blockSize * 2)) {
        
        // Skip over header super-block
        if (y < this.headerSize && x < this.headerSize) {
          console.log("Skipping header block");
          continue;
        }
        
        base8_0 = cryptogram.decoder.getBase8Value(imageData, img.width, x, y, blockSize, blockSize);
        base8_1 = cryptogram.decoder.getBase8Value(imageData, img.width, x + blockSize, y, blockSize, blockSize);
          
        // Found black, stop
        if (base8_0 == -1 || base8_1 == -1) break;  
        
        base64Num = base8_0 * 8 + base8_1 ;
        base64 = this.base64Values.charAt(base64Num);                    
        this.newBase64 += base64;
      } 
    count++;  
    y+= blockSize;
    
    if (y >= img.height) {
      done = true;
      break;
    }
  }
  
  this.y = y;
  _decoder = this;

  if (!done) {
      // Artificially inflate the percent so it gets to 100
      var percent = Math.ceil(100.0 * ((y + (4*blockSize)) / img.height));
      if (percent > 100) percent = 100;
      cryptogram.context.setStatus("Decode<br>" + percent + "%");
      setTimeout(function () { _decoder.processImage() }, 1);
  } else {
      cryptogram.context.setStatus();
      cryptogram.log("Decoded " + this.newBase64.length + " Base64 characters:", this.newBase64);
      _decoder.decryptImage();
  }
  
  
}



cryptogram.decoder.decryptImage = function () {

  var newBase64 = this.newBase64;
  
  var check = newBase64.substring(0,64);
  var iv = newBase64.substring(64,86);
  var salt = newBase64.substring(86,97);
  var ct = newBase64.substring(97,newBase64.length);
  var full = newBase64.substring(64,newBase64.length);
    
  var bits = sjcl.hash.sha256.hash(full);
  var hexHash = sjcl.codec.hex.fromBits(bits);
    
  if (hexHash != check) {
    cryptogram.log("Checksum failed. Image is corrupted.");
    return;
  } else {
    cryptogram.log("Checksum passed.");
  }
    
  var obj = new Object();
  obj.iv = iv;
  obj.salt = salt;
  obj.ct = ct;
  var base64Decode = JSON.stringify(obj);
  var decrypted;
  
  try {
    decrypted = sjcl.decrypt(this.password, base64Decode);
  } 
  
  catch(err) {
    cryptogram.log("Error decrypting:" ,err.toString());
    return;
  }
  
  cryptogram.log("Decrypted " + decrypted.length + " Base64 characters:", decrypted);
  cryptogram.storage.savePassword(this.container.src, this.password);
  cryptogram.context.setSrc(cryptogram.decoder.URIHeader + decrypted);
}

    
// Takes the average over some block of pixels
//
//  -1 is black
//  0-7 are decoded base8 values. 0 is white, 7 dark gray, etc

cryptogram.decoder.getBase8Value = function(block, width, x, y, blockW, blockH) {

  var count = 0.0;
  var vt = 0.0;
  var avg;
  
  for (i = 0; i < blockW; i++) {
    for (j = 0; j < blockH; j++) {
      
      base = (y + j) * width + (x + i);
      //Use green to estimate the value
      vt += block[4*base + 1];
      count++;
    }
  }
  v = vt / count;
  
  var bin = Math.floor((v + 3.0) / 28.0)
  if (bin == 0) return -1;
  if (bin > 8) return 0;
  return (8 - bin);   
}
            






// ############################## LOADER ##############################


cryptogram.loader = {};


cryptogram.loader.updateProgress = function(e) {

  if (e.lengthComputable) {  
    var percentComplete = Math.ceil(100.0 * (e.loaded / e.total));
    cryptogram.context.setStatus("Download<br>" + percentComplete + "%");
  }

}

cryptogram.loader.createRequest = function() {
  var oHTTP = null;
  if (window.XMLHttpRequest) {
    oHTTP = new XMLHttpRequest();
    oHTTP.responseType = "arraybuffer";  
    oHTTP.addEventListener("progress", cryptogram.loader.updateProgress, false);  
  } else if (window.ActiveXObject) {
    oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
    }
  return oHTTP;
}


// Binary parsing code borrowed from 
// http://jsperf.com/encoding-xhr-image-data
cryptogram.loader.arrayBufferDataUri = function(raw) {
   var base64 = ''
   var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  
   var bytes = new Uint8Array(raw)
   var byteLength = bytes.byteLength
   var byteRemainder = byteLength % 3
   var mainLength = byteLength - byteRemainder
  
   var a, b, c, d
   var chunk
  
   // Main loop deals with bytes in chunks of 3
   for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
  
    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63 // 63       = 2^6 - 1
    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
   }
  
   // Deal with the remaining bytes and padding
   if (byteRemainder == 1) {
    chunk = bytes[mainLength]
  
    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4 // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + '=='
   } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
  
    a = (chunk & 16128) >> 8 // 16128 = (2^6 - 1) << 8
    b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2 // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + '='
   }
  
   return "data:image/jpeg;base64," + base64
}


cryptogram.loader.getImageData = function(src, callback) {

  cryptogram.context.setStatus("Download<br>...");

  var oHTTP = cryptogram.loader.createRequest();
  oHTTP.onreadystatechange = function() {
  
    if (oHTTP.readyState == 4) {
      if (oHTTP.status == "200" || oHTTP.status == "206") {
        var arrayBuffer = oHTTP.response;  
        var b64 = cryptogram.loader.arrayBufferDataUri(arrayBuffer);
        cryptogram.log("Downloaded image as Base64:", b64);
        callback(b64);
      } else {
        console.error("Download failed");
      }
      
      oHTTP = null;
    }
  };
           
  oHTTP.open("GET", src, true);
  if (oHTTP.overrideMimeType) oHTTP.overrideMimeType('text/plain; charset=x-user-defined');
  oHTTP.send(null);
};









// ############################## MISC ##############################


cryptogram.log = function(str1, str2) {
  
  cryptogram.log.report += str1 + "%0D%0A";
  console.log(str1);
  
  if (str2) {
    if (str2.length > 128) {      
      str2 = str2.substring(0,128) + "…";
    }
    str2 = "   " + str2;
    console.log(str2);
    cryptogram.log.report += str2 + "%0D%0A";
  }  
};

cryptogram.log.sendDebugReport = function() {
  
  var addresses = "ispiro@gmail.com,mrtierney@gmail.com";
  var subject = "Cryptogram Debug Report";
  var href = "mailto:" + addresses + "?subject=" + subject + "&body=" + cryptogram.log.report;
  window.open(href, "_blank");
}

cryptogram.log.report = "";


// Add a contains function to simplify URL searching
String.prototype.contains = function(str1) {
  return (this.search(str1) != -1);
};


/**
 * A utility class for creating object-oriented hierarchy.
 * 
 * Courtesy Thomas Huston
 */
var OOP = {

  /**
   * Implements the specified interface for the specified class type.
   *
   * @param classType The class type to add the interface to.
   * @param interfaceType The interface to implement.
   */
  implement: function(classType, interfaceType) {
    var property;
    if (typeof classType === 'function') {
      for (property in interfaceType.prototype) {
        if (interfaceType.prototype.hasOwnProperty(property)) {
          classType.prototype[property] = interfaceType.prototype[property];
        }
      }
    } else {
      for (property in interfaceType.prototype) {
        if (interfaceType.prototype.hasOwnProperty(property)) {
          classType[property] = interfaceType.prototype[property];
        }
      }
    }
  },

  /**
   * Inherits the prototype methods of superType in subType.
   *
   * @param subType The subclass.
   * @param superType The superclass.
   */
  inherit: function(subType, superType) {
    function F(){}
    F.prototype = superType.prototype;
    var prototype = new F();
    prototype.constructor = subType;
    subType.prototype = prototype;
  }
};






// ############################## INITIALIZATION ##############################


cryptogram.init();
