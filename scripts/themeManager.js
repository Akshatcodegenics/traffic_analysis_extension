// ===== THEME MANAGER =====

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.storageKey = 'traffic_analyzer_theme';
        this.body = document.body;
        this.themeToggle = null;
        
        this.init();
    }

    /**
     * Initialize theme manager
     */
    init() {
        this.loadSavedTheme();
        this.setupEventListeners();
        this.applyTheme();
    }

    /**
     * Load theme from storage or detect system preference
     */
    loadSavedTheme() {
        const savedTheme = Utils.storage.get(this.storageKey);
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Detect system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.currentTheme = 'dark';
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.themeToggle = document.getElementById('themeToggle');
            
            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
            }

            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
                    // Only auto-switch if user hasn't manually set a preference
                    const savedTheme = Utils.storage.get(this.storageKey);
                    if (!savedTheme) {
                        this.currentTheme = e.matches ? 'dark' : 'light';
                        this.applyTheme();
                    }
                });
            }
        });
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
        
        // Emit theme change event
        Utils.events.emit('themeChanged', {
            theme: this.currentTheme
        });

        // Show toast notification
        this.showThemeChangeToast();
    }

    /**
     * Apply the current theme
     */
    applyTheme() {
        // Add theme switching class to prevent transitions during switch
        this.body.classList.add('theme-switching');
        
        // Remove previous theme classes
        this.body.classList.remove('theme-light', 'theme-dark');
        
        // Add current theme class
        this.body.classList.add(`theme-${this.currentTheme}`);
        
        // Update theme toggle icon
        this.updateThemeToggleIcon();
        
        // Remove theme switching class after a short delay
        setTimeout(() => {
            this.body.classList.remove('theme-switching');
            this.body.classList.add('theme-transition');
            
            // Remove transition class after animation
            setTimeout(() => {
                this.body.classList.remove('theme-transition');
            }, 500);
        }, 50);

        // Update meta theme color for mobile browsers
        this.updateMetaThemeColor();
    }

    /**
     * Update theme toggle icon
     */
    updateThemeToggleIcon() {
        if (!this.themeToggle) return;
        
        const icon = this.themeToggle.querySelector('i');
        if (icon) {
            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        // Update tooltip
        this.themeToggle.title = `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`;
    }

    /**
     * Update meta theme color for mobile browsers
     */
    updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        // Set theme color based on current theme
        const colors = {
            light: '#667eea',
            dark: '#818cf8'
        };
        
        metaThemeColor.content = colors[this.currentTheme];
    }

    /**
     * Save current theme to storage
     */
    saveTheme() {
        Utils.storage.set(this.storageKey, this.currentTheme);
    }

    /**
     * Show theme change toast notification
     */
    showThemeChangeToast() {
        const message = `Switched to ${this.currentTheme} theme`;
        const icon = this.currentTheme === 'light' ? 'fa-sun' : 'fa-moon';
        
        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'info',
                message: message,
                icon: icon,
                duration: 2000
            });
        }
    }

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Set specific theme
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.currentTheme = theme;
            this.applyTheme();
            this.saveTheme();
            
            Utils.events.emit('themeChanged', {
                theme: this.currentTheme
            });
        }
    }

    /**
     * Check if current theme is dark
     * @returns {boolean} True if dark theme is active
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * Get theme colors for charts and visualizations
     * @returns {Object} Color palette for current theme
     */
    getThemeColors() {
        const lightColors = {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#f093fb',
            success: '#4ade80',
            warning: '#fbbf24',
            error: '#ef4444',
            background: '#ffffff',
            surface: '#f8fafc',
            text: '#1e293b',
            textSecondary: '#64748b',
            border: '#e2e8f0'
        };

        const darkColors = {
            primary: '#818cf8',
            secondary: '#a855f7',
            accent: '#f472b6',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            background: '#0f172a',
            surface: '#1e293b',
            text: '#f1f5f9',
            textSecondary: '#cbd5e1',
            border: '#334155'
        };

        return this.currentTheme === 'light' ? lightColors : darkColors;
    }

    /**
     * Get CSS custom properties for current theme
     * @returns {Object} CSS custom properties
     */
    getThemeProperties() {
        const colors = this.getThemeColors();
        const properties = {};
        
        Object.entries(colors).forEach(([key, value]) => {
            const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            properties[`--${cssVar}`] = value;
        });
        
        return properties;
    }

    /**
     * Apply custom theme colors to root element
     * @param {Object} customColors - Custom color overrides
     */
    applyCustomColors(customColors) {
        const root = document.documentElement;
        const colors = { ...this.getThemeColors(), ...customColors };
        
        Object.entries(colors).forEach(([key, value]) => {
            const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(`--custom-${cssVar}`, value);
        });
    }

    /**
     * Reset custom colors
     */
    resetCustomColors() {
        const root = document.documentElement;
        const colors = this.getThemeColors();
        
        Object.keys(colors).forEach(key => {
            const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.removeProperty(`--custom-${cssVar}`);
        });
    }
}

// Initialize theme manager when script loads
const themeManager = new ThemeManager();

// Make it globally available
window.ThemeManager = themeManager;
