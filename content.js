let bearerToken = null;

// Initialize by checking storage
chrome.storage.local.get(['bearerToken', 'enableFaviconBadges'], function(result) {
  if (result.bearerToken) {
    bearerToken = result.bearerToken;
    checkNotifications(); // Check immediately if we have a token
  }
  // Set default value for favicon badges if not set
  if (result.enableFaviconBadges === undefined) {
    chrome.storage.local.set({ enableFaviconBadges: true });
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

  // First XHR for unread count
  const countXhr = new XMLHttpRequest();
  countXhr.open('GET', 'https://shimeji.us-east.host.bsky.network/xrpc/app.bsky.notification.getUnreadCount', true);
  countXhr.setRequestHeader('Authorization', bearerToken);
  
  countXhr.onload = function() {
    if (countXhr.status === 200) {
      const response = JSON.parse(countXhr.responseText);
      const count = response.count;
      
      // If we have unread notifications, fetch their content
      if (count > 0) {
        fetchNotificationContent();
      }

      // Send message to update badge and favicon
      chrome.runtime.sendMessage({
        type: 'UNREAD_COUNT',
        count: count
      });

      // Store count in local storage
      chrome.storage.local.set({ unreadCount: count });

      // Update favicon if count exists and feature is enabled
      chrome.storage.local.get(['enableFaviconBadges'], function(result) {
        if (count > 0 && result.enableFaviconBadges) {
          updateFavicon(count);
        } else {
          restoreOriginalFavicon();
        }
      });

      // Setup click handler if not already set
      setupNotificationClickHandler();
    }
  };
  
  countXhr.send();
}

function fetchNotificationContent() {
  const contentXhr = new XMLHttpRequest();
  contentXhr.open('GET', 'https://shimeji.us-east.host.bsky.network/xrpc/app.bsky.notification.listNotifications', true);
  contentXhr.setRequestHeader('Authorization', bearerToken);
  
  contentXhr.onload = function() {
    if (contentXhr.status === 200) {
      const response = JSON.parse(contentXhr.responseText);
      // Filter for unread notifications only
      const unreadNotifications = response.notifications.filter(n => !n.isRead);
      
      // Store in local storage
      chrome.storage.local.set({ unreadNotifications });
    }
  };
  
  contentXhr.send();
}

// Add broadcast channel listener
const notificationsBroadcast = new BroadcastChannel('NOTIFS_BROADCAST_CHANNEL');
notificationsBroadcast.addEventListener('message', (event) => {
  const count = event.data.event === '30+' 
    ? 30 
    : event.data.event === '' 
      ? 0 
      : parseInt(event.data.event, 10) || 0;

  // Check current count in storage before updating
  chrome.storage.local.get(['unreadCount'], function(result) {
    const currentCount = result.unreadCount || 0;
    
    // Only proceed if count has changed
    if (currentCount !== count) {
      // Send message to update badge
      chrome.runtime.sendMessage({
        type: 'UNREAD_COUNT',
        count: count
      });

      // Store new count
      chrome.storage.local.set({ unreadCount: count });

      // Fetch notification content if we have unread notifications
      if (count > 0) {
        fetchNotificationContent();
      }

      // Update favicon if enabled
      chrome.storage.local.get(['enableFaviconBadges'], function(result) {
        if (count > 0 && result.enableFaviconBadges) {
          updateFavicon(count);
        } else {
          restoreOriginalFavicon();
        }
      });
    }
  });
});

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