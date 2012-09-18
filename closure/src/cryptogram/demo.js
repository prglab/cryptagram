goog.provide('cryptogram.demo');

goog.require('goog.dom');
goog.require('cryptogram');
goog.require('cryptogram.loader');
goog.require('cryptogram.decoder');
goog.require('cryptogram.encoder');

/**
 * @constructor
 */
cryptogram.demo = function() {
  var settings = {image: 'http://ianspiro.com/secret.jpg'};
  cryptogram.demo.settings = settings;
  goog.dom.getElement('main').innerHTML = cryptogram.templates.demo(settings);
  cryptogram.discoverMedia();
  
  document.getElementById('file_selector').addEventListener('change', cryptogram.demo.handleFileSelect, false);
  
};

cryptogram.demo.decrypt = function() {

  if (cryptogram.demo.decrypted) {
    cryptogram.demo.decrypted = false;
    goog.dom.getElement('button').value = "Decrypt"; 
    cryptogram.context.setSrc(cryptogram.context.container.previousSrc);
  } else {
    cryptogram.demo.decrypted = true;
    goog.dom.getElement('button').value = "Reset"; 
    cryptogram.loader.getImageData(cryptogram.demo.settings.image, function(data) {

     var containers = cryptogram.context.getContainers();
     var password = "cryptogram";      
     var decoder = new cryptogram.decoder();
     decoder.decodeDataToContainer(data, password, containers[0]);
   });
  }    
};



// When the user selects a file, draw it on the canvas as an image.
cryptogram.demo.handleFileSelect = function(evt) {

  clear_alerts();
  var files = evt.target.files; // FileList object

  // Files is a FileList of File objects. List some properties.
  var output = [];

  for (var i = 0; i < files.length; i++) {
  f = files[i];
  console.log(f);
  var name = escape(f.name);
  var type = f.type || 'n/a';
  var output = ['<li><strong>', name, '</strong> (', type, ') - ', f.size,
								' bytes</li>'];
  var reader = new FileReader();
  reader.onload = function ( loadEvent ) {
    var originalData = loadEvent.target.result;
    var originalImage = new Image();
    originalImage.onload= function () {
      goog.dom.getElement('original_image').appendChild(originalImage);
    }
    originalImage.src = originalData;

    // Get rid of data type information (for now assuming always JPEG.
    var withoutMimeHeader = originalData.split('base64,')[1];

		// TODO(tierney): Accept user-chosen password.
		var password = 'cryptogram';
    encryptedData = encrypt(withoutMimeHeader, password);
    width_to_height_ratio = 1.0; // TODO(iskandr): Actually use the image.
    var encodedImage = cryptogram.encoder.encode(encryptedData, width_to_height_ratio );
    encodedImage.onload = function () {
      goog.dom.getElement('encoded_image').appendChild(encodedImage);
    }
  };
  reader.onerror = show_error;
  reader.readAsDataURL(f);
  }
}





goog.exportSymbol('cryptogram.demo', cryptogram.demo);
goog.exportSymbol('cryptogram.demo.decrypt', cryptogram.demo.decrypt);
