var proxyURL = "grab/";
var URIHeader = "data:image/jpeg;base64,";


var colors = ['#FFFFFF',  '#FF0000', '#00FF00', '#0000FF'];
var hexValues = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
var lookup;



function init() {

	// Create reverse associative array
	lookup = new Array();
	for (i = 0; i < hexValues.length; i++) {
		lookup[hexValues[i]] = i;
	}

	go();
}


function go() {

	clear();
	var src = document.getElementById("imageURL").value;
	var proxySrc = proxyURL + src;
	document.getElementById("imageOriginal").src = proxySrc;
	rescaleImage();
}




// Clear all divs and images

function clear() {

	var images = ["imageOriginal", "imageRescale", "imageDecrypt"];
	var divs = ["base64Input", "base64Encrypt", "base64Decode", "base64Decrypt"];

	for (i = 0; i < images.length; i++) {
		document.getElementById(images[i]).src = "pixel.gif";
	}

	for (i = 0; i < divs.length; i++) {
		document.getElementById(divs[i]).innerHTML = "";
	}
}





// Rescales the image and sets the JPEG quality

function rescaleImage() {

	var canvas = document.createElement("canvas");
	var img = new Image();
  var context = canvas.getContext("2d");
	var canvasCopy = document.createElement("canvas");
  var copyContext = canvasCopy.getContext("2d");
	var imageRescale = document.getElementById("imageRescale");

  img.onload = function() {
    var ratio = document.getElementById("imageScale").value;
    var quality = parseFloat(document.getElementById("imageQuality").value);
    canvasCopy.width = img.width;
    canvasCopy.height = img.height;
    copyContext.drawImage(img, 0, 0);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    context.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);

    // canvas.toDataURL is only allowed when the image is hosted on the local server
    // (Or rather, the proxy is making it seem that way.)
    imageRescale.src = canvas.toDataURL("image/jpeg", quality);

    imageToBase64();
  };

  img.src = document.getElementById("imageOriginal").src;
}





// Image was already rendered through a base64 URI so we just extract that data from the IMG

function imageToBase64() {

	var canvasData = document.getElementById("imageRescale").src;

	// Need to split off the header since :; aren't valid base64
  var canvasDataParts = canvasData.split(",");
  document.getElementById("base64Header").innerHTML = canvasDataParts[0];
	document.getElementById("base64Input").innerHTML = canvasDataParts[1];
  document.getElementById("resizeSize").innerHTML = canvasDataParts[1].length + " characters";

  encryptBase64();
}




function encryptBase64() {
	var password = document.getElementById("password").value;
	var data = document.getElementById("base64Input").innerHTML;
	var encrypted = sjcl.encrypt(password, data);
	document.getElementById("base64Encrypt").innerHTML = encrypted;
	document.getElementById("encryptSize").innerHTML = encrypted.length + " characters";

	encodeRGB();
}



function encodeRGB() {

	var targetWidth = parseInt(document.getElementById("RGBWidth").value);
  var scale = parseInt(document.getElementById("RGBBlock").value);

	// Need to pack the 3 JSON components into one string since we can't
	// base64 encode {}"; iv and salt seem to always have the same length
	var obj = JSON.parse(document.getElementById("base64Encrypt").innerHTML);
	var b64 = obj.iv + obj.salt + obj.ct;

	// Convert to hex
	var data = base64ToHex(b64);
	var numData = data.length;
	var width = targetWidth / (scale * 2);
	var height = Math.ceil(numData / width);

	var RGBCanvas = document.createElement('canvas');
	RGBCanvas.height = height * scale;
	RGBCanvas.width = width * scale * 2;
	var RGBContext = RGBCanvas.getContext('2d');

	// For each hex value, draw two RGBW blocks
	for (i = 0; i < numData; i++) {

		var hex = data.charAt(i);
		var hexVal = lookup[hex];
		var base4_1 = Math.floor(hexVal / 4.0);
		var base4_0 = hexVal - (base4_1 * 4);
		var yCoord = Math.floor(i / width);
		var xCoord = i - (yCoord * width);
		RGBContext.fillStyle = colors[base4_0];
		RGBContext.fillRect(xCoord * scale * 2, yCoord*scale , scale, scale);
		RGBContext.fillStyle = colors[base4_1];
		RGBContext.fillRect(xCoord * scale * 2 + scale, yCoord*scale , scale, scale);
	}

  var quality = parseFloat(document.getElementById("RGBQuality").value);
	document.getElementById("imageRGB").src = RGBCanvas.toDataURL("image/jpeg",quality);
	document.getElementById("RGBSize").innerHTML = RGBCanvas.width + " x " + RGBCanvas.height;

	extractRGB();
}




