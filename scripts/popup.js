// ===== MAIN POPUP CONTROLLER =====

class PopupController {
    constructor() {
        this.currentSection = 'heatmap';
        this.controllers = {};
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize popup controller
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigation();
            this.initializeControllers();
            this.setupEventListeners();
            this.loadInitialData();
            
            this.isInitialized = true;
            Utils.events.emit('popupReady');
        });
    }

    /**
     * Setup navigation system
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const contentSections = document.querySelectorAll('.content-section');

        navItems.forEach(navItem => {
            navItem.addEventListener('click', () => {
                const targetSection = navItem.dataset.section;
                this.navigateToSection(targetSection);
            });
        });

        // Setup mobile navigation toggle
        this.setupMobileNavigation();
    }

    /**
     * Navigate to specific section
     * @param {string} sectionName - Name of section to navigate to
     */
    navigateToSection(sectionName) {
        if (sectionName === this.currentSection) return;

        const previousSection = this.currentSection;
        this.currentSection = sectionName;

        // Update navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === `${sectionName}-section`);
        });

        // Notify controllers about section change
        Utils.events.emit('sectionChanged', {
            from: previousSection,
            to: sectionName
        });

        // Update URL hash (if needed)
        if (history.replaceState) {
            history.replaceState(null, null, `#${sectionName}`);
        }

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    /**
     * Setup mobile navigation
     */
    setupMobileNavigation() {
        const sidebar = document.getElementById('sidebar');
        const navItems = document.querySelectorAll('.nav-item');

        // Handle mobile navigation scrolling
        if (window.innerWidth <= 480) {
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    // Scroll to active item on mobile
                    item.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                });
            });
        }
    }

    /**
     * Initialize all controllers
     */
    initializeControllers() {
        try {
            // Initialize individual section controllers
            if (window.HeatmapController) {
                this.controllers.heatmap = new HeatmapController();
            }
            
            if (window.RouteController) {
                this.controllers.routes = new RouteController();
            }
            
            if (window.AnalyticsController) {
                this.controllers.analytics = new AnalyticsController();
            }
            
            if (window.FavoritesController) {
                this.controllers.favorites = new FavoritesController();
            }

            // Initialize data manager
            if (window.DataManager) {
                this.dataManager = new DataManager();
            }

            // Initialize toast manager
            this.initializeToastManager();
            
        } catch (error) {
            console.error('Error initializing controllers:', error);
            this.showError('Failed to initialize application components');
        }
    }

    /**
     * Initialize toast notification manager
     */
    initializeToastManager() {
        class ToastManager {
            constructor() {
                this.container = document.getElementById('toastContainer');
                this.toasts = [];
            }

            show({ type = 'info', message, icon, duration = 4000 }) {
                const toast = this.createToast(type, message, icon);
                this.container.appendChild(toast);
                this.toasts.push(toast);

                // Auto-remove after duration
                setTimeout(() => {
                    this.remove(toast);
                }, duration);

                return toast;
            }

            createToast(type, message, icon) {
                const toastElement = Utils.createElement('div', {
                    className: `toast ${type}`
                });

                if (icon) {
                    const iconElement = Utils.createElement('i', {
                        className: `fas ${icon} toast-icon`
                    });
                    toastElement.appendChild(iconElement);
                }

                const messageElement = Utils.createElement('div', {
                    className: 'toast-message'
                }, message);

                const closeButton = Utils.createElement('button', {
                    className: 'toast-close',
                    title: 'Close'
                }, Utils.createElement('i', {
                    className: 'fas fa-times'
                }));

                closeButton.addEventListener('click', () => {
                    this.remove(toastElement);
                });

                toastElement.appendChild(messageElement);
                toastElement.appendChild(closeButton);

                return toastElement;
            }

            remove(toast) {
                const index = this.toasts.indexOf(toast);
                if (index > -1) {
                    this.toasts.splice(index, 1);
                    toast.style.transform = 'translateX(100%)';
                    toast.style.opacity = '0';
                    
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }
            }

            clear() {
                this.toasts.forEach(toast => this.remove(toast));
            }
        }

        window.ToastManager = new ToastManager();
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettingsModal();
            });
        }

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle window resize
        window.addEventListener('resize', Utils.throttle(() => {
            this.handleResize();
        }, 250));

        // Listen for theme changes
        Utils.events.on('themeChanged', (data) => {
            this.handleThemeChange(data);
        });

        // Listen for data updates
        Utils.events.on('dataUpdated', (data) => {
            this.handleDataUpdate(data);
        });
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + number for section navigation
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const sections = ['heatmap', 'routes', 'analytics', 'favorites'];
            const sectionIndex = parseInt(e.key) - 1;
            if (sections[sectionIndex]) {
                this.navigateToSection(sections[sectionIndex]);
            }
        }

        // Ctrl/Cmd + T for theme toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            if (window.ThemeManager) {
                window.ThemeManager.toggleTheme();
            }
        }

        // Escape key to close modals
        if (e.key === 'Escape') {
            this.closeActiveModal();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const isMobile = window.innerWidth <= 480;
        document.body.classList.toggle('mobile-view', isMobile);
        
        // Notify controllers about resize
        Utils.events.emit('windowResize', {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile
        });
    }

    /**
     * Handle theme changes
     * @param {Object} data - Theme change data
     */
    handleThemeChange(data) {
        // Update charts and visualizations with new theme colors
        Object.values(this.controllers).forEach(controller => {
            if (typeof controller.updateTheme === 'function') {
                controller.updateTheme(data.theme);
            }
        });
    }

    /**
     * Handle data updates
     * @param {Object} data - Updated data
     */
    handleDataUpdate(data) {
        // Refresh current section if it uses the updated data
        if (this.controllers[this.currentSection]) {
            const controller = this.controllers[this.currentSection];
            if (typeof controller.refreshData === 'function') {
                controller.refreshData(data);
            }
        }
    }

    /**
     * Load initial data for the application
     */
    async loadInitialData() {
        try {
            this.showGlobalLoading('Loading traffic data...');

            // Load user location
            await this.loadUserLocation();

            // Load cached data
            await this.loadCachedData();

            // Load fresh data
            await this.loadFreshData();

            this.hideGlobalLoading();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.hideGlobalLoading();
            this.showError('Failed to load traffic data. Please check your connection.');
        }
    }

    /**
     * Load user location
     */
    async loadUserLocation() {
        try {
            const location = await Utils.getCurrentLocation();
            Utils.storage.set('user_location', location);
            
            Utils.events.emit('locationUpdated', location);
        } catch (error) {
            console.warn('Could not get user location:', error.message);
            
            // Use default location (can be changed in settings)
            const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York
            Utils.events.emit('locationUpdated', defaultLocation);
        }
    }

    /**
     * Load cached data
     */
    async loadCachedData() {
        const cachedData = Utils.storage.get('traffic_cache');
        if (cachedData && this.isDataFresh(cachedData.timestamp)) {
            Utils.events.emit('dataLoaded', cachedData);
        }
    }

    /**
     * Load fresh data
     */
    async loadFreshData() {
        if (this.dataManager) {
            await this.dataManager.refreshAllData();
        }
    }

    /**
     * Check if cached data is still fresh
     * @param {number} timestamp - Cache timestamp
     * @returns {boolean} True if data is fresh
     */
    isDataFresh(timestamp) {
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return Date.now() - timestamp < maxAge;
    }

    /**
     * Load section-specific data
     * @param {string} sectionName - Section name
     */
    loadSectionData(sectionName) {
        const controller = this.controllers[sectionName];
        if (controller && typeof controller.loadData === 'function') {
            controller.loadData();
        }
    }

    /**
     * Show global loading overlay
     * @param {string} message - Loading message
     */
    showGlobalLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const messageElement = overlay.querySelector('.loading-spinner p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide global loading overlay
     */
    hideGlobalLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'error',
                message: message,
                icon: 'fa-exclamation-circle',
                duration: 6000
            });
        }
    }

    /**
     * Open settings modal
     */
    openSettingsModal() {
        // Create and show settings modal
        const modal = this.createSettingsModal();
        document.body.appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });
    }

    /**
     * Create settings modal
     * @returns {HTMLElement} Modal element
     */
    createSettingsModal() {
        const overlay = Utils.createElement('div', {
            className: 'modal-overlay'
        });

        const modal = Utils.createElement('div', {
            className: 'modal'
        });

        const header = Utils.createElement('div', {
            className: 'modal-header'
        }, [
            Utils.createElement('h2', {
                className: 'modal-title'
            }, 'Settings'),
            Utils.createElement('button', {
                className: 'modal-close'
            }, Utils.createElement('i', {
                className: 'fas fa-times'
            }))
        ]);

        const body = Utils.createElement('div', {
            className: 'modal-body'
        }, this.createSettingsContent());

        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);

        // Setup close functionality
        const closeBtn = header.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            this.closeModal(overlay);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal(overlay);
            }
        });

        return overlay;
    }

    /**
     * Create settings content
     * @returns {HTMLElement} Settings content
     */
    createSettingsContent() {
        const container = Utils.createElement('div', {
            className: 'settings-content'
        });

        // Theme setting
        const themeGroup = Utils.createElement('div', {
            className: 'form-group'
        }, [
            Utils.createElement('label', {
                className: 'form-label'
            }, 'Theme'),
            Utils.createElement('select', {
                className: 'form-input',
                id: 'themeSelect'
            }, [
                Utils.createElement('option', { value: 'light' }, 'Light'),
                Utils.createElement('option', { value: 'dark' }, 'Dark'),
                Utils.createElement('option', { value: 'auto' }, 'Auto (System)')
            ])
        ]);

        // Auto-refresh setting
        const refreshGroup = Utils.createElement('div', {
            className: 'form-group'
        }, [
            Utils.createElement('label', {
                className: 'form-label'
            }, 'Auto-refresh Interval'),
            Utils.createElement('select', {
                className: 'form-input',
                id: 'refreshInterval'
            }, [
                Utils.createElement('option', { value: '30' }, '30 seconds'),
                Utils.createElement('option', { value: '60' }, '1 minute'),
                Utils.createElement('option', { value: '300' }, '5 minutes'),
                Utils.createElement('option', { value: '0' }, 'Disabled')
            ])
        ]);

        container.appendChild(themeGroup);
        container.appendChild(refreshGroup);

        // Load current settings
        this.loadCurrentSettings();

        return container;
    }

    /**
     * Load current settings into the modal
     */
    loadCurrentSettings() {
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect && window.ThemeManager) {
            themeSelect.value = window.ThemeManager.getCurrentTheme();
            
            themeSelect.addEventListener('change', (e) => {
                window.ThemeManager.setTheme(e.target.value);
            });
        }

        const refreshSelect = document.getElementById('refreshInterval');
        if (refreshSelect) {
            const interval = Utils.storage.get('refresh_interval', 60);
            refreshSelect.value = interval.toString();
            
            refreshSelect.addEventListener('change', (e) => {
                Utils.storage.set('refresh_interval', parseInt(e.target.value));
                Utils.events.emit('settingsChanged', {
                    refreshInterval: parseInt(e.target.value)
                });
            });
        }
    }

    /**
     * Close modal
     * @param {HTMLElement} modal - Modal to close
     */
    closeModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    /**
     * Close any active modals
     */
    closeActiveModal() {
        const activeModal = document.querySelector('.modal-overlay');
        if (activeModal) {
            this.closeModal(activeModal);
        }
    }
}

// Initialize popup controller
const popupController = new PopupController();

// Make it globally available
window.PopupController = popupController;
