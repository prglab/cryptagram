import { detectCryptagram } from '@cryptagram/core';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "decode-cryptagram",
    title: "Decode with Cryptagram",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "decode-cryptagram" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "DECODE_IMAGE",
      src: info.srcUrl
    });
  }
});
