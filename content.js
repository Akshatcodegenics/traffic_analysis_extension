// ===== CONTENT SCRIPT FOR TRAFFIC ANALYZER =====

class TrafficContentScript {
    constructor() {
        this.initialized = false;
        this.mapDetected = false;
        this.injectedElements = [];
        
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        this.detectMapServices();
        this.setupMessageListener();
        this.injectTrafficOverlay();
        
        this.initialized = true;
        console.log('Traffic Analyzer content script loaded');
    }

    detectMapServices() {
        const url = window.location.href;
        
        if (url.includes('maps.google.com')) {
            this.mapDetected = true;
            this.handleGoogleMaps();
        } else if (url.includes('waze.com')) {
            this.mapDetected = true;
            this.handleWaze();
        } else if (url.includes('mapquest.com')) {
            this.mapDetected = true;
            this.handleMapQuest();
        }

        if (this.mapDetected) {
            this.notifyBackgroundScript();
        }
    }

    handleGoogleMaps() {
        // Add traffic analyzer integration to Google Maps
        setTimeout(() => {
            this.addGoogleMapsIntegration();
        }, 2000);
    }

    handleWaze() {
        // Add traffic analyzer integration to Waze
        setTimeout(() => {
            this.addWazeIntegration();
        }, 2000);
    }

    handleMapQuest() {
        // Add traffic analyzer integration to MapQuest
        setTimeout(() => {
            this.addMapQuestIntegration();
        }, 2000);
    }

    addGoogleMapsIntegration() {
        // Create floating widget for Google Maps
        const widget = this.createFloatingWidget();
        document.body.appendChild(widget);
        this.injectedElements.push(widget);

        // Listen for route changes in Google Maps
        this.observeGoogleMapsChanges();
    }

    addWazeIntegration() {
        // Create subtle integration for Waze
        const notification = this.createWazeNotification();
        document.body.appendChild(notification);
        this.injectedElements.push(notification);
    }

    addMapQuestIntegration() {
        // Create integration for MapQuest
        const sidebar = this.createMapQuestSidebar();
        document.body.appendChild(sidebar);
        this.injectedElements.push(sidebar);
    }

    createFloatingWidget() {
        const widget = document.createElement('div');
        widget.id = 'traffic-analyzer-widget';
        widget.innerHTML = `
            <div class="ta-widget">
                <div class="ta-widget-header">
                    <div class="ta-logo">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span>TrafficPro</span>
                    </div>
                    <button class="ta-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="ta-widget-content">
                    <div class="ta-stat">
                        <div class="ta-stat-value" id="ta-current-traffic">--</div>
                        <div class="ta-stat-label">Traffic Index</div>
                    </div>
                    <div class="ta-actions">
                        <button class="ta-btn ta-btn-primary" onclick="this.openExtension()">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            Analyze Route
                        </button>
                        <button class="ta-btn ta-btn-secondary" onclick="this.shareRoute()">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return widget;
    }

    createWazeNotification() {
        const notification = document.createElement('div');
        notification.id = 'traffic-analyzer-waze-notification';
        notification.innerHTML = `
            <div class="ta-notification">
                <div class="ta-notification-icon">🚦</div>
                <div class="ta-notification-content">
                    <strong>Traffic Analyzer Pro</strong>
                    <p>Enhanced traffic insights available</p>
                </div>
                <button class="ta-notification-action" onclick="this.openExtension()">Open</button>
                <button class="ta-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        return notification;
    }

    createMapQuestSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'traffic-analyzer-mapquest-sidebar';
        sidebar.innerHTML = `
            <div class="ta-sidebar">
                <div class="ta-sidebar-header">
                    <h3>Traffic Insights</h3>
                    <button class="ta-toggle" onclick="this.toggleSidebar()">◀</button>
                </div>
                <div class="ta-sidebar-content">
                    <div class="ta-quick-stats">
                        <div class="ta-quick-stat">
                            <span class="value" id="ta-avg-speed">--</span>
                            <span class="label">Avg Speed</span>
                        </div>
                        <div class="ta-quick-stat">
                            <span class="value" id="ta-delays">--</span>
                            <span class="label">Delays</span>
                        </div>
                    </div>
                    <button class="ta-full-analysis" onclick="this.openExtension()">
                        Full Analysis
                    </button>
                </div>
            </div>
        `;

