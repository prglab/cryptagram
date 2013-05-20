goog.provide('cryptagram.cipher');

/**
 * @constructor
 */
cryptagram.cipher = function() {};

cryptagram.cipher.prototype.decrypt = goog.abstractMethod;

cryptagram.cipher.prototype.URIHeader = 'data:image/jpeg;base64,';

cryptagram.cipher.prototype.encrypt = goog.abstractMethod;