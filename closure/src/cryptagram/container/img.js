goog.provide('cryptagram.container.img');

goog.require('cryptagram.container');
goog.require('goog.dom');

/**
 * @constructor
 */
cryptagram.container.img = function(img, node) {
  cryptagram.container.call(this, img, node);
};

goog.inherits(cryptagram.container.img, cryptagram.container);


cryptagram.container.img.prototype.setSrc = function(src) {    
  this.previousSrc = this.img.src;

  if (this.newImg) {
    this.newImg.src = src;
    this.img.style.display = "none";
  } else {
    this.img.src = src;
  }
};


/** @inheritDoc */
cryptagram.container.img.prototype.revertSrc = function() {
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
