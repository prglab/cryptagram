goog.provide('cryptagram.container.div');

goog.require('cryptagram.container');
goog.require('goog.dom');

/**
 * @constructor
 */
cryptagram.container.div = function(img, node) {
  this.img = img;
  this.createStatus();
  img.insertBefore(this.div, img.childNodes[0]);

  // Hard-coded for Facebook album view
  this.displayWidth = 206;

};

goog.inherits(cryptagram.container.div, cryptagram.container);


/** @inheritDoc */
cryptagram.container.div.prototype.setSrc = function(src) {    
  this.previousSrc = this.img.src;

  //To show image in div, set the div's background style
  this.img.style.background = "url(" + src + ")";
  this.img.style.backgroundRepeat = "no-repeat";
      
  //Hack to force correct resize of decoded background image
  this.img.style.backgroundSize = "100%";
  this.img.style.backgroundSize = "";
};