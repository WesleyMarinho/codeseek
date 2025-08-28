// frontend/public/js/homepage.js

document.addEventListener('DOMContentLoaded', () => {

    // Função para carregar produtos em destaque
    const loadFeaturedProducts = async () => {
        const container = document.getElementById('products-container');
        if (!container) return;

        try {
            const response = await fetch('/api/public/products?limit=4'); // Busca 4 produtos
            if (!response.ok) throw new Error('Failed to fetch products');

            const { products } = await response.json();
            container.innerHTML = ''; // Limpa o "loading"

            if (!products || products.length === 0) {
                container.innerHTML = '<p class="col-span-full text-center text-gray-500">No products available.</p>';
                return;
            }

            products.forEach(product => {
                container.insertAdjacentHTML('beforeend', createProductCard(product));
            });

        } catch (error) {
            container.innerHTML = '<p class="col-span-full text-center text-red-500">Could not load products.</p>';
        }
    };

    // Função para renderizar a seção de FAQ
    const renderFAQ = () => {
        const container = document.getElementById('faq-container');
        if (!container) return;

        const faqs = [
            {
                question: 'What is included in the All Access Pass?',
                answer: 'The All Access Pass gives you immediate access to every single product in our catalog, including all future releases, for one single price. You get lifetime updates and support for all products.'
            },
            {
                question: 'What is your refund policy?',
                answer: 'We offer a 30-day money-back guarantee. If you are not satisfied with our products for any reason, you can request a full refund within 30 days of your purchase.'
            },
            {
                question: 'How do I receive product updates?',
                answer: 'Once you purchase a product or the All Access Pass, you will have access to your personal dashboard where you can download the latest versions of your products at any time.'
            },
            {
                question: 'Can I use the products on multiple websites?',
                answer: 'Yes, our standard license allows you to use the products on an unlimited number of websites that you own. Please check the specific license terms for each product.'
            }
        ];

        container.innerHTML = faqs.map((faq, index) => `
            <div class="bg-white rounded-lg border border-gray-200">
                <h2>
                    <button type="button" class="faq-toggle flex items-center justify-between w-full p-6 font-semibold text-left text-gray-800" data-index="${index}">
                        <span>${faq.question}</span>
                        <i class="fas fa-chevron-down transform transition-transform"></i>
                    </button>
                </h2>
                <div id="faq-answer-${index}" class="faq-answer hidden p-6 pt-0 text-gray-600">
                    <p>${faq.answer}</p>
                </div>
            </div>
        `).join('');

        // Adiciona evento de clique para o toggle do FAQ
        container.querySelectorAll('.faq-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const index = button.dataset.index;
                const answer = document.getElementById(`faq-answer-${index}`);
                const icon = button.querySelector('i');

                const isHidden = answer.classList.contains('hidden');
                if (isHidden) {
                    answer.classList.remove('hidden');
                    icon.classList.add('rotate-180');
                } else {
                    answer.classList.add('hidden');
                    icon.classList.remove('rotate-180');
                }
            });
        });
    };

    // Função auxiliar para criar o card de um produto
    const createProductCard = (product) => {
        const price = parseFloat(product.price);

        // Usa o sistema global de fallback de imagens
        const imageHTML = ImageFallback.createImageWithFallback(
            product.featuredMedia ? `/uploads${product.featuredMedia}` : null,
            product.name,
            'w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300',
            'product'
        );

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <a href="/product/${product.id}" class="block overflow-hidden rounded-t-xl">
                    ${imageHTML}
                </a>
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2 truncate">
                        <a href="/product/${product.id}" class="hover:text-blue-600">${product.name}</a>
                    </h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">${product.shortDescription || ''}</p>
                    <div class="flex items-center justify-between mt-auto">
                        <span class="text-xl font-bold text-gray-900">$${price.toFixed(2)}</span>
                        <a href="/product/${product.id}" class="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
    };

    // Inicializa a página
    loadFeaturedProducts();
    renderFAQ();
});