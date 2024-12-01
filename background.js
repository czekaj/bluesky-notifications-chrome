let bearerToken = null;

// Capture bearer token from requests
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    const authHeader = details.requestHeaders.find(header => header.name.toLowerCase() === 'authorization');
    if (authHeader) {
      const newToken = authHeader.value;
      // Check if token is different from stored one
      chrome.storage.local.get(['bearerToken'], function(result) {
        if (result.bearerToken !== newToken) {
          chrome.storage.local.set({ bearerToken: newToken });
          chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, { type: 'BEARER_TOKEN', token: newToken });
            });
          });
        }
      });
    }
  },
  { urls: ['*://*.bsky.network/*'] },
  ['requestHeaders']
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UNREAD_COUNT') {
    chrome.action.setBadgeText({
      text: message.count.toString()
    });
  }
}); 