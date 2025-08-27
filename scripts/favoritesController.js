// ===== FAVORITES CONTROLLER =====

class FavoritesController {
    constructor() {
        this.favorites = [];
        this.container = null;
        
        this.init();
    }

    init() {
        this.container = document.getElementById('favoritesList');
        this.loadFavorites();
        this.setupEventListeners();
        this.renderFavorites();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addFavorite');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddFavoriteModal());
        }
    }

    loadFavorites() {
        this.favorites = Utils.storage.get('favorite_routes', []);
        
        // Add some sample favorites if none exist
        if (this.favorites.length === 0) {
            this.favorites = [
                {
                    id: Utils.generateId(),
                    name: 'Home to Work',
                    from: 'Home',
                    to: 'Downtown Office',
                    distance: 15200,
                    averageDuration: 25,
                    lastUsed: Date.now() - 86400000, // Yesterday
                    useCount: 12
                },
                {
                    id: Utils.generateId(),
                    name: 'Airport Route',
                    from: 'City Center',
                    to: 'International Airport',
                    distance: 28500,
                    averageDuration: 35,
                    lastUsed: Date.now() - 604800000, // Week ago
                    useCount: 3
                }
            ];
            this.saveFavorites();
        }
    }

    renderFavorites() {
        if (!this.container) return;

        if (this.favorites.length === 0) {
            this.showEmptyState();
            return;
        }

        const favoritesHTML = this.favorites.map(favorite => 
            this.createFavoriteCard(favorite)
        ).join('');

        this.container.innerHTML = favoritesHTML;
        this.attachEventListeners();
    }

    createFavoriteCard(favorite) {
        return `
            <div class="favorite-item" data-favorite-id="${favorite.id}">
                <div class="favorite-header">
                    <div class="favorite-info">
                        <div class="favorite-name">${favorite.name}</div>
                        <div class="favorite-route">
                            <i class="fas fa-map-marker-alt"></i>
                            ${favorite.from}
                            <i class="fas fa-arrow-right" style="margin: 0 8px;"></i>
                            <i class="fas fa-flag"></i>
                            ${favorite.to}
                        </div>
                    </div>
                    <div class="favorite-actions">
                        <button class="favorite-btn" onclick="favoritesController.editFavorite('${favorite.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="favorite-btn delete" onclick="favoritesController.deleteFavorite('${favorite.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="favorite-stats">
                    <span class="favorite-stat">
                        <i class="fas fa-route"></i>
                        ${Utils.formatDistance(favorite.distance)}
                    </span>
                    <span class="favorite-stat">
                        <i class="fas fa-clock"></i>
                        ~${Utils.formatDuration(favorite.averageDuration)}
                    </span>
                    <span class="favorite-stat">
                        <i class="fas fa-history"></i>
                        Used ${favorite.useCount} times
                    </span>
                    <span class="favorite-stat">
                        <i class="fas fa-calendar"></i>
                        ${this.getLastUsedText(favorite.lastUsed)}
                    </span>
                </div>
                
                <div class="favorite-actions" style="margin-top: 12px;">
                    <button class="action-btn" onclick="favoritesController.useFavorite('${favorite.id}')">
                        <i class="fas fa-play"></i> Use Route
                    </button>
                    <button class="action-btn primary" onclick="favoritesController.navigateToFavorite('${favorite.id}')">
                        <i class="fas fa-navigation"></i> Navigate
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const favoriteCards = this.container.querySelectorAll('.favorite-item');
        favoriteCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.favorite-actions') || e.target.closest('.favorite-btn')) {
                    return; // Don't trigger card selection for button clicks
                }
                this.selectFavorite(card.dataset.favoriteId);
            });
        });
    }

    showAddFavoriteModal() {
        // Create a simple modal for adding favorites
        const modal = this.createAddFavoriteModal();
        document.body.appendChild(modal);
    }

    createAddFavoriteModal() {
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
            }, 'Add Favorite Route'),
            Utils.createElement('button', {
                className: 'modal-close'
            }, Utils.createElement('i', {
                className: 'fas fa-times'
            }))
        ]);

        const body = Utils.createElement('div', {
            className: 'modal-body'
        }, this.createAddFavoriteForm());

        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);

        // Setup event listeners
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

    createAddFavoriteForm() {
        return `
            <form id="addFavoriteForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div class="form-group">
                    <label class="form-label">Route Name</label>
                    <input type="text" class="form-input" id="favoriteName" placeholder="e.g., Home to Work" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">From Location</label>
                    <input type="text" class="form-input" id="favoriteFrom" placeholder="Start location" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">To Location</label>
                    <input type="text" class="form-input" id="favoriteTo" placeholder="Destination" required>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button type="button" class="form-button secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="submit" class="form-button primary">
                        <i class="fas fa-plus"></i> Add Favorite
                    </button>
                </div>
            </form>
        `;
    }

    closeModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    addFavorite(name, from, to) {
        const favorite = {
            id: Utils.generateId(),
            name: name,
            from: from,
            to: to,
            distance: 15000 + Math.random() * 20000, // Mock distance
            averageDuration: 20 + Math.random() * 30, // Mock duration
            lastUsed: Date.now(),
            useCount: 1,
            createdAt: Date.now()
        };

        this.favorites.unshift(favorite);
        this.saveFavorites();
        this.renderFavorites();

        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'success',
                message: `Added "${name}" to favorites`,
                icon: 'fa-star',
                duration: 3000
            });
        }
    }

    editFavorite(favoriteId) {
        const favorite = this.favorites.find(f => f.id === favoriteId);
        if (!favorite) return;

        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'info',
                message: `Edit functionality would open here for "${favorite.name}"`,
                icon: 'fa-edit',
                duration: 2000
            });
        }
    }

    deleteFavorite(favoriteId) {
        const favoriteIndex = this.favorites.findIndex(f => f.id === favoriteId);
        if (favoriteIndex === -1) return;

        const favorite = this.favorites[favoriteIndex];
        
        // Confirm deletion
        if (confirm(`Delete "${favorite.name}" from favorites?`)) {
            this.favorites.splice(favoriteIndex, 1);
            this.saveFavorites();
            this.renderFavorites();

            if (window.ToastManager) {
                window.ToastManager.show({
                    type: 'success',
                    message: `Removed "${favorite.name}" from favorites`,
                    icon: 'fa-trash',
                    duration: 2000
                });
            }
        }
    }

    useFavorite(favoriteId) {
        const favorite = this.favorites.find(f => f.id === favoriteId);
        if (!favorite) return;

        // Update usage stats
        favorite.lastUsed = Date.now();
        favorite.useCount++;
        this.saveFavorites();
        this.renderFavorites();

        // Navigate to routes section and populate the form
        if (window.PopupController) {
            window.PopupController.navigateToSection('routes');
            
            setTimeout(() => {
                const fromInput = document.getElementById('fromLocation');
                const toInput = document.getElementById('toLocation');
                
                if (fromInput && toInput) {
                    fromInput.value = favorite.from;
                    toInput.value = favorite.to;
                    
                    // Trigger route search
                    if (window.routeController) {
                        window.routeController.searchRoutes();
                    }
                }
            }, 100);
        }

        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'info',
                message: `Loading route: ${favorite.name}`,
                icon: 'fa-route',
                duration: 2000
            });
        }
    }

    navigateToFavorite(favoriteId) {
        const favorite = this.favorites.find(f => f.id === favoriteId);
        if (!favorite) return;

        if (window.ToastManager) {
            window.ToastManager.show({
                type: 'success',
                message: `Starting navigation: ${favorite.name}`,
                icon: 'fa-navigation',
                duration: 3000
            });
        }

        // Update usage stats
        favorite.lastUsed = Date.now();
        favorite.useCount++;
        this.saveFavorites();
    }

    selectFavorite(favoriteId) {
        // Remove previous selections
        this.container.querySelectorAll('.favorite-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        // Select new favorite
        const favoriteCard = this.container.querySelector(`[data-favorite-id="${favoriteId}"]`);
        if (favoriteCard) {
            favoriteCard.classList.add('selected');
        }
    }

    showEmptyState() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <i class="fas fa-star" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h3 style="margin-bottom: 8px; color: #64748b;">No Favorite Routes</h3>
                    <p style="margin-bottom: 20px; font-size: 14px;">Save your frequently used routes for quick access</p>
                    <button class="form-button primary" onclick="document.getElementById('addFavorite').click()">
                        <i class="fas fa-plus"></i> Add Your First Favorite
                    </button>
                </div>
            `;
        }
    }

    getLastUsedText(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
    }

    saveFavorites() {
        Utils.storage.set('favorite_routes', this.favorites);
    }

    updateTheme(theme) {
        // Theme updates would go here if needed
    }

    refreshData() {
        this.loadFavorites();
        this.renderFavorites();
    }

    loadData() {
        this.loadFavorites();
        this.renderFavorites();
    }
}

// Make globally available
window.FavoritesController = FavoritesController;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.favoritesController = new FavoritesController();
    });
} else {
    window.favoritesController = new FavoritesController();
}
