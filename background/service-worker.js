// Dynamic Island Extension - Service Worker
console.log('Dynamic Island extension loaded');

// Open Side Panel (Overlay) when clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle_sidebar' });
});