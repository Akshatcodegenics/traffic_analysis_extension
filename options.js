// ===== OPTIONS PAGE SCRIPT =====

class OptionsManager {
    constructor() {
        this.settings = {};
        this.defaultSettings = {
            theme: 'auto',
            autoRefresh: true,
            defaultView: 'dashboard',
            units: 'imperial',
            notifications: true,
            incidentNotifications: true,
            routeAlerts: true,
            voiceAlerts: false,
            analytics: true,
            locationServices: true,
            dataRetention: '1month',
            googleMapsIntegration: true,
            wazeIntegration: true,
            widgetPosition: 'top-right',
            updateFrequency: '60',
            animationEffects: true,
            backgroundUpdates: true,
            apiEndpoint: '',
            apiKey: '',
            requestTimeout: 10,
            cacheLimit: '50'
        };
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.initializeTheme();
    }

    async loadSettings() {
        try {
            this.settings = await chrome.storage.sync.get(this.defaultSettings);
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = this.defaultSettings;
        }
    }

    updateUI() {
        // Update all form elements with current settings
        Object.keys(this.settings).forEach(key => {
            const element = this.findSettingElement(key);
            
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
            }
        });
    }

    findSettingElement(key) {
        // Try different naming conventions
        const selectors = [
            `#${key}Option`,
            `#${key}Select`, 
            `#${key}`,
            `#${key}Input`
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        
        return null;
    }

    initializeTheme() {
        const theme = this.settings.theme;
        let actualTheme = theme;
        
        if (theme === 'auto') {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', actualTheme);
    }

    setupEventListeners() {
        // Theme selector with real-time preview
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                let actualTheme = theme;
                
                if (theme === 'auto') {
                    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                document.documentElement.setAttribute('data-theme', actualTheme);
                this.showPreviewMessage('Theme updated');
            });
        }

        // Auto-save on change for immediate feedback
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            const event = input.type === 'checkbox' ? 'change' : 'input';
            input.addEventListener(event, debounce(() => {
                this.autoSaveSettings();
            }, 1000));
        });

        // Save button
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Advanced options toggle
        const advancedToggle = document.getElementById('advancedToggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                this.toggleAdvancedOptions();
            });
        }

        // Clear cache button
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }

        // Export data button
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Special handlers
        this.setupSpecialHandlers();
    }

    setupSpecialHandlers() {
        // Notification permission request
        const notificationToggle = document.getElementById('notificationsOption');
        if (notificationToggle) {
            notificationToggle.addEventListener('change', (e) => {
                if (e.target.checked && Notification.permission === 'default') {
                    Notification.requestPermission().then(permission => {
                        if (permission !== 'granted') {
                            e.target.checked = false;
                            this.showStatusMessage('Notification permission denied', 'warning');
                        }
                    });
                }
            });
        }

        // Location services permission
        const locationToggle = document.getElementById('locationServices');
        if (locationToggle) {
            locationToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    navigator.geolocation.getCurrentPosition(
                        () => {
                            this.showStatusMessage('Location access granted', 'success');
                        },
                        () => {
                            e.target.checked = false;
                            this.showStatusMessage('Location access denied', 'warning');
                        }
                    );
                }
            });
        }
    }

    toggleAdvancedOptions() {
        const content = document.getElementById('advancedContent');
        const icon = document.querySelector('#advancedToggle i');
        
        if (content) {
            content.classList.toggle('show');
            if (icon) {
                icon.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        }
    }

    async autoSaveSettings() {
        const formData = this.collectFormData();
        
        try {
            await chrome.storage.sync.set(formData);
            this.settings = { ...this.settings, ...formData };
            
            // Show subtle feedback
            this.showPreviewMessage('Auto-saved');
            
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    async saveSettings() {
        const formData = this.collectFormData();
        
        try {
            await chrome.storage.sync.set(formData);
            this.settings = { ...this.settings, ...formData };
            this.showStatusMessage('Settings saved successfully!', 'success');
            
            // Notify background script
            chrome.runtime.sendMessage({
                type: 'UPDATE_SETTINGS',
                data: formData
            });
            
            // Add visual feedback
            const saveBtn = document.getElementById('saveSettings');
            if (saveBtn) {
                saveBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    saveBtn.style.transform = '';
                }, 150);
            }
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showStatusMessage('Failed to save settings', 'error');
        }
    }

    collectFormData() {
        const formData = {};
        
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (!input.id) return;
            
            const key = input.id
                .replace('Option', '')
                .replace('Select', '')
                .replace('Input', '');
                
            if (key && key !== 'advancedToggle') {
                formData[key] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });

        return formData;
    }

    async resetSettings() {
        const confirmed = confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.');
        
        if (!confirmed) return;

        try {
            await chrome.storage.sync.clear();
            this.settings = { ...this.defaultSettings };
            this.updateUI();
            this.initializeTheme();
            this.showStatusMessage('Settings reset to defaults', 'info');
            
            // Notify background script
            chrome.runtime.sendMessage({
                type: 'SETTINGS_RESET',
                data: this.defaultSettings
            });
            
        } catch (error) {
            console.error('Failed to reset settings:', error);
            this.showStatusMessage('Failed to reset settings', 'error');
        }
    }

    async clearCache() {
        try {
            await chrome.storage.local.clear();
            this.showStatusMessage('Cache cleared successfully', 'success');
            
            // Add visual feedback
            const clearBtn = document.getElementById('clearCacheBtn');
            if (clearBtn) {
                clearBtn.innerHTML = '<i class="fas fa-check"></i> Cleared';
                setTimeout(() => {
                    clearBtn.innerHTML = '<i class="fas fa-trash"></i> Clear Cache';
                }, 2000);
            }
            
        } catch (error) {
            console.error('Failed to clear cache:', error);
            this.showStatusMessage('Failed to clear cache', 'error');
        }
    }

    async exportData() {
        try {
            const data = await chrome.storage.local.get();
            const exportData = {
                settings: this.settings,
                userData: data,
                exportDate: new Date().toISOString(),
                version: chrome.runtime.getManifest().version
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `traffic-analyzer-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showStatusMessage('Data exported successfully', 'success');
            
            // Add visual feedback
            const exportBtn = document.getElementById('exportDataBtn');
            if (exportBtn) {
                exportBtn.innerHTML = '<i class="fas fa-check"></i> Exported';
                setTimeout(() => {
                    exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Data';
                }, 2000);
            }
            
        } catch (error) {
            console.error('Failed to export data:', error);
            this.showStatusMessage('Failed to export data', 'error');
        }
    }

    showStatusMessage(message, type = 'success') {
        // Create or update status message
        let statusEl = document.getElementById('statusMessage');
        
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'statusMessage';
            statusEl.className = 'toast';
            statusEl.style.cssText = 'position: fixed; top: 20px; right: 20px; opacity: 0; z-index: 10000;';
            document.body.appendChild(statusEl);
        }

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        statusEl.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icons[type] || icons.success}"></i>
                <span>${message}</span>
            </div>
        `;
        
        statusEl.className = `toast toast-${type}`;
        
        // Animate in
        statusEl.style.opacity = '1';
        statusEl.style.transform = 'translateX(0)';
        
        // Animate out
        setTimeout(() => {
            statusEl.style.opacity = '0';
            statusEl.style.transform = 'translateX(100px)';
        }, 3000);
    }

    showPreviewMessage(message) {
        // Show subtle preview message
        let previewEl = document.getElementById('previewMessage');
        
        if (!previewEl) {
            previewEl = document.createElement('div');
            previewEl.id = 'previewMessage';
            previewEl.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                padding: var(--spacing-sm) var(--spacing-md);
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 1000;
            `;
            document.body.appendChild(previewEl);
        }

        previewEl.textContent = message;
        previewEl.style.opacity = '1';
        
        setTimeout(() => {
            previewEl.style.opacity = '0';
        }, 1500);
    }

    // Validate settings before saving
    validateSettings(formData) {
        const errors = [];

        // Validate API endpoint if provided
        if (formData.apiEndpoint && !this.isValidURL(formData.apiEndpoint)) {
            errors.push('Invalid API endpoint URL');
        }

        // Validate timeout range
        if (formData.requestTimeout < 5 || formData.requestTimeout > 60) {
            errors.push('Request timeout must be between 5 and 60 seconds');
        }

        // Validate cache limit
        if (formData.cacheLimit && isNaN(parseInt(formData.cacheLimit))) {
            errors.push('Invalid cache limit value');
        }

        return errors;
    }

    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Import settings from file
    async importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedData = JSON.parse(text);
            
            if (importedData.settings) {
                // Validate imported settings
                const validSettings = {};
                Object.keys(this.defaultSettings).forEach(key => {
                    if (importedData.settings.hasOwnProperty(key)) {
                        validSettings[key] = importedData.settings[key];
                    }
                });

                await chrome.storage.sync.set(validSettings);
                this.settings = { ...this.settings, ...validSettings };
                this.updateUI();
                this.showStatusMessage('Settings imported successfully', 'success');
            }
        } catch (error) {
            console.error('Import failed:', error);
            this.showStatusMessage('Invalid settings file', 'error');
        }
    }

    setupEventListeners() {
        // Theme selector with real-time preview
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                let actualTheme = theme;
                
                if (theme === 'auto') {
                    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                document.documentElement.setAttribute('data-theme', actualTheme);
                this.showPreviewMessage('Theme preview');
            });
        }

        // Auto-save for immediate feedback
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            const event = input.type === 'checkbox' ? 'change' : 'input';
            input.addEventListener(event, debounce(() => {
                this.autoSaveSettings();
            }, 1000));
        });

        // Manual save button
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Reset button with confirmation
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Clear cache
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }

        // Export data
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Import settings
        const importInput = document.getElementById('importInput');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                this.importSettings(e);
            });
        }

        // Special handlers for permission-required settings
        this.setupPermissionHandlers();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupPermissionHandlers() {
        // Notification permission handler
        const notificationToggle = document.getElementById('notificationsOption');
        if (notificationToggle) {
            notificationToggle.addEventListener('change', async (e) => {
                if (e.target.checked && 'Notification' in window) {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        e.target.checked = false;
                        this.showStatusMessage('Notification permission denied', 'warning');
                    } else {
                        this.showStatusMessage('Notifications enabled', 'success');
                    }
                }
            });
        }

        // Location services handler
        const locationToggle = document.getElementById('locationServices');
        if (locationToggle) {
            locationToggle.addEventListener('change', (e) => {
                if (e.target.checked && 'geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        () => {
                            this.showStatusMessage('Location access granted', 'success');
                        },
                        () => {
                            e.target.checked = false;
                            this.showStatusMessage('Location access denied', 'warning');
                        },
                        { timeout: 5000 }
                    );
                }
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveSettings();
            }
            
            // Escape to close advanced options
            if (e.key === 'Escape') {
                const advancedContent = document.getElementById('advancedContent');
                if (advancedContent && advancedContent.classList.contains('show')) {
                    this.toggleAdvancedOptions();
                }
            }
        });
    }

    async autoSaveSettings() {
        const formData = this.collectFormData();
        const errors = this.validateSettings(formData);
        
        if (errors.length > 0) {
            this.showStatusMessage(errors[0], 'warning');
            return;
        }
        
        try {
            await chrome.storage.sync.set(formData);
            this.settings = { ...this.settings, ...formData };
            this.showPreviewMessage('Auto-saved');
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    collectFormData() {
        const formData = {};
        
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (!input.id || input.id === 'advancedToggle') return;
            
            const key = input.id
                .replace('Option', '')
                .replace('Select', '')
                .replace('Input', '');
                
            if (key) {
                formData[key] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });

        return formData;
    }

    // Get storage usage information
    async getStorageInfo() {
        try {
            const localData = await chrome.storage.local.get();
            const syncData = await chrome.storage.sync.get();
            
            const localSize = JSON.stringify(localData).length;
            const syncSize = JSON.stringify(syncData).length;
            
            return {
                local: {
                    used: localSize,
                    limit: 5242880, // 5MB limit for local storage
                    percentage: (localSize / 5242880) * 100
                },
                sync: {
                    used: syncSize,
                    limit: 102400, // 100KB limit for sync storage
                    percentage: (syncSize / 102400) * 100
                }
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    // Display storage usage
    async updateStorageDisplay() {
        const storageInfo = await this.getStorageInfo();
        if (!storageInfo) return;

        const storageDisplay = document.getElementById('storageDisplay');
        if (storageDisplay) {
            storageDisplay.innerHTML = `
                <div class="storage-info">
                    <div class="storage-item">
                        <label>Local Storage:</label>
                        <div class="storage-bar">
                            <div class="storage-fill" style="width: ${storageInfo.local.percentage}%"></div>
                        </div>
                        <span class="storage-text">${(storageInfo.local.used / 1024).toFixed(1)} KB / 5 MB</span>
                    </div>
                    <div class="storage-item">
                        <label>Sync Storage:</label>
                        <div class="storage-bar">
                            <div class="storage-fill" style="width: ${storageInfo.sync.percentage}%"></div>
                        </div>
                        <span class="storage-text">${(storageInfo.sync.used / 1024).toFixed(1)} KB / 100 KB</span>
                    </div>
                </div>
            `;
        }
    }
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    window.optionsManager = new OptionsManager();
    
    // Update storage display periodically
    setInterval(() => {
        if (window.optionsManager) {
            window.optionsManager.updateStorageDisplay();
        }
    }, 5000);
    
    console.log('Traffic Analyzer Options page loaded');
});

// ===== KEYBOARD ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
    // Tab navigation enhancement
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

// ===== THEME AUTO-DETECTION =====
if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    darkModeQuery.addEventListener('change', (e) => {
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect && themeSelect.value === 'auto') {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Options page error:', e.error);
    
    if (window.optionsManager) {
        window.optionsManager.showStatusMessage('An error occurred. Please refresh the page.', 'error');
    }
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptionsManager;
}
