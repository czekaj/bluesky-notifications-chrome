// Saves options to chrome.storage
function saveOptions() {
  const enableFaviconBadges = document.getElementById('enableFaviconBadges').checked;
  chrome.storage.local.set({
    enableFaviconBadges: enableFaviconBadges
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.local.get({
    enableFaviconBadges: true  // default value
  }, function(items) {
    document.getElementById('enableFaviconBadges').checked = items.enableFaviconBadges;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('enableFaviconBadges').addEventListener('change', saveOptions); 