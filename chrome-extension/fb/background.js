// Create a context menu which will only show up for images and link the menu
// item to getClickHandler

var background = {};

// Sends the decodeURL message request to the current tabIndex



background.getClickHandler = function() {
  
  return function(info, tab) {
        
    chrome.tabs.getSelected(null, function(tab) {
        
      if (info.srcUrl.substring(0,5) == "data:") {
        chrome.tabs.sendRequest(tab.id, {"revertURL":info.srcUrl}, null); 
        return;
      }
      
      chrome.tabs.sendRequest(tab.id, {"decryptURL":info.srcUrl, "storage": localStorage}, function(response) {
        if (response.outcome == "success") {
          if (localStorage['auto_password'] == "true") {
            localStorage[response.id] = response.password;
          }
        }
      });  
    });    
  };
};


// Keep track of last checked URL since the FB JS seems to lead to double complete events sometimes
background.lastCheck = "";
   
   
// The JS files need to be loaded last, so this listener waits until status is complete
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    
  if (info.status=="complete") {
            
    chrome.tabs.executeScript(null, {file: "sjcl.js"});
    chrome.tabs.executeScript(null, {file: "cryptogram.js"});
                
    if (tab.url != background.lastCheck) {
      background.lastCheck = tab.url;

      if (localStorage["auto_decrypt"] == "true") {
        chrome.tabs.sendRequest(tabId, {"checkForSaved":1, "storage": localStorage}, null);
      }   
    }
  }  
});



// Uses messaging to get all images on the page then checks to see if we have any relevant passwords

background.checkForSavedPasswords = function(tabId) {

  chrome.tabs.sendRequest(tabId, { "getImages":1 }, function(response) {
            
    if (response.images) {
                
      for (i = 0; i < response.images.length; i++) {
            
        var testURL = response.images[i];
        var password = localStorage['password.' + testURL];
                
        if (password) {
          chrome.tabs.sendRequest(tabId, {"decodeURL":testURL, "password":password}, null);
        }
                                      
      }   
    }
  }); 
};



background.contextMenuID = chrome.contextMenus.create({
  "title" : "Decode Image",
  "type" : "normal",
  "contexts" : ["image"],
  "onclick" : background.getClickHandler()
});

