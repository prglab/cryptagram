// Create a context menu which will only show up for images and link the menu
// item to getClickHandler

chrome.contextMenus.create({
    "title" : "Decrypt Image",
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
	
    if (info.status=="complete") {
        
	chrome.tabs.executeScript(null, {file: "sjcl.js"});
	chrome.tabs.executeScript(null, {file: "seemenot.js"});
    }
})

