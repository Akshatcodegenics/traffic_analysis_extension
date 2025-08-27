// ===== HEATMAP CONTROLLER =====

class HeatmapController {
    constructor() {
        this.currentView = 'area';
        this.zoomLevel = 10;
        this.trafficData = null;
        this.container = null;
        this.dataManager = new DataManager();
        
        this.init();
    }

    init() {
        this.container = document.getElementById('trafficMap');
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // View controls
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Zoom controls
        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoomOut());
    }

    async loadInitialData() {
        try {
            this.showLoading();
            this.trafficData = await this.dataManager.getTrafficData();
            this.renderHeatmap();
        } catch (error) {
            console.error('Error loading heatmap data:', error);
            this.showError('Failed to load traffic heatmap');
        }
    }

    renderHeatmap() {
        if (!this.container || !this.trafficData) return;

        const mockHeatmap = this.createMockHeatmapVisualization();
        this.container.innerHTML = mockHeatmap;
        this.hideLoading();
    }

    createMockHeatmapVisualization() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const bgGradient = isDark 
            ? 'linear-gradient(135deg, #1e293b, #334155)' 
            : 'linear-gradient(135deg, #e0f2fe, #f1f5f9)';
        
        // Generate more realistic traffic data points based on current view and zoom
        const trafficPoints = this.generateTrafficPoints();
        const roadSegments = this.generateRoadSegments();
        
        return `
            <div class="heatmap-container" style="
                width: 100%; 
                height: 100%; 
                position: relative; 
                background: ${bgGradient};
                border-radius: 8px;
                overflow: hidden;
                cursor: grab;
            ">
                <!-- Road Network Base -->
                <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0; z-index: 1;">
                    ${roadSegments.map(segment => `
                        <path d="${segment.path}" 
                              stroke="${isDark ? '#475569' : '#cbd5e1'}" 
                              stroke-width="${segment.width}" 
                              fill="none" 
                              opacity="0.8"/>
                    `).join('')}
                </svg>
                
                <!-- Traffic Intensity Heatmap -->
                <div class="traffic-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2;">
                    ${trafficPoints.map((point, index) => `
                        <div class="traffic-hotspot" 
                             data-intensity="${point.intensity}"
                             data-location="${point.location}"
                             data-speed="${point.speed}"
                             style="
                                 position: absolute;
                                 top: ${point.y}%;
                                 left: ${point.x}%;
                                 width: ${point.size}px;
                                 height: ${point.size}px;
                                 background: ${this.getIntensityColor(point.intensity)};
                                 border-radius: 50%;
                                 animation: heatmapPulse ${1.5 + Math.random()}s infinite;
                                 opacity: 0.8;
                                 cursor: pointer;
                                 transform: translate(-50%, -50%);
                                 transition: all 0.3s ease;
                             "
                             onmouseover="this.style.opacity='1'; this.style.transform='translate(-50%, -50%) scale(1.2)'"
                             onmouseout="this.style.opacity='0.8'; this.style.transform='translate(-50%, -50%) scale(1)'"
                             onclick="window.heatmapController?.showTrafficDetails('${point.location}', ${point.speed}, '${point.intensity}')">
                        </div>
                    `).join('')}
                </div>
                
                <!-- Interactive Controls Overlay -->
                <div class="heatmap-controls" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                ">
                    <button class="zoom-btn" onclick="window.heatmapController?.zoomIn()" 
                            style="
                                padding: 8px;
                                background: rgba(255, 255, 255, 0.9);
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                transition: all 0.2s;
                            "
                            onmouseover="this.style.background='rgba(255, 255, 255, 1)'"
                            onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'">
                        <i class="fas fa-plus" style="color: #374151;"></i>
                    </button>
                    <button class="zoom-btn" onclick="window.heatmapController?.zoomOut()" 
                            style="
                                padding: 8px;
                                background: rgba(255, 255, 255, 0.9);
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                transition: all 0.2s;
                            "
                            onmouseover="this.style.background='rgba(255, 255, 255, 1)'"
                            onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'">
                        <i class="fas fa-minus" style="color: #374151;"></i>
                    </button>
                    <button class="refresh-btn" onclick="window.heatmapController?.refreshData()" 
                            style="
                                padding: 8px;
                                background: rgba(59, 130, 246, 0.9);
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                transition: all 0.2s;
                            "
                            onmouseover="this.style.background='rgba(59, 130, 246, 1)'"
                            onmouseout="this.style.background='rgba(59, 130, 246, 0.9)'">
                        <i class="fas fa-sync-alt" style="color: white;"></i>
                    </button>
                </div>
                
                <!-- Traffic Legend -->
                <div class="traffic-legend" style="
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    z-index: 10;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    font-size: 11px;
                    color: #374151;
                ">
                    <div style="font-weight: 600; margin-bottom: 6px;">Traffic Intensity</div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
                            <span>Light</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%;"></div>
                            <span>Moderate</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></div>
                            <span>Heavy</span>
                        </div>
                    </div>
                </div>
                
                <!-- View Info -->
                <div class="view-info" style="
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    z-index: 10;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                ">
                    ${this.currentView.toUpperCase()} VIEW • ZOOM ${this.zoomLevel}
                </div>
                
                <!-- Live Update Indicator -->
                <div class="live-indicator" style="
                    position: absolute;
                    top: 40px;
                    left: 10px;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #22c55e;
                    font-size: 10px;
                    font-weight: 500;
                ">
                    <div style="width: 6px; height: 6px; background: #22c55e; border-radius: 50%; animation: blink 1.5s infinite;"></div>
                    LIVE
                </div>
            </div>
            
            <style>
                @keyframes heatmapPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                }
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
                .heatmap-container:active {
                    cursor: grabbing;
                }
            </style>
        `;
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.renderHeatmap();
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 1, 18);
        this.renderHeatmap();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 1, 1);
        this.renderHeatmap();
    }

    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b;">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>
                    Loading traffic data...
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading is hidden when renderHeatmap() is called
    }

    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                    ${message}
                </div>
            `;
        }
    }

    generateTrafficPoints() {
        const points = [];
        const numPoints = Math.min(15 + this.zoomLevel, 25);
        
        for (let i = 0; i < numPoints; i++) {
            const intensity = ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)];
            const point = {
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80,
                intensity: intensity,
                size: intensity === 'heavy' ? 35 : intensity === 'moderate' ? 25 : 18,
                speed: Math.round(20 + Math.random() * 60),
                location: this.generateLocationName()
            };
            points.push(point);
        }
        
        return points;
    }
    
    generateRoadSegments() {
        const segments = [];
        
        // Major highways
        segments.push(
            { path: 'M 20 30 Q 150 25 280 40', width: 4 },
            { path: 'M 10 80 Q 100 75 200 85 Q 250 90 300 95', width: 4 },
            { path: 'M 60 10 Q 65 50 70 120 Q 75 180 80 220', width: 4 }
        );
        
        // Secondary roads
        for (let i = 0; i < 8; i++) {
            segments.push({
                path: `M ${20 + i * 35} ${15 + Math.random() * 20} Q ${50 + i * 35} ${60 + Math.random() * 40} ${80 + i * 35} ${120 + Math.random() * 60}`,
                width: 2
            });
        }
        
        return segments;
    }
    
    generateLocationName() {
        const locations = [
            'Main St & 5th Ave', 'Highway 101', 'Downtown Area', 'Industrial Zone',
            'Residential District', 'Commercial Center', 'Business Park', 'University Campus',
            'Shopping Mall', 'Airport Access', 'Bridge Crossing', 'Tunnel Entrance'
        ];
        return locations[Math.floor(Math.random() * locations.length)];
    }
    
    getIntensityColor(intensity) {
        const colors = {
            'light': 'radial-gradient(circle, rgba(34, 197, 94, 0.7), rgba(34, 197, 94, 0.1))',
            'moderate': 'radial-gradient(circle, rgba(245, 158, 11, 0.8), rgba(245, 158, 11, 0.1))',
            'heavy': 'radial-gradient(circle, rgba(239, 68, 68, 0.9), rgba(239, 68, 68, 0.1))'
        };
        return colors[intensity] || colors['moderate'];
    }
    
    showTrafficDetails(location, speed, intensity) {
        if (window.ToastManager) {
            const icon = intensity === 'heavy' ? 'fa-exclamation-triangle' : 
                        intensity === 'moderate' ? 'fa-clock' : 'fa-check-circle';
            const type = intensity === 'heavy' ? 'warning' : 
                        intensity === 'moderate' ? 'info' : 'success';
                        
            window.ToastManager.show({
                type: type,
                message: `${location}: ${speed} km/h avg speed • ${intensity.toUpperCase()} traffic`,
                icon: icon,
                duration: 3000
            });
        }
    }
    
    updateTheme(theme) {
        // Update visualization colors based on theme
        this.renderHeatmap();
    }

    refreshData() {
        this.loadInitialData();
    }
}

window.HeatmapController = HeatmapController;