// March over the RGB image extracting each pair of blocks.
// Estimate the block colors and convert these into a hex value

function extractRGB() {

	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
  var img = new Image();

	var blockSize = parseInt(document.getElementById("RGBBlock").value);

  img.onload = function(){
  	canvas.width = img.width;
  	canvas.height = img.height;
    ctx.drawImage(img,0,0);
    var count = 0;
    var hexString = "";
    var block0;
    var block1;

    var imgHeight = img.height;
    var imgWidth = img.width;
    for (y = 0; y < imgHeight; y+= blockSize) {
    	for (x = 0; x < imgWidth; x+= (blockSize * 2)) {

    		block0 = ctx.getImageData(x, y, blockSize, blockSize).data;
    		block1 = ctx.getImageData(x + blockSize, y, blockSize, blockSize).data;
    		hex0 = getWRGBK(block0);
    		hex1 = getWRGBK(block1);

    		// Found black, stop
    		if (hex0 == 4 || hex1 == 4)
          break;

    		hexNum = hex0 + hex1 * 4;
    		hex = hexValues[hexNum];
    		hexString += hex;
    		count++;
			}
    }

    var errors = 0;
    var newBase64 = hexToBase64(hexString);

    // Unpack 3 JSON components with fixed length and positions in the string
    var iv = newBase64.substring(0,22);
    var salt = newBase64.substring(22,33);
    var ct = newBase64.substring(33, newBase64.length-1); // -1 to get rid of trailing =

    var obj = new Object();
    obj.iv = iv;
    obj.salt = salt;
    obj.ct = ct;
    var base64Decode = JSON.stringify(obj);
    var original = document.getElementById("base64Encrypt").innerHTML;

    if (original != base64Decode) {
      var originalLength = original.length;
    	for (i = 0; i < originalLength; i++) {
    		if (original.charAt(i) != base64Decode.charAt(i)) errors++;
    	}
    }

    document.getElementById("base64Decode").innerHTML = base64Decode;
    document.getElementById("matchRate").innerHTML = errors + " errors";

		decryptBase64();
  };

  img.src = document.getElementById("imageRGB").src;
}



function decryptBase64() {
  var password = document.getElementById("password2").value;
  var base64Decode = document.getElementById("base64Decode").innerHTML;
  var decrypted = sjcl.decrypt(password, base64Decode);
  document.getElementById("base64Decrypt").innerHTML = decrypted;
  document.getElementById("imageDecrypt").src = URIHeader + decrypted;
}



// Takes the average over some block of pixels then guesses if
// it's white, red, green, blue, or black with a dumb heuristic
//
//  0 = White, 1 = Red, 2 = Green, 3 = Blue, 4 = Black, -1 = Error

function getWRGBK(block) {

	var upperThresh = 150;
	var lowerThresh = 50;
	var count = 0.0;
	var rt = 0.0;
	var gt = 0.0;
	var bt = 0.0;

	for (i = 0; i < block.length; i+= 4) {
		rt += block[i];
		gt += block[i+1];
		bt += block[i+2];
		count++;
	}

	r = rt / count;
	g = gt / count;
	b = bt / count;

	if (r > upperThresh && b > upperThresh && g > upperThresh) return 0;
	if (r < lowerThresh && g < lowerThresh && b < lowerThresh) return 4;

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

