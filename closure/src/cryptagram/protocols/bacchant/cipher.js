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

  var hash = CryptoJS.MD5(full);
  this.logger.info("Decrypting image with hash " + hash);

  if (hash != check) {
    this.logger.shout("Embedded hash " + check);
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
    this.logger.severe("Error decrypting " + err.toString());
    return null;
  }

  this.logger.shout("Decrypted base64 " + decrypted.length);

  var payload = this.URIHeader + decrypted;
  return payload;
};

cryptagram.cipher.bacchant.prototype.encrypt = function(data, password) {
  // Get rid of data type information (for now assuming always JPEG.
  var withoutMimeHeader = data.split('base64,')[1];
	this.logger.shout("Started encrypting data " + data.length);
	var unparsed = sjcl.encrypt(password, withoutMimeHeader);
  var encrypted = JSON.parse(unparsed);

  var iv = encrypted['iv'];
  var salt = encrypted['salt'];
  var ct = encrypted['ct'];
  var full = iv + salt + ct;
  var hash = CryptoJS.MD5(full);
  
  this.logger.shout("Encrypted image with hash " + hash);

  return hash + full;
};
