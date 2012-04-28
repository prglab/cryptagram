// ############################## CRYPTOGRAM ##############################

var cryptogram = {};

cryptogram.init = function() {
  if (chrome.extension.onRequest.hasListeners()) return;

  chrome.extension.onRequest.addListener(
      function(request, sender, sendResponse) {
        if (request.decodeURL && request.password) {
          cryptogram.decryptByURL(request.decodeURL, request.password);
        }
      });
};

cryptogram.decryptByURL = function(URL, password) {
  
  console.log("Request to decrypt:\n " + URL);
  
  cryptogram.context.initWithURL(URL);
  cryptogram.loader.getImageData( cryptogram.context.fullURL, 
    function(data) {
      cryptogram.decoder.decodeDataToContainer(data, password, cryptogram.context.container);
    });

};






// ############################## CONTEXT ##############################

cryptogram.context = {
  
  initWithURL: function(URL) {
    _URL = URL;
    
    if (URL.contains("fbcdn.net/")) {
      this._media = cryptogram.context.facebook;
    } else if (URL.contains("googleusercontent.com/")) {
      this._media = cryptogram.context.gplus;
    } else {
      this._media = cryptogram.context.web;
    }
    
    this.fullURL = this._media.fixURL(_URL);
    this.container = cryptogram.context.getContainer();
    cryptogram.context.createStatusDiv();
  },
  
  createStatusDiv: function() {
  
  	if (this.status != null) return;
  	var div = document.createElement("div");
  	div.id = "cryptogramStatus";
  	div.style.position = "absolute";
  	div.style.top = "0px";
  	div.style.left = "50%";
  	div.style.margin = "5px";
  	div.style.marginLeft = "-40px";
  	div.style.padding = "5px";
  	div.style.color = "black";
  	div.style.background = "white";
  	div.style.opacity = "0.8";
  	div.innerHTML = "Downloading...";
  	this.status = div;
  	this.container.parentNode.appendChild(div);
  },
  
  
  
  getContainer: function() {
    var elements = document.getElementsByTagName('img');  
    for (i = 0; i < elements.length; i++) {
      if (elements[i].src == _URL) {
        return elements[i];
      }
    }
    return null;
  }
};

cryptogram.context.facebook = {
  fixURL: function(URL) {
      
    if (URL.search("_o.jpg") != -1) {
      console.log("Facebook URL appears to be full size.")
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
    		console.log("Extracted Facebook URL from Ajax:\n " + fullURL);
    		return fullURL;
    	}
    			
  	// Regular image page	
  	} else {
    			
    	var elements = document.getElementsByClassName('fbPhotosPhotoActionsItem');
    			
    	for (i = 0; i < elements.length; i++) {
    		var fullURL = elements[i].href;
    		if (fullURL.contains("_o.jpg") || fullURL.contains("_n.jpg")) {
    		  console.log("Extracted full Facebook URL from Download Link:\n " + fullURL);
    		  return fullURL;
    		}
    	}
    }
    return URL;
  }
};

cryptogram.context.gplus = {
  fixURL: function(URL) {
    // URL is like: https://a1.googleusercontent.com/-a/B/C/E/<size>/0.jpg
    // By swapping the <size> parameter with 's0' we get the full size image
    GURLParts = URL.split("/");
    GURLParts[7] = "s0";
    var fullURL = GURLParts.join("/");
    console.log("Modified Google+ URL with s0:\n " + fullURL);
    return fullURL;
  }
};

cryptogram.context.web = {
  fixURL: function(URL) {
    return URL;
  }
};






// ############################## DECODER ##############################

cryptogram.decoder = {};
cryptogram.decoder.URIHeader = "data:image/jpeg;base64,";
cryptogram.decoder.decodeDataToContainer = function(data, password, container) {


  var base64Values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  blockSize = 2;
  
  var _decoder = this;
  _decoder.base64Values = base64Values;
  
  img.onload = function(){

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0);
    var count = 0;
    var newBase64 = "";
    var block0;
    var block1;
		
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;               

		_decoder.img = img;
		_decoder.imageData = imageData;
		_decoder.blockSize = blockSize;
		_decoder.password = password;
		_decoder.container = container;
		_decoder.chunkSize = img.height / 12;
		_decoder.y = 0;
		_decoder.newBase64 = "";
		
  	cryptogram.decoder.processImage();
  };
  
  img.src = data;
}


cryptogram.decoder.processImage = function() {

	var img = this.img;
	var imageData = this.imageData;
	var blockSize = this.blockSize;
	var newBase64 = "";
	var count = 0;
	var y = this.y;
	var done = false;
	//console.log(img.height + "/" + this.chunkSize);
	
	
	while (this.chunkSize == 0 || count < this.chunkSize) {
	
		for (x = 0; x < img.width; x+= (blockSize * 2)) {
        
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
	
	if (!done) {
			var percent = Math.floor(100.0 * (y / img.height));
			cryptogram.context.status.style.display = "";
			cryptogram.context.status.innerHTML = "Decrypting " + percent + "%";
			setTimeout(function () { cryptogram.decoder.processImage() }, 100);
	} else {
			cryptogram.context.status.style.display = "none";
			cryptogram.context.status.innerHTML = "Downloading...";
			console.log("Decoded " + newBase64.length + " Base64 characters:\n \"" + newBase64.substring(0,100) + "…\"");
			cryptogram.decoder.decryptImage(this.newBase64);
	}
	
	
}



cryptogram.decoder.decryptImage = function (newBase64) {

  var check = newBase64.substring(0,64);
  var iv = newBase64.substring(64,64+22);
  var salt = newBase64.substring(64+22,64+33);
  var ct = newBase64.substring(64+33,newBase64.length);
  var full = newBase64.substring(64,newBase64.length);
    
	var bits = sjcl.hash.sha256.hash(full);
	var hexHash = sjcl.codec.hex.fromBits(bits);
	
	if (hexHash != check) {
		console.log("Checksum failed. Image is corrupted.");
	}	else {
		console.log("Checksum passed.");
	}
		
  var obj = new Object();
  obj.iv = iv;
  obj.salt = salt;
  obj.ct = ct;
  var base64Decode = JSON.stringify(obj);
  var decrypted = sjcl.decrypt(this.password, base64Decode);
    
  console.log("Decrypted " + decrypted.length + " Base64 characters:\n \"" + decrypted.substring(0,100) + "…\"");
  this.container.src = cryptogram.decoder.URIHeader + decrypted;
}

 		
// Takes the average over some block of pixels
//
//  -1 is black
// 	0-7 are decoded base8 values. 0 is white, 7 dark gray, etc

cryptogram.decoder.getBase8Value = function(block, width, x, y, blockW, blockH) {

  var count = 0.0;
  var vt = 0.0;
  
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

cryptogram.loader.createRequest = function() {
  var oHTTP = null;
  if (window.XMLHttpRequest) {
    oHTTP = new XMLHttpRequest();
    oHTTP.responseType = "arraybuffer";  
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

  var oHTTP = cryptogram.loader.createRequest();
  oHTTP.onreadystatechange = function() {
    if (oHTTP.readyState == 4) {
      if (oHTTP.status == "200" || oHTTP.status == "206") {
        var arrayBuffer = oHTTP.response;  
        var b64 = cryptogram.loader.arrayBufferDataUri(arrayBuffer);
        console.log("Downloaded image as Base64:\n \"" + b64.substring(0,100) + "…\"");
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

// Add a contains function to cleanup URL searching
String.prototype.contains = function(str1) {
  return (this.search(str1) != -1);
};




cryptogram.init();