goog.provide('cryptogram.demo');

goog.require('goog.dom');
goog.require('cryptogram');
goog.require('cryptogram.loader');
goog.require('cryptogram.decoder');
goog.require('cryptogram.encoder');
goog.require('goog.events.FileDropHandler');

/**
 * @constructor
 */
cryptogram.demo = function() {
  var settings = {image: 'secret.jpg'};
  cryptogram.demo.settings = settings;
  goog.dom.getElement('main').innerHTML = cryptogram.templates.decrypt(settings);
  cryptogram.discoverMedia();
  
};

/**
 * @constructor
 */
cryptogram.demo.encryptDemo = function() {
  goog.dom.getElement('main').innerHTML = cryptogram.templates.encrypt();
  
  document.getElementById('file_selector').addEventListener('change', cryptogram.demo.handleFileSelect, false);
  
  var dropZone = goog.dom.getElement('drop_zone');
  var handler = new goog.events.FileDropHandler(dropZone, true);

  goog.events.listen(handler, goog.events.FileDropHandler.EventType.DROP,
      function(e) {
        var files = e.getBrowserEvent().dataTransfer.files;
          cryptogram.demo.handleFiles(files);
        });
        
   cryptogram.demo.downloadify = Downloadify.create('downloadify',{
          filename: "encrypted.zip",
          data: function(){ 
            return cryptogram.demo.zip.generate();
          },
          onError: function(){ 
            alert('Nothing to save.'); 
          },
          dataType: 'base64',
          swf: 'media/downloadify.swf',
          downloadImage: 'images/download.png',
          width: 100,
          height: 30,
          transparent: false,
          append: false,
          enabled: true
        });
  
};


cryptogram.demo.runDecrypt = function() {

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

cryptogram.demo.handleFileSelect = function(evt) {
  var files = evt.target.files; // FileList object          
  cryptogram.demo.handleFiles(files);
}

cryptogram.demo.handleFiles = function(files) {
  
  clear_alerts();

  // Files is a FileList of File objects. List some properties.
  var output = [];
  var zip;
  var images;

  if (cryptogram.demo.zip == null) {
      cryptogram.demo.zip = new JSZip();;
      cryptogram.demo.images = cryptogram.demo.zip.folder("images");
      cryptogram.demo.numberImages = 0;
  }
  var filesLeft = files.length;
  for (var i = 0; i < files.length; i++) {
  f = files[i];
  var name = escape(f.name);
  if (f.size > 250000) {
    console.log("Skipping " + name);  
  }
  var type = f.type || 'n/a';
  var reader = new FileReader();
  reader.onload = function ( loadEvent ) {
    var originalData = loadEvent.target.result;
    var originalImage = new Image();
    originalImage.onload= function () {
      goog.dom.insertChildAt(goog.dom.getElement('original_image'), originalImage, 0);
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
      goog.dom.insertChildAt(goog.dom.getElement('encoded_image'),encodedImage,0);
      
      var str = encodedImage.src;
      var idx = str.indexOf(",");
      var dat = str.substring(idx+1);
      cryptogram.demo.images.file(cryptogram.demo.numberImages + ".jpg", dat, {base64: true});
      cryptogram.demo.numberImages++;
    }
  };
  reader.onerror = show_error;
  reader.readAsDataURL(f);
  }
}




goog.exportSymbol('cryptogram.demo', cryptogram.demo);
goog.exportSymbol('cryptogram.demo.encryptDemo', cryptogram.demo.encryptDemo);
goog.exportSymbol('cryptogram.demo.decrypt', cryptogram.demo.decrypt);
