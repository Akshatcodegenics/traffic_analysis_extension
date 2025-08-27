// ===== BACKGROUND SERVICE WORKER =====

class TrafficAnalyzerBackground {
    constructor() {
        this.isEnabled = true;
        this.refreshInterval = 60000; // 1 minute default
        this.dataCache = new Map();
        this.lastFetch = 0;
        this.activeRequests = new Set();
        
        this.init();
    }

    /**
     * Initialize background service worker
     */
    init() {
        this.setupEventListeners();
        this.startPeriodicRefresh();
        console.log('Traffic Analyzer Background Service Worker initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle extension installation/startup
        chrome.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });

        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstalled(details);
        });

        // Handle messages from popup and content scripts
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Handle tab updates for location-based features
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Handle alarm for periodic data refresh
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
    }

    /**
     * Handle extension startup
     */
    async handleStartup() {
        console.log('Extension started');
        await this.loadSettings();
        this.scheduleDataRefresh();
    }

    /**
     * Handle extension installation
     * @param {Object} details - Installation details
     */
    async handleInstalled(details) {
        console.log('Extension installed:', details.reason);
        
        if (details.reason === 'install') {
            // First time installation
            await this.initializeDefaultSettings();
            this.showWelcomeNotification();
        } else if (details.reason === 'update') {
            // Extension updated
            await this.handleUpdate(details.previousVersion);
        }
    }

    /**
     * Handle messages from other parts of the extension
     * @param {Object} message - Message object
     * @param {Object} sender - Message sender
     * @param {Function} sendResponse - Response callback
     */
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'GET_TRAFFIC_DATA':
                    const trafficData = await this.getTrafficData(message.params);
                    sendResponse({ success: true, data: trafficData });
                    break;

                case 'GET_ROUTE_SUGGESTIONS':
                    const routes = await this.getRouteSuggestions(message.params);
                    sendResponse({ success: true, data: routes });
                    break;

                case 'UPDATE_SETTINGS':
                    await this.updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'REFRESH_DATA':
                    await this.refreshAllData();
                    sendResponse({ success: true });
                    break;

                case 'GET_CACHED_DATA':
                    const cachedData = this.getCachedData(message.key);
                    sendResponse({ success: true, data: cachedData });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * Handle tab updates
     * @param {number} tabId - Tab ID
     * @param {Object} changeInfo - Change information
     * @param {Object} tab - Tab object
     */
    handleTabUpdate(tabId, changeInfo, tab) {
        // Update badge or take action based on current page
        if (changeInfo.status === 'complete' && tab.url) {
            this.updateBadgeForTab(tab);
        }
    }

    /**
     * Handle alarms for scheduled tasks
     * @param {Object} alarm - Alarm object
     */
    async handleAlarm(alarm) {
        switch (alarm.name) {
            case 'refresh-traffic-data':
                await this.refreshAllData();
                break;
            case 'cleanup-cache':
                this.cleanupCache();
                break;
        }
    }

    /**
     * Get traffic data
     * @param {Object} params - Request parameters
     * @returns {Object} Traffic data
     */
    async getTrafficData(params = {}) {
        const cacheKey = `traffic_${JSON.stringify(params)}`;
        const cached = this.dataCache.get(cacheKey);
        
        // Return cached data if fresh
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
            return cached.data;
        }

        // Fetch fresh data
        try {
            const data = await this.fetchTrafficData(params);
            this.dataCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching traffic data:', error);
            // Return cached data if available, even if stale
            return cached ? cached.data : this.generateMockTrafficData(params);
        }
    }

    /**
     * Fetch traffic data from APIs
     * @param {Object} params - Request parameters
     * @returns {Object} Traffic data
     */
    async fetchTrafficData(params) {
        // In a real implementation, this would call actual traffic APIs
        // For demo purposes, we'll generate realistic mock data
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.generateMockTrafficData(params));
            }, 1000);
        });
    }

    /**
     * Generate mock traffic data for demonstration
     * @param {Object} params - Request parameters
     * @returns {Object} Mock traffic data
     */
    generateMockTrafficData(params) {
        const currentTime = new Date();
        const hour = currentTime.getHours();
        
        // Traffic patterns based on time of day
        let baseCongestion = 0.3;
        if (hour >= 7 && hour <= 9) baseCongestion = 0.8; // Morning rush
        if (hour >= 17 && hour <= 19) baseCongestion = 0.9; // Evening rush
        if (hour >= 12 && hour <= 14) baseCongestion = 0.6; // Lunch time
        if (hour >= 22 || hour <= 5) baseCongestion = 0.1; // Night time

        const trafficPoints = [];
        for (let i = 0; i < 50; i++) {
            const congestion = Math.max(0, Math.min(1, 
                baseCongestion + (Math.random() - 0.5) * 0.4
            ));
            
            trafficPoints.push({
                id: `point_${i}`,
                lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                lng: -74.0060 + (Math.random() - 0.5) * 0.1,
                congestion: congestion,
                speed: Math.round((1 - congestion) * 80 + 20), // 20-100 km/h
                timestamp: Date.now()
            });
        }

        return {
            points: trafficPoints,
            summary: {
                averageCongestion: baseCongestion,
                averageSpeed: Math.round((1 - baseCongestion) * 80 + 20),
                totalPoints: trafficPoints.length,
                lastUpdated: Date.now()
            }
        };
    }

    /**
     * Get route suggestions
     * @param {Object} params - Route parameters
     * @returns {Array} Route suggestions
     */
    async getRouteSuggestions(params) {
        const { from, to, departureTime } = params;
        
        // Generate mock route suggestions
        const routes = [];
        const routeCount = 3;
        
        for (let i = 0; i < routeCount; i++) {
            const baseDistance = 15000 + Math.random() * 10000; // 15-25 km
            const baseDuration = 20 + Math.random() * 20; // 20-40 minutes
            const congestionFactor = 0.3 + Math.random() * 0.7;
            
            routes.push({
                id: `route_${i}`,
                name: `Route ${i + 1}`,
                distance: Math.round(baseDistance),
                duration: Math.round(baseDuration * (1 + congestionFactor * 0.5)),
                congestion: congestionFactor,
                status: congestionFactor <= 0.4 ? 'optimal' : 
                        congestionFactor <= 0.7 ? 'moderate' : 'congested',
                eta: new Date(Date.now() + baseDuration * (1 + congestionFactor * 0.5) * 60000),
                polyline: this.generateMockPolyline(from, to),
                incidents: Math.random() < 0.3 ? ['Minor traffic incident'] : []
            });
        }
        
        // Sort by duration (fastest first)
        routes.sort((a, b) => a.duration - b.duration);
        
        return routes;
    }

    /**
     * Generate mock polyline for route visualization
     * @param {Object} from - Start location
     * @param {Object} to - End location
     * @returns {Array} Polyline points
     */
    generateMockPolyline(from, to) {
        const points = [];
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const lat = from.lat + (to.lat - from.lat) * progress;
            const lng = from.lng + (to.lng - from.lng) * progress;
            
            // Add some randomness to make routes look different
            const offsetLat = (Math.random() - 0.5) * 0.01;
            const offsetLng = (Math.random() - 0.5) * 0.01;
            
            points.push({
                lat: lat + offsetLat,
                lng: lng + offsetLng
            });
        }
        
        return points;
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        const result = await chrome.storage.sync.get({
            refreshInterval: 60000,
            notifications: true,
            theme: 'light'
        });
        
        this.refreshInterval = result.refreshInterval;
        this.notificationsEnabled = result.notifications;
    }

    /**
     * Update settings
     * @param {Object} settings - New settings
     */
    async updateSettings(settings) {
        await chrome.storage.sync.set(settings);
        await this.loadSettings();
        
        // Reschedule refresh if interval changed
        if (settings.refreshInterval !== undefined) {
            this.scheduleDataRefresh();
        }
    }

    /**
     * Initialize default settings on first install
     */
    async initializeDefaultSettings() {
        await chrome.storage.sync.set({
            refreshInterval: 60000,
            notifications: true,
            theme: 'light',
            favoriteRoutes: [],
            firstTime: false
        });
    }

    /**
     * Start periodic data refresh
     */
    startPeriodicRefresh() {
        this.scheduleDataRefresh();
    }

    /**
     * Schedule data refresh alarm
     */
    scheduleDataRefresh() {
        chrome.alarms.clear('refresh-traffic-data');
        
        if (this.refreshInterval > 0) {
            chrome.alarms.create('refresh-traffic-data', {
                delayInMinutes: this.refreshInterval / 60000,
                periodInMinutes: this.refreshInterval / 60000
            });
        }
    }

    /**
     * Refresh all cached data
     */
    async refreshAllData() {
        console.log('Refreshing all traffic data...');
        
        // Clear cache to force fresh data
        this.dataCache.clear();
        this.lastFetch = 0;
        
        // Notify active tabs about data refresh
        this.notifyDataRefresh();
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {*} Cached data
     */
    getCachedData(key) {
        const cached = this.dataCache.get(key);
        return cached ? cached.data : null;
    }

    /**
     * Clean up old cache entries
     */
    cleanupCache() {
        const maxAge = 30 * 60 * 1000; // 30 minutes
        const now = Date.now();
        
        for (const [key, value] of this.dataCache.entries()) {
            if (now - value.timestamp > maxAge) {
                this.dataCache.delete(key);
            }
        }
        
        console.log(`Cache cleanup completed. ${this.dataCache.size} entries remaining.`);
    }

    /**
     * Update badge for specific tab
     * @param {Object} tab - Tab object
     */
    updateBadgeForTab(tab) {
        // Update extension badge based on current traffic conditions
        chrome.action.setBadgeText({
            text: '🔴', // Could be traffic status indicator
            tabId: tab.id
        });

        chrome.action.setBadgeBackgroundColor({
            color: '#ef4444',
            tabId: tab.id
        });
    }

    /**
     * Show welcome notification on first install
     */
    showWelcomeNotification() {
        chrome.notifications.create('welcome', {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Traffic Analyzer Pro',
            message: 'Extension installed successfully! Click the icon to start analyzing traffic.'
        });
    }

    /**
     * Handle extension update
     * @param {string} previousVersion - Previous version
     */
    async handleUpdate(previousVersion) {
        console.log(`Updated from version ${previousVersion}`);
        
        // Handle any migration needed for new version
        // For now, just refresh data
        await this.refreshAllData();
    }

    /**
     * Notify all tabs about data refresh
     */
    notifyDataRefresh() {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'DATA_REFRESHED',
                    timestamp: Date.now()
                }).catch(() => {
                    // Ignore errors for tabs without content script
                });
            });
        });
    }
}

// Initialize background service worker
const backgroundService = new TrafficAnalyzerBackground();

// Make it globally available for debugging
self.TrafficAnalyzerBackground = backgroundService;
