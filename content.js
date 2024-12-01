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
      const count = response.count;
      
      // Send message to update badge and favicon
      chrome.runtime.sendMessage({
        type: 'UNREAD_COUNT',
        count: count
      });

      // Update favicon if count exists
      if (count > 0) {
        updateFavicon(count);
      } else {
        restoreOriginalFavicon();
      }

      // Setup click handler if not already set
      setupNotificationClickHandler();
    }
  };
  
  xhr.send();
}

// Check notifications every 30 seconds
setInterval(checkNotifications, 30000);
checkNotifications(); // Initial check 

function updateFavicon(count) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');

  // Get current favicon as base
  const favicon = document.querySelector('link[rel="icon"]') ||
                 document.querySelector('link[rel="shortcut icon"]');
  const img = new Image();
  
  img.onload = function() {
    // Draw original favicon
    ctx.drawImage(img, 0, 0, 16, 16);

    // Draw notification badge
    ctx.fillStyle = '#FF3E00';
    ctx.beginPath();
    ctx.arc(12, 4, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Add count text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 6px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 99 ? '99+' : count.toString(), 12, 4);

    // Update favicon
    updateFaviconLink(canvas.toDataURL());
  };

  img.src = favicon ? favicon.href : '/favicon.ico';
}

function restoreOriginalFavicon() {
  const favicon = document.querySelector('link[rel="icon"]') ||
                 document.querySelector('link[rel="shortcut icon"]');
  if (favicon) {
    favicon.href = favicon.dataset.originalHref || favicon.href;
  }
}

function updateFaviconLink(dataUrl) {
  let favicon = document.querySelector('link[rel="icon"]') ||
                document.querySelector('link[rel="shortcut icon"]');
  
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }

  // Store original href if not already stored
  if (!favicon.dataset.originalHref) {
    favicon.dataset.originalHref = favicon.href;
  }

  favicon.type = 'image/x-icon';
  favicon.href = dataUrl;
}

// Add this new function
function setupNotificationClickHandler() {
  const notificationLink = document.querySelector('a[aria-label="Notifications"]');
  if (notificationLink) {
    notificationLink.addEventListener('click', () => {
      // Send message to update badge to zero
      chrome.runtime.sendMessage({
        type: 'UNREAD_COUNT',
        count: 0
      });
      restoreOriginalFavicon();
    });
  }
}