console.log("Cryptagram Popup loaded");

document.getElementById('scan')?.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          console.log("Scanning page for Cryptagram images...");
          // Future: Implement page-wide scanning
        }
      });
    }
  });
});
