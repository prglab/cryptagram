goog.provide('cryptogram.extension');

goog.require('goog.dom');
goog.require('goog.net.XhrIo');


cryptogram.extension.settings = ['save_passwords',
                                 'auto_decrypt',
                                 'album_passwords'];
cryptogram.extension.lastCheck = '';


cryptogram.extension.onInstall =  function() {
  chrome.tabs.create({
    url: 'welcome.html'
  });
  console.log("Extension Installed");
}

cryptogram.extension.onUpdate = function() {
  chrome.tabs.create({
    url: 'welcome.html'
  });
  console.log("Extension Updated");
}

cryptogram.extension.getVersion = function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.extension.getURL("manifest.json"), false);
  var resp = "";
  xhr.send();
  resp = JSON.parse(xhr.responseText);
  return resp['version'];

  // NOTE(tierney): This should work, but I found it was unreliably compiled by
  // closure.
  // var details = chrome.app.getDetails();
  // return details.version;
}

cryptogram.extension.init = function() {
     
  // Create a context menu which will only show up for images and link the menu
  // item to getClickHandler.
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
        chrome.tabs.sendMessage(
            tabId,
            {'autoDecrypt': tab.url, 'storage': localStorage},
            null);
      }
    }
  });
  
  chrome.browserAction.setPopup({'popup':"popup.html"});

  // Check if the version has changed (installed or updated extension) and react
  // appropriately.
  var currVersion = cryptogram.extension.getVersion();
  var prevVersion = window.localStorage.getItem('version');
  if (currVersion != prevVersion) {
    // Check if we just installed this extension.
    if (typeof prevVersion == undefined) {
      cryptogram.extension.onInstall();
    } else {
      cryptogram.extension.onUpdate();
    }
    window.localStorage.setItem('version', currVersion);
  }
  
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
      chrome.tabs.sendMessage(tab.id, {'decryptURL':info['srcUrl'], 'storage': localStorage}, function(response) {
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
      chrome.tabs.sendMessage(tab.id, {'sendDebugReport': 1}, null); 
  }); 
};


/**
 * @param {function(*)} sendResponse Takes an argument that can be serialized as
 *     JSON.
 */
cryptogram.extension.proxyContentScript = function(sendResponse) {
  var url = 'http://localhost:2012/compile?id=cryptogram&mode=SIMPLE&pretty-print=true';
  goog.net.XhrIo.send(url, function(e) {
    var xhr = /** @type {goog.net.XhrIo} */ (e.target);
    sendResponse(xhr.getResponseText());
  });
};


/**
 * @param {Object} request JSON sent by sender.
 * @param {MessageSender} sender has a 'tab' property if sent from a content
 *     script.
 * @param {function(*)} sendResponse Call this to send a response to the
 *     request (which must be JSON).
 */
cryptogram.extension.onRequest = function(request, sender, sendResponse) {
  if (request['proxyContentScript'] == true) {
    cryptogram.extension.proxyContentScript(sendResponse);
  }
};


chrome.extension.onRequest.addListener(cryptogram.extension.onRequest);


goog.exportSymbol('cryptogram.extension.settings', cryptogram.extension.settings);
goog.exportSymbol('cryptogram.extension.showEncoder', cryptogram.extension.showEncoder);


cryptogram.extension.init();
