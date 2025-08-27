// ===== DATA MANAGER =====

class DataManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.apiEndpoints = {
            traffic: '/api/traffic',
            routes: '/api/routes',
            analytics: '/api/analytics'
        };
        this.isOnline = navigator.onLine;
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            Utils.events.emit('connectionStatusChanged', { online: true });
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            Utils.events.emit('connectionStatusChanged', { online: false });
        });

        // Listen for storage changes
        Utils.events.on('settingsChanged', (settings) => {
            this.handleSettingsChange(settings);
        });
    }

    /**
     * Get traffic data for a specific location
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Traffic data
     */
    async getTrafficData(params = {}) {
        const cacheKey = `traffic_${JSON.stringify(params)}`;
        
        // Try cache first
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            let data;
            
            // Use background script if available, otherwise direct API call
            if (chrome && chrome.runtime) {
                data = await this.sendMessageToBackground({
                    type: 'GET_TRAFFIC_DATA',
                    params: params
                });
            } else {
                data = await this.fetchTrafficDataDirect(params);
            }
            
            // Cache the result
            this.setCache(cacheKey, data);
            
            // Emit data update event
            Utils.events.emit('dataUpdated', {
                type: 'traffic',
                data: data
            });
            
            return data;
            
        } catch (error) {
            console.error('Error fetching traffic data:', error);
            
            // Return cached data if available, even if stale
            return this.getFromCache(cacheKey, true) || this.generateFallbackTrafficData(params);
        }
    }

    /**
     * Get route suggestions
     * @param {Object} params - Route parameters
     * @returns {Promise<Array>} Route suggestions
     */
    async getRouteSuggestions(params) {
        const { from, to, departureTime } = params;
        const cacheKey = `routes_${from}_${to}_${departureTime}`;
        
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            let data;
            
            if (chrome && chrome.runtime) {
                data = await this.sendMessageToBackground({
                    type: 'GET_ROUTE_SUGGESTIONS',
                    params: params
                });
            } else {
                data = await this.fetchRouteSuggestionsDirect(params);
            }
            
            this.setCache(cacheKey, data);
            
            Utils.events.emit('dataUpdated', {
                type: 'routes',
                data: data
            });
            
            return data;
            
        } catch (error) {
            console.error('Error fetching route suggestions:', error);
            return this.getFromCache(cacheKey, true) || this.generateFallbackRoutes(params);
        }
    }

    /**
     * Get analytics data
     * @param {Object} params - Analytics parameters
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalyticsData(params = {}) {
        const cacheKey = `analytics_${JSON.stringify(params)}`;
        
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const data = await this.fetchAnalyticsDataDirect(params);
            this.setCache(cacheKey, data);
            
            Utils.events.emit('dataUpdated', {
                type: 'analytics',
                data: data
            });
            
            return data;
            
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            return this.getFromCache(cacheKey, true) || this.generateFallbackAnalytics(params);
        }
    }

    /**
     * Send message to background script
     * @param {Object} message - Message to send
     * @returns {Promise<*>} Response from background script
     */
    async sendMessageToBackground(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response?.error || 'Unknown error'));
                }
            });
        });
    }

    /**
     * Fetch traffic data directly (fallback method)
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Traffic data
     */
    async fetchTrafficDataDirect(params) {
        // In a real implementation, this would make HTTP requests to traffic APIs
        // For demo purposes, generate mock data
        return this.generateMockTrafficData(params);
    }

    /**
     * Fetch route suggestions directly
     * @param {Object} params - Route parameters
     * @returns {Promise<Array>} Route suggestions
     */
    async fetchRouteSuggestionsDirect(params) {
        return this.generateMockRoutes(params);
    }

    /**
     * Fetch analytics data directly
     * @param {Object} params - Analytics parameters
     * @returns {Promise<Object>} Analytics data
     */
    async fetchAnalyticsDataDirect(params) {
        return this.generateMockAnalytics(params);
    }

    /**
     * Generate mock traffic data
     * @param {Object} params - Request parameters
     * @returns {Object} Mock traffic data
     */
    generateMockTrafficData(params) {
        const currentHour = new Date().getHours();
        let baseCongestion = 0.3;
        
        // Simulate traffic patterns
        if (currentHour >= 7 && currentHour <= 9) baseCongestion = 0.8;
        if (currentHour >= 17 && currentHour <= 19) baseCongestion = 0.9;
        if (currentHour >= 12 && currentHour <= 14) baseCongestion = 0.6;
        if (currentHour >= 22 || currentHour <= 5) baseCongestion = 0.1;

        const points = [];
        for (let i = 0; i < 50; i++) {
            const congestion = Math.max(0, Math.min(1, 
                baseCongestion + (Math.random() - 0.5) * 0.4
            ));
            
            points.push({
                id: `point_${i}`,
                lat: 40.7128 + (Math.random() - 0.5) * 0.2,
                lng: -74.0060 + (Math.random() - 0.5) * 0.2,
                congestion: congestion,
                speed: Math.round((1 - congestion) * 80 + 20),
                timestamp: Date.now(),
                roadType: ['highway', 'arterial', 'local'][Math.floor(Math.random() * 3)]
            });
        }

        return {
            points: points,
            summary: {
                averageCongestion: baseCongestion,
                averageSpeed: Math.round((1 - baseCongestion) * 80 + 20),
                totalPoints: points.length,
                lastUpdated: Date.now(),
                region: 'New York City'
            }
        };
    }

    /**
     * Generate mock route suggestions
     * @param {Object} params - Route parameters
     * @returns {Array} Mock routes
     */
    generateMockRoutes(params) {
        const routes = [];
        const routeNames = ['Via Highway', 'Scenic Route', 'Fastest Route'];
        
        for (let i = 0; i < 3; i++) {
            const baseDistance = 15000 + Math.random() * 10000;
            const baseDuration = 20 + Math.random() * 20;
            const congestionFactor = 0.2 + Math.random() * 0.8;
            
            routes.push({
                id: `route_${i}`,
                name: routeNames[i],
                distance: Math.round(baseDistance),
                duration: Math.round(baseDuration * (1 + congestionFactor * 0.5)),
                congestion: congestionFactor,
                status: Utils.getTrafficColor(congestionFactor),
                eta: Utils.calculateETA(baseDistance, (1 - congestionFactor) * 60 + 20),
                polyline: this.generateMockPolyline(),
                incidents: Math.random() < 0.3 ? ['Construction ahead'] : [],
                tollCost: Math.random() < 0.4 ? (5 + Math.random() * 15).toFixed(2) : null
            });
        }
        
        return routes.sort((a, b) => a.duration - b.duration);
    }

    /**
     * Generate mock polyline
     * @returns {Array} Polyline points
     */
    generateMockPolyline() {
        const points = [];
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            points.push({
                lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                lng: -74.0060 + (Math.random() - 0.5) * 0.1
            });
        }
        
        return points;
    }

    /**
     * Generate mock analytics data
     * @param {Object} params - Analytics parameters
     * @returns {Object} Mock analytics data
     */
    generateMockAnalytics(params) {
        const period = params.period || '24h';
        const dataPoints = period === '1h' ? 60 : period === '6h' ? 72 : 144;
        
        const speedData = [];
        const delayData = [];
        const congestionData = [];
        
        for (let i = 0; i < dataPoints; i++) {
            const hour = (Date.now() - (dataPoints - i) * 60000) / 1000 / 3600;
            const timeOfDay = hour % 24;
            
            let baseCongestion = 0.3;
            if (timeOfDay >= 7 && timeOfDay <= 9) baseCongestion = 0.8;
            if (timeOfDay >= 17 && timeOfDay <= 19) baseCongestion = 0.9;
            
            const congestion = baseCongestion + (Math.random() - 0.5) * 0.2;
            const speed = (1 - congestion) * 60 + 20 + (Math.random() - 0.5) * 10;
            const delay = congestion * 30 + (Math.random() - 0.5) * 10;
            
            speedData.push({
                timestamp: Date.now() - (dataPoints - i) * 60000,
                value: Math.max(10, Math.round(speed))
            });
            
            delayData.push({
                timestamp: Date.now() - (dataPoints - i) * 60000,
                value: Math.max(0, Math.round(delay))
            });
            
            congestionData.push({
                timestamp: Date.now() - (dataPoints - i) * 60000,
                value: Math.max(0, Math.min(1, congestion))
            });
        }
        
        return {
            speedTrends: speedData,
            delayPatterns: delayData,
            congestionLevels: congestionData,
            summary: {
                averageSpeed: speedData.reduce((sum, d) => sum + d.value, 0) / speedData.length,
                averageDelay: delayData.reduce((sum, d) => sum + d.value, 0) / delayData.length,
                peakCongestion: Math.max(...congestionData.map(d => d.value)),
                period: period
            }
        };
    }

    /**
     * Get data from cache
     * @param {string} key - Cache key
     * @param {boolean} ignoreTimeout - Ignore cache timeout
     * @returns {*} Cached data or null
     */
    getFromCache(key, ignoreTimeout = false) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (!ignoreTimeout && Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * Set data in cache
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        // Cleanup old cache entries
        this.cleanupCache();
    }

    /**
     * Clean up old cache entries
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout * 2) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
        Utils.events.emit('cacheCleared');
    }

    /**
     * Refresh all cached data
     */
    async refreshAllData() {
        this.clearCache();
        
        // Trigger refresh for all data types
        Utils.events.emit('dataRefreshRequested');
        
        try {
            // Get fresh data for common requests
            await Promise.all([
                this.getTrafficData(),
                this.getAnalyticsData({ period: '6h' })
            ]);
            
            Utils.events.emit('dataRefreshCompleted');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            Utils.events.emit('dataRefreshFailed', error);
        }
    }

    /**
     * Handle settings change
     * @param {Object} settings - New settings
     */
    handleSettingsChange(settings) {
        if (settings.refreshInterval !== undefined) {
            this.cacheTimeout = Math.max(settings.refreshInterval, 30000); // Min 30 seconds
        }
    }

    /**
     * Generate fallback traffic data when all else fails
     * @param {Object} params - Request parameters
     * @returns {Object} Fallback traffic data
     */
    generateFallbackTrafficData(params) {
        return {
            points: [],
            summary: {
                averageCongestion: 0.5,
                averageSpeed: 45,
                totalPoints: 0,
                lastUpdated: Date.now(),
                error: 'Unable to fetch real-time data'
            }
        };
    }

    /**
     * Generate fallback routes
     * @param {Object} params - Route parameters
     * @returns {Array} Fallback routes
     */
    generateFallbackRoutes(params) {
        return [{
            id: 'fallback_route',
            name: 'Default Route',
            distance: 20000,
            duration: 30,
            congestion: 0.5,
            status: 'moderate',
            eta: new Date(Date.now() + 30 * 60000),
            polyline: [],
            incidents: [],
            error: 'Unable to calculate optimal routes'
        }];
    }

    /**
     * Generate fallback analytics
     * @param {Object} params - Analytics parameters
     * @returns {Object} Fallback analytics
     */
    generateFallbackAnalytics(params) {
        return {
            speedTrends: [],
            delayPatterns: [],
            congestionLevels: [],
            summary: {
                averageSpeed: 45,
                averageDelay: 5,
                peakCongestion: 0.7,
                error: 'Unable to fetch analytics data'
            }
        };
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout,
            isOnline: this.isOnline,
            lastCleanup: this.lastCleanup || 'Never'
        };
    }
}

// Make DataManager globally available
window.DataManager = DataManager;
