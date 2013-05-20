goog.provide('cryptagram.cipher.chequer');

goog.require('cryptagram.RemoteLog');
goog.require('goog.debug.Logger');
goog.require('cryptagram.cipher');

/**
 * @constructor
 */
cryptagram.cipher.chequer = function() {};

goog.inherits(cryptagram.cipher.chequer, cryptagram.cipher.bacchant);

cryptagram.cipher.chequer.prototype.logger =
  goog.debug.Logger.getLogger('cryptagram.cipher.chequer');
  
    
cryptagram.cipher.chequer.prototype.encrypt = function(data, password) {

	var unparsed = sjcl.encrypt(password, data);
  var encrypted = JSON.parse(unparsed);

  var iv = encrypted['iv'];
  var salt = encrypted['salt'];
  var ct = encrypted['ct'];
  var full = iv + salt + ct;
  //var hash = CryptoJS.MD5(full);

  //this.logger.shout('ENCRYPT_FINISH ' + hash);

  return full;
};


cryptagram.cipher.chequer.prototype.decrypt = function(newBase64, password) {

  var iv = newBase64.substring(0,22);
  var salt = newBase64.substring(22,33);
  var ct = newBase64.substring(33,newBase64.length);

  var obj = new Object();
  obj['iv'] = iv;
  obj['salt'] = salt;
  obj['ct'] = ct;
    
  var base64Decode = JSON.stringify(obj);
  var decrypted;

  try {
    decrypted = sjcl.decrypt(password, base64Decode);
  } catch(err) {
    this.logger.severe('DECRYPT_FAILED ' + err.toString());
    return null;
  }

  this.logger.shout('DECRYPT_DONE ' + newBase64.length + ' ' +
                    decrypted.length);

  return decrypted;
};
