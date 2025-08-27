// ===== TRAFFIC ANALYZER EXTENSION - MAIN SCRIPT =====

class TrafficAnalyzer {
    constructor() {
        this.currentTheme = 'light';
        this.currentView = 'dashboard';
        this.activeRoutes = [];
        this.pinnedRoutes = this.loadPinnedRoutes();
        this.trafficData = [];
        this.chart = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTheme();
        this.startDataSimulation();
        this.initializeChart();
        this.animateCounters();
        this.setupTooltips();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // View level toggle for heatmap
        document.querySelectorAll('[data-level]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchViewLevel(e.currentTarget.dataset.level);
            });
        });

        // Time range selector
        document.querySelectorAll('[data-range]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTimeRange(e.currentTarget.dataset.range);
            });
        });

        // Chart controls
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartMetric(e.currentTarget.dataset.metric);
            });
        });

        // Time slider
        const timeSlider = document.getElementById('timeSlider');
        if (timeSlider) {
            timeSlider.addEventListener('input', (e) => {
                this.updateTimeDisplay(e.target.value);
            });
        }

        // Route actions
        this.setupRouteActions();

        // Refresh button
        document.getElementById('refreshData')?.addEventListener('click', () => {
            this.refreshData();
        });

        // Location swap
        document.getElementById('swapBtn')?.addEventListener('click', () => {
            this.swapLocations();
        });

        // Find routes button
        document.querySelector('.find-routes-btn')?.addEventListener('click', () => {
            this.findRoutes();
        });

        // Settings toggles
        this.setupSettingsToggles();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        const themeIcon = document.getElementById('themeIcon');
        themeIcon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        
        // Save theme preference
        localStorage.setItem('traffic-analyzer-theme', this.currentTheme);
        
        // Animate theme change
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('traffic-analyzer-theme') || 'light';
        this.currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeIcon = document.getElementById('themeIcon');
        themeIcon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        
        const targetView = document.getElementById(`${view}View`);
        if (targetView) {
            targetView.classList.add('active', 'entering');
            setTimeout(() => {
                targetView.classList.remove('entering');
            }, 500);
        }

        this.currentView = view;

        // Initialize view-specific features
        if (view === 'analytics') {
            this.updateChart();
        } else if (view === 'heatmap') {
            this.updateHeatmap();
        }
    }

    switchViewLevel(level) {
        document.querySelectorAll('[data-level]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-level="${level}"]`).classList.add('active');
        
        this.updateHeatmap(level);
        this.showToast(`Switched to ${level} view`, 'info');
    }

    switchTimeRange(range) {
        document.querySelectorAll('[data-range]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-range="${range}"]`).classList.add('active');
        
        this.updateChart(range);
    }

    switchChartMetric(metric) {
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-metric="${metric}"]`).classList.add('active');
        
        this.updateChart(null, metric);
    }

    updateTimeDisplay(value) {
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        document.getElementById('currentTime').textContent = timeString;
        
        // Update chart based on time selection
        this.updateChartTimeline(value);
    }

    setupRouteActions() {
        // Pin/unpin routes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pin-btn')) {
                this.pinRoute(e.target.closest('.route-card'));
            } else if (e.target.closest('.unpin-btn')) {
                this.unpinRoute(e.target.closest('.route-card'));
            } else if (e.target.closest('.share-btn')) {
                this.shareRoute(e.target.closest('.route-card'));
            }
        });
    }

    pinRoute(routeCard) {
        const routeName = routeCard.querySelector('.route-name').textContent;
        const eta = routeCard.querySelector('.time').textContent;
        const status = routeCard.querySelector('.traffic-status').textContent;
        
        const pinnedRoute = {
            id: Date.now().toString(),
            name: routeName,
            eta: eta,
            status: status,
            distance: routeCard.querySelector('.distance').textContent
        };
        
        this.pinnedRoutes.push(pinnedRoute);
        this.savePinnedRoutes();
        this.renderPinnedRoutes();
        this.showToast('Route pinned successfully!', 'success');
        
        // Add animation
        routeCard.classList.add('animate-bounce');
        setTimeout(() => {
            routeCard.classList.remove('animate-bounce');
        }, 2000);
    }

    unpinRoute(routeCard) {
        const routeName = routeCard.querySelector('.route-name').textContent;
        this.pinnedRoutes = this.pinnedRoutes.filter(route => route.name !== routeName);
        this.savePinnedRoutes();
        this.renderPinnedRoutes();
        this.showToast('Route unpinned', 'info');
    }

    shareRoute(routeCard) {
        const routeName = routeCard.querySelector('.route-name').textContent;
        const eta = routeCard.querySelector('.time').textContent;
        
        // Simulate sharing functionality
        navigator.clipboard.writeText(`Check out this route: ${routeName} - ETA: ${eta}`)
            .then(() => {
                this.showToast('Route copied to clipboard!', 'success');
            })
            .catch(() => {
                this.showToast('Unable to copy route', 'error');
            });
    }

    loadPinnedRoutes() {
        const saved = localStorage.getItem('pinned-routes');
        return saved ? JSON.parse(saved) : [];
    }

    savePinnedRoutes() {
        localStorage.setItem('pinned-routes', JSON.stringify(this.pinnedRoutes));
    }

    renderPinnedRoutes() {
        const container = document.querySelector('.pinned-routes .route-cards');
        if (!container) return;

        container.innerHTML = '';
        
        this.pinnedRoutes.forEach(route => {
            const routeHtml = `
                <div class="route-card pinned">
                    <div class="route-header">
                        <span class="route-name">${route.name}</span>
                        <button class="unpin-btn">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                    </div>
                    <div class="route-info">
                        <div class="eta">
                            <span class="time">${route.eta}</span>
                            <span class="traffic-status ${this.getStatusClass(route.status)}">${route.status}</span>
                        </div>
                        <div class="distance">${route.distance}</div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', routeHtml);
        });
    }

    getStatusClass(status) {
        const statusMap = {
            'Light Traffic': 'smooth',
            'Moderate Traffic': 'moderate', 
            'Heavy Traffic': 'heavy',
            'Moderate': 'moderate'
        };
        return statusMap[status] || 'moderate';
    }

    swapLocations() {
        const fromInput = document.getElementById('fromInput');
        const toInput = document.getElementById('toInput');
        
        if (fromInput && toInput) {
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;
            
            // Add animation feedback
            document.getElementById('swapBtn').style.transform = 'rotate(180deg) scale(1.1)';
            setTimeout(() => {
                document.getElementById('swapBtn').style.transform = '';
            }, 300);
        }
    }

    findRoutes() {
        const fromInput = document.getElementById('fromInput');
        const toInput = document.getElementById('toInput');
        
        if (!fromInput.value.trim() || !toInput.value.trim()) {
            this.showToast('Please enter both locations', 'warning');
            return;
        }

        this.showLoading();
        
        // Simulate API call
        setTimeout(() => {
            this.hideLoading();
            this.generateRouteOptions(fromInput.value, toInput.value);
            this.showToast('Routes updated!', 'success');
        }, 1500);
    }

    generateRouteOptions(from, to) {
        const routes = [
            {
                name: `Via Main Highway`,
                time: `${15 + Math.floor(Math.random() * 20)} min`,
                status: ['Light Traffic', 'Moderate Traffic', 'Heavy Traffic'][Math.floor(Math.random() * 3)],
                distance: `${8 + Math.random() * 10}.${Math.floor(Math.random() * 10)} miles`,
                fuel: `$${(1.5 + Math.random() * 2).toFixed(2)}`,
                tolls: `$${(Math.random() * 5).toFixed(2)}`,
                recommended: Math.random() > 0.5
            },
            {
                name: `Via Local Roads`,
                time: `${18 + Math.floor(Math.random() * 15)} min`,
                status: ['Light Traffic', 'Moderate Traffic'][Math.floor(Math.random() * 2)],
                distance: `${6 + Math.random() * 8}.${Math.floor(Math.random() * 10)} miles`,
                fuel: `$${(1.2 + Math.random() * 1.5).toFixed(2)}`,
                tolls: `$0.00`,
                recommended: false
            }
        ];

        this.renderRouteOptions(routes);
    }

    renderRouteOptions(routes) {
        const container = document.querySelector('#routeSuggestions .route-cards');
        if (!container) return;

        container.innerHTML = '';
        
        routes.forEach((route, index) => {
            const isRecommended = route.recommended;
            const statusClass = this.getStatusClass(route.status);
            
            const routeHtml = `
                <div class="route-card ${isRecommended ? 'recommended' : ''}">
                    ${isRecommended ? '<div class="route-badge"><i class="fas fa-star"></i>AI Recommended</div>' : ''}
                    <div class="route-header">
                        <span class="route-name">${route.name}</span>
                        <div class="route-actions">
                            <button class="pin-btn" title="Pin Route">
                                <i class="fas fa-thumbtack"></i>
                            </button>
                            <button class="share-btn" title="Share Route">
                                <i class="fas fa-share"></i>
                            </button>
                        </div>
                    </div>
                    <div class="route-details">
                        <div class="eta-section">
                            <div class="current-eta">
                                <span class="time">${route.time}</span>
                                <span class="traffic-status ${statusClass}">${route.status}</span>
                            </div>
                            ${isRecommended ? '<div class="optimal-time"><i class="fas fa-lightbulb"></i><span>Best departure: 8:45 AM (15 min)</span></div>' : ''}
                        </div>
                        <div class="route-metrics">
                            <span class="distance"><i class="fas fa-road"></i> ${route.distance}</span>
                            <span class="fuel"><i class="fas fa-gas-pump"></i> ${route.fuel}</span>
                            <span class="tolls"><i class="fas fa-coins"></i> ${route.tolls}</span>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', routeHtml);
        });

        // Add staggered animation
        container.querySelectorAll('.route-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    refreshData() {
        const refreshBtn = document.getElementById('refreshData');
        const icon = refreshBtn.querySelector('i');
        
        // Animate refresh button
        icon.style.animation = 'spin 1s linear infinite';
        refreshBtn.disabled = true;
        
        // Simulate data refresh
        setTimeout(() => {
            icon.style.animation = '';
            refreshBtn.disabled = false;
            this.updateTrafficStats();
            this.showToast('Data refreshed!', 'success');
        }, 1500);
    }

    startDataSimulation() {
        // Simulate real-time traffic data updates
        setInterval(() => {
            this.updateTrafficStats();
            this.updateHeatmapData();
        }, 30000); // Update every 30 seconds

        // Generate initial data
        this.generateTrafficData();
    }

    generateTrafficData() {
        const now = new Date();
        this.trafficData = [];
        
        for (let i = 0; i < 24; i++) {
            const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
            this.trafficData.push({
                time: time,
                speed: this.generateSpeedData(i),
                delay: this.generateDelayData(i),
                congestion: this.generateCongestionData(i)
            });
        }
    }

    generateSpeedData(hour) {
        const peakHours = [7, 8, 9, 17, 18, 19];
        const isPeak = peakHours.includes(hour);
        const baseSpeed = isPeak ? 25 + Math.random() * 15 : 45 + Math.random() * 20;
        return Math.round(baseSpeed);
    }

    generateDelayData(hour) {
        const peakHours = [7, 8, 9, 17, 18, 19];
        const isPeak = peakHours.includes(hour);
        const baseDelay = isPeak ? 8 + Math.random() * 12 : 2 + Math.random() * 5;
        return Math.round(baseDelay);
    }

    generateCongestionData(hour) {
        const peakHours = [7, 8, 9, 17, 18, 19];
        const isPeak = peakHours.includes(hour);
        const baseCongestion = isPeak ? 60 + Math.random() * 35 : 20 + Math.random() * 30;
        return Math.round(baseCongestion);
    }

    updateTrafficStats() {
        // Simulate dynamic stat updates
        const stats = [
            { selector: '[data-counter="15"]', newValue: 15 + Math.floor(Math.random() * 10 - 5) },
            { selector: '[data-counter="78"]', newValue: 78 + Math.floor(Math.random() * 20 - 10) },
            { selector: '[data-counter="4"]', newValue: 4 + Math.floor(Math.random() * 3 - 1) },
            { selector: '[data-counter="2"]', newValue: Math.floor(Math.random() * 5) }
        ];

        stats.forEach(stat => {
            const element = document.querySelector(stat.selector);
            if (element) {
                this.animateCounter(element, parseInt(element.textContent), stat.newValue);
                element.setAttribute('data-counter', stat.newValue);
            }
        });
    }

    animateCounters() {
        document.querySelectorAll('[data-counter]').forEach(counter => {
            const target = parseInt(counter.getAttribute('data-counter'));
            this.animateCounter(counter, 0, target);
        });
    }

    animateCounter(element, start, end) {
        const duration = 1000;
        const range = end - start;
        const startTime = Date.now();

        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(start + range * easeOutQuart);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    initializeChart() {
        const canvas = document.getElementById('trafficChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.chart = new SimpleChart(ctx, canvas.width, canvas.height);
        this.updateChart();
    }

    updateChart(timeRange = '1d', metric = 'delay') {
        if (!this.chart) return;

        const data = this.getChartData(timeRange, metric);
        this.chart.updateData(data, metric);
    }

    getChartData(timeRange, metric) {
        let data = this.trafficData;
        
        switch (timeRange) {
            case '1h':
                data = data.slice(-4); // Last 4 data points (6 hours)
                break;
            case '6h':
                data = data.slice(-6);
                break;
            case '1d':
                data = data.slice(-24);
                break;
            case '1w':
                // Generate weekly data
                data = this.generateWeeklyData();
                break;
        }

        return data.map(item => ({
            time: item.time,
            value: item[metric] || item.delay
        }));
    }

    generateWeeklyData() {
        const weekData = [];
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour += 6) {
                const date = new Date();
                date.setDate(date.getDate() - (6 - day));
                date.setHours(hour);
                
                weekData.push({
                    time: date,
                    speed: this.generateSpeedData(hour),
                    delay: this.generateDelayData(hour),
                    congestion: this.generateCongestionData(hour)
                });
            }
        }
        return weekData;
    }

    updateChartTimeline(timeValue) {
        // Update chart highlight based on time slider
        if (this.chart) {
            this.chart.setTimeHighlight(timeValue);
        }
    }

    updateHeatmap(level = 'road') {
        const mapElement = document.getElementById('trafficMap');
        if (!mapElement) return;

        // Simulate heatmap update
        mapElement.innerHTML = `
            <div class="map-placeholder">
                <i class="fas fa-map pulse-effect"></i>
                <p>Updating ${level}-level heatmap...</p>
            </div>
        `;

        setTimeout(() => {
            mapElement.innerHTML = this.generateHeatmapContent(level);
        }, 1000);
    }

    generateHeatmapContent(level) {
        return `
            <div class="heatmap-grid">
                <div class="traffic-zone smooth" data-intensity="20" style="top: 10%; left: 15%; width: 25%; height: 15%;"></div>
                <div class="traffic-zone moderate" data-intensity="65" style="top: 30%; left: 40%; width: 30%; height: 20%;"></div>
                <div class="traffic-zone heavy" data-intensity="85" style="top: 55%; left: 20%; width: 35%; height: 25%;"></div>
                <div class="traffic-zone smooth" data-intensity="15" style="top: 20%; left: 70%; width: 20%; height: 30%;"></div>
                <div class="traffic-zone moderate" data-intensity="55" style="top: 75%; left: 45%; width: 40%; height: 20%;"></div>
            </div>
        `;
    }

    updateHeatmapData() {
        document.querySelectorAll('.traffic-zone').forEach(zone => {
            const currentIntensity = parseInt(zone.getAttribute('data-intensity'));
            const newIntensity = Math.max(5, Math.min(95, currentIntensity + Math.floor(Math.random() * 20 - 10)));
            
            zone.setAttribute('data-intensity', newIntensity);
            zone.className = `traffic-zone ${this.getTrafficClass(newIntensity)}`;
        });
    }

    getTrafficClass(intensity) {
        if (intensity < 30) return 'smooth';
        if (intensity < 70) return 'moderate';
        return 'heavy';
    }

    setupSettingsToggles() {
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const setting = e.target.id;
                const enabled = e.target.checked;
                this.updateSetting(setting, enabled);
            });
        });
    }

    updateSetting(setting, enabled) {
        localStorage.setItem(`setting-${setting}`, enabled);
        this.showToast(`${setting} ${enabled ? 'enabled' : 'disabled'}`, 'info');
        
        // Handle specific settings
        switch (setting) {
            case 'autoRefresh':
                if (enabled) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
                break;
            case 'notifications':
                if (enabled) {
                    this.requestNotificationPermission();
                }
                break;
        }
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) return;
        
        this.autoRefreshInterval = setInterval(() => {
            this.updateTrafficStats();
        }, 60000); // Refresh every minute
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    setupTooltips() {
        document.addEventListener('mouseover', (e) => {
            const element = e.target.closest('[title]');
            if (element) {
                this.showTooltip(element, element.getAttribute('title'));
            }
        });

        document.addEventListener('mouseout', (e) => {
            const element = e.target.closest('[title]');
            if (element) {
                this.hideTooltip();
            }
        });
    }

    showTooltip(element, text) {
        const tooltip = document.getElementById('tooltip');
        const rect = element.getBoundingClientRect();
        
        tooltip.querySelector('.tooltip-content').textContent = text;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 40}px`;
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.classList.add('visible');
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.remove('visible');
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle', 
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// ===== SIMPLE CHART CLASS =====
class SimpleChart {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.data = [];
        this.metric = 'delay';
        this.timeHighlight = 12;
        this.animationFrame = null;
    }

    updateData(data, metric) {
        this.data = data;
        this.metric = metric;
        this.draw();
    }

    setTimeHighlight(time) {
        this.timeHighlight = time;
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.data.length === 0) return;

        const padding = 60;
        const chartWidth = this.width - padding * 2;
        const chartHeight = this.height - padding * 2;

        // Draw grid
        this.drawGrid(padding, chartWidth, chartHeight);
        
        // Draw data line
        this.drawDataLine(padding, chartWidth, chartHeight);
        
        // Draw time highlight
        this.drawTimeHighlight(padding, chartWidth, chartHeight);
        
        // Draw labels
        this.drawLabels(padding, chartWidth, chartHeight);
    }

    drawGrid(padding, chartWidth, chartHeight) {
        this.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color');
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(padding + chartWidth, y);
            this.ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding);
            this.ctx.lineTo(x, padding + chartHeight);
            this.ctx.stroke();
        }
    }

    drawDataLine(padding, chartWidth, chartHeight) {
        if (this.data.length < 2) return;

        const maxValue = Math.max(...this.data.map(d => d.value));
        const minValue = Math.min(...this.data.map(d => d.value));
        const range = maxValue - minValue || 1;

        // Create gradient
        const gradient = this.ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.1)');

        // Draw area
        this.ctx.beginPath();
        this.data.forEach((point, index) => {
            const x = padding + (chartWidth / (this.data.length - 1)) * index;
            const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        // Close area path
        const lastX = padding + chartWidth;
        const lastY = padding + chartHeight;
        this.ctx.lineTo(lastX, lastY);
        this.ctx.lineTo(padding, lastY);
        this.ctx.closePath();
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Draw line
        this.ctx.beginPath();
        this.data.forEach((point, index) => {
            const x = padding + (chartWidth / (this.data.length - 1)) * index;
            const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw data points
        this.data.forEach((point, index) => {
            const x = padding + (chartWidth / (this.data.length - 1)) * index;
            const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#667eea';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    drawTimeHighlight(padding, chartWidth, chartHeight) {
        const x = padding + (chartWidth / 24) * this.timeHighlight;
        
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, padding);
        this.ctx.lineTo(x, padding + chartHeight);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }

    drawLabels(padding, chartWidth, chartHeight) {
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary');
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';

        // X-axis labels (time)
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            const hour = Math.floor(i * 4);
            const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
            this.ctx.fillText(timeLabel, x, padding + chartHeight + 20);
        }

        // Y-axis labels (values)
        this.ctx.textAlign = 'right';
        const maxValue = Math.max(...this.data.map(d => d.value));
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            const value = Math.round(maxValue - (maxValue / 5) * i);
            const unit = this.metric === 'speed' ? ' mph' : ' min';
            this.ctx.fillText(value + unit, padding - 10, y + 4);
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

function throttle(func, limit) {
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

// ===== TOAST NOTIFICATION STYLES =====
const toastStyles = `
.toast {
    position: fixed;
    top: 80px;
    right: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    opacity: 0;
    transform: translateX(100px);
    transition: all 0.3s ease;
    max-width: 300px;
}

.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    font-weight: 500;
}

.toast-success {
    border-left: 4px solid var(--success-color);
}

.toast-error {
    border-left: 4px solid var(--error-color);
}

.toast-warning {
    border-left: 4px solid var(--warning-color);
}

.toast-info {
    border-left: 4px solid var(--info-color);
}

.toast-success .fas {
    color: var(--success-color);
}

.toast-error .fas {
    color: var(--error-color);
}

.toast-warning .fas {
    color: var(--warning-color);
}

.toast-info .fas {
    color: var(--info-color);
}
`;

// ===== HEATMAP STYLES =====
const heatmapStyles = `
.heatmap-grid {
    width: 100%;
    height: 100%;
    position: relative;
    background: linear-gradient(45deg, #f8fafc 25%, transparent 25%),
                linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #f8fafc 75%),
                linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

[data-theme="dark"] .heatmap-grid {
    background: linear-gradient(45deg, #334155 25%, transparent 25%),
                linear-gradient(-45deg, #334155 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #334155 75%),
                linear-gradient(-45deg, transparent 75%, #334155 75%);
}

.traffic-zone {
    position: absolute;
    border-radius: var(--radius-sm);
    transition: all var(--transition-slow);
    cursor: pointer;
    animation: fadeInUp 0.5s ease;
}

.traffic-zone:hover {
    transform: scale(1.05);
    z-index: 10;
}

.traffic-zone.smooth {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.6));
    border: 2px solid var(--traffic-smooth);
}

.traffic-zone.moderate {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(245, 158, 11, 0.6));
    border: 2px solid var(--traffic-moderate);
}

.traffic-zone.heavy {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.6));
    border: 2px solid var(--traffic-heavy);
    animation: pulse 2s infinite;
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles + heatmapStyles;
document.head.appendChild(styleSheet);

// ===== INITIALIZE APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    window.trafficAnalyzer = new TrafficAnalyzer();
    
    // Add CSS for enhanced interactions
    document.querySelectorAll('.stat-card, .route-card, .nav-item').forEach(element => {
        element.classList.add('interactive-element', 'gpu-accelerated');
    });

    // Initialize view state
    const savedView = localStorage.getItem('current-view') || 'dashboard';
    window.trafficAnalyzer.switchView(savedView);
    
    // Load saved settings
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        const setting = toggle.id;
        const saved = localStorage.getItem(`setting-${setting}`);
        if (saved !== null) {
            toggle.checked = saved === 'true';
        }
    });

    console.log('Traffic Analyzer Extension loaded successfully!');
});

// ===== PERFORMANCE OPTIMIZATIONS =====
// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements that need animation
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.stat-card, .route-card, .prediction-card').forEach(el => {
        animationObserver.observe(el);
    });
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                window.trafficAnalyzer?.switchView('dashboard');
                break;
            case '2':
                e.preventDefault();
                window.trafficAnalyzer?.switchView('heatmap');
                break;
            case '3':
                e.preventDefault();
                window.trafficAnalyzer?.switchView('routes');
                break;
            case '4':
                e.preventDefault();
                window.trafficAnalyzer?.switchView('analytics');
                break;
            case 'r':
                e.preventDefault();
                window.trafficAnalyzer?.refreshData();
                break;
        }
    }
});

// ===== SERVICE WORKER COMMUNICATION =====
if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Listen for background script messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case 'TRAFFIC_UPDATE':
                window.trafficAnalyzer?.updateTrafficStats();
                break;
            case 'ROUTE_ALERT':
                window.trafficAnalyzer?.showToast(message.data, 'warning');
                break;
        }
    });

    // Send status to background script
    chrome.runtime.sendMessage({
        type: 'EXTENSION_READY',
        data: { timestamp: Date.now() }
    });
}

// ===== CLEANUP =====
window.addEventListener('beforeunload', () => {
    // Save current state
    localStorage.setItem('current-view', window.trafficAnalyzer?.currentView || 'dashboard');
    
    // Clean up intervals
    if (window.trafficAnalyzer?.autoRefreshInterval) {
        clearInterval(window.trafficAnalyzer.autoRefreshInterval);
    }
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Extension error:', e.error);
    
    if (window.trafficAnalyzer) {
        window.trafficAnalyzer.showToast('An error occurred. Please refresh.', 'error');
    }
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TrafficAnalyzer, SimpleChart };
}
