goog.provide('cryptogram.extension');

goog.require('goog.dom');

goog.require('goog.debug.Logger');
goog.require('goog.debug.FancyWindow');




cryptogram.extension.settings = ['save_passwords', 'auto_decrypt', 'album_passwords'];
cryptogram.extension.lastCheck = '';

cryptogram.extension.logger = goog.debug.Logger.getLogger('cryptogram.extension');

cryptogram.extension.init = function() {
    
  var debugWindow = new goog.debug.FancyWindow('main');
  debugWindow.setEnabled(true);
  debugWindow.init();
  
  cryptogram.extension.logger.info('Initializing extension.');

    
  // Create a context menu which will only show up for images and link the menu
  // item to getClickHandler
  cryptogram.extension.contextMenuID = chrome.contextMenus.create({
    'title' : 'Decrypt Image',
    'type' : 'normal',
    'contexts' : ['image'],
    'onclick' : cryptogram.extension.getClickHandler()
  });
  
  for (var i = 0; i < cryptogram.extension.settings.length; i++) {
    var setting = cryptogram.extension.settings[i];
    if (!localStorage[setting]) localStorage[setting] = 'true';
  }
    
  chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    if (info['status'] == 'complete') {
      if (localStorage['auto_decrypt'] == 'true') {
        chrome.tabs.sendRequest(tabId, {'autoDecrypt': tab.url, 'storage': localStorage}, null);
      }
    }
  });
  
  chrome.browserAction.setPopup({'popup':"popup.html"});
  
//chrome.browserAction.onClicked.addListener(function(tab) {
//  chrome.tabs.create({url:chrome.extension.getURL("encoder.html")});
//});
};

cryptogram.extension.showEncoder = function() {

  
  chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendRequest(tab.id, {'showEncoder':1});
  });
};


// Sends the decodeURL message request to the current tabIndex
cryptogram.extension.getClickHandler = function() {
    
  return function(info, tab) {
  
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendRequest(tab.id, {'decryptURL':info['srcUrl'], 'storage': localStorage}, function(response) {
        if (response['outcome'] == 'success') {          
          localStorage[response.id] = response['password'];
          if(response['album'] != null) {
            localStorage[response['album']] = response['password'];              
          }     
        };
      });  
    });    
  };
};


cryptogram.extension.sendDebugReport = function() {
  chrome.tabs.getSelected(null, function(tab) {   
      chrome.tabs.sendRequest(tab.id, {'sendDebugReport': 1}, null); 
  }); 
};


goog.exportSymbol('cryptogram.extension.settings', cryptogram.extension.settings);
goog.exportSymbol('cryptogram.extension.showEncoder', cryptogram.extension.showEncoder);


cryptogram.extension.init();

