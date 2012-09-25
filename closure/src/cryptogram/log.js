goog.provide('cryptogram.log');

//cryptogram.log.report = "";

/**
 * @param{string} str1
 * @param{string} str2
 */
cryptogram.log = function(str1, str2) {
  
  cryptogram.log.report += str1 + "%0D%0A";
  console.log(str1);
  
  if (str2) {
    if (str2.length > 128) {  
    
      str2 = str2.substring(0,128) + "…";
    }
    str2 = "   " + str2;
    console.log(str2);
    cryptogram.log.report += str2 + "%0D%0A";
  }  
};

cryptogram.log.sendDebugReport = function() {
  
  var addresses = "ispiro@gmail.com,mrtierney@gmail.com";
  var subject = "Cryptogram Debug Report";
  var href = "mailto:" + addresses + "?subject=" + subject + "&body=" + cryptogram.log.report;
  window.open(href, "_blank");
}


// Add a contains function to simplify URL searching
String.prototype.contains = function(str1) {
  return (this.search(str1) != -1);
};


