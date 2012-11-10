goog.provide('cryptogram.container');

goog.require('goog.dom');

/**
 * @constructor
 */
cryptogram.container = function(img, node) {

  this.backgroundMode = false;
  this.img = img;
  this.div = goog.dom.createDom('div', { 'class': 'status'});
  this.div.style.display = 'none';
  if (node == null) {
    node = img.parentNode;
  }

  if (img.tagName != "IMG") {
    this.backgroundMode = true;
    node = img;
  }

  node.appendChild(this.div);
};

cryptogram.container.prototype.getSrc = function() {
  return this.img.src;
};


cryptogram.container.prototype.setSrc = function(src) {
    
    this.previousSrc = this.img.src;

    if (this.backgroundMode) {
      this.img.style.background = "url(" + src + ")";
      this.img.style.backgroundRepeat = "no-repeat";
      
      //Hack to force correct resize of decoded background image
      this.img.style.backgroundSize = "100%";
      this.img.style.backgroundSize = "";
      
    } else {
      this.img.src = src;    
    }
};


cryptogram.container.prototype.revertSrc = function() {
    if (!this.previousSrc) return;    
    this.img.src = this.previousSrc;
    this.previousSrc = null;
};


cryptogram.container.prototype.setStatus = function(status) {
  if (!status) {
    this.div.innerHTML = '';
    this.div.style.display = 'none';
  } else {
    this.div.innerHTML = status;  
    this.div.style.display = '';
  }
};


cryptogram.container.prototype.remove = function() {
  this.div.parentNode.removeChild(this.div);  
};


cryptogram.container.prototype.singleImageMode = function() {
  this.div.style.left = this.img.width / 2;  
};