        return sidebar;
    }

    observeGoogleMapsChanges() {
        // Observe changes in Google Maps interface
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.checkForRouteChanges();
                }
            });
        });

        const targetNode = document.querySelector('#app-container') || document.body;
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    }

    checkForRouteChanges() {
        // Detect route planning in Google Maps
        const routeElements = document.querySelectorAll('[data-value="Directions"]');
        if (routeElements.length > 0) {
            this.extractRouteInformation();
        }
    }

    extractRouteInformation() {
        // Extract current route information from Google Maps
        try {
            const startInput = document.querySelector('input[placeholder*="Starting point"]');
            const endInput = document.querySelector('input[placeholder*="Destination"]');
            
            if (startInput && endInput) {
                const routeInfo = {
                    from: startInput.value || 'Current Location',
                    to: endInput.value || 'Destination',
                    timestamp: Date.now()
                };

                // Send to background script
                chrome.runtime.sendMessage({
                    type: 'ROUTE_DETECTED',
                    data: routeInfo
                });
            }
        } catch (error) {
            console.error('Failed to extract route information:', error);
        }
    }

    injectTrafficOverlay() {
        if (!this.mapDetected) return;

        // Inject minimal traffic overlay for any map service
        const overlay = document.createElement('div');
        overlay.id = 'traffic-analyzer-overlay';
        overlay.innerHTML = `
            <div class="ta-overlay">
                <div class="ta-overlay-toggle" onclick="this.toggleOverlay()">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
                <div class="ta-overlay-content">
                    <div class="ta-live-indicator">
                        <div class="ta-pulse"></div>
                        <span>Live Traffic Data</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.injectedElements.push(overlay);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'UPDATE_WIDGET_DATA':
                    this.updateWidgetData(message.data);
                    break;
                
                case 'HIGHLIGHT_ROUTE':
                    this.highlightRoute(message.data);
                    break;
                
                case 'SHOW_TRAFFIC_ALERT':
                    this.showTrafficAlert(message.data);
                    break;
            }
        });
    }

    updateWidgetData(data) {
        // Update floating widget with real-time data
        const trafficElement = document.getElementById('ta-current-traffic');
        const speedElement = document.getElementById('ta-avg-speed');
        const delayElement = document.getElementById('ta-delays');

        if (trafficElement) {
            trafficElement.textContent = data.trafficIndex || '--';
        }
        if (speedElement) {
            speedElement.textContent = `${data.avgSpeed || '--'} mph`;
        }
        if (delayElement) {
            delayElement.textContent = `${data.delays || '--'} min`;
        }
    }

    highlightRoute(routeData) {
        // Add visual highlighting to detected routes
        const routeElements = document.querySelectorAll('[data-route]');
        routeElements.forEach(element => {
            if (routeData.recommended) {
                element.style.border = '2px solid #667eea';
                element.style.boxShadow = '0 0 10px rgba(102, 126, 234, 0.3)';
            }
        });
    }

    showTrafficAlert(alertData) {
        // Show in-page traffic alert
        const alert = document.createElement('div');
        alert.className = 'ta-traffic-alert';
        alert.innerHTML = `
            <div class="ta-alert-content">
                <div class="ta-alert-icon">⚠️</div>
                <div class="ta-alert-message">
                    <strong>${alertData.title}</strong>
                    <p>${alertData.message}</p>
                </div>
                <button class="ta-alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    notifyBackgroundScript() {
        chrome.runtime.sendMessage({
            type: 'MAP_SERVICE_DETECTED',
            data: {
                service: this.getMapService(),
                url: window.location.href,
                timestamp: Date.now()
            }
        });
    }

    getMapService() {
        const url = window.location.href;
        
        if (url.includes('maps.google.com')) return 'google_maps';
        if (url.includes('waze.com')) return 'waze';
        if (url.includes('mapquest.com')) return 'mapquest';
        if (url.includes('bing.com/maps')) return 'bing_maps';
        
        return 'unknown';
    }

    cleanup() {
        // Remove all injected elements
        this.injectedElements.forEach(element => {
            if (element.parentElement) {
                element.remove();
            }
        });
        
        this.injectedElements = [];
    }
}

// ===== GLOBAL FUNCTIONS FOR WIDGET INTERACTIONS =====
window.openExtension = function() {
    chrome.runtime.sendMessage({
        type: 'OPEN_EXTENSION',
        data: { source: 'content_script' }
    });
};

window.shareRoute = function() {
    const currentRoute = window.location.href;
    navigator.clipboard.writeText(currentRoute).then(() => {
        console.log('Route URL copied to clipboard');
    });
};

window.toggleOverlay = function() {
    const overlay = document.querySelector('.ta-overlay-content');
    if (overlay) {
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    }
};

window.toggleSidebar = function() {
    const sidebar = document.querySelector('.ta-sidebar');
    const toggle = document.querySelector('.ta-toggle');
    
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        toggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
    }
};

// ===== INITIALIZATION =====
// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TrafficContentScript();
    });
} else {
    new TrafficContentScript();
}

// Handle dynamic page changes (for SPAs)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        
        // Reinitialize if needed
        setTimeout(() => {
            new TrafficContentScript();
        }, 1000);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    if (e.error && e.error.message.includes('traffic-analyzer')) {
        console.error('Traffic Analyzer content script error:', e.error);
    }
});

// ===== CLEANUP ON PAGE UNLOAD =====
window.addEventListener('beforeunload', () => {
    observer.disconnect();
});
