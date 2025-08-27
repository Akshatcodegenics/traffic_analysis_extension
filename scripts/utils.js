// ===== UTILITY FUNCTIONS =====

/**
 * Utility class for common operations
 */
class Utils {
    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately
     * @returns {Function} Debounced function
     */
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Format time duration
     * @param {number} minutes - Duration in minutes
     * @returns {string} Formatted duration
     */
    static formatDuration(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}min`;
    }

    /**
     * Format distance
     * @param {number} meters - Distance in meters
     * @returns {string} Formatted distance
     */
    static formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    }

    /**
     * Format speed
     * @param {number} kmh - Speed in km/h
     * @returns {string} Formatted speed
     */
    static formatSpeed(kmh) {
        return `${Math.round(kmh)} km/h`;
    }

    /**
     * Calculate ETA
     * @param {number} distance - Distance in meters
     * @param {number} speed - Speed in km/h
     * @returns {Date} Estimated arrival time
     */
    static calculateETA(distance, speed) {
        const durationInHours = (distance / 1000) / speed;
        const durationInMs = durationInHours * 60 * 60 * 1000;
        return new Date(Date.now() + durationInMs);
    }

    /**
     * Format timestamp
     * @param {Date|number} timestamp - Timestamp
     * @returns {string} Formatted time
     */
    static formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Get traffic color based on congestion level
     * @param {number} congestion - Congestion level (0-1)
     * @returns {string} CSS class name
     */
    static getTrafficColor(congestion) {
        if (congestion <= 0.3) return 'smooth';
        if (congestion <= 0.7) return 'moderate';
        return 'heavy';
    }

    /**
     * Get optimal departure time
     * @param {Object} routeData - Route data with historical patterns
     * @returns {Date} Optimal departure time
     */
    static getOptimalDepartureTime(routeData) {
        // Simple algorithm - find the time with lowest congestion
        const now = new Date();
        const currentHour = now.getHours();
        
        // Traffic patterns (0-1, where 1 is heavy traffic)
        const trafficPatterns = {
            0: 0.1, 1: 0.1, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2,
            6: 0.4, 7: 0.8, 8: 0.9, 9: 0.7, 10: 0.5, 11: 0.6,
            12: 0.7, 13: 0.6, 14: 0.5, 15: 0.6, 16: 0.7, 17: 0.9,
            18: 0.8, 19: 0.6, 20: 0.4, 21: 0.3, 22: 0.2, 23: 0.1
        };

        let optimalHour = currentHour;
        let minTraffic = trafficPatterns[currentHour];

        // Look for better times in the next 4 hours
        for (let i = 1; i <= 4; i++) {
            const hour = (currentHour + i) % 24;
            if (trafficPatterns[hour] < minTraffic) {
                minTraffic = trafficPatterns[hour];
                optimalHour = hour;
            }
        }

        const optimalTime = new Date();
        optimalTime.setHours(optimalHour, 0, 0, 0);
        
        // If the optimal time is in the past, add a day
        if (optimalTime <= now) {
            optimalTime.setDate(optimalTime.getDate() + 1);
        }

        return optimalTime;
    }

    /**
     * Animate number counting
     * @param {HTMLElement} element - Target element
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     * @param {Function} formatter - Number formatter function
     */
    static animateNumber(element, start, end, duration, formatter = (n) => n) {
        const startTime = performance.now();
        const difference = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (difference * easeOut);
            
            element.textContent = formatter(Math.round(current));
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    /**
     * Create DOM element with attributes and content
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string|HTMLElement|Array} content - Element content
     * @returns {HTMLElement} Created element
     */
    static createElement(tag, attributes = {}, content = null) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content !== null) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            } else if (Array.isArray(content)) {
                content.forEach(child => {
                    if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    } else if (child instanceof HTMLElement) {
                        element.appendChild(child);
                    }
                });
            }
        }
        
        return element;
    }

    /**
     * Show loading state for an element
     * @param {HTMLElement} element - Target element
     * @param {string} message - Loading message
     */
    static showLoading(element, message = 'Loading...') {
        const loader = Utils.createElement('div', {
            className: 'loading-state'
        }, [
            Utils.createElement('i', {
                className: 'fas fa-spinner fa-spin'
            }),
            Utils.createElement('span', {}, message)
        ]);
        
        element.innerHTML = '';
        element.appendChild(loader);
    }

    /**
     * Hide loading state and restore content
     * @param {HTMLElement} element - Target element
     * @param {HTMLElement|string} content - Content to restore
     */
    static hideLoading(element, content) {
        element.innerHTML = '';
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }
    }

    /**
     * Local storage wrapper with JSON support
     */
    static storage = {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from storage:', error);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error writing to storage:', error);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from storage:', error);
                return false;
            }
        }
    };

    /**
     * Event emitter for component communication
     */
    static events = {
        listeners: {},

        on(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
        },

        off(event, callback) {
            if (!this.listeners[event]) return;
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        },

        emit(event, data) {
            if (!this.listeners[event]) return;
            this.listeners[event].forEach(callback => callback(data));
        }
    };

    /**
     * Validate coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} Valid coordinates
     */
    static isValidCoordinates(lat, lng) {
        return (
            typeof lat === 'number' && 
            typeof lng === 'number' &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180
        );
    }

    /**
     * Calculate distance between two points (Haversine formula)
     * @param {number} lat1 - First point latitude
     * @param {number} lng1 - First point longitude
     * @param {number} lat2 - Second point latitude
     * @param {number} lng2 - Second point longitude
     * @returns {number} Distance in meters
     */
    static calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Get user's current location
     * @returns {Promise<{lat: number, lng: number}>} User coordinates
     */
    static async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(new Error(`Geolocation error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
}
