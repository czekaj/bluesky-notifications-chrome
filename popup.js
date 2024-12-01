function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function getReasonText(notification) {
  switch(notification.reason) {
    case 'like': return 'liked your post';
    case 'repost': return 'reposted your post';
    case 'follow': return 'followed you';
    case 'mention': return 'mentioned you';
    case 'reply': return 'replied to your post';
    default: return notification.reason;
  }
}

// Update notification display
function displayNotifications() {
  chrome.storage.local.get(['unreadNotifications'], function(result) {
    const notifications = result.unreadNotifications || [];
    const container = document.getElementById('notifications');
    container.innerHTML = '';
    
    notifications.forEach(notification => {
      const notifEl = document.createElement('div');
      notifEl.className = 'notification';
      notifEl.innerHTML = `
        <img class="avatar" src="${notification.author.avatar || 'default-avatar.png'}" />
        <div class="content">
          <div class="author">${notification.author.displayName || notification.author.handle}</div>
          <div class="reason">${getReasonText(notification)}</div>
          <div class="time">${formatTime(notification.indexedAt)}</div>
        </div>
      `;
      container.appendChild(notifEl);
    });
  });
}

// Listen for unread count updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UNREAD_COUNT') {
    document.getElementById('count').textContent = message.count;
    displayNotifications();
  }
});

// Initial load
displayNotifications(); 