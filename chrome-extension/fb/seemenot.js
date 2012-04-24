var URIHeader = "data:image/jpeg;base64,";
var colors = ['#FFFFFF',  '#FF0000', '#00FF00', '#0000FF'];	

var hexValues = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];	
var lookup;
var base64Values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

var blockSize = 2;

 
 function createRequest() {
    var oHTTP = null;
    if (window.XMLHttpRequest) {
      oHTTP = new XMLHttpRequest();
      oHTTP.responseType = "arraybuffer";  

    } else if (window.ActiveXObject) {
      oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
    }
    return oHTTP;
  }
  
  
function arrayBufferDataUri(raw) {
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
  
  
function getImageBinary(src, container) {

    var oHTTP = createRequest();
	oHTTP.onreadystatechange = function() {
            if (oHTTP.readyState == 4) {
              if (oHTTP.status == "200" || oHTTP.status == "206") {
                
					var arrayBuffer = oHTTP.response;   
                    var b64 = arrayBufferDataUri(arrayBuffer);
    				var img = document.createElement("img");
    				img.style.display = "none";
    				img.src = b64;
    				container.parentNode.appendChild(img);
    				extractRGB(src, container, img);
  
              } else {
                
              }
              oHTTP = null;
            }
          };
      
      // Need to swap for the full size image URL on Facebook
      /*if (src.search("fbcdn.net") && src.search("_o.jpg")==-1) {
       	var originalImage = src.substring(0,src.length - 5) + "o.jpg";
      	src = originalImage;
      }*/      
      
	oHTTP.open("GET", src, true);
	if (oHTTP.overrideMimeType) oHTTP.overrideMimeType('text/plain; charset=x-user-defined');
	oHTTP.send(null);
	
}





// The background context doesn't seem to have access to the IMG dom element,
// just the src of the image. We loop over all images in the current DOM and
// if the target src matches, we apply the RGB extraction.

var lastReplace = "";


function replaceImageBySrc(src) {
	
	init();
	var elements = document.getElementsByTagName('img');
	
	for (i = 0; i < elements.length; i++) {
		if (elements[i].src == src) {
			if (lastReplace == src) continue;
			getImageBinary(src, elements[i]);
			lastReplace = src;			
		}
	}
}


// Listener to handle the decodeURL message

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
  
	if (request.decodeURL) {
	    replaceImageBySrc(request.decodeURL);
	}
    });
    
    
function init() {

    if (lookup != null) return;

    // Create reverse associative array
    lookup = new Array();
    for (i = 0; i < hexValues.length; i++) {
	lookup[hexValues[i]] = i;
    }	
}


// March over the RGB image extracting each pair of blocks.
// Estimate the block colors and convert these into a hex value

function extractRGB(src, container, newImg) {
		
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = new Image();
	
  	img.onload = function(){
				
	    canvas.width = img.width;
	    canvas.height = img.height;
	    ctx.drawImage(img,0,0);
		var count = 0;
		var newBase64 = "";
		var block0;
		var block1;

		var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;   	  	    	
    	   
		for (y = 0; y < img.height; y+= blockSize) {
			for (x = 0; x < img.width; x+= (blockSize * 2)) {
				
				base8_0 = getBase8Value(imageData, img.width, x, y, blockSize, blockSize);
				base8_1 = getBase8Value(imageData, img.width, x + blockSize, y, blockSize, blockSize);
    			
				// Found black, stop
				if (base8_0 == -1 || base8_1 == -1) break;	
		    
				base64Num = base8_0 * 8 + base8_1 ;
				base64 = base64Values.charAt(base64Num);    			    			
				newBase64 += base64;
				count++;
			}
   	    }
    	
    	    	
	    // Unpack 3 JSON components with fixed length and positions in the string
	    
	    var pad = 0;
	    
	    var iv = newBase64.substring(0+pad,22+pad);
	    var salt = newBase64.substring(22+pad,33+pad);
	    var ct = newBase64.substring(33+pad,newBase64.length); 
	    var obj = new Object();
	    obj.iv = iv;
	    obj.salt = salt;
	    obj.ct = ct;
	    var base64Decode = JSON.stringify(obj);
	    var password = prompt("Enter password for\n"+src,"helloworld");     
	    var decrypted = sjcl.decrypt(password, base64Decode);
		
	    var url = self.location.href;
	    var suffix = url.substring(url.length - 3, url.length);
		
	    if (suffix == "jpg") {
			self.location.href = URIHeader + decrypted;
	    } else {
			container.src = URIHeader + decrypted;
		}
	};

    img.src = newImg.src;
}



// Takes the average over some block of pixels
//
//  -1 is black
// 	0-7 are decoded base8 values. 0 is white, 7 dark gray, etc

function getBase8Value(block, width, x, y, blockW, blockH) {

    var count = 0.0;
    var rt = 0.0;
    var gt = 0.0;
    var bt = 0.0;
	
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
	
	return (8 - bin);  	
}





// Takes the average over some block of pixels then guesses if 
// it's white, red, green, blue, or black with a dumb heuristic
//
//  0 = White, 1 = Red, 2 = Green, 3 = Blue, 4 = Black, -1 = Error
//
// Now we take a single block of memory and do pointer arithmetic to find the correct
// data, since the getImageData function is slow.

function getWRGBK(block, w, x, y, blockW, blockH) {
	
    var upperThresh = 150;
    var lowerThresh = 50;
    var count = 0.0;
    var rt = 0.0;
    var gt = 0.0;
    var bt = 0.0;
	
    for (i = 0; i < blockW; i++) {
	for (j = 0; j < blockH; j++) {
			
	    base = (y + j) * w + (x + i);
	    rt += block[4*base];
	    gt += block[4*base+1];
	    bt += block[4*base+2];
	    count++;
	}
    }
	
    r = rt / count;
    g = gt / count;
    b = bt / count;
	
    if (r > upperThresh && b > upperThresh && g > upperThresh) return 0;
    if ( r < lowerThresh && g < lowerThresh && b < lowerThresh) return 4;
	
    if ( r > g && r > b) return 1;
    if ( g > r && g > b) return 2;
    if ( b > r && b > g) return 3;
	
    return -1;
}



// Utility functions based on SJCL

function base64ToHex(base64) {
    var bits = sjcl.codec.base64.toBits(base64);
    return sjcl.codec.hex.fromBits(bits);
}

function hexToBase64(hex) {
    var bits = sjcl.codec.hex.toBits(hex);
    return sjcl.codec.base64.fromBits(bits);
}

