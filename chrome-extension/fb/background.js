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
		
		var password = localStorage['password.' + info.srcUrl];
		if (!password) {
			password = prompt("Enter password for\n"+info.srcUrl,"helloworld");     
		}
		chrome.tabs.sendRequest(tab.id, {"decodeURL":info.srcUrl, "password":password}, function(response) {
	    	
	    if (response.outcome == "success") {
	    	alert("Success");
	    	//localStorage['password.' + info.srcUrl] = password;
	    }
	    	
	    });
	}); 
		
    };
};


// Keep track of last checked URL since the FB JS seems to lead to double complete events sometimes
var lastCheck = "";

   
// The JS files need to be loaded last, so this listener waits until status is complete
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
	
    if (info.status=="complete") {
    	    
		chrome.tabs.executeScript(null, {file: "sjcl.js"});
		chrome.tabs.executeScript(null, {file: "cryptogram.js"});
				
		if (tab.url != lastCheck) {
    		lastCheck = tab.url;
    		//checkForSavedPasswords(tab.id);
       	} 
		
		
    }
})


// Uses messaging to get all images on the page then checks to see if we have any relevant passwords

function checkForSavedPasswords(tabId) {

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
}