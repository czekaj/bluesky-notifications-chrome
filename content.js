let bearerToken = null;

// Initialize by checking storage
chrome.storage.local.get(['bearerToken'], function(result) {
  if (result.bearerToken) {
    bearerToken = result.bearerToken;
    checkNotifications(); // Check immediately if we have a token
  }
});

// Continue listening for updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'BEARER_TOKEN') {
    const hadNoToken = !bearerToken; // Check if this is the first time we're getting a token
    bearerToken = message.token;
    if (hadNoToken) {
      checkNotifications(); // Check immediately if this was our first token
    }
  }
});

function checkNotifications() {
  if (!bearerToken) {
    console.log('Waiting for bearer token...');
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://shimeji.us-east.host.bsky.network/xrpc/app.bsky.notification.getUnreadCount', true);
  xhr.setRequestHeader('Authorization', bearerToken);
  
  xhr.onload = function() {
    console.log(xhr.responseText);
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      chrome.runtime.sendMessage({
        type: 'UNREAD_COUNT',
        count: response.count
      });
    }
  };
  
  xhr.send();
}

// Check notifications every 30 seconds
setInterval(checkNotifications, 30000);
checkNotifications(); // Initial check 