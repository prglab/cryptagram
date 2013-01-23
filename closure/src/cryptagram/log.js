goog.provide('cryptagram.log');

//cryptagram.log.report = "";

/**
 * @param{string} str1
 * @param{string} str2
 */
cryptagram.log = function(str1, str2) {
  
  cryptagram.log.report += str1 + "%0D%0A";
  console.log(str1);
  
  if (str2) {
    if (str2.length > 128) {  
    
      str2 = str2.substring(0,128) + "…";
    }
    str2 = "   " + str2;
    console.log(str2);
    cryptagram.log.report += str2 + "%0D%0A";
  }  
};

cryptagram.log.sendDebugReport = function() {
  
  var addresses = "ispiro@gmail.com,mrtierney@gmail.com";
  var subject = "cryptagram Debug Report";
  var href = "mailto:" + addresses + "?subject=" + subject + "&body=" + cryptagram.log.report;
  window.open(href, "_blank");
}
