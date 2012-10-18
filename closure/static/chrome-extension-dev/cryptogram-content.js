/**
 * @fileoverview In development, the JavaScript for the content script is
 * proxied through the background page so that it can be recompiled by plovr
 * without having to reload the extension.
 */
 
chrome.extension.sendRequest({'proxyContentScript': true}, eval);