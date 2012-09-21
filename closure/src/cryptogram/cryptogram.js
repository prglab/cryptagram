goog.provide('cryptogram');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('cryptogram.media.generic');
goog.require('cryptogram.media.facebook');
goog.require('cryptogram.media.googleplus');


/**
 * Iterates through known media types to find the best match.
 */
cryptogram.init = function(){

  if (cryptogram.context != null) return;

  var URL = new goog.Uri(window.location);
  
  var knownMedia = [cryptogram.media.facebook,
                    cryptogram.media.googleplus,
                    cryptogram.media.generic];
  var testMedia;
  for (var i = 0; i < knownMedia.length; i++) {
    testMedia = new knownMedia[i]();
    if (testMedia.matchesURL(URL)) {
      cryptogram.context = testMedia;
    }
  }
};
