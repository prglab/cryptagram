goog.provide('cryptagram.cipher.bacchant');

goog.require('cryptagram.RemoteLog');
goog.require('goog.debug.Logger');
goog.require('cryptagram.cipher');

/**
 * @constructor
 */
cryptagram.cipher.bacchant = function() {};

goog.inherits(cryptagram.cipher.bacchant, cryptagram.cipher);

cryptagram.cipher.bacchant.prototype.logger = goog.debug.Logger.getLogger('cryptagram.cipher.bacchant');

/**
 */
cryptagram.cipher.bacchant.prototype.decrypt = function(newBase64, password) {

  var check = newBase64.substring(0,32);
  var iv = newBase64.substring(32,54);
  var salt = newBase64.substring(54,65);
  var ct = newBase64.substring(65,newBase64.length);
  var full = iv + salt + ct;
  this.logger.info("Full message: " + full);

  var hash = CryptoJS.MD5(full);

  this.logger.info("Decrypting Image hashed " + hash);
  this.logger.info("Decrypting Image (image) " + check);

  if (hash != check) {
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

cryptagram.cipher.bacchant.prototype.encrypt = function(data, password) {
  // Get rid of data type information (for now assuming always JPEG.
  var withoutMimeHeader = data.split('base64,')[1];
	this.logger.info("Start");
	var unparsed = sjcl.encrypt(password, withoutMimeHeader);
  var encrypted = JSON.parse(unparsed);
	this.logger.info("Stop");

	this.logger.info("iv");
  var iv = encrypted['iv'];
	this.logger.info("salt");
  var salt = encrypted['salt'];
	this.logger.info("ct");
  var ct = encrypted['ct'];
	this.logger.info("to_hash");
  var full = iv + salt + ct;

	this.logger.info("Hashing");
  var hash = CryptoJS.MD5(full);
  this.logger.info("Full message: " + full);
  this.logger.shout("Encrypting Image. Hash:" + hash);

  return hash + full;
};
