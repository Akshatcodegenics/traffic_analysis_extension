// ===== CONTENT SCRIPT =====

class TrafficAnalyzerContent {
    constructor() {
        this.isInitialized = false;
        this.pageInfo = null;
        
        this.init();
    }

    /**
     * Initialize content script
     */
    init() {
        // Only initialize on relevant pages or when needed
        if (this.isRelevantPage()) {
            this.setupPageIntegration();
            this.setupMessageListener();
            this.extractPageInfo();
        }
        
        this.isInitialized = true;
    }

    /**
     * Check if current page is relevant for traffic analysis
     * @returns {boolean} True if page is relevant
     */
    isRelevantPage() {
        const url = window.location.href;
        const domain = window.location.hostname;
        
        // Check for maps, navigation, or travel-related sites
        const relevantDomains = [
            'maps.google.com',
            'waze.com',
            'bing.com/maps',
            'mapquest.com',
            'here.com',
            'tomtom.com'
        ];
        
        const relevantKeywords = [
            'maps', 'directions', 'navigation', 'traffic', 'route'
        ];
        
        // Check domain
        if (relevantDomains.some(d => domain.includes(d))) {
            return true;
        }
        
        // Check URL for keywords
        if (relevantKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
            return true;
        }
        
        return false;
    }

    /**
     * Setup page integration features
     */
    setupPageIntegration() {
        this.injectTrafficOverlay();
        this.addContextMenus();
        this.monitorLocationChanges();
    }

    /**
     * Setup message listener for communication with background script
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true;
        });
    }

    /**
     * Handle messages from background script or popup
     * @param {Object} message - Message object
     * @param {Object} sender - Message sender
     * @param {Function} sendResponse - Response callback
     */
    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'GET_PAGE_INFO':
                sendResponse({
                    success: true,
                    data: this.getPageInfo()
                });
                break;
                
            case 'DATA_REFRESHED':
                this.handleDataRefresh(message);
                sendResponse({ success: true });
                break;
                
            case 'SHOW_TRAFFIC_OVERLAY':
                this.showTrafficOverlay(message.data);
                sendResponse({ success: true });
                break;
                
