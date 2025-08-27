// ===== ROUTE CONTROLLER =====

class RouteController {
    constructor() {
        this.currentRoutes = [];
        this.selectedRoute = null;
        this.dataManager = new DataManager();
        this.container = null;
        
        this.init();
    }

    init() {
        this.container = document.getElementById('routeResults');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Location inputs
        const fromInput = document.getElementById('fromLocation');
        const toInput = document.getElementById('toLocation');
        const swapBtn = document.getElementById('swapLocations');
        const refreshBtn = document.getElementById('refreshRoutes');

        if (fromInput && toInput) {
            const debouncedSearch = Utils.debounce(() => this.searchRoutes(), 1000);
            fromInput.addEventListener('input', debouncedSearch);
            toInput.addEventListener('input', debouncedSearch);
        }

        swapBtn?.addEventListener('click', () => this.swapLocations());
        refreshBtn?.addEventListener('click', () => this.refreshRoutes());

        // Departure time
        document.getElementById('departureTime')?.addEventListener('change', (e) => {
            this.handleDepartureTimeChange(e.target.value);
        });
    }

    async searchRoutes() {
        const from = document.getElementById('fromLocation')?.value;
        const to = document.getElementById('toLocation')?.value;
        
        if (!from || !to || from.length < 3 || to.length < 3) {
            this.clearResults();
            return;
        }

        try {
            this.showLoading();
            
            const routes = await this.dataManager.getRouteSuggestions({
                from: from,
                to: to,
                departureTime: document.getElementById('departureTime')?.value || 'now'
            });

            this.currentRoutes = routes;
            this.renderRoutes();
            
        } catch (error) {
            console.error('Error fetching routes:', error);
            this.showError('Failed to find routes');
        }
    }

    renderRoutes() {
        if (!this.container || !this.currentRoutes.length) {
            this.showEmptyState();
            return;
        }

        const routeCards = this.currentRoutes.map((route, index) => 
            this.createRouteCard(route, index)
        ).join('');

        this.container.innerHTML = routeCards;
        this.attachRouteCardEvents();
    }

    createRouteCard(route, index) {
        const statusClass = route.status || 'moderate';
        const statusIcon = {
            'smooth': '🟢',
            'moderate': '🟡', 
            'heavy': '🔴'
        }[statusClass] || '🟡';

        return `
            <div class="route-card" data-route-id="${route.id}" data-index="${index}">
                <div class="route-header">
                    <div class="route-title">
                        <i class="fas fa-route"></i>
                        ${route.name}
                    </div>
                    <div class="route-status ${statusClass}">
                        ${statusIcon} ${statusClass}
                    </div>
                </div>
                
                <div class="route-details">
                    <div class="route-metric">
                        <div class="metric-value">${Utils.formatDuration(route.duration)}</div>
                        <div class="metric-label">Duration</div>
                    </div>
                    <div class="route-metric">
                        <div class="metric-value">${Utils.formatDistance(route.distance)}</div>
                        <div class="metric-label">Distance</div>
                    </div>
                    <div class="route-metric">
                        <div class="metric-value">${Utils.formatTime(route.eta)}</div>
                        <div class="metric-label">ETA</div>
                    </div>
                </div>

                ${route.incidents?.length ? `
                    <div class="route-incidents">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${route.incidents.join(', ')}
                    </div>
                ` : ''}

                ${route.tollCost ? `
                    <div class="route-toll">
                        <i class="fas fa-dollar-sign"></i>
                        Toll: $${route.tollCost}
                    </div>
                ` : ''}

                <div class="route-actions">
                    <button class="action-btn" onclick="routeController.selectRoute(${index})">
                        <i class="fas fa-check"></i> Select
                    </button>
                    <button class="action-btn" onclick="routeController.addToFavorites(${index})">
                        <i class="fas fa-star"></i> Favorite
                    </button>
                    <button class="action-btn primary" onclick="routeController.startNavigation(${index})">
                        <i class="fas fa-navigation"></i> Navigate
                    </button>
                </div>
            </div>
        `;
    }

    attachRouteCardEvents() {
        const routeCards = this.container.querySelectorAll('.route-card');
        routeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.route-actions')) return;
                this.selectRouteCard(card);
            });
        });
    }

    selectRouteCard(card) {
        // Remove previous selection
        this.container.querySelectorAll('.route-card.selected').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Select new card
        card.classList.add('selected');
        const index = parseInt(card.dataset.index);
        this.selectedRoute = this.currentRoutes[index];
    }

    selectRoute(index) {
        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'success',
                message: `Selected ${this.currentRoutes[index].name}`,
                icon: 'fa-check',
                duration: 2000
            });
        }
        this.selectedRoute = this.currentRoutes[index];
    }

    addToFavorites(index) {
        const route = this.currentRoutes[index];
        // This would integrate with FavoritesController
        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'success',
                message: `Added ${route.name} to favorites`,
                icon: 'fa-star',
                duration: 2000
            });
        }
    }

    startNavigation(index) {
        const route = this.currentRoutes[index];
        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'info',
                message: `Starting navigation via ${route.name}`,
                icon: 'fa-navigation',
                duration: 3000
            });
        }
    }

    swapLocations() {
        const fromInput = document.getElementById('fromLocation');
        const toInput = document.getElementById('toLocation');
        
        if (fromInput && toInput) {
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;
            
            if (fromInput.value && toInput.value) {
                this.searchRoutes();
            }
        }
    }

    refreshRoutes() {
        this.searchRoutes();
    }

    handleDepartureTimeChange(value) {
        if (value === 'optimal' && this.currentRoutes.length > 0) {
            const optimalTime = Utils.getOptimalDepartureTime({});
            if (window.ToastManager) {
                window.ToastManager.show({
                    type: 'info',
                    message: `Optimal departure time: ${Utils.formatTime(optimalTime)}`,
                    icon: 'fa-clock',
                    duration: 4000
                });
            }
        }
        
        // Re-search routes with new departure time
        if (document.getElementById('fromLocation')?.value && 
            document.getElementById('toLocation')?.value) {
            this.searchRoutes();
        }
    }

    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="loading-state" style="text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
                    <p>Finding best routes...</p>
                </div>
            `;
        }
    }

    showEmptyState() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #94a3b8;">
                    <i class="fas fa-route" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="margin-bottom: 8px;">Enter start and destination</p>
                    <p style="font-size: 14px;">We'll find the best routes for you</p>
                </div>
            `;
        }
    }

    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 12px;"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    clearResults() {
        this.currentRoutes = [];
        this.selectedRoute = null;
        this.showEmptyState();
    }

    updateTheme(theme) {
        // Theme-specific updates would go here
    }

    refreshData() {
        if (document.getElementById('fromLocation')?.value && 
            document.getElementById('toLocation')?.value) {
            this.searchRoutes();
        }
    }

    loadData() {
        // Load data when section becomes active
        if (document.getElementById('fromLocation')?.value && 
            document.getElementById('toLocation')?.value) {
            this.searchRoutes();
        }
    }
}

// Make globally available
window.RouteController = RouteController;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.routeController = new RouteController();
    });
} else {
    window.routeController = new RouteController();
}
