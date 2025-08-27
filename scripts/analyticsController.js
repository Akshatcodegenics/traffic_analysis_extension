// ===== ANALYTICS CONTROLLER =====

class AnalyticsController {
    constructor() {
        this.charts = {};
        this.currentPeriod = '6h';
        this.analyticsData = null;
        this.dataManager = new DataManager();
        this.timeSliderValue = 12;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.loadData();
    }

    setupEventListeners() {
        // Time period controls
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changePeriod(e.target.dataset.period);
            });
        });

        // Time slider
        const timeSlider = document.getElementById('timeSlider');
        if (timeSlider) {
            timeSlider.addEventListener('input', (e) => {
                this.updateTimeSlider(e.target.value);
            });
        }
    }

    async loadData() {
        try {
            this.showLoading();
            this.analyticsData = await this.dataManager.getAnalyticsData({
                period: this.currentPeriod
            });
            this.updateCharts();
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data');
        }
    }

    initializeCharts() {
        // Initialize Chart.js charts
        if (typeof Chart !== 'undefined') {
            this.initSpeedChart();
            this.initDelayChart();
        } else {
            // Fallback for when Chart.js is not available
            this.createMockCharts();
        }
    }

    initSpeedChart() {
        const ctx = document.getElementById('speedChart');
        if (!ctx) return;

        this.charts.speed = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Speed (km/h)',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `Speed: ${context.parsed.y} km/h`
                        }
                    }
                }
            }
        });
    }

    initDelayChart() {
        const ctx = document.getElementById('delayChart');
        if (!ctx) return;

        this.charts.delay = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Delay (min)',
                    data: [],
                    backgroundColor: '#f093fb',
                    borderColor: '#764ba2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `Delay: ${context.parsed.y} minutes`
                        }
                    }
                }
            }
        });
    }

    createMockCharts() {
        const speedChart = document.getElementById('speedChart');
        const delayChart = document.getElementById('delayChart');

        if (speedChart) {
            speedChart.innerHTML = this.createMockSpeedVisualization();
        }

        if (delayChart) {
            delayChart.innerHTML = this.createMockDelayVisualization();
        }
    }

    createMockSpeedVisualization() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gradient = isDark 
            ? 'linear-gradient(to top, #3b82f6, #1e40af)'
            : 'linear-gradient(to top, #667eea, #764ba2)';
        
        return `
            <div class="interactive-chart" style="
                position: relative; 
                height: 100%; 
                display: flex; 
                align-items: end; 
                justify-content: space-around; 
                padding: 20px;
                background: ${isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)'};
                border-radius: 8px;
                overflow: hidden;
            ">
                <!-- Chart Grid Lines -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1;">
                    ${Array.from({ length: 5 }, (_, i) => `
                        <div style="
                            position: absolute;
                            top: ${(i + 1) * 20}%;
                            left: 0;
                            right: 0;
                            height: 1px;
                            background: ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.2)'};
                        "></div>
                    `).join('')}
                </div>
                
                <!-- Interactive Bars -->
                ${Array.from({ length: 12 }, (_, i) => {
                    const height = 25 + Math.sin(i * 0.5) * 20 + Math.random() * 30;
                    const speed = Math.round(35 + height * 0.8);
                    const time = new Date(Date.now() - (11 - i) * 3600000).getHours();
                    
                    return `
                        <div class="chart-bar" 
                             onmouseover="this.querySelector('.bar-tooltip').style.opacity='1'"
                             onmouseout="this.querySelector('.bar-tooltip').style.opacity='0'"
                             style="
                                 display: flex; 
                                 flex-direction: column; 
                                 align-items: center; 
                                 gap: 4px;
                                 position: relative;
                                 z-index: 2;
                                 cursor: pointer;
                                 transition: transform 0.2s ease;
                             "
                             onmouseover="this.style.transform='translateY(-2px)'"
                             onmouseout="this.style.transform='translateY(0)'">
                            <!-- Tooltip -->
                            <div class="bar-tooltip" style="
                                position: absolute;
                                top: -35px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: ${isDark ? '#1f2937' : '#374151'};
                                color: white;
                                padding: 4px 8px;
                                border-radius: 4px;
                                font-size: 10px;
                                white-space: nowrap;
                                opacity: 0;
                                transition: opacity 0.2s;
                                pointer-events: none;
                                z-index: 10;
                            ">
                                ${speed} km/h at ${time}:00
                                <div style="
                                    position: absolute;
                                    top: 100%;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    width: 0;
                                    height: 0;
                                    border-left: 4px solid transparent;
                                    border-right: 4px solid transparent;
                                    border-top: 4px solid ${isDark ? '#1f2937' : '#374151'};
                                "></div>
                            </div>
                            
                            <!-- Speed Label -->
                            <div style="font-size: 10px; color: ${isDark ? '#cbd5e1' : '#64748b'}; font-weight: 500;">${speed}</div>
                            
                            <!-- Bar -->
                            <div style="
                                width: 18px; 
                                height: ${height}%; 
                                background: ${gradient}; 
                                border-radius: 3px;
                                position: relative;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            ">
                                <!-- Animated Shine Effect -->
                                <div style="
                                    position: absolute;
                                    top: 0;
                                    left: -50%;
                                    width: 100%;
                                    height: 100%;
                                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                                    transform: skewX(-25deg);
                                    animation: shine 3s infinite;
                                "></div>
                            </div>
                            
                            <!-- Time Label -->
                            <div style="font-size: 9px; color: ${isDark ? '#94a3b8' : '#94a3b8'}; font-weight: 400;">${time}:00</div>
                        </div>
                    `;
                }).join('')}
                
                <!-- Chart Info -->
                <div style="
                    position: absolute; 
                    bottom: 5px; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    font-size: 12px; 
                    color: ${isDark ? '#cbd5e1' : '#64748b'};
                    font-weight: 500;
                    background: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)'};
                    padding: 4px 8px;
                    border-radius: 12px;
                ">
                    Average Speed Trends (${this.currentPeriod})
                </div>
            </div>
            
            <style>
                @keyframes shine {
                    0% { left: -50%; }
                    100% { left: 150%; }
                }
            </style>
        `;
    }

    createMockDelayVisualization() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        return `
            <div class="interactive-chart delay-chart" style="
                position: relative; 
                height: 100%; 
                display: flex; 
                align-items: end; 
                justify-content: space-around; 
                padding: 20px;
                background: ${isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)'};
                border-radius: 8px;
                overflow: hidden;
            ">
                <!-- Background Pattern -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 30% 30%, ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(147, 51, 234, 0.1)'}, transparent 50%);
                    z-index: 1;
                "></div>
                
                <!-- Delay Bars with Animations -->
                ${Array.from({ length: 10 }, (_, i) => {
                    const baseDelay = [5, 12, 18, 8, 25, 15, 7, 22, 11, 16][i];
                    const height = (baseDelay / 30) * 80 + 15;
                    const delayColor = baseDelay > 20 ? '#ef4444' : baseDelay > 10 ? '#f59e0b' : '#22c55e';
                    const gradient = `linear-gradient(to top, ${delayColor}, ${delayColor}88)`;
                    const routeName = ['Route A', 'Route B', 'Route C', 'Route D', 'Route E', 'Route F', 'Route G', 'Route H', 'Route I', 'Route J'][i];
                    
                    return `
                        <div class="delay-bar" 
                             data-delay="${baseDelay}"
                             data-route="${routeName}"
                             style="
                                 display: flex; 
                                 flex-direction: column; 
                                 align-items: center; 
                                 gap: 4px;
                                 position: relative;
                                 z-index: 2;
                                 cursor: pointer;
                                 transition: all 0.3s ease;
                                 animation: slideUp 0.8s ease ${i * 0.1}s both;
                             "
                             onmouseover="this.style.transform='scale(1.05)'; this.querySelector('.delay-tooltip').style.opacity='1'"
                             onmouseout="this.style.transform='scale(1)'; this.querySelector('.delay-tooltip').style.opacity='0'"
                             onclick="window.analyticsController?.showDelayDetails('${routeName}', ${baseDelay})">
                            
                            <!-- Tooltip -->
                            <div class="delay-tooltip" style="
                                position: absolute;
                                top: -45px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: ${isDark ? '#1f2937' : '#374151'};
                                color: white;
                                padding: 6px 10px;
                                border-radius: 6px;
                                font-size: 11px;
                                white-space: nowrap;
                                opacity: 0;
                                transition: opacity 0.2s;
                                pointer-events: none;
                                z-index: 10;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                            ">
                                <div style="font-weight: 600;">${routeName}</div>
                                <div style="font-size: 10px; opacity: 0.9;">Avg delay: ${baseDelay} min</div>
                                <div style="
                                    position: absolute;
                                    top: 100%;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    width: 0;
                                    height: 0;
                                    border-left: 6px solid transparent;
                                    border-right: 6px solid transparent;
                                    border-top: 6px solid ${isDark ? '#1f2937' : '#374151'};
                                "></div>
                            </div>
                            
                            <!-- Delay Value -->
                            <div style="
                                font-size: 11px; 
                                color: ${isDark ? '#e2e8f0' : '#374151'}; 
                                font-weight: 600;
                                background: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)'};
                                padding: 2px 6px;
                                border-radius: 8px;
                            ">${baseDelay}min</div>
                            
                            <!-- Bar Container -->
                            <div style="
                                width: 22px; 
                                height: ${height}%; 
                                position: relative;
                                border-radius: 4px;
                                overflow: hidden;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                            ">
                                <!-- Animated Bar -->
                                <div style="
                                    position: absolute;
                                    bottom: 0;
                                    left: 0;
                                    right: 0;
                                    height: 100%;
                                    background: ${gradient};
                                    border-radius: 4px;
                                    animation: fillUp 1.5s ease ${i * 0.1}s both;
                                "></div>
                                
                                <!-- Pulse Overlay for High Delays -->
                                ${baseDelay > 15 ? `
                                    <div style="
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        right: 0;
                                        bottom: 0;
                                        background: rgba(239, 68, 68, 0.3);
                                        animation: delayPulse 2s infinite;
                                        border-radius: 4px;
                                    "></div>
                                ` : ''}
                            </div>
                            
                            <!-- Route Label -->
                            <div style="
                                font-size: 9px; 
                                color: ${isDark ? '#94a3b8' : '#6b7280'}; 
                                font-weight: 500;
                                writing-mode: vertical-rl;
                                text-orientation: mixed;
                                height: 40px;
                                display: flex;
                                align-items: center;
                            ">${routeName}</div>
                        </div>
                    `;
                }).join('')}
                
                <!-- Chart Info -->
                <div style="
                    position: absolute; 
                    bottom: 5px; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    font-size: 12px; 
                    color: ${isDark ? '#cbd5e1' : '#64748b'};
                    font-weight: 500;
                    background: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)'};
                    padding: 4px 8px;
                    border-radius: 12px;
                    backdrop-filter: blur(4px);
                ">
                    Route Delay Analysis (${this.currentPeriod})
                </div>
            </div>
            
            <style>
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fillUp {
                    from {
                        height: 0;
                    }
                    to {
                        height: 100%;
                    }
                }
                
                @keyframes delayPulse {
                    0%, 100% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.6;
                    }
                }
            </style>
        `;
    }

    updateCharts() {
        if (!this.analyticsData) return;

        if (this.charts.speed && this.charts.delay) {
            this.updateSpeedChart();
            this.updateDelayChart();
        } else {
            this.createMockCharts();
        }

        this.hideLoading();
    }

    updateSpeedChart() {
        const data = this.analyticsData.speedTrends || [];
        const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        }));
        const values = data.map(d => d.value);

        this.charts.speed.data.labels = labels;
        this.charts.speed.data.datasets[0].data = values;
        this.charts.speed.update();
    }

    updateDelayChart() {
        const data = this.analyticsData.delayPatterns || [];
        const labels = data.map((d, i) => `Period ${i + 1}`);
        const values = data.map(d => d.value);

        this.charts.delay.data.labels = labels;
        this.charts.delay.data.datasets[0].data = values;
        this.charts.delay.update();
    }

    changePeriod(period) {
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });

        this.loadData();
    }

    updateTimeSlider(value) {
        this.timeSliderValue = value;
        
        const currentTimeLabel = document.getElementById('currentTime');
        if (currentTimeLabel) {
            const timeOfDay = parseFloat(value);
            let label = 'Present';
            
            if (timeOfDay < 12) {
                label = `${Math.floor(timeOfDay)}h ago`;
            } else if (timeOfDay > 12) {
                label = `+${Math.floor(timeOfDay - 12)}h future`;
            }
            
            currentTimeLabel.textContent = label;
        }

        // Here you would filter/update the charts based on the time slider value
        this.updateChartsForTime(value);
    }

    updateChartsForTime(timeValue) {
        // This would filter the data based on the time slider position
        // For demo purposes, we'll add a visual indicator and highlight relevant data
        const hour = Math.floor(parseFloat(timeValue));
        const period = hour < 12 ? 'Past' : hour > 12 ? 'Future' : 'Present';
        
        // Update chart highlighting
        this.highlightTimeSlice(timeValue);
        
        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'info',
                message: `Viewing ${period} traffic data (${hour}:00)`,
                icon: 'fa-clock',
                duration: 1500
            });
        }
    }
    
    highlightTimeSlice(timeValue) {
        // Add visual highlighting to charts based on time slider
        const speedChart = document.getElementById('speedChart');
        const delayChart = document.getElementById('delayChart');
        
        // Remove existing highlights
        document.querySelectorAll('.time-highlight').forEach(el => el.remove());
        
        // Add highlight overlay
        [speedChart, delayChart].forEach(chart => {
            if (!chart) return;
            
            const highlight = document.createElement('div');
            highlight.className = 'time-highlight';
            highlight.style.cssText = `
                position: absolute;
                top: 0;
                left: ${(timeValue / 24) * 100}%;
                width: 2px;
                height: 100%;
                background: #3b82f6;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
                z-index: 100;
                pointer-events: none;
                animation: slideIndicator 0.3s ease;
            `;
            
            chart.style.position = 'relative';
            chart.appendChild(highlight);
        });
    }
    
    showDelayDetails(routeName, delay) {
        if (window.ToastManager) {
            const severity = delay > 20 ? 'High' : delay > 10 ? 'Moderate' : 'Low';
            const icon = delay > 20 ? 'fa-exclamation-triangle' : 
                        delay > 10 ? 'fa-clock' : 'fa-check-circle';
            const type = delay > 20 ? 'warning' : delay > 10 ? 'info' : 'success';
            
            window.ToastManager.show({
                type: type,
                message: `${routeName}: ${delay} min average delay • ${severity} traffic`,
                icon: icon,
                duration: 3000
            });
        }
    }

    showLoading() {
        const speedChart = document.getElementById('speedChart');
        const delayChart = document.getElementById('delayChart');

        const loadingHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b;">
                <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>
                Loading analytics...
            </div>
        `;

        if (speedChart) speedChart.innerHTML = loadingHTML;
        if (delayChart) delayChart.innerHTML = loadingHTML;
    }

    hideLoading() {
        // Loading is hidden when charts are updated
    }

    showError(message) {
        const speedChart = document.getElementById('speedChart');
        const delayChart = document.getElementById('delayChart');

        const errorHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                ${message}
            </div>
        `;

        if (speedChart) speedChart.innerHTML = errorHTML;
        if (delayChart) delayChart.innerHTML = errorHTML;
    }

    updateTheme(theme) {
        // Update chart colors based on theme
        if (this.charts.speed) {
            const colors = window.ThemeManager?.getThemeColors();
            if (colors) {
                this.charts.speed.data.datasets[0].borderColor = colors.primary;
                this.charts.speed.data.datasets[0].backgroundColor = colors.primary + '20';
                this.charts.speed.update();
            }
        }
        
        if (this.charts.delay) {
            const colors = window.ThemeManager?.getThemeColors();
            if (colors) {
                this.charts.delay.data.datasets[0].backgroundColor = colors.accent;
                this.charts.delay.data.datasets[0].borderColor = colors.secondary;
                this.charts.delay.update();
            }
        }
    }

    refreshData() {
        this.loadData();
    }

    loadData() {
        this.loadData();
    }
}

window.AnalyticsController = AnalyticsController;
