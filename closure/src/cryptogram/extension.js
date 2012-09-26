goog.provide('cryptogram.extension');

goog.require('goog.dom');


cryptogram.extension.settings = ['save_passwords', 'auto_decrypt', 'album_passwords'];
cryptogram.extension.lastCheck = "";


cryptogram.extension.init = function() {
    
  // Create a context menu which will only show up for images and link the menu
  // item to getClickHandler
  cryptogram.extension.contextMenuID = chrome.contextMenus.create({
    "title" : "Decrypt Image",
    "type" : "normal",
    "contexts" : ["image"],
    "onclick" : cryptogram.extension.getClickHandler()
  });
  
  for (i = 0; i < cryptogram.extension.settings.length; i++) {
    var setting = cryptogram.extension.settings[i];
    if (!localStorage[setting]) localStorage[setting] = "true";
  }
}


// Sends the decodeURL message request to the current tabIndex
cryptogram.extension.getClickHandler = function() {
    
  return function(info, tab) {
  
    chrome.tabs.getSelected(null, function(tab) {  
      chrome.tabs.sendRequest(tab.id, {"decryptURL":info['srcUrl'], "storage": localStorage}, function(response) {
        if (response.outcome == "success") {
          localStorage[response.id] = response.password;
          if (response.album != null) {
            localStorage[response.album] = response.password;              
          }         
        }
      });  
    });    
  };
};


cryptogram.extension.sendDebugReport = function() {
  chrome.tabs.getSelected(null, function(tab) {   
      chrome.tabs.sendRequest(tab.id, {"sendDebugReport": 1}, null); 
  }); 
};
   

cryptogram.extension.init();