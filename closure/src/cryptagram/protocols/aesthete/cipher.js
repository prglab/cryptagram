goog.provide('cryptagram.cipher.aesthete');

goog.require('cryptagram.cipher');
goog.require('cryptagram.RemoteLog');
goog.require('goog.debug.Logger');

/**
 * @constructor
 */
cryptagram.cipher.aesthete = function() {};

goog.inherits(cryptagram.cipher.aesthete, cryptagram.cipher);

cryptagram.cipher.aesthete.prototype.logger = goog.debug.Logger.getLogger('cryptagram.cipher.aesthete');

/**
 */
cryptagram.cipher.aesthete.prototype.decrypt = function(newBase64, password) {

  var check = newBase64.substring(0,64);
  var iv = newBase64.substring(64,86);
  var salt = newBase64.substring(86,97);
  var ct = newBase64.substring(97,newBase64.length);
  var full = newBase64.substring(64,newBase64.length);

  var bits = sjcl.hash.sha256.hash(full);
  var hexHash = sjcl.codec.hex.fromBits(bits);

  this.logger.info("Decrypting Image");
  
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
  } catch(err) {
    this.logger.severe("Error decrypting: " + err.toString());
    return null;
  }

  this.logger.shout("Decrypted " + decrypted.length + " base64 characters.");

  var payload = this.URIHeader + decrypted;
  return payload;
};

cryptagram.cipher.aesthete.prototype.encrypt = function(data, password) {
  // Get rid of data type information (for now assuming always JPEG.
  var withoutMimeHeader = data.split('base64,')[1];
	this.logger.info("Start");
	var unparsed_encrypted = sjcl.encrypt(password, withoutMimeHeader);
  var encrypted_data = JSON.parse(unparsed_encrypted);
	this.logger.info("Stop");

	this.logger.info("iv");
  var iv = encrypted_data['iv'];
	this.logger.info("salt");
  var salt = encrypted_data['salt'];
	this.logger.info("ct");
  var ct = encrypted_data['ct'];
	this.logger.info("to_hash");
  var to_hash = iv + salt + ct;
  
	this.logger.info("Hashing");
	var bits = sjcl.hash.sha256.hash(to_hash);
	this.logger.info("fromBits");
  var integrity_check_value = sjcl.codec.hex.fromBits(bits);
  //var integrity_check_value = CryptoJS.MD5(to_hash);
  this.logger.shout("Encrypting Image. Hash:" + integrity_check_value);
  
  return integrity_check_value + to_hash;
};
