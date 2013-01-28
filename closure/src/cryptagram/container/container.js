goog.provide('cryptagram.container');

goog.require('goog.dom');

/**
 * @constructor
 */
cryptagram.container = function(img, node) {

  this.img = img;
  this.createStatus();

  if (!img) {
    console.log("Bad Container");
    return;
  }
  if (node == null) {
    node = img.parentNode;
  }
  if (node) {
    node.insertBefore(this.div, node.childNodes[0]);
  }
};


cryptagram.container.prototype.createStatus = function() {
  this.div = goog.dom.createDom('div', { 'class': 'status'});
  this.div.style.display = 'none';
  this.div.style.position = "absolute";
  this.div.style.width = "50px";
  this.div.style.top = "0px";
  this.div.style.margin = "5px";
  this.div.style.marginLeft = "-25px";
  this.div.style.padding = "5px";
  this.div.style.color = "black";
  this.div.style.background = "white";
  this.div.style.opacity = "0.8";
  this.div.style.font = "10px arial";
  this.div.style.textAlign = "center";
  this.div.style.borderRadius = "3px";
};

cryptagram.container.prototype.remove = function() {
  this.div.parentNode.removeChild(this.div);
};


cryptagram.container.prototype.getSrc = function() {
  return this.img.src;
};


cryptagram.container.prototype.setSrc = function(src) {
  this.previousSrc = this.img.src;
  this.img.src = src;
};


cryptagram.container.prototype.revertSrc = function() {
    if (!this.previousSrc) return;
    this.img.src = this.previousSrc;
    this.previousSrc = null;
};

cryptagram.container.prototype.setStatus = function(status) {
  if (!status) {
    this.div.innerHTML = '';
    this.div.style.display = 'none';
  } else {

    var width = this.img.width;
    if (this.displayWidth) {
      width = this.displayWidth;
    }
    this.div.style.left = (width / 2) + "px";
    this.div.style.display = 'inline-block';
    this.div.innerHTML = status;
    }
};
