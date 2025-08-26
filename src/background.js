// Simple background service worker for traffic monitoring

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PAGE_VISIT') {
        console.log('Page visited:', request.data.url);
        
        // You can add API calls here to fetch traffic data
        // For now, just acknowledge the visit
        sendResponse({ status: 'received' });
    }
});

// Listen for tab updates to track navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', tab.url);
        
        // Store basic tab info
        const tabData = {
            url: tab.url,
            title: tab.title,
            timestamp: Date.now()
        };
        
        // Store in chrome storage
        chrome.storage.local.get(['recentTabs'], (result) => {
            const tabs = result.recentTabs || [];
            tabs.unshift(tabData);
            
            // Keep only last 20 tabs
            if (tabs.length > 20) {
                tabs.splice(20);
            }
            
            chrome.storage.local.set({ recentTabs: tabs });
        });
    }
});

// Simple traffic analysis function
async function analyzeUrl(url) {
    try {
        const domain = new URL(url).hostname;
        
        // Return basic analysis
        return {
            domain: domain,
            isSecure: url.startsWith('https'),
            timestamp: Date.now()
        };
    } catch (error) {
        return null;
    }
}
