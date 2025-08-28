// frontend/public/js/products.js (VERSÃO FINAL E CORRIGIDA)

class ProductsManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.filters = { search: '', category: 'all', price: 'all', sort: 'newest' };
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalPages = 1;
        this.viewMode = 'grid';
        this.init();
    }

    async init() {
        // Espera o GlobalCart ser inicializado antes de continuar
        await window.cartReady; 
        await this.loadCategories();
        await this.loadProducts();
        this.setupEventListeners();
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/public/categories');
            if (!response.ok) return;
            const data = await response.json();
            this.categories = data.categories || [];
            this.renderCategoryFilters();
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;
        const allOption = container.querySelector('label').outerHTML;
        const additionalCategories = this.categories.map(category => `
            <label class="flex items-center"><input type="radio" name="category" value="${category.id}" class="text-blue-600 focus:ring-blue-500"><span class="ml-2 text-sm text-gray-700">${category.name}</span></label>
        `).join('');
        container.innerHTML = allOption + additionalCategories;
    }

    async loadProducts() {
        this.showLoadingState();
        try {
            const params = new URLSearchParams({ page: this.currentPage, limit: this.itemsPerPage, sort: this.mapSortValue(this.filters.sort) });
            if (this.filters.search) params.append('search', this.filters.search);
            if (this.filters.category !== 'all') params.append('category', this.filters.category);
            if (this.filters.price !== 'all') {
                const priceRange = this.mapPriceRange(this.filters.price);
                if (priceRange.min !== undefined) params.append('minPrice', priceRange.min);
                if (priceRange.max !== undefined) params.append('maxPrice', priceRange.max);
            }
            const response = await fetch(`/api/public/products?${params}`);
            if (!response.ok) throw new Error('Failed to load products');
            const data = await response.json();
            this.products = data.products || [];
            const totalProducts = data.pagination?.total || this.products.length;
            this.totalPages = data.pagination?.pages || 1;
            this.renderProducts();
            this.updateResultsInfo(totalProducts);
            this.renderPagination();
        } catch (error) {
            this.showErrorState();
        }
    }
    
    mapSortValue(sort) {
        const map = { 'newest': 'createdAt-desc', 'oldest': 'createdAt-asc', 'price-low': 'price-asc', 'price-high': 'price-desc', 'name-az': 'name-asc', 'name-za': 'name-desc' };
        return map[sort] || 'createdAt-desc';
    }

    mapPriceRange(priceFilter) {
        const ranges = { 'free': { min: 0, max: 0 }, 'under-50': { max: 49.99 }, '50-100': { min: 50, max: 100 }, 'over-100': { min: 100.01 } };
        return ranges[priceFilter] || {};
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;
        this.hideAllStates();
        if (this.products.length === 0) {
            this.showEmptyState();
            return;
        }
        container.classList.remove('hidden');
        container.className = this.viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4';
        container.innerHTML = this.products.map(p => this.viewMode === 'grid' ? this.createProductCard(p) : this.createProductListItem(p)).join('');
        if (window.GlobalCart) {
            window.GlobalCart.updateAllCartButtons();
        }
    }

    createProductCard(product) {
        const monthlyPrice = parseFloat(product.monthlyPrice || 0);
        const priceDisplay = monthlyPrice > 0 ? `$${monthlyPrice.toFixed(2)}/mo` : `$${parseFloat(product.price || 0).toFixed(2)}`;
        const imageHTML = ImageFallback.createImageWithFallback(
            product.featuredMedia ? `/uploads${product.featuredMedia}` : null,
            product.name,
            'w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300',
            'product'
        );

        // Agora GlobalCart.cartItems estará sempre disponível
        const isInCart = window.GlobalCart.cartItems.includes(String(product.id));
        const buttonText = isInCart ? '<i class="fas fa-times mr-2"></i>Remove from Cart' : '<i class="fas fa-shopping-cart mr-2"></i>Add to Cart';
        const buttonColor = isInCart ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
        const inCartAttr = isInCart ? 'true' : 'false';

        const cartButtonHTML = `<button class="add-to-cart-btn w-full text-center text-white px-4 py-2 rounded-lg font-semibold transition-colors ${buttonColor}" data-product-id="${product.id}" data-in-cart="${inCartAttr}">${buttonText}</button>`;

        return `
            <div class="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300 group border border-gray-200 flex flex-col">
                <a href="/product/${product.id}" class="block overflow-hidden rounded-t-xl">${imageHTML}</a>
                <div class="p-5 flex flex-col flex-grow">
                    <div class="flex items-start justify-between mb-2">
                         <h3 class="text-lg font-bold text-gray-900 line-clamp-2 flex-1">${product.name}</h3>
                         ${product.category ? `<span class="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">${product.category.name}</span>` : ''}
                    </div>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">${product.shortDescription || ''}</p>
                    <div class="text-2xl font-bold text-blue-600 mb-4">${priceDisplay}</div>
                    <div class="flex flex-col space-y-2 mt-auto">
                        ${cartButtonHTML}
                        <a href="/product/${product.id}" class="w-full text-center bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">View Details</a>
                    </div>
                </div>
            </div>`;
    }

    createProductListItem(product) {
        const monthlyPrice = parseFloat(product.monthlyPrice || 0);
        const priceDisplay = monthlyPrice > 0 ? `$${monthlyPrice.toFixed(2)}/mo` : `$${parseFloat(product.price || 0).toFixed(2)}`;
        const imageHTML = ImageFallback.createImageWithFallback(
            product.featuredMedia ? `/uploads${product.featuredMedia}` : null,
            product.name,
            'w-full h-full object-cover rounded-lg',
            'product'
        );
            
        const isInCart = window.GlobalCart.cartItems.includes(String(product.id));
        const buttonText = isInCart ? '<i class="fas fa-times mr-2"></i>Remove' : '<i class="fas fa-shopping-cart mr-2"></i>Add to Cart';
        const buttonColor = isInCart ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
        const inCartAttr = isInCart ? 'true' : 'false';
        
        const cartButtonHTML = `<button class="add-to-cart-btn text-white px-4 py-2 rounded-lg font-semibold transition-colors ${buttonColor}" data-product-id="${product.id}" data-in-cart="${inCartAttr}">${buttonText}</button>`;

        return `
            <div class="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div class="flex gap-6">
                    <div class="w-48 h-32 flex-shrink-0"><a href="/product/${product.id}" class="block w-full h-full">${imageHTML}</a></div>
                    <div class="flex-1 flex flex-col">
                        <div>
                            <div class="flex items-start justify-between mb-1"><h3 class="text-xl font-bold text-gray-900"><a href="/product/${product.id}">${product.name}</a></h3>${product.category ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">${product.category.name}</span>` : ''}</div>
                            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.shortDescription || ''}</p>
                        </div>
                        <div class="flex items-center justify-between mt-auto">
                            <div class="text-xl font-bold text-blue-600">${priceDisplay}</div>
                            <div class="flex space-x-3">
                                ${cartButtonHTML}
                                <a href="/product/${product.id}" class="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">View Details</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    updateResultsInfo(total) {
        const element = document.getElementById('results-count');
        if (element) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(this.currentPage * this.itemsPerPage, total);
            element.textContent = total > 0 ? `Showing ${start}-${end} of ${total} products` : 'No products found';
        }
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination || this.totalPages <= 1) {
            pagination?.classList.add('hidden');
            return;
        }
        pagination.classList.remove('hidden');
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === this.totalPages;
        let pages = [];
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                pages.push(i);
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                pages.push('...');
            }
        }
        document.getElementById('page-numbers').innerHTML = pages.map(page => {
            if (page === '...') return '<span class="px-3 py-2 text-gray-500">...</span>';
            return `<button class="page-btn px-3 py-2 rounded-lg ${page===this.currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}" data-page="${page}">${page}</button>`;
        }).join('');
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadProducts();
    }
    
    setupEventListeners() {
        document.getElementById('mobile-menu-button')?.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.toggle('hidden'));
        let searchTimeout;
        document.getElementById('search')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => { this.filters.search = e.target.value; this.currentPage = 1; this.loadProducts(); }, 300);
        });
        document.addEventListener('change', (e) => {
            if (e.target.name === 'category') { this.filters.category = e.target.value; this.currentPage = 1; this.loadProducts(); }
            if (e.target.name === 'price') { this.filters.price = e.target.value; this.currentPage = 1; this.loadProducts(); }
        });
        document.getElementById('sort')?.addEventListener('change', (e) => { this.filters.sort = e.target.value; this.currentPage = 1; this.loadProducts(); });
        document.getElementById('grid-view')?.addEventListener('click', () => { this.viewMode = 'grid'; this.updateViewButtons(); this.renderProducts(); });
        document.getElementById('list-view')?.addEventListener('click', () => { this.viewMode = 'list'; this.updateViewButtons(); this.renderProducts(); });
        document.getElementById('clear-filters')?.addEventListener('click', () => this.clearAllFilters());
        document.getElementById('clear-filters-empty')?.addEventListener('click', () => this.clearAllFilters());
        document.getElementById('retry-loading')?.addEventListener('click', () => this.loadProducts());
        document.getElementById('pagination')?.addEventListener('click', (e) => {
            const pageBtn = e.target.closest('.page-btn');
            if(pageBtn) this.goToPage(parseInt(pageBtn.dataset.page));
            if(e.target.closest('#prev-page')) this.goToPage(this.currentPage - 1);
            if(e.target.closest('#next-page')) this.goToPage(this.currentPage + 1);
        });
    }

    clearAllFilters() {
        this.filters = { search: '', category: 'all', price: 'all', sort: 'newest' };
        document.getElementById('search').value = '';
        document.querySelector('input[name="category"][value="all"]').checked = true;
        document.querySelector('input[name="price"][value="all"]').checked = true;
        document.getElementById('sort').value = 'newest';
        this.currentPage = 1;
        this.loadProducts();
    }
    
    updateViewButtons() {
        const gridView = document.getElementById('grid-view'), listView = document.getElementById('list-view');
        const isGrid = this.viewMode === 'grid';
        gridView?.classList.toggle('text-blue-600', isGrid); gridView?.classList.toggle('text-gray-400', !isGrid);
        listView?.classList.toggle('text-blue-600', !isGrid); listView?.classList.toggle('text-gray-400', isGrid);
    }
    
    showLoadingState() { this.hideAllStates(); document.getElementById('loading-state')?.classList.remove('hidden'); }
    showEmptyState() { this.hideAllStates(); document.getElementById('empty-state')?.classList.remove('hidden'); }
    showErrorState() { this.hideAllStates(); document.getElementById('error-state')?.classList.remove('hidden'); }
    hideAllStates() {
        ['loading-state', 'products-container', 'empty-state', 'error-state', 'pagination'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { new ProductsManager(); });