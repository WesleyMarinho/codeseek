// frontend/public/js/core.js (Versão Final Unificada)

// Ensure logo web component is registered
(function ensureLogoComponent(){
    try {
        if (!customElements.get('app-logo')) {
            const s = document.createElement('script');
            s.src = '/public/js/logo.js';
            s.defer = true;
            document.head.appendChild(s);
        }
    } catch (_) {}
})();

// Configurações globais
const API_BASE_URL = '/api';
const UPLOAD_BASE_URL = '/uploads';

// Sistema de formatação de preços
const PriceFormatter = {
    // Formatar valor para exibição com 2 casas decimais
    format: (value) => {
        if (!value || value === '') return '';
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '';
        return numValue.toFixed(2);
    },

    // Aplicar formatação automática a um campo de input
    applyToInput: (input) => {
        if (!input || input.type !== 'number') return;
        
        input.addEventListener('blur', () => {
            if (input.value && input.value !== '') {
                input.value = PriceFormatter.format(input.value);
            }
        });
    },

    // Inicializar formatação em todos os campos de preço
    init: () => {
        // Aplica a campos existentes
        document.querySelectorAll('input[type="number"][step="0.01"]').forEach(input => {
            PriceFormatter.applyToInput(input);
        });

        // Observer para novos campos adicionados dinamicamente
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const priceInputs = node.querySelectorAll ? node.querySelectorAll('input[type="number"][step="0.01"]') : [];
                        priceInputs.forEach(input => PriceFormatter.applyToInput(input));
                        
                        if (node.matches && node.matches('input[type="number"][step="0.01"]')) {
                            PriceFormatter.applyToInput(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
};

// Sistema global de fallback para imagens
const ImageFallback = {
    // Ícones padrão para diferentes tipos de conteúdo
    icons: {
        product: 'fas fa-star',
        category: 'fas fa-folder',
        user: 'fas fa-user',
        default: 'fas fa-image'
    },

    // Aplica fallback a uma imagem específica
    applyFallback: (img, type = 'default') => {
        if (!img || img.tagName !== 'IMG') return;
        
        const iconClass = ImageFallback.icons[type] || ImageFallback.icons.default;
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'w-full h-full flex items-center justify-center bg-gray-200';
        fallbackDiv.innerHTML = `<i class="${iconClass} text-gray-400 text-4xl"></i>`;
        
        // Mantém as classes da imagem original
        const imgClasses = img.className;
        fallbackDiv.className = imgClasses.replace(/object-cover|object-contain/g, '').trim() + ' flex items-center justify-center bg-gray-200';
        
        // Substitui a imagem pelo div com ícone
        img.parentNode.replaceChild(fallbackDiv, img);
    },

    // Inicializa o sistema de fallback global
    init: () => {
        // Aplica fallback a todas as imagens existentes
        document.querySelectorAll('img').forEach(img => {
            if (img.complete && img.naturalHeight === 0) {
                // Imagem já carregou mas falhou
                ImageFallback.applyFallback(img, img.dataset.fallbackType);
            } else {
                // Adiciona listener para futuras falhas
                img.addEventListener('error', () => {
                    ImageFallback.applyFallback(img, img.dataset.fallbackType);
                });
            }
        });

        // Observer para novas imagens adicionadas dinamicamente
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Verifica se o próprio node é uma imagem
                        if (node.tagName === 'IMG') {
                            node.addEventListener('error', () => {
                                ImageFallback.applyFallback(node, node.dataset.fallbackType);
                            });
                        }
                        // Verifica imagens dentro do node
                        node.querySelectorAll && node.querySelectorAll('img').forEach(img => {
                            img.addEventListener('error', () => {
                                ImageFallback.applyFallback(img, img.dataset.fallbackType);
                            });
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    // Função helper para criar imagem com fallback
    createImageWithFallback: (src, alt, className = '', fallbackType = 'default') => {
        if (!src) {
            // Se não há src, retorna diretamente o fallback
            const iconClass = ImageFallback.icons[fallbackType] || ImageFallback.icons.default;
            return `<div class="${className} flex items-center justify-center bg-gray-200"><i class="${iconClass} text-gray-400 text-4xl"></i></div>`;
        }
        
        return `<img src="${src}" alt="${alt}" class="${className}" data-fallback-type="${fallbackType}">`;
    }
};

// --- Sistema de Notificações (Toasts) ---
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
    const icon = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `flex items-center text-white text-sm font-medium px-4 py-3 rounded-md shadow-lg transform transition-all duration-300 ease-in-out translate-x-full ${colors[type]}`;
    toast.innerHTML = `<i class="fas ${icon[type]} mr-3"></i> <p class="flex-1">${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-x-full'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-full');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}

// --- Sistema de Modal de Confirmação --- 
function showConfirmationModal({ title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) {
    const existingModal = document.getElementById('confirmation-modal');
    if (existingModal) existingModal.remove();
    const modalHTML = `
        <div id="confirmation-modal" class="modal-overlay" style="opacity: 0;">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0">
                <h3 class="text-lg font-bold text-gray-900">${title}</h3><p class="mt-2 text-sm text-gray-600">${message}</p>
                <div class="mt-6 flex justify-end space-x-3">
                    <button id="confirm-cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">${cancelText}</button>
                    <button id="confirm-action-btn" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">${confirmText}</button>
                </div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirmation-modal');
    const modalContent = modal.querySelector('.bg-white');
    setTimeout(() => { modal.style.opacity = '1'; modalContent.classList.remove('scale-95', 'opacity-0'); }, 10);
    const closeModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        modal.style.opacity = '0';
        modal.addEventListener('transitionend', () => modal.remove(), { once: true });
    };
    document.getElementById('confirm-action-btn').onclick = () => { onConfirm(); closeModal(); };
    document.getElementById('confirm-cancel-btn').onclick = closeModal;
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// --- Sistema de Modal de Formulário (UNIFICADO E CORRIGIDO) ---
function showFormModal({ title, initialData = {}, onSubmit, fields = [], productId = null }) {
    const existingModal = document.getElementById('form-modal');
    if (existingModal) existingModal.remove();

    const isEditing = !!(productId || initialData.id);
    const isProductForm = fields.some(f => ['media', 'downloadFile'].includes(f.name));

    let fieldsHTML = '';
    if (isProductForm) {
        const sections = {
            'Basic Information': [], 'Pricing Options': [], 'Product Details': [], 'Status & Settings': [], 'Media Files': []
        };
        fields.forEach(field => {
            if (['name', 'shortDescription', 'categoryId'].includes(field.name)) sections['Basic Information'].push(field);
            else if (['price', 'monthlyPrice', 'annualPrice'].includes(field.name)) sections['Pricing Options'].push(field);
            else if (['description', 'changelog'].includes(field.name)) sections['Product Details'].push(field);
            else if (['isActive', 'isAllAccessIncluded'].includes(field.name)) sections['Status & Settings'].push(field);
            else if (['media', 'downloadFile'].includes(field.name)) sections['Media Files'].push(field);
            else sections['Product Details'].push(field);
        });
        Object.entries(sections).forEach(([title, sectionFields]) => {
            if (sectionFields.length === 0) return;
            let sectionHTML = `<div class="mb-6"><h4 class="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">${title}</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">`;
            sectionFields.forEach(field => {
                const isFullWidth = field.type === 'textarea' || field.type === 'file';
                sectionHTML += `<div class="${isFullWidth ? 'col-span-1 md:col-span-2' : ''}">${renderField(field, initialData[field.name] || '')}</div>`;
            });
            sectionHTML += `</div></div>`;
            fieldsHTML += sectionHTML;
        });
    } else {
        fieldsHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
        fields.forEach(field => {
            fieldsHTML += `<div>${renderField(field, initialData[field.name] || '')}</div>`;
        });
        fieldsHTML += '</div>';
    }

    const modalHTML = `
        <div id="form-modal" class="modal-overlay" style="opacity: 0;">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 opacity-0">
                <div class="p-6 flex-shrink-0 border-b"><h3 class="text-xl font-semibold text-gray-900">${title}</h3></div>
                <form id="modal-form" class="p-6 flex-grow overflow-y-auto">
                    ${fieldsHTML}
                </form>
                <div class="p-4 bg-gray-50 flex justify-end space-x-3 flex-shrink-0 border-t">
                    <button type="button" id="form-cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Cancel</button>
                    <button type="submit" id="form-submit-btn" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">${isEditing ? 'Save Changes' : 'Create'}</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('form-modal');
    const modalContent = modal.querySelector('.bg-white');
    const form = document.getElementById('modal-form');
    if (productId) modal.dataset.productId = productId;

    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.classList.remove('scale-95', 'opacity-0');
        const fileFields = fields.filter(f => f.type === 'file');
        if (fileFields.length > 0) {
            fileFields.forEach(field => {
                initializeDropzone(modal, field, initialData.media || [], initialData.downloadFile);
            });
        }
    }, 50);

    const closeModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        modal.style.opacity = '0';
        modal.addEventListener('transitionend', () => modal.remove(), { once: true });
    };

    document.getElementById('form-submit-btn').onclick = () => form.requestSubmit();
    document.getElementById('form-cancel-btn').onclick = closeModal;
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    form.onsubmit = (e) => {
        e.preventDefault();
        const hasFileInput = fields.some(f => f.type === 'file');

        if (!hasFileInput) {
            // Enviar como JSON quando não há inputs de arquivo
            const data = {};
            const fd = new FormData(e.target);
            for (const [key, value] of fd.entries()) {
                if (e.target.querySelector(`[name="${key}"][type="checkbox"]`)) {
                    data[key] = true; // checkbox marcado
                } else {
                    data[key] = value;
                }
            }
            // Garante false para checkboxes não marcados
            fields.forEach(field => {
                if (field.type === 'checkbox' && !Object.prototype.hasOwnProperty.call(data, field.name)) {
                    data[field.name] = false;
                }
            });
            onSubmit(data);
        } else {
            // Formulários com arquivos (produtos): usar FormData
            const formData = new FormData(e.target);
            fields.forEach(field => {
                if (field.type === 'checkbox') formData.set(field.name, formData.has(field.name));
            });

            const dz = modal.dropzoneInstances || {};
            if (dz.media) {
                const mediaGrid = modal.querySelector('#media-preview-grid-media');
                const existingItems = Array.from(mediaGrid?.querySelectorAll('.media-preview-item[data-media-id]') || []);
                const existingMediaObjects = existingItems
                    .map(el => (initialData.media || []).find(m => String(m.id) === el.dataset.mediaId))
                    .filter(Boolean);
                formData.set('mediaFiles', JSON.stringify(existingMediaObjects));
                dz.media.getAcceptedFiles().filter(f => f.isNew).forEach(file => formData.append('media', file, file.name));
                const featuredItem = mediaGrid?.querySelector('.media-preview-featured');
                if (featuredItem) {
                    const path = featuredItem.dataset.path || '';
                    formData.set('featuredMedia', path);
                }
            }
            if (dz.downloadFile) {
                const zipCard = modal.querySelector('#media-preview-grid-downloadFile .file-preview-item');
                if (zipCard) {
                    if (zipCard.dataset.isExisting === 'true') {
                        formData.set('downloadFile', initialData.downloadFile);
                    } else {
                        const file = dz.downloadFile.getAcceptedFiles().find(f => f.isNew);
                        if (file) formData.set('downloadFile', file, file.name);
                    }
                } else {
                    formData.set('downloadFile', '');
                }
            }
            onSubmit(formData);
        }
        closeModal();
    };
}

// --- Funções Auxiliares de Renderização e Dropzone ---

function renderField(field, value) {
    const { name, label, type, required, options } = field;
    // Corrigindo o problema do checkbox
    if (type === 'checkbox') {
        return `<div class="flex items-center col-span-1"><input id="form-field-${name}" name="${name}" type="checkbox" ${value ? 'checked' : ''} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"><label for="form-field-${name}" class="ml-2 text-sm text-gray-700">${label}</label></div>`;
    }
    if (type === 'file') {
        return `<div class="dropzone-container">
                    <label class="block text-sm font-medium text-gray-700 mb-2">${label}</label>
                    <button type="button" class="upload-btn" data-field="${name}"><i class="fas fa-upload mr-2"></i> Select Files</button>
                    <div class="dropzone hidden" data-field="${name}"></div>
                    <div id="media-preview-grid-${name}" class="${name === 'media' ? 'media-preview-grid' : ''}"></div>
                </div>`;
    }
    let fieldHTML = `<label for="form-field-${name}" class="block text-sm font-medium text-gray-700 mb-2">${label}${required ? '<span class="text-red-500 ml-1">*</span>' : ''}</label>`;
    switch (type) {
        case 'select':
            const opts = options.map(opt => `<option value="${opt.value}" ${String(value) === String(opt.value) ? 'selected' : ''}>${opt.label}</option>`).join('');
            return `${fieldHTML}<select id="form-field-${name}" name="${name}" ${required ? 'required' : ''} class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">${opts}</select>`;
        case 'textarea':
            return `${fieldHTML}<textarea id="form-field-${name}" name="${name}" rows="4" ${required ? 'required' : ''} class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">${value || ''}</textarea>`;
        default:
            const inputHTML = `${fieldHTML}<input type="${type}" id="form-field-${name}" name="${name}" value="${value || ''}" ${required ? 'required' : ''} class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" ${field.step ? `step="${field.step}"` : ''}>`;          
            // Aplicar formatação de preço após criar o elemento
            if (type === 'number' && field.step === '0.01') {
                setTimeout(() => {
                    const input = document.getElementById(`form-field-${name}`);
                    if (input) {
                        PriceFormatter.applyToInput(input);
                        // Formatar valor inicial se existir
                        if (input.value) {
                            input.value = PriceFormatter.format(input.value);
                        }
                    }
                }, 0);
            }
            return inputHTML;
    }
}

function initializeDropzone(modal, fieldConfig, existingMedia, existingDownloadFile) {
    const dropzoneEl = modal.querySelector(`.dropzone[data-field="${fieldConfig.name}"]`);
    if (!dropzoneEl || dropzoneEl.dropzone) return;
    Dropzone.autoDiscover = false;
    const previewGrid = modal.querySelector(`#media-preview-grid-${fieldConfig.name}`);
    const uploadBtn = modal.querySelector(`.upload-btn[data-field="${fieldConfig.name}"]`);
    const myDropzone = new Dropzone(dropzoneEl, {
        url: "/api/temp-upload", paramName: "file", clickable: uploadBtn, previewsContainer: false,
        maxFiles: fieldConfig.name === 'downloadFile' ? 1 : null, acceptedFiles: fieldConfig.accept
    });
    if (!modal.dropzoneInstances) modal.dropzoneInstances = {};
    modal.dropzoneInstances[fieldConfig.name] = myDropzone;
    myDropzone.on("addedfile", () => { uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...'; uploadBtn.disabled = true; });
    myDropzone.on("success", (file, response) => {
        file.isNew = true;
        file.serverFilename = response.filename;
        if (fieldConfig.name === 'media') renderMediaPreview(previewGrid, { ...response, uuid: file.upload.uuid });
        else renderFilePreview(previewGrid, { ...response, uuid: file.upload.uuid });
    });
    myDropzone.on("error", (f, msg) => showNotification(`Upload Error: ${msg}`, 'error'));
    myDropzone.on("queuecomplete", () => { uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i> Select Files'; uploadBtn.disabled = false; });
    if (fieldConfig.name === 'media') existingMedia.forEach(media => renderMediaPreview(previewGrid, media));
    if (fieldConfig.name === 'downloadFile' && existingDownloadFile) renderFilePreview(previewGrid, existingDownloadFile);
}

function renderMediaPreview(grid, mediaData) {
    const isExisting = !!mediaData.id;
    const item = document.createElement('div');
    item.className = 'media-preview-item';
    if (mediaData.isFeatured) item.classList.add('media-preview-featured');
    if (isExisting) item.dataset.mediaId = mediaData.id; else item.dataset.fileId = mediaData.uuid;
    item.dataset.path = mediaData.path;
    item.innerHTML = `
        <img src="/uploads${mediaData.path}" alt="Preview">
        ${mediaData.isFeatured ? '<div class="media-preview-featured-badge"><i class="fas fa-star"></i></div>' : ''}
        <div class="media-preview-overlay">
            <div class="media-preview-actions">
                ${!mediaData.isFeatured ? '<button type="button" title="Set as featured" class="set-featured-btn"><i class="fas fa-star"></i></button>' : ''}
                <button type="button" title="Remove" class="remove-media-btn"><i class="fas fa-trash"></i></button>
            </div></div>`;
    grid.appendChild(item);
    if (!grid.querySelector('.media-preview-featured')) setFeaturedPreview(item);
}

function renderFilePreview(grid, fileData) {
    const isExisting = typeof fileData === 'string' || !!fileData.id;
    const filename = isExisting ? (fileData.split ? fileData.split('/').pop() : fileData.filename) : fileData.filename;
    const item = document.createElement('div');
    item.className = 'file-preview-item';
    item.dataset.isExisting = isExisting;
    if (!isExisting) item.dataset.fileId = fileData.uuid;
    item.dataset.filename = filename;
    item.innerHTML = `
        <div class="file-icon"><i class="fas fa-file-archive"></i></div>
        <div class="file-info"><p class="file-name">${filename}</p></div>
        <div class="file-actions"><button type="button" title="Remove" class="remove-file-btn"><i class="fas fa-trash"></i></button></div>`;
    grid.innerHTML = '';
    grid.appendChild(item);
}

// --- Lógica de Eventos Delegados para Mídia ---
document.addEventListener('click', async (e) => {
    const setFeaturedBtn = e.target.closest('.set-featured-btn');
    if (setFeaturedBtn) setFeaturedPreview(setFeaturedBtn.closest('.media-preview-item'));

    const removeMediaBtn = e.target.closest('.remove-media-btn');
    if (removeMediaBtn) removeMediaPreview(removeMediaBtn.closest('.media-preview-item'));

    const removeFileBtn = e.target.closest('.remove-file-btn');
    if (removeFileBtn) removeFilePreview(removeFileBtn.closest('.file-preview-item'));
});

function setFeaturedPreview(item) {
    if (!item) return;
    const grid = item.parentElement;
    grid.querySelectorAll('.media-preview-item').forEach(el => {
        el.classList.remove('media-preview-featured');
        const overlay = el.querySelector('.media-preview-actions');
        if (overlay && !overlay.querySelector('.set-featured-btn')) {
            overlay.insertAdjacentHTML('afterbegin', '<button type="button" title="Set as featured" class="set-featured-btn"><i class="fas fa-star"></i></button>');
        }
        el.querySelector('.media-preview-featured-badge')?.remove();
    });
    item.classList.add('media-preview-featured');
    item.querySelector('.set-featured-btn')?.remove();
    item.insertAdjacentHTML('afterbegin', '<div class="media-preview-featured-badge"><i class="fas fa-star"></i></div>');
}

async function removeMediaPreview(item) {
    if (!item) return;
    const modal = item.closest('#form-modal');
    const wasFeatured = item.classList.contains('media-preview-featured');
    try {
        if (item.dataset.mediaId && modal?.dataset.productId) {
            await fetch(`/api/admin/products/${modal.dataset.productId}/media/${item.dataset.mediaId}`, { method: 'DELETE' });
        } else if (item.dataset.fileId) {
            const dz = modal.dropzoneInstances.media;
            const file = dz.files.find(f => f.upload.uuid === item.dataset.fileId);
            if (file?.serverFilename) await fetch(`/api/temp-upload/${file.serverFilename}`, { method: 'DELETE' });
        }
    } catch (err) { showNotification('Failed to delete file', 'error'); }
    const grid = item.parentElement;
    item.remove();
    if (wasFeatured) setFeaturedPreview(grid.querySelector('.media-preview-item'));
}

async function removeFilePreview(item) {
    if (!item) return;
    const modal = item.closest('#form-modal');
    try {
        if (item.dataset.isExisting === 'true' && modal?.dataset.productId) {
            await fetch(`/api/admin/products/${modal.dataset.productId}/download`, { method: 'DELETE' });
        } else if (item.dataset.fileId) {
            const dz = modal.dropzoneInstances.downloadFile;
            const file = dz.files.find(f => f.upload.uuid === item.dataset.fileId);
            if (file?.serverFilename) await fetch(`/api/temp-upload/${file.serverFilename}`, { method: 'DELETE' });
        }
    } catch (err) { showNotification('Failed to delete file', 'error'); }
    item.remove();
}

// --- Sistema de Overlay de Carregamento (Loading) ---
function showLoading() {
    // Evita criar múltiplos overlays
    if (document.getElementById('loading-overlay')) return;

    const overlayHTML = `
        <div id="loading-overlay" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div class="text-white text-2xl">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}


// Inicialização dos sistemas globais
document.addEventListener('DOMContentLoaded', () => {
    ImageFallback.init();
    PriceFormatter.init();
});

// // Sistema de Carregamento de Fragmentos
// const loadFragment = async (fragmentPath, targetElement) => {
//     if (!targetElement) {
//         console.error(`❌ Target element not found for fragment: ${fragmentPath}`);
//         return false;
//     }
//     try {
//         // Sempre usar caminho relativo, nunca incluir protocolo
//         let requestPath = fragmentPath;
//         if (!requestPath.startsWith('/')) {
//             requestPath = '/' + requestPath;
//         }
//         // Remove qualquer protocolo acidental
//         requestPath = requestPath.replace(/^https?:\/\//, '/');
//         console.log(`🔄 Loading fragment: ${fragmentPath} → ${requestPath}`);
//         const response = await fetch(requestPath);
//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status} ${response.statusText}: Failed to load ${requestPath}`);
//         }
//         const html = await response.text();
//         if (!html.trim()) {
//             throw new Error(`Empty response for fragment: ${requestPath}`);
//         }
//         targetElement.outerHTML = html;
//         console.log(`✅ Fragment loaded successfully: ${fragmentPath}`);
//         return true;
//     } catch (error) {
//         console.error(`❌ Error loading fragment ${fragmentPath}:`, error.message);
//         if (targetElement && targetElement.parentNode) {
//             targetElement.innerHTML = `
//                 <div class="bg-red-50 border border-red-200 rounded-md p-4 text-center">
//                     <p class="text-red-600 text-sm">
//                         <i class="fas fa-exclamation-triangle mr-2"></i>
//                         Failed to load content: ${fragmentPath}
//                     </p>
//                 </div>
//             `;
//         }
//         return false;
//     }
// };

// // Função para carregar todos os fragmentos da página
// const loadAllFragments = async () => {
//     console.log('🔄 Starting fragment loading process...');
    
//     const fragmentElements = document.querySelectorAll('[data-include]');
    
//     if (fragmentElements.length === 0) {
//         console.log('ℹ️ No fragments found on this page');
//         return;
//     }
    
//     console.log(`📄 Found ${fragmentElements.length} fragment(s) to load`);
    
//     const loadPromises = Array.from(fragmentElements).map(async (el, index) => {
//         const fragmentPath = el.dataset.include;
        
//         if (!fragmentPath) {
//             console.warn(`⚠️ Element ${index + 1} has data-include but no path:`, el);
//             return false;
//         }
        
//         // Pequeno delay para evitar sobrecarga
//         await new Promise(resolve => setTimeout(resolve, index * 50));
        
//         return await loadFragment(fragmentPath, el);
//     });
    
//     try {
//         const results = await Promise.all(loadPromises);
//         const successful = results.filter(Boolean).length;
//         const failed = results.length - successful;
        
//         console.log(`📊 Fragment loading complete: ${successful} successful, ${failed} failed`);
        
//         // Disparar evento customizado para notificar que os fragmentos foram carregados
//         document.dispatchEvent(new CustomEvent('fragmentsLoaded', {
//             detail: { successful, failed, total: results.length }
//         }));
        
//     } catch (error) {
//         console.error('❌ Error in fragment loading process:', error);
//     }
// };

// // Quando o DOM estiver pronto, carrega todos os fragmentos
// document.addEventListener('DOMContentLoaded', () => {
//     setTimeout(loadAllFragments, 100);
// });

// // Função utilitária para recarregar fragmentos manualmente
// window.reloadFragments = loadAllFragments;
