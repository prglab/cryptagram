goog.provide('cryptogram.cipher');

goog.require('goog.debug.Logger');


/**
 * @constructor
 */
cryptogram.cipher = function() {
};

cryptogram.cipher.prototype.logger = goog.debug.Logger.getLogger('cryptogram.cipher');


cryptogram.cipher.URIHeader = "data:image/jpeg;base64,";

/** 
 */
cryptogram.cipher.prototype.decrypt = function(newBase64, password) {
  
  var check = newBase64.substring(0,64);
  var iv = newBase64.substring(64,86);
  var salt = newBase64.substring(86,97);
  var ct = newBase64.substring(97,newBase64.length);
  var full = newBase64.substring(64,newBase64.length);
  var bits = sjcl.hash.sha256.hash(full);
  var hexHash = sjcl.codec.hex.fromBits(bits);
      
  if (hexHash != check) {
    this.logger.severe("Checksum failed. Image is corrupted.");
    return;
  } else {
    this.logger.info("Checksum passed.");
  }
    
  var obj = new Object();
  obj['iv'] = iv;
  obj['salt'] = salt;
  obj['ct'] = ct;
  var base64Decode = JSON.stringify(obj);
  var decrypted;
  
  try {
    decrypted = sjcl.decrypt(password, base64Decode);
  } 
  
  catch(err) {
    this.logger.severe("Error decrypting:" + err.toString());
    return;
  }
  
  this.logger.info("Decrypted " + decrypted.length + " base64 characters.");
  
  var payload = cryptogram.cipher.URIHeader + decrypted;
  return payload;
};

cryptogram.cipher.prototype.encrypt = function(data, password) {
  // Get rid of data type information (for now assuming always JPEG.
  var withoutMimeHeader = data.split('base64,')[1];
  var encrypted_data = JSON.parse(sjcl.encrypt(password, withoutMimeHeader));
  var iv = encrypted_data['iv'];
  var salt = encrypted_data['salt'];
  var ct = encrypted_data['ct'];
  var to_hash = iv + salt + ct;
	var bits = sjcl.hash.sha256.hash(to_hash);
  var integrity_check_value = sjcl.codec.hex.fromBits(bits);
  return integrity_check_value + to_hash;
};
