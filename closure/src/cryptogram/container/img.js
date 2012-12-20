goog.provide('cryptogram.container.img');

goog.require('cryptogram.container');
goog.require('goog.dom');

/**
 * @constructor
 */
cryptogram.container.img = function(img, node) {
  cryptogram.container.call(this, img, node);
};

goog.inherits(cryptogram.container.img, cryptogram.container);


cryptogram.container.img.prototype.setSrc = function(src) {    
  this.previousSrc = this.img.src;

  if (this.newImg) {
    this.newImg.src = src;
    this.img.style.display = "none";
  } else {
    this.img.src = src;
  }
};


/** @inheritDoc */
cryptogram.container.img.prototype.revertSrc = function() {

    if (!this.previousSrc) return;    

    if (this.newImg) {
      document.body.removeChild(this.newImg);
      this.newImg = null;
      this.img.style.display = "";
    } else {
      this.img.src = this.previousSrc;
    }
    
    this.previousSrc = null;
};
