let bearerToken = null;

// Listen for bearer token from background script
chrome.runtime.onMessage.addListener((message) => {
  console.log('Received message:', message);  // Debug log
  if (message.type === 'BEARER_TOKEN') {
    console.log('Setting bearer token');  // Debug log
    bearerToken = message.token;
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

// Check notifications every minute
setInterval(checkNotifications, 60000);
checkNotifications(); // Initial check 