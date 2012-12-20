goog.provide('cryptogram.container.div');

goog.require('cryptogram.container');
goog.require('goog.dom');

/**
 * @constructor
 */
cryptogram.container.div = function(img, node) {
  this.img = img;
  this.createStatus();
  img.insertBefore(this.div, img.childNodes[0]);
};

goog.inherits(cryptogram.container.div, cryptogram.container);


/** @inheritDoc */
cryptogram.container.div.prototype.setSrc = function(src) {    
  this.previousSrc = this.img.src;

  //To show image in div, set the div's background style
  this.img.style.background = "url(" + src + ")";
  this.img.style.backgroundRepeat = "no-repeat";
      
  //Hack to force correct resize of decoded background image
  this.img.style.backgroundSize = "100%";
  this.img.style.backgroundSize = "";
};