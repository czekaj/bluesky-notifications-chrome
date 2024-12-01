let bearerToken = null;

// Capture bearer token from requests
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    console.log('Intercepted request:', details.url);  // Debug log
    const authHeader = details.requestHeaders.find(header => header.name.toLowerCase() === 'authorization');
    if (authHeader) {
      console.log('Found bearer token');  // Debug log
      bearerToken = authHeader.value;
      // Broadcast token to content script
      chrome.tabs.query({}, function(tabs) {
        console.log('Broadcasting to', tabs.length, 'tabs');  // Debug log
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { type: 'BEARER_TOKEN', token: bearerToken });
        });
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