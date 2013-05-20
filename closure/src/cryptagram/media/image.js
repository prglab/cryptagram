goog.provide('cryptagram.media.image');

goog.require('cryptagram.container.url');
goog.require('cryptagram.media');
goog.require('goog.debug.Logger');


/**
 * @constructor
 * @extends {cryptagram.media}
 */
cryptagram.media.image = function() {};
goog.inherits(cryptagram.media.image, cryptagram.media);

cryptagram.media.image.prototype.logger = goog.debug.Logger.getLogger('cryptagram.media.image');



/** @inheritDoc */
cryptagram.media.image.prototype.name = function() {
  return 'JPEG Image';
};


/** @inheritDoc */
cryptagram.media.image.prototype.matchesURL = function(URL) {
  var regex=new RegExp(/jpg$/i);
  return regex.test(URL);
};


/** @inheritDoc */
cryptagram.media.image.prototype.getImages = function(opt_URL) {
  return document.getElementsByTagName('img');
};


/** @inheritDoc */
cryptagram.media.image.prototype.getPhotoName = function() {
  return window.location.toString();
};


/** @inheritDoc */
cryptagram.media.image.prototype.getAlbumName = function() {
  return null;
};


/** @inheritDoc */
cryptagram.media.image.prototype.loadContainer = function(URL) {
  var images = this.getImages(URL);  
  var container = new cryptagram.container.url(images[0]);
  return container;
};


/**
 * In single image mode, there is no style sheet. We have to
 * manually set all the styles to get the password dialog to 
 * look right.
 */
cryptagram.media.image.prototype.cssHack = function(dialog) {
  var md = dialog.getDialogElement();
  md.style.background = '#c1d9ff';
  md.style.border = '1px solid #3a5774';
  md.style.color = '#000';
  md.style.padding = '4px';
  md.style.position = 'absolute';
  md.style.width = '350px';
  md.style.zIndex = '100001';
  md.style.fontSize = '12px';
  md.style.fontFamily = 'helvetica';

  var mdt = dialog.getTitleElement();
  mdt.style.background = '#e0edfe';
  mdt.style.color = '#000';
  mdt.style.cursor = 'pointer';
  mdt.style.fontSize = '120%';
  mdt.style.fontWeight = 'bold';
  mdt.style.padding = '8px 31px 8px 8px';
  mdt.style.position = 'relative';
  mdt.style._zoom = '1'; 
  
  var mdc = dialog.getContentElement();
  mdc.style.backgroundColor = '#fff';
  mdc.style.padding = '8px';
  
  var mdb = dialog.getButtonElement();
  mdb.style.backgroundColor = '#fff';
  mdb.style.padding = '8px';

  var mdtc = dialog.getTitleCloseElement();
  mdtc.style.background = '#e0edfe url(//ssl.gstatic.com/editor/editortoolbar.png) no-repeat -528px 0';
  mdtc.style.cursor = 'default';
  mdtc.style.height = '15px';
  mdtc.style.position = 'absolute';
  mdtc.style.right = '10px';
  mdtc.style.top = '8px';
  mdtc.style.width = '15px';
  mdtc.style.verticalAlign = 'middle';
};