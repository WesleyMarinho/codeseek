// frontend/public/js/core.js

// --- Funções de Loading ---
function showLoading() {
    // Cria o overlay se ele não existir
    if (!document.getElementById('loading-overlay')) {
        const overlay = `
            <div id="loading-overlay" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[100]">
                <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                    <i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
                    <span class="text-gray-700 font-medium">Loading...</span>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', overlay);
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// --- Sistema de Notificações (Toasts) ---
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('Notification container not found!');
        return;
    }

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `flex items-center text-white text-sm font-medium px-4 py-3 rounded-md shadow-lg transform transition-all duration-300 ease-in-out translate-x-full ${colors[type]}`;
    toast.innerHTML = `<i class="fas ${icon[type]} mr-3"></i> <p class="flex-1">${message}</p>`;

    container.appendChild(toast);

    // Animação de entrada
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);


    // Animação de saída e remoção
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-full');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}


// --- Sistema de Modal de Confirmação ---
function showConfirmationModal({ title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) {
    // Remove qualquer modal existente para evitar duplicatas
    const existingModal = document.getElementById('confirmation-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHTML = `
        <div id="confirmation-modal" class="modal-overlay" style="opacity: 0;">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0">
                <h3 class="text-lg font-bold text-gray-900">${title}</h3>
                <p class="mt-2 text-sm text-gray-600">${message}</p>
                <div class="mt-6 flex justify-end space-x-3">
                    <button id="confirm-cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">${cancelText}</button>
                    <button id="confirm-action-btn" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">${confirmText}</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('confirmation-modal');
    const modalContent = modal.querySelector('.bg-white');

    // Animação de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.classList.remove('scale-95', 'opacity-0');
    }, 10);

    const closeModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        modal.style.opacity = '0';
        modal.addEventListener('transitionend', () => modal.remove(), { once: true });
    };

    document.getElementById('confirm-action-btn').onclick = () => {
        onConfirm();
        closeModal();
    };
    document.getElementById('confirm-cancel-btn').onclick = closeModal;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// --- Sistema de Modal de Formulário (Add/Edit) ---
function showFormModal({ title, initialData = {}, onSubmit, submitText, cancelText = 'Cancel', fields = null, customContent = '' }) {
    // Remove qualquer modal existente para evitar duplicatas
    const existingModal = document.getElementById('form-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const isEditing = !!initialData.id;
    const finalSubmitText = submitText || (isEditing ? 'Save Changes' : 'Create');

    // Campos padrão para categorias (retrocompatibilidade)
    const defaultFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: false }
    ];

    const fieldsToRender = fields || defaultFields;
    
    // Agrupar campos por seções
    const basicInfoFields = [];
    const pricingFields = [];
    const detailsFields = [];
    const statusFields = [];
    const mediaFields = [];
    
    // Organizar campos em categorias
    fieldsToRender.forEach(field => {
        if (field.name === 'name' || field.name === 'shortDescription' || field.name === 'categoryId') {
            basicInfoFields.push(field);
        } else if (field.name === 'price' || field.name === 'monthlyPrice' || field.name === 'annualPrice') {
            pricingFields.push(field);
        } else if (field.name === 'description' || field.name === 'changelog') {
            detailsFields.push(field);
        } else if (field.name === 'isActive' || field.name === 'isAllAccessIncluded') {
            statusFields.push(field);
        } else if (field.name === 'media') {
            mediaFields.push(field);
        } else {
            // Campos adicionais vão para a seção de detalhes
            detailsFields.push(field);
        }
    });
    
    // Funções para renderizar seções e campos
    const renderSection = (title, fields) => {
        if (fields.length === 0) return '';
        
        let sectionHTML = `
            <div class="mb-6">
                <h4 class="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">${title}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">`;
        
        // Caso especial: description e changelog lado a lado
        if (title === 'Product Details' && fields.length >= 2) {
            // Encontrar os campos de descrição e changelog
            const descriptionField = fields.find(f => f.name === 'description');
            const changelogField = fields.find(f => f.name === 'changelog');
            
            if (descriptionField && changelogField) {
                sectionHTML += `
                    <div class="col-span-1">
                        ${renderField(descriptionField, initialData[descriptionField.name] || '')}
                    </div>
                    <div class="col-span-1">
                        ${renderField(changelogField, initialData[changelogField.name] || '')}
                    </div>`;
                
                // Renderizar outros campos que não sejam descrição ou changelog
                fields.forEach(field => {
                    if (field.name !== 'description' && field.name !== 'changelog') {
                        const isFullWidth = field.type === 'textarea' || field.type === 'file';
                        sectionHTML += `
                            <div class="${isFullWidth ? 'col-span-1 md:col-span-2' : ''}">
                                ${renderField(field, initialData[field.name] || '')}
                            </div>`;
                    }
                });
            } else {
                // Renderização padrão se não encontrar ambos os campos
                fields.forEach(field => {
                    const isFullWidth = field.type === 'textarea' || field.type === 'file';
                    sectionHTML += `
                        <div class="${isFullWidth ? 'col-span-1 md:col-span-2' : ''}">
                            ${renderField(field, initialData[field.name] || '')}
                        </div>`;
                });
            }
        } else {
            // Renderização normal para outras seções
            fields.forEach(field => {
                // Campos de arquivo ocupam toda a largura
                const isFullWidth = field.type === 'file';
                
                sectionHTML += `
                    <div class="${isFullWidth ? 'col-span-1 md:col-span-2' : ''}">
                        ${renderField(field, initialData[field.name] || '')}
                    </div>`;
            });
        }
        
        sectionHTML += `
                </div>
            </div>`;
        
        return sectionHTML;
    };
    
    const renderField = (field, value) => {
        if (field.type === 'textarea') {
            const rows = field.rows || 3;
            return `
                <label for="modal-${field.name}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
                <textarea id="modal-${field.name}" class="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" rows="${rows}" ${field.required ? 'required' : ''}>${value}</textarea>`;
        } else if (field.type === 'select') {
            let optionsHTML = '';
            field.options.forEach(option => {
                const selected = value == option.value ? 'selected' : '';
                optionsHTML += `<option value="${option.value}" ${selected}>${option.label}</option>`;
            });
            return `
                <label for="modal-${field.name}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
                <select id="modal-${field.name}" class="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" ${field.required ? 'required' : ''}>
                    ${optionsHTML}
                </select>`;
        } else if (field.type === 'checkbox') {
            const checked = value === true || value === 'true' || value === 'on' ? 'checked' : '';
            return `
                <div class="flex items-center h-full">
                    <input type="checkbox" id="modal-${field.name}" ${checked} class="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="modal-${field.name}" class="ml-2 block text-sm font-medium text-gray-700">${field.label}</label>
                </div>`;
        } else if (field.type === 'file') {
            const uniqueId = `dropzone-${field.name}-${Date.now()}`;
            
            return `
                <div class="col-span-full">
                    <label for="${uniqueId}" class="block text-sm font-medium text-gray-700 mb-2">${field.label}</label>
                    <div class="mb-3 flex justify-center">
                        <button type="button" class="upload-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors flex items-center">
                            <i class="fas fa-upload mr-2"></i>
                            Selecionar Arquivos
                        </button>
                    </div>
                    <div id="${uniqueId}" class="dropzone">
                        <div class="dz-message" data-dz-message>
                            <span>Arraste arquivos aqui ou use o botão acima</span>
                        </div>
                    </div>
                    <div id="media-preview-grid" class="media-preview-grid"></div>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500 text-center">
                            ${field.accept ? `Formatos aceitos: ${field.accept.replace('image/*,video/*', 'imagens e vídeos')}` : ''}
                        </p>
                    </div>
                </div>
            `;
        } else {
            const stepAttr = field.step ? `step="${field.step}"` : '';
            return `
                <label for="modal-${field.name}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
                <input type="${field.type}" id="modal-${field.name}" value="${value}" ${stepAttr} class="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" ${field.required ? 'required' : ''}>`;
        }
    };
    
    // Montar HTML do formulário
    let fieldsHTML = '';
    fieldsHTML += renderSection('Basic Information', basicInfoFields);
    fieldsHTML += renderSection('Pricing Options', pricingFields);
    fieldsHTML += renderSection('Product Details', detailsFields);
    fieldsHTML += renderSection('Status & Settings', statusFields);
    fieldsHTML += renderSection('Media Files', mediaFields);

    const modalHTML = `
        <div id="form-modal" class="modal-overlay" style="opacity: 0;">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out scale-95 opacity-0">
                <h3 class="text-lg font-bold text-gray-900 mb-4">${title}</h3>
                ${customContent ? `<div class="mb-6">${customContent}</div>` : ''}
                <div id="media-preview-container" class="mb-6" style="display: none;">
                    <h4 class="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">Media Files Preview</h4>
                    <div id="media-preview-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"></div>
                </div>
                <form id="modal-form">
                    ${fieldsHTML}
                    <div class="mt-8 flex justify-end space-x-3">
                        <button type="button" id="form-cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">${cancelText}</button>
                        <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">${finalSubmitText}</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('form-modal');
    const modalContent = modal.querySelector('.bg-white');
    const form = document.getElementById('modal-form');
    const firstInput = modal.querySelector('input, select, textarea');

    // Animação de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.classList.remove('scale-95', 'opacity-0');
        if (firstInput) firstInput.focus();
        
        // Inicializar Dropzone após a renderização do modal
        initializeDropzone();
    }, 50); // Aumentar delay para garantir que o DOM está pronto

    const closeModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        modal.style.opacity = '0';
        modal.addEventListener('transitionend', () => modal.remove(), { once: true });
    };
    
    // Função para inicializar o Dropzone
    function initializeDropzone() {
        const dropzoneField = fieldsToRender.find(f => f.type === 'file');
        if (!dropzoneField || typeof Dropzone === 'undefined') return;

        const dropzoneContainer = modal.querySelector('.dropzone');
        const uploadBtn = modal.querySelector('.upload-btn');
        const previewGrid = modal.querySelector('#media-preview-grid');

        if (!dropzoneContainer || dropzoneContainer.dropzone) return; // Já inicializado

        // Configurar Dropzone
        Dropzone.autoDiscover = false;
        
        const dropzoneOptions = {
            url: "/api/temp-upload",
            autoProcessQueue: true, // Mudança: ativar processamento automático
            addRemoveLinks: false,
            dictDefaultMessage: "Arraste arquivos aqui ou use o botão acima",
            maxFiles: 10,
            acceptedFiles: dropzoneField.accept || "image/*,video/*",
            clickable: uploadBtn,
            previewsContainer: false, // Desabilita previews padrão do Dropzone
            createImageThumbnails: false // Desabilita thumbnails padrão
        };
        
        let dropzoneInstance;
        try {
            dropzoneInstance = new Dropzone(dropzoneContainer, dropzoneOptions);
            
            // Armazenar arquivos processados
            const processedFiles = [];
            
            // Eventos do Dropzone
            dropzoneInstance.on("addedfile", file => {
                console.log('Arquivo adicionado:', file.name);
                
                // Criar preview customizado imediatamente
                renderMediaPreview(file, previewGrid);
                
                // Atualizar botão durante upload
                if (uploadBtn) {
                    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...';
                    uploadBtn.disabled = true;
                }
            });
            
            dropzoneInstance.on("success", (file, response) => {
                console.log('Upload com sucesso:', response);
                
                // Atualizar informações do arquivo com resposta do servidor
                if (response && response.url) {
                    file.serverUrl = response.url;
                    file.serverName = response.name;
                    file.serverSize = response.size;
                }
                
                // Adicionar à lista de arquivos processados
                processedFiles.push(file);
                
                // Marcar primeiro arquivo como destacado automaticamente
                if (processedFiles.length === 1) {
                    setTimeout(() => {
                        const firstPreview = previewGrid.querySelector('.media-preview-item');
                        if (firstPreview) {
                            setFeaturedPreview(firstPreview);
                        }
                    }, 100);
                }
                
                // Remover indicador de loading
                const preview = previewGrid.querySelector(`[data-file-id="${file.upload.uuid}"]`);
                if (preview) {
                    const loadingDiv = preview.querySelector('.media-preview-loading');
                    if (loadingDiv) loadingDiv.remove();
                    preview.classList.add('upload-success');
                }
            });
            
            dropzoneInstance.on("error", (file, errorMessage) => {
                console.error(`Erro no upload: ${errorMessage}`);
                
                // Mostrar erro no preview
                const preview = previewGrid.querySelector(`[data-file-id="${file.upload.uuid}"]`);
                if (preview) {
                    preview.classList.add('upload-error');
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'absolute inset-0 bg-red-100 border-2 border-red-500 rounded flex items-center justify-center';
                    errorDiv.innerHTML = '<span class="text-red-700 text-xs font-medium">Erro no upload</span>';
                    preview.appendChild(errorDiv);
                }
            });
            
            dropzoneInstance.on("queuecomplete", () => {
                // Restaurar botão
                if (uploadBtn) {
                    uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i> Selecionar Arquivos';
                    uploadBtn.disabled = false;
                }
            });

            // Armazenar instância para uso posterior
            modal.dropzoneInstance = dropzoneInstance;
            modal.processedFiles = processedFiles;
            
        } catch (e) {
            console.error("Erro ao inicializar Dropzone:", e);
        }
    }

    // Função para renderizar preview customizado
    function renderMediaPreview(file, container) {
        const previewId = `preview-${file.upload.uuid}`;
        const isImage = file.type.startsWith('image/');
        
        // Criar elemento do preview
        const previewItem = document.createElement('div');
        previewItem.className = 'media-preview-item';
        previewItem.dataset.fileId = file.upload.uuid;
        previewItem.id = previewId;
        
        // Criar estrutura HTML do preview
        previewItem.innerHTML = `
            <div class="media-preview-loading">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="media-preview-overlay">
                <div class="media-preview-info">
                    <div class="text-xs font-medium truncate">${file.name}</div>
                    <div class="text-xs opacity-75">${(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <div class="media-preview-actions">
                    <button type="button" class="set-featured-btn" data-file-id="${file.upload.uuid}">
                        <i class="fas fa-star mr-1"></i>Destacar
                    </button>
                    <button type="button" class="remove-media-btn" data-file-id="${file.upload.uuid}">
                        <i class="fas fa-trash mr-1"></i>Remover
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar ao container
        container.appendChild(previewItem);
        
        // Carregar preview da imagem/vídeo usando FileReader
        if (isImage) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.alt = file.name;
                img.className = 'w-full h-full object-cover';
                
                // Inserir imagem antes do overlay
                previewItem.insertBefore(img, previewItem.querySelector('.media-preview-overlay'));
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const video = document.createElement('video');
                video.src = event.target.result;
                video.muted = true;
                video.className = 'w-full h-full object-cover';
                
                // Inserir vídeo antes do overlay
                previewItem.insertBefore(video, previewItem.querySelector('.media-preview-overlay'));
            };
            reader.readAsDataURL(file);
        } else {
            // Para outros tipos de arquivo, mostrar ícone genérico
            const iconDiv = document.createElement('div');
            iconDiv.className = 'w-full h-full bg-gray-200 flex items-center justify-center';
            iconDiv.innerHTML = '<i class="fas fa-file text-gray-400 text-3xl"></i>';
            previewItem.insertBefore(iconDiv, previewItem.querySelector('.media-preview-overlay'));
        }
    }

    // Função para definir preview como destacado
    function setFeaturedPreview(previewElement) {
        // Remover destaque de todos os previews
        modal.querySelectorAll('.media-preview-featured-badge').forEach(badge => badge.remove());
        modal.querySelectorAll('.media-preview-featured').forEach(item => item.classList.remove('media-preview-featured'));
        
        // Adicionar destaque ao elemento selecionado
        previewElement.classList.add('media-preview-featured');
        const badge = document.createElement('div');
        badge.className = 'media-preview-featured-badge';
        badge.innerHTML = '<i class="fas fa-star mr-1"></i>Destacado';
        previewElement.appendChild(badge);
    }

    // Delegação de eventos para a galeria de mídia
    modal.addEventListener('click', (event) => {
        // Botão "Destacar"
        const setFeaturedBtn = event.target.closest('.set-featured-btn');
        if (setFeaturedBtn) {
            event.preventDefault();
            const previewItem = setFeaturedBtn.closest('.media-preview-item');
            setFeaturedPreview(previewItem);
            return;
        }

        // Botão "Remover"
        const removeMediaBtn = event.target.closest('.remove-media-btn');
        if (removeMediaBtn) {
            event.preventDefault();
            const previewItem = removeMediaBtn.closest('.media-preview-item');
            const fileId = removeMediaBtn.dataset.fileId;
            const mediaId = removeMediaBtn.dataset.mediaId;

            // Remover do Dropzone se for arquivo novo
            if (fileId && modal.dropzoneInstance) {
                const file = modal.dropzoneInstance.files.find(f => f.upload.uuid === fileId);
                if (file) {
                    modal.dropzoneInstance.removeFile(file);
                    // Remover da lista de arquivos processados
                    const index = modal.processedFiles.indexOf(file);
                    if (index > -1) {
                        modal.processedFiles.splice(index, 1);
                    }
                }
            }

            // Remover mídia existente (chamar API se necessário)
            if (mediaId) {
                // TODO: Implementar chamada para deletar mídia existente
                console.log('Deleting existing media:', mediaId);
            }

            // Remover preview do DOM
            previewItem.remove();
            
            // Se removeu o item destacado e ainda há outros, destacar o primeiro
            if (previewItem.classList.contains('media-preview-featured')) {
                const remainingPreviews = modal.querySelectorAll('.media-preview-item');
                if (remainingPreviews.length > 0) {
                    setFeaturedPreview(remainingPreviews[0]);
                }
            }
            
            return;
        }
    });

    form.onsubmit = (e) => {
        e.preventDefault();
        const data = {};
        const files = {};
        
        fieldsToRender.forEach(field => {
            const element = document.getElementById(`modal-${field.name}`);
            if (field.type === 'checkbox') {
                data[field.name] = element ? element.checked : false;
            } else if (field.type === 'file') {
                // Obter arquivos do Dropzone
                if (modal.dropzoneInstance && modal.processedFiles) {
                    files[field.name] = modal.processedFiles;
                    
                    // Verificar se há um arquivo marcado como destaque
                    const featuredPreview = modal.querySelector('.media-preview-featured');
                    if (featuredPreview) {
                        const featuredFileId = featuredPreview.dataset.fileId;
                        const featuredFileIndex = modal.processedFiles.findIndex(f => f.upload.uuid === featuredFileId);
                        if (featuredFileIndex !== -1) {
                            data.featuredMediaIndex = featuredFileIndex;
                        }
                    }
                }
            } else {
                if (element && element.value !== '') {
                    data[field.name] = element.value;
                }
            }
        });
        
        onSubmit(data, files);
        closeModal();
    };

    document.getElementById('form-cancel-btn').onclick = closeModal;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Event Listeners delegados para modais
document.addEventListener('click', (e) => {
    // Botão para destacar mídia
    if (e.target.closest('.set-featured-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.set-featured-btn');
        const fileId = btn.dataset.fileId;
        const previewItem = btn.closest('.media-preview-item');
        
        setFeaturedPreview(previewItem);
    }
    
    // Botão para remover mídia
    if (e.target.closest('.remove-media-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.remove-media-btn');
        const fileId = btn.dataset.fileId;
        const previewItem = btn.closest('.media-preview-item');
        
        removeMediaPreview(previewItem, fileId);
    }
});

// Função para definir preview como destacado
function setFeaturedPreview(previewItem) {
    if (!previewItem) return;
    
    const container = previewItem.closest('#media-preview-grid');
    if (!container) return;
    
    // Remover destaque de outros previews
    container.querySelectorAll('.media-preview-item').forEach(item => {
        item.classList.remove('featured');
        const btn = item.querySelector('.set-featured-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-star mr-1"></i>Destacar';
            btn.classList.remove('featured');
        }
    });
    
    // Adicionar destaque ao preview atual
    previewItem.classList.add('featured');
    const featuredBtn = previewItem.querySelector('.set-featured-btn');
    if (featuredBtn) {
        featuredBtn.innerHTML = '<i class="fas fa-star mr-1"></i>Destacado';
        featuredBtn.classList.add('featured');
    }
}

// Função para remover preview de mídia
function removeMediaPreview(previewItem, fileId) {
    if (!previewItem) return;
    
    const modal = previewItem.closest('.modal');
    const dropzoneInstance = modal?.dropzoneInstance;
    const processedFiles = modal?.processedFiles;
    
    // Remover do Dropzone se existir
    if (dropzoneInstance && processedFiles) {
        const fileIndex = processedFiles.findIndex(f => f.upload.uuid === fileId);
        if (fileIndex !== -1) {
            const file = processedFiles[fileIndex];
            dropzoneInstance.removeFile(file);
            processedFiles.splice(fileIndex, 1);
        }
    }
    
    // Verificar se era o item destacado
    const wasFeatured = previewItem.classList.contains('featured');
    
    // Remover elemento do DOM com animação
    previewItem.style.opacity = '0';
    previewItem.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        previewItem.remove();
        
        // Se era destacado, destacar o primeiro item restante
        if (wasFeatured) {
            const container = document.querySelector('#media-preview-grid');
            const firstPreview = container?.querySelector('.media-preview-item');
            if (firstPreview) {
                setFeaturedPreview(firstPreview);
            }
        }
    }, 200);
}

// Event Listeners para carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    console.log('DigiServer Core carregado');
});
