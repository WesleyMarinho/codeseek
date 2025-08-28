// frontend/public/js/cart.js (VERSÃO FINAL E CORRIGIDA)

// Cria uma promessa que será resolvida quando o carrinho estiver pronto
window.cartReady = new Promise(resolve => {
    if (typeof window.GlobalCart !== 'undefined') {
        resolve(window.GlobalCart);
    } else {
        document.addEventListener('cartReady', () => resolve(window.GlobalCart));
    }
});

class GlobalCartManager {
    constructor() {
        this.cartItems = [];
        this.init().then(() => {
            // Dispara um evento personalizado quando o carrinho estiver inicializado
            document.dispatchEvent(new Event('cartReady'));
        });
    }

    async init() {
        await this.syncCartState();
        this.updateAllCartButtons();
        this.bindGlobalEvents();
    }

    async syncCartState() {
        try {
            const response = await fetch('/api/cart');
            if (!response.ok) throw new Error("API request failed");
            const data = await response.json();
            if (data.success && data.cart && Array.isArray(data.cart.items)) {
                this.cartItems = data.cart.items.filter(item => item && (item.productId || item.id)).map(item => String(item.productId || item.id));
                this.updateCartCount(data.cart.itemCount || 0);
            } else {
                this.cartItems = [];
                this.updateCartCount(0);
            }
        } catch (error) {
            console.error('Error syncing cart state:', error);
            this.cartItems = [];
            this.updateCartCount(0);
        }
    }

    updateCartCount(count) {
        const cartBadge = document.getElementById('cart-count');
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.classList.toggle('hidden', count === 0);
        }
    }

    async addToCart(productId, plan = 'onetime') {
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ productId, plan, quantity: 1 })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Product added to cart!', 'success');
                await this.syncCartState();
                this.updateAllCartButtons();
                return true;
            }
            showNotification(data.message || 'Failed to add product.', 'error');
            return false;
        } catch (error) {
            showNotification('Failed to add product to cart', 'error');
            return false;
        }
    }
    
    async removeFromCart(productId) {
        try {
            const response = await fetch(`/api/cart/item/${productId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                showNotification('Product removed from cart!', 'success');
                await this.syncCartState();
                this.updateAllCartButtons();
                return true;
            }
            showNotification(data.message || 'Failed to remove product.', 'error');
            return false;
        } catch (error) {
            showNotification('Failed to remove product from cart.', 'error');
            return false;
        }
    }

    updateAllCartButtons() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            const productId = button.dataset.productId;
            if (this.cartItems.includes(productId)) {
                button.innerHTML = '<i class="fas fa-times mr-2"></i>Remove from Cart';
                button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                button.classList.add('bg-red-600', 'hover:bg-red-700');
                button.dataset.inCart = "true";
            } else {
                button.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Add to Cart';
                button.classList.remove('bg-red-600', 'hover:bg-red-700');
                button.classList.add('bg-blue-600', 'hover:bg-blue-700');
                button.dataset.inCart = "false";
            }
        });
    }

    bindGlobalEvents() {
        document.addEventListener('click', async (e) => {
            const button = e.target.closest('.add-to-cart-btn');
            if (button) {
                e.preventDefault();
                const productId = button.dataset.productId;
                const isInCart = button.dataset.inCart === 'true';
                if (!productId) return;
                
                const originalText = button.innerHTML;
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                const success = isInCart ? await this.removeFromCart(productId) : await this.addToCart(productId);
                
                if (!success) {
                    setTimeout(() => {
                       button.innerHTML = originalText;
                       button.disabled = false;
                       this.updateAllCartButtons();
                    }, 500);
                } else {
                     button.disabled = false;
                }
            }
        });
    }
}

if (typeof showNotification === 'undefined') {
    function showNotification(message, type) { alert(`${type}: ${message}`); }
}

// Inicializa o carrinho globalmente e o disponibiliza para outros scripts.
window.GlobalCart = new GlobalCartManager();