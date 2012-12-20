goog.provide('cryptogram.container.url');

goog.require('goog.dom');

/**
 * @constructor
 */
cryptogram.container.url = function(img, node) {
  cryptogram.container.call(this, img, node);
  this.newImg = goog.dom.createDom('img');
  document.body.insertBefore(this.newImg, document.body.childNodes[0]);
};

goog.inherits(cryptogram.container.url, cryptogram.container);


cryptogram.container.url.prototype.setSrc = function(src) {    
  this.previousSrc = this.img.src;
  this.newImg.src = src;
  this.img.style.display = "none";
};


/** @inheritDoc */
cryptogram.container.url.prototype.revertSrc = function() {

  if (!this.previousSrc) return;    

  document.body.removeChild(this.newImg);
  this.newImg = null;
  this.img.style.display = "";
    
  this.previousSrc = null;
};
