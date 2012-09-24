// Create a context menu which will only show up for images and link the menu
// item to getClickHandler


//goog.provide('cryptogram.background');

var background = {};

background.settings = ['save_passwords', 'auto_decrypt', 'album_passwords'];
background.lastCheck = "";

// Sends the decodeURL message request to the current tabIndex
background.getClickHandler = function() {
  
  return function(info, tab) {
        
    chrome.tabs.getSelected(null, function(tab) {
                
    /* if (info.srcUrl.substring(0,5) == "data:") {
        chrome.tabs.sendRequest(tab.id, {"revertURL":info.srcUrl}, null); 
        return;
      }*/
      
      chrome.tabs.sendRequest(tab.id, {"decryptURL":info.srcUrl, "storage": localStorage}, function(response) {
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


background.sendDebugReport = function() {

  chrome.tabs.getSelected(null, function(tab) {   
      chrome.tabs.sendRequest(tab.id, {"sendDebugReport": 1}, null); 
  });
    
};

   
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    
  if (info.status=="complete") {
    
    //Default all settings to true
    for (i = 0; i < background.settings.length; i++) {
      var setting = background.settings[i];
      if (!localStorage[setting]) localStorage[setting] = "true";
    }
        
    chrome.tabs.executeScript(null, {file: "cryptogram-compiled.js"}, function() {
      
     if (localStorage["auto_decrypt"] == "true") {
        chrome.tabs.sendRequest(tabId, {"checkForSaved":1, "storage": localStorage}, null);
      }   
    }); 
  }  
});

 


background.contextMenuID = chrome.contextMenus.create({
  "title" : "Decrypt Image",
  "type" : "normal",
  "contexts" : ["image"],
  "onclick" : background.getClickHandler()
});

