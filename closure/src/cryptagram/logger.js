goog.provide('cryptagram.logger');


cryptagram.logger = function() {
}

cryptagram.logger.prototype.log = function(host, port, severity, message) {
  var img = new Image();
  img.src = "http://" + host + ":" + port + "?sev=" +
    encodeURIComponent(severity) + "&msg=" + encodeURIComponent(message);
}

cryptagram.logger.prototype.info = function(message) {
  this.log("theseus.news.cs.nyu.edu", 8888, 1, message);
}

cryptagram.logger.prototype.severe = function(message) {
  this.log("theseus.news.cs.nyu.edu", 8888, 2, message);
}