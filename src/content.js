// Simple content script to monitor URL changes and send data to popup

// Get current URL and basic page info
function getCurrentPageData() {
    return {
        url: window.location.href,
        domain: window.location.hostname,
        title: document.title,
        timestamp: Date.now()
    };
}

// Store page visit data
function storePageData() {
    const pageData = getCurrentPageData();
    
    // Send to background script for processing
    chrome.runtime.sendMessage({
        type: 'PAGE_VISIT',
        data: pageData
    });
    
    // Store in local storage for popup access
    chrome.storage.local.get(['visitedSites'], (result) => {
        const sites = result.visitedSites || [];
        sites.unshift(pageData);
        
        // Keep only last 10 visits
        if (sites.length > 10) {
            sites.splice(10);
        }
        
        chrome.storage.local.set({ visitedSites: sites });
    });
}

// Monitor URL changes (for single-page applications)
let currentUrl = window.location.href;

function checkUrlChange() {
    if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        storePageData();
    }
}

// Initial page load
storePageData();

// Monitor for URL changes
setInterval(checkUrlChange, 1000);

// Monitor for navigation events
window.addEventListener('popstate', storePageData);
window.addEventListener('pushstate', storePageData);
window.addEventListener('replacestate', storePageData);
