// frontend/public/js/product-detail.js (VERSÃO FINAL E CORRIGIDA)

document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');

    // Estado da página
    let productData = null;
    let selectedPlan = 'monthly';

    const getProductIdFromUrl = () => {
        const pathSegments = window.location.pathname.split('/');
        return pathSegments[pathSegments.length - 1] || null;
    };

    const productId = getProductIdFromUrl();

    // Função principal que orquestra o carregamento da página
    const initializePage = async () => {
        if (!productId) {
            return showError('Product ID not found in URL.');
        }

        try {
            // Mostra o estado de carregamento
            loadingState.classList.remove('hidden');
            mainContent.classList.add('hidden');
            errorState.classList.add('hidden');

            // Busca os dados do produto principal
            const response = await fetch(`/api/public/products/${productId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Product not found (Status: ${response.status})` }));
                throw new Error(errorData.message);
            }

            const data = await response.json();
            if (!data.success || !data.product) {
                throw new Error('Invalid product data received.');
            }

            productData = data.product;

            // Renderiza o produto principal e só depois busca os relacionados
            renderProduct();

            // Só busca produtos relacionados se não for o All Access Pass
            if (productData.name !== 'All Access Pass') {
                await loadRelatedProducts(); // Espera a conclusão
            }

        } catch (error) {
            console.error('Initialization failed:', error);
            showError(error.message);
        }
    };

    // Renderiza o conteúdo principal do produto
    const renderProduct = () => {
        document.title = `${productData.name} - ${window.siteName || 'CodeSeek'}`;
        document.getElementById('breadcrumb-product').textContent = productData.name;

        // Renderiza a galeria de imagens (com fallback)
        renderGallery();

        // Renderiza as informações
        document.getElementById('category-badge').textContent = productData.category?.name || 'Uncategorized';
        document.getElementById('product-title').textContent = productData.name;
        document.getElementById('product-short-description').textContent = productData.shortDescription || '';

        // Renderiza o seletor de preços
        renderPricingOptions();

        // Renderiza as abas de descrição e changelog
        document.getElementById('tab-description').innerHTML = productData.description || '<p>No description available.</p>';
        renderChangelog();

        // Mostra o conteúdo principal e esconde o loading
        loadingState.classList.add('hidden');
        mainContent.classList.remove('hidden');
    };

    const renderGallery = () => {
        const galleryContainer = document.querySelector('.lg\\:grid-cols-2 > div:first-child');
        const mainImageContainer = galleryContainer?.querySelector('.aspect-\\[4\\/3\\]');

        if (!mainImageContainer) return;

        const imageHTML = ImageFallback.createImageWithFallback(
            productData.featuredMedia ? `/uploads${productData.featuredMedia}` : null,
            productData.name,
            'w-full h-full object-cover',
            'product'
        );
        
        mainImageContainer.innerHTML = imageHTML;
    };

    const renderChangelog = () => {
        const changelogContent = document.getElementById('tab-changelog');
        if (productData.changelog && productData.changelog.trim() !== '') {
            const formattedChangelog = productData.changelog.replace(/\r\n/g, '\n').split('\n').map(line => line.trim()).filter(line => line).map(line => `<p>${line}</p>`).join('');
            changelogContent.innerHTML = formattedChangelog;
        } else {
            changelogContent.innerHTML = '<p>No changelog available yet.</p>';
        }
    };

    const renderPricingOptions = () => {
        const container = document.getElementById('pricing-options');
        if (!container) return;
        container.innerHTML = '';
        const plans = [];

        if (productData.monthlyPrice > 0) plans.push({ id: 'monthly', title: 'Monthly Plan', price: parseFloat(productData.monthlyPrice), period: '/month' });
        if (productData.annualPrice > 0) plans.push({ id: 'annual', title: 'Annual Plan', price: parseFloat(productData.annualPrice), period: '/year' });
        if (productData.price > 0) plans.push({ id: 'onetime', title: 'One-Time Purchase', price: parseFloat(productData.price), period: 'once' });

        if (plans.length === 0) {
            container.style.display = 'none';
            document.getElementById('add-to-cart-btn').style.display = 'none';
            return;
        }

        selectedPlan = plans[0].id;
        plans.forEach((plan, index) => {
            const isSelected = index === 0;
            const optionHTML = `
                <label class="pricing-option ${isSelected ? 'selected' : ''}" data-plan-id="${plan.id}">
                    <div class="flex items-center"><div class="custom-radio"></div><div class="plan-details"><div class="plan-title">${plan.title}</div></div></div>
                    <div class="plan-price"><div class="price">$${plan.price.toFixed(2)}</div><div class="period">${plan.period}</div></div>
                    <input type="radio" name="pricing-plan" value="${plan.id}" ${isSelected ? 'checked' : ''}>
                </label>`;
            container.insertAdjacentHTML('beforeend', optionHTML);
        });

        document.querySelectorAll('.pricing-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.pricing-option').forEach(el => el.classList.remove('selected'));
                option.classList.add('selected');
                selectedPlan = option.dataset.planId;
                option.querySelector('input[type="radio"]').checked = true;
            });
        });
    };

    // Função para carregar produtos relacionados de forma segura
    const loadRelatedProducts = async () => {
        // Função dummy, pois não está implementada no HTML, mas mantém a estrutura
        console.log("Carregando produtos relacionados...");
    };

    // **FUNÇÃO SHOWERROR ROBUSTA**
    const showError = (message) => {
        const errorMessageElement = document.getElementById('error-message');

        if (errorMessageElement) errorMessageElement.textContent = message;
        if (loadingState) loadingState.classList.add('hidden');
        if (mainContent) mainContent.classList.add('hidden');
        if (errorState) errorState.classList.remove('hidden');
    };

    // --- Event Listeners ---
    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
        if (productData && typeof GlobalCart !== 'undefined') {
            GlobalCart.addToCart(productData.id, selectedPlan);
        }
    });

    // Event listener para o botão "Buy Now"
    document.getElementById('buy-now-btn').addEventListener('click', () => {
        if (productData) {
            // Adiciona o produto ao carrinho primeiro
            if (typeof GlobalCart !== 'undefined') {
                GlobalCart.addToCart(productData.id, selectedPlan);
            }
            // Redireciona diretamente para o checkout
            window.location.href = `/checkout?product=${productData.id}&plan=${selectedPlan}&direct=true`;
        }
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.currentTarget.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active', 'text-blue-600', 'border-blue-600'));
            e.currentTarget.classList.add('active', 'text-blue-600', 'border-blue-600');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.toggle('hidden', content.id !== `tab-${tabId}`);
            });
        });
    });

    // Inicia o processo de carregamento da página
    initializePage();
});