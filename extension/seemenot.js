var URIHeader = "data:image/jpeg;base64,";
var colors = ['#FFFFFF',  '#FF0000', '#00FF00', '#0000FF'];	
var hexValues = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];	
var lookup;
var blockSize = 2;


// The background context doesn't seem to have access to the IMG dom element,
// just the src of the image. We loop over all images in the current DOM and
// if the target src matches, we apply the RGB extraction.

function replaceImageBySrc(src) {
	
	init();
	var elements = document.getElementsByTagName('img');

	for (i = 0; i < elements.length; i++) {
		if (elements[i].src == src) {
			extractRGB(src, elements[i]);
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

function extractRGB(src, container) {

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = new Image();
	
  	img.onload = function(){
					
	    canvas.width = img.width;
	    canvas.height = img.height;
	    ctx.drawImage(img,0,0);
	    var count = 0;
	    var hexString = "";
	    var block0;
	    var block1;
	
	    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;   	  	    	
    	    	
	    for (y = 0; y < img.height; y+= blockSize) {
		for (x = 0; x < img.width; x+= (blockSize * 2)) {

		    hex0 = getWRGBK(imageData, img.width, x, y, blockSize, blockSize);
		    hex1 = getWRGBK(imageData, img.width, x + blockSize, y, blockSize, blockSize);
    			
		    // Found black, stop
		    if (hex0 == 4 || hex1 == 4) break;	
		    
		    hexNum = hex0 + hex1 * 4;
		    hex = hexValues[hexNum];    			    			
		    hexString += hex;
		    count++;
		}
   	    }

	    var newBase64 = hexToBase64(hexString);
    	
	    // Unpack 3 JSON components with fixed length and positions in the string
	    var iv = newBase64.substring(0,22);
	    var salt = newBase64.substring(22,33);
	    var ct = newBase64.substring(33,newBase64.length); 
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
    img.src = src;
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

