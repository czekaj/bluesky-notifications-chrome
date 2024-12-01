chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UNREAD_COUNT') {
    document.getElementById('count').textContent = message.count;
  }
}); 