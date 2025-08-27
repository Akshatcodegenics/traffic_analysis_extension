// ===== BACKGROUND SERVICE WORKER =====

class TrafficBackgroundService {
    constructor() {
        this.updateInterval = null;
        this.notificationSettings = {
            enabled: true,
            trafficAlerts: true,
            routeUpdates: true
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.startPeriodicUpdates();
    }

    setupEventListeners() {
        // Extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onInstall();
            } else if (details.reason === 'update') {
                this.onUpdate();
            }
        });

        // Message handling
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Alarm handling for periodic tasks
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });

        // Command handling (keyboard shortcuts)
        chrome.commands.onCommand.addListener((command) => {
            this.handleCommand(command);
        });

        // Tab updates for context-aware notifications
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabChange(activeInfo);
        });
    }

    onInstall() {
        // Set default settings
        chrome.storage.sync.set({
            theme: 'light',
            notifications: true,
            autoRefresh: true,
            voiceAlerts: false,
            analytics: true,
            pinnedRoutes: [],
            favoriteLocations: []
        });

        // Create periodic alarms
        chrome.alarms.create('trafficUpdate', { periodInMinutes: 5 });
        chrome.alarms.create('routeCheck', { periodInMinutes: 15 });

        // Show welcome notification
        this.showNotification({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'Traffic Analyzer Pro Installed!',
            message: 'Click the extension icon to start analyzing traffic patterns.'
        });
    }

    onUpdate() {
        console.log('Traffic Analyzer Pro updated to version', chrome.runtime.getManifest().version);
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'EXTENSION_READY':
                this.handleExtensionReady(message.data, sendResponse);
                break;
            
            case 'GET_TRAFFIC_DATA':
                this.getTrafficData(message.data, sendResponse);
                break;
            
            case 'UPDATE_SETTINGS':
                this.updateSettings(message.data, sendResponse);
                break;
            
            case 'ADD_PINNED_ROUTE':
                this.addPinnedRoute(message.data, sendResponse);
                break;
            
            case 'REMOVE_PINNED_ROUTE':
                this.removePinnedRoute(message.data, sendResponse);
                break;
            
            case 'GET_ROUTE_SUGGESTIONS':
                this.getRouteSuggestions(message.data, sendResponse);
                break;
            
            case 'REQUEST_LOCATION':
                this.requestLocation(sendResponse);
                break;
        }
    }

    handleAlarm(alarm) {
        switch (alarm.name) {
            case 'trafficUpdate':
                this.updateTrafficData();
                break;
            
            case 'routeCheck':
                this.checkPinnedRoutes();
                break;
        }
    }

    handleCommand(command) {
        switch (command) {
            case 'open_dashboard':
                chrome.action.openPopup();
                break;
            
            case 'refresh_data':
                this.broadcastMessage({
                    type: 'TRAFFIC_UPDATE',
                    data: { timestamp: Date.now() }
                });
                break;
        }
    }

    handleTabChange(activeInfo) {
        // Get current tab URL for context-aware features
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            if (tab.url && (tab.url.includes('maps.google.com') || tab.url.includes('waze.com'))) {
                this.broadcastMessage({
                    type: 'MAP_DETECTED',
                    data: { url: tab.url }
                });
            }
        });
    }

    handleExtensionReady(data, sendResponse) {
        console.log('Extension popup ready at:', new Date(data.timestamp));
        
        // Send initial data
        this.getTrafficData({}, (trafficData) => {
            sendResponse({
                success: true,
                data: trafficData
            });
        });
    }

    async getTrafficData(params, sendResponse) {
        try {
            // Simulate API call to traffic service
            const trafficData = await this.fetchTrafficData(params);
            
            sendResponse({
                success: true,
                data: trafficData,
                timestamp: Date.now()
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async fetchTrafficData(params) {
        // Simulate real traffic API response
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    averageTravelTime: 15 + Math.floor(Math.random() * 20),
                    trafficIndex: 60 + Math.floor(Math.random() * 40),
                    activeRoutes: 3 + Math.floor(Math.random() * 5),
                    trafficAlerts: Math.floor(Math.random() * 6),
                    heatmapData: this.generateHeatmapData(),
                    routeSuggestions: this.generateRouteSuggestions(),
                    predictions: this.generateTrafficPredictions()
                });
            }, 500 + Math.random() * 1000);
        });
    }

    generateHeatmapData() {
        const zones = [];
        for (let i = 0; i < 10; i++) {
            zones.push({
                id: `zone_${i}`,
                lat: 37.7749 + (Math.random() - 0.5) * 0.1,
                lng: -122.4194 + (Math.random() - 0.5) * 0.1,
                intensity: Math.floor(Math.random() * 100),
                type: ['smooth', 'moderate', 'heavy'][Math.floor(Math.random() * 3)]
            });
        }
        return zones;
    }

    generateRouteSuggestions() {
        const routes = [];
        const routeNames = ['Highway 101', 'Highway 280', 'Local Roads', 'Bay Bridge', 'Golden Gate'];
        
        for (let i = 0; i < 3; i++) {
            routes.push({
                id: `route_${i}`,
                name: `Via ${routeNames[i]}`,
                duration: 15 + Math.floor(Math.random() * 25),
                distance: 5 + Math.random() * 15,
                traffic: ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)],
                cost: Math.random() * 10,
                tolls: Math.random() * 5,
                recommended: i === 0 && Math.random() > 0.3
            });
        }
        
        return routes;
    }

    generateTrafficPredictions() {
        return {
            nextHour: {
                change: Math.random() > 0.5 ? 'improving' : 'worsening',
                percentage: 10 + Math.floor(Math.random() * 30),
                confidence: 75 + Math.floor(Math.random() * 20)
            },
            peakTime: {
                expectedTime: '17:30',
                severity: ['moderate', 'heavy'][Math.floor(Math.random() * 2)],
                duration: 90 + Math.floor(Math.random() * 60)
            }
        };
    }

    async updateTrafficData() {
        try {
            const currentData = await this.fetchTrafficData({});
            
            // Store updated data
            chrome.storage.local.set({
                latestTrafficData: currentData,
                lastUpdate: Date.now()
            });

            // Notify popup if open
            this.broadcastMessage({
                type: 'TRAFFIC_UPDATE',
                data: currentData
            });

            // Check for significant changes and notify user
            this.checkForTrafficAlerts(currentData);
            
        } catch (error) {
            console.error('Failed to update traffic data:', error);
        }
    }

    checkForTrafficAlerts(data) {
        const { trafficIndex, trafficAlerts } = data;
        
        // High traffic alert
        if (trafficIndex > 85) {
            this.showNotification({
                type: 'basic',
                iconUrl: 'icons/icon-48.png',
                title: 'Heavy Traffic Alert',
                message: `Traffic congestion is very high (${trafficIndex}%). Consider alternative routes.`,
                priority: 2
            });
        }

        // New traffic incidents
        if (trafficAlerts > 0) {
            this.showNotification({
                type: 'basic',
                iconUrl: 'icons/icon-48.png', 
                title: 'Traffic Incident Detected',
                message: `${trafficAlerts} new traffic incident(s) affecting your area.`,
                buttons: [
                    { title: 'View Details' },
                    { title: 'Dismiss' }
                ]
            });
        }
    }

    async checkPinnedRoutes() {
        try {
            const { pinnedRoutes } = await chrome.storage.sync.get('pinnedRoutes');
            
            if (!pinnedRoutes || pinnedRoutes.length === 0) return;

            for (const route of pinnedRoutes) {
                const routeData = await this.getRouteData(route);
                
                // Check for significant delays
                if (routeData.delay > route.normalDelay * 1.5) {
                    this.showNotification({
                        type: 'basic',
                        iconUrl: 'icons/icon-48.png',
                        title: `Route Alert: ${route.name}`,
                        message: `Unusual delays detected. Current ETA: ${routeData.eta}`,
                        buttons: [
                            { title: 'Find Alternative' },
                            { title: 'Dismiss' }
                        ]
                    });
                }
            }
        } catch (error) {
            console.error('Failed to check pinned routes:', error);
        }
    }

    async getRouteData(route) {
        // Simulate route-specific data fetch
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    eta: `${15 + Math.floor(Math.random() * 25)} min`,
                    delay: 5 + Math.floor(Math.random() * 20),
                    normalDelay: 8,
                    traffic: ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)]
                });
            }, 300);
        });
    }

    loadSettings() {
        chrome.storage.sync.get([
            'notifications',
            'autoRefresh', 
            'voiceAlerts',
            'analytics'
        ]).then((settings) => {
            this.notificationSettings = {
                enabled: settings.notifications !== false,
                trafficAlerts: true,
                routeUpdates: true
            };
        });
    }

    updateSettings(settings, sendResponse) {
        chrome.storage.sync.set(settings).then(() => {
            this.loadSettings();
            sendResponse({ success: true });
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
    }

    addPinnedRoute(route, sendResponse) {
        chrome.storage.sync.get('pinnedRoutes').then((data) => {
            const pinnedRoutes = data.pinnedRoutes || [];
            pinnedRoutes.push({
                ...route,
                id: Date.now().toString(),
                addedAt: Date.now()
            });
            
            return chrome.storage.sync.set({ pinnedRoutes });
        }).then(() => {
            sendResponse({ success: true });
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
    }

    removePinnedRoute(routeId, sendResponse) {
        chrome.storage.sync.get('pinnedRoutes').then((data) => {
            const pinnedRoutes = (data.pinnedRoutes || []).filter(route => route.id !== routeId);
            return chrome.storage.sync.set({ pinnedRoutes });
        }).then(() => {
            sendResponse({ success: true });
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
    }

    getRouteSuggestions(params, sendResponse) {
        // Simulate getting route suggestions
        setTimeout(() => {
            const suggestions = this.generateRouteSuggestions();
            sendResponse({
                success: true,
                data: suggestions,
                timestamp: Date.now()
            });
        }, 800);
    }

    requestLocation(sendResponse) {
        // Request user's current location (requires user permission)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    sendResponse({
                        success: true,
                        data: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        }
                    });
                },
                (error) => {
                    sendResponse({
                        success: false,
                        error: error.message
                    });
                }
            );
        } else {
            sendResponse({
                success: false,
                error: 'Geolocation not supported'
            });
        }
    }

    startPeriodicUpdates() {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Start new update cycle
        this.updateInterval = setInterval(() => {
            this.updateTrafficData();
        }, 300000); // Update every 5 minutes
    }

    broadcastMessage(message) {
        // Send message to all extension contexts
        chrome.runtime.sendMessage(message).catch(() => {
            // Popup might not be open, ignore error
        });
    }

    async showNotification(options) {
        if (!this.notificationSettings.enabled) return;

        try {
            await chrome.notifications.create(options.id || `notification_${Date.now()}`, {
                type: options.type || 'basic',
                iconUrl: options.iconUrl || 'icons/icon-48.png',
                title: options.title,
                message: options.message,
                priority: options.priority || 1,
                buttons: options.buttons
            });
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    // Handle notification clicks
    setupNotificationHandlers() {
        chrome.notifications.onClicked.addListener((notificationId) => {
            // Open extension popup
            chrome.action.openPopup();
            chrome.notifications.clear(notificationId);
        });

        chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
            this.handleNotificationButton(notificationId, buttonIndex);
            chrome.notifications.clear(notificationId);
        });
    }

    handleNotificationButton(notificationId, buttonIndex) {
        if (notificationId.includes('route_alert')) {
            if (buttonIndex === 0) { // Find Alternative
                chrome.action.openPopup();
                setTimeout(() => {
                    this.broadcastMessage({
                        type: 'SHOW_ROUTE_ALTERNATIVES',
                        data: { notificationId }
                    });
                }, 500);
            }
        } else if (notificationId.includes('traffic_incident')) {
            if (buttonIndex === 0) { // View Details
                chrome.action.openPopup();
                setTimeout(() => {
                    this.broadcastMessage({
                        type: 'SHOW_HEATMAP',
                        data: { focus: 'incidents' }
                    });
                }, 500);
            }
        }
    }

    // Analytics and usage tracking
    trackUsage(event, data = {}) {
        chrome.storage.sync.get('analytics').then((settings) => {
            if (settings.analytics === false) return;

            const usage = {
                event,
                timestamp: Date.now(),
                data
            };

            chrome.storage.local.get('usageStats').then((stored) => {
                const stats = stored.usageStats || [];
                stats.push(usage);
                
                // Keep only last 1000 events
                if (stats.length > 1000) {
                    stats.splice(0, stats.length - 1000);
                }
                
                chrome.storage.local.set({ usageStats: stats });
            });
        });
    }

    // Cleanup function
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        chrome.alarms.clearAll();
    }
}

// ===== UTILITY FUNCTIONS =====
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ===== INITIALIZE BACKGROUND SERVICE =====
const backgroundService = new TrafficBackgroundService();

// Set up notification handlers
backgroundService.setupNotificationHandlers();

// Handle extension lifecycle
chrome.runtime.onSuspend.addListener(() => {
    backgroundService.cleanup();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficBackgroundService;
}
