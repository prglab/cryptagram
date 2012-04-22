// Create a context menu which will only show up for images and link the menu
// item to getClickHandler

chrome.contextMenus.create({
  "title" : "Decrypt image",
  "type" : "normal",
  "contexts" : ["image"],
  "onclick" : getClickHandler()
});

// Sends the decodeURL message request to the current tab
function getClickHandler() {
  return function(info, tab) {
	  chrome.tabs.getSelected(null, function(tab) {
	    chrome.tabs.sendRequest(tab.id, {"decodeURL":info.srcUrl});
	  });

  };
};

// The JS files need to be loaded last, so this listener waits until status is complete
chrome.tabs.onUpdated.addListener(function(tabId, info) {
  console.log('Adding listener.');
  if (info.status == "complete") {
    console.log('Executing listener script.');
		chrome.tabs.executeScript(null, {file: "rewrite.js"});
  }
})

chrome.tabs.sendRequest(
  28, {"getDOM":""},
  function(response) {
    console.log('Response:' + response.dom);
    console.log('Response:' + response.astring);
    console.log('Response:' + response.request);
  }
);