            case 'HIDE_TRAFFIC_OVERLAY':
                this.hideTrafficOverlay();
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    }

    /**
     * Extract relevant information from the current page
     */
    extractPageInfo() {
        const info = {
            url: window.location.href,
            domain: window.location.hostname,
            title: document.title,
            timestamp: Date.now()
        };
        
        // Extract location information if available
        info.locations = this.extractLocations();
        
        // Extract route information if on maps page
        if (this.isMapsPage()) {
            info.routes = this.extractRouteInfo();
        }
        
        this.pageInfo = info;
        
        // Send page info to background script
        chrome.runtime.sendMessage({
            type: 'PAGE_INFO_UPDATED',
            data: info
        });
    }

    /**
     * Extract location information from page
     * @returns {Array} Array of locations found on page
     */
    extractLocations() {
        const locations = [];
        
        // Look for address patterns in text content
        const addressRegex = /\b\d+\s+[\w\s]+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|circle|cir|court|ct|place|pl)\b/gi;
        const matches = document.body.textContent.match(addressRegex);
        
        if (matches) {
            matches.forEach(address => {
                locations.push({
                    type: 'address',
                    text: address.trim(),
                    confidence: 0.7
                });
            });
        }
        
        // Look for coordinates in data attributes or text
        const coordRegex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/g;
        const coordMatches = document.body.textContent.match(coordRegex);
        
        if (coordMatches) {
            coordMatches.forEach(coord => {
                const [lat, lng] = coord.split(',').map(c => parseFloat(c.trim()));
                if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                    locations.push({
                        type: 'coordinates',
                        lat: lat,
                        lng: lng,
                        confidence: 0.9
                    });
                }
            });
        }
        
        return locations.slice(0, 10); // Limit to first 10 locations
    }

    /**
     * Extract route information from maps pages
     * @returns {Array} Array of route information
     */
    extractRouteInfo() {
        const routes = [];
        
        // This would be customized for each maps service
        if (window.location.hostname.includes('maps.google.com')) {
            routes.push(...this.extractGoogleMapsRoutes());
        }
        
        return routes;
    }

    /**
     * Extract routes from Google Maps (example implementation)
     * @returns {Array} Array of Google Maps routes
     */
    extractGoogleMapsRoutes() {
        const routes = [];
        
        try {
            // Look for route panels or direction elements
            const routeElements = document.querySelectorAll('[data-value="Directions"]');
            
            routeElements.forEach((element, index) => {
                const routeData = {
                    id: `google_route_${index}`,
                    source: 'google_maps',
                    element: element,
                    extracted: true
                };
                
                // Try to extract duration and distance
                const durationElement = element.querySelector('[jstcache="461"]');
                const distanceElement = element.querySelector('[jstcache="459"]');
                
                if (durationElement) {
                    routeData.duration = durationElement.textContent.trim();
                }
                
                if (distanceElement) {
                    routeData.distance = distanceElement.textContent.trim();
                }
                
                routes.push(routeData);
            });
        } catch (error) {
            console.log('Could not extract Google Maps routes:', error);
        }
        
        return routes;
    }

    /**
     * Check if current page is a maps page
     * @returns {boolean} True if maps page
     */
    isMapsPage() {
        const domain = window.location.hostname;
        const mapsKeywords = ['maps', 'directions', 'navigation'];
        
        return mapsKeywords.some(keyword => 
            domain.includes(keyword) || window.location.href.includes(keyword)
        );
    }

    /**
     * Get current page information
     * @returns {Object} Page information object
     */
    getPageInfo() {
        return this.pageInfo || {};
    }

    /**
     * Handle data refresh from background script
     * @param {Object} message - Refresh message
     */
    handleDataRefresh(message) {
        // Update any displayed traffic information
        if (this.trafficOverlayVisible) {
            this.refreshTrafficOverlay();
        }
        
        console.log('Traffic data refreshed at', new Date(message.timestamp));
    }

    /**
     * Inject traffic overlay into page
     */
    injectTrafficOverlay() {
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'traffic-analyzer-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-height: 400px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: none;
            overflow: hidden;
        `;
        
        document.body.appendChild(overlay);
        this.trafficOverlay = overlay;
    }

    /**
     * Add context menu functionality
     */
    addContextMenus() {
        document.addEventListener('contextmenu', (e) => {
            this.lastContextMenuEvent = {
                x: e.clientX,
                y: e.clientY,
                element: e.target
            };
        });
    }

    /**
     * Monitor location changes on single-page applications
     */
    monitorLocationChanges() {
        let lastUrl = location.href;
        
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(() => {
                    this.extractPageInfo();
                }, 1000); // Delay to let page content load
            }
        }).observe(document, { subtree: true, childList: true });
    }

    /**
     * Show traffic overlay with data
     * @param {Object} data - Traffic data to display
     */
    showTrafficOverlay(data) {
        if (!this.trafficOverlay) return;
        
        this.trafficOverlay.innerHTML = this.createOverlayContent(data);
        this.trafficOverlay.style.display = 'block';
        this.trafficOverlayVisible = true;
        
        // Add close button functionality
        const closeBtn = this.trafficOverlay.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideTrafficOverlay();
            });
        }
    }

    /**
     * Create overlay content HTML
     * @param {Object} data - Traffic data
     * @returns {string} HTML content
     */
    createOverlayContent(data) {
        return `
            <div style="padding: 16px; position: relative;">
                <button class="close-btn" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                    border-radius: 4px;
                ">×</button>
                
                <h3 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">
                    🚦 Traffic Analyzer
                </h3>
                
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 14px; color: #666;">Current Conditions</div>
                    <div style="font-size: 18px; font-weight: 600; color: #333;">
                        ${this.formatTrafficStatus(data)}
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                    <div style="flex: 1; text-align: center;">
                        <div style="font-size: 12px; color: #666;">Avg Speed</div>
                        <div style="font-size: 16px; font-weight: 600; color: #333;">
                            ${data.averageSpeed || 45} km/h
                        </div>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-size: 12px; color: #666;">Congestion</div>
                        <div style="font-size: 16px; font-weight: 600; color: #333;">
                            ${Math.round((data.averageCongestion || 0.4) * 100)}%
                        </div>
                    </div>
                </div>
                
                <div style="font-size: 11px; color: #999; text-align: center;">
                    Updated ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `;
    }

    /**
     * Format traffic status for display
     * @param {Object} data - Traffic data
     * @returns {string} Formatted status
     */
    formatTrafficStatus(data) {
        const congestion = data.averageCongestion || 0.4;
        
        if (congestion <= 0.3) return '🟢 Smooth Traffic';
        if (congestion <= 0.6) return '🟡 Moderate Traffic';
        return '🔴 Heavy Traffic';
    }

    /**
     * Hide traffic overlay
     */
    hideTrafficOverlay() {
        if (this.trafficOverlay) {
            this.trafficOverlay.style.display = 'none';
            this.trafficOverlayVisible = false;
        }
    }

    /**
     * Refresh traffic overlay with new data
     */
    async refreshTrafficOverlay() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_TRAFFIC_DATA',
                params: {}
            });
            
            if (response.success) {
                this.showTrafficOverlay(response.data.summary);
            }
        } catch (error) {
            console.error('Error refreshing traffic overlay:', error);
        }
    }
}

// Initialize content script
const contentScript = new TrafficAnalyzerContent();

// Make it available for debugging
window.TrafficAnalyzerContent = contentScript;
