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

function fetchImageBinary(src, container) {
    console.log("Calling getImageBinary");
    var oHTTP = createRequest();
	  oHTTP.onreadystatechange = function() {
        if (oHTTP.readyState == 4) {
            if (oHTTP.status == "200" || oHTTP.status == "206") {

				        var arrayBuffer = oHTTP.response;
                var b64 = arrayBufferDataUri(arrayBuffer);
    		        var img = document.createElement("img");
                img.id = "base64edimage";
    		        // img.style.display = "none";
    		        img.src = b64;

                var parent = container.parentNode;
                while (parent.firstChild) {
                    parent.removeChild(parent.firstChild);
                }
    		        parent.appendChild(img);

            } else {

            }
            oHTTP = null;
        }
    };

    console.log('About to open GET request.');
	  oHTTP.open("GET", src, true);
	  if (oHTTP.overrideMimeType) {
        oHTTP.overrideMimeType('text/plain; charset=x-user-defined');
    }
	  oHTTP.send(null);
}

var lastReplace = "";

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "getDOM") {

            document.getElementsByTagName("img");
	          var elements = document.getElementsByTagName('img');

            var toProcess;
            var src;
	          for (i = 0; i < elements.length; i++) {
                if (lastReplace == elements[i].src) {
                    console.log ("ALREADY SEEN!!");
                    continue;            
                }
		            if (elements[i].alt == "takeme") {
                    elements[i].alt = "TAKEN";
                    var parent = elements[i].parentNode;
                    toProcess = elements[i];
                    src = elements[i].src;
                    lastReplace = src;
                }
            }

            if (src && toProcess) {
                console.log('About to call getImageBinary.');
                fetchImageBinary(src, toProcess);
            }

            var b64 = "";
            var b64image = document.getElementById("base64edimage");
            if (b64image) {
                b64 = b64image.src;
            } else {
                sendResponse({process: false});
                return;
            }
            console.log('Sending b64: ' + b64.substr(0,10));
            sendResponse(
                {
                    dom: b64,
                    process: true,
                    astring: "hello",
                    request: request.action
                }
            )

        } else if (request.action == "decrypted") {
            var newBase64 = request.data;
            // console.log('Received extracted: ' + newBase64);
            
	          var password = prompt("Enter password for\n"+src, "helloworld");
            console.log('Decrypting...');

	          var pad = 0;
	          var iv = newBase64.substring(0+pad,22+pad);
	          var salt = newBase64.substring(22+pad,33+pad);
	          var ct = newBase64.substring(33+pad,newBase64.length);

            // console.log('iv ' + iv);
            // console.log('salt ' + salt);
            // console.log('ct ' + ct);

	          var obj = new Object();
	          obj.iv = iv;
	          obj.salt = salt;
	          obj.ct = ct;
	          var base64Decode = JSON.stringify(obj);
            // console.log(base64Decode);
            var decrypted;
	          decrypted = sjcl.decrypt(password, base64Decode);
            // console.log('Decrypted ' + decrypted);

            var URIHeader = "data:image/jpeg;base64,";
            var b64image = document.getElementById("base64edimage");
            if (b64image) {
                console.log('Decrypted.');
                b64image.id = 'decrypted';
                b64image.src = URIHeader + decrypted;
            }

        } else {
            sendResponse({}); // Send nothing..
        }
    }
);
