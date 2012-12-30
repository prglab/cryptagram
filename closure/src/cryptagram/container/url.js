goog.provide('cryptagram.container.url');

goog.require('goog.dom');

/**
 * @constructor
 */
cryptagram.container.url = function(img, node) {
  cryptagram.container.call(this, img, node);
  this.newImg = goog.dom.createDom('img');
  document.body.insertBefore(this.newImg, document.body.childNodes[0]);
};

goog.inherits(cryptagram.container.url, cryptagram.container);


cryptagram.container.url.prototype.setSrc = function(src) {    
  this.previousSrc = this.img.src;
  this.newImg.src = src;
  this.img.style.display = "none";
};


/** @inheritDoc */
cryptagram.container.url.prototype.revertSrc = function() {

  if (!this.previousSrc) return;    

  document.body.removeChild(this.newImg);
  this.newImg = null;
  this.img.style.display = "";
    
  this.previousSrc = null;
};
