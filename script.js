// ========== CONSTANTES E CONFIGURAÇÕES ==========
const CONFIG = {
    STORAGE_KEYS: {
        AUTO_SAVE: 'sicredi_report_v3_',
        TEMPLATES: 'sicredi_templates_v3'
    },
    NOTIFICATIONS: {
        DURATION: {
            SUCCESS: 3000,
            ERROR: 4500,
            INFO: 3000,
            WARNING: 3500
        }
    },
    PDF: {
        MARGINS: 12,
        DEFAULT_FILENAME: 'relatorio-sicredi',
        QUALITY: 0.95
    },
    DEBOUNCE_DELAY: 300,
    AUTOSAVE_DELAY: 2500
};

// ========== VARIÁVEIS GLOBAIS DO CARROSSEL ==========
let currentSlide = 0;
let dashboards = [
    {
        src: 'image.png', // Mantém a imagem original do seu código
        title: 'Dashboard Principal'
    }
];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    // Adiciona ícones aos títulos das seções
    const titles = document.querySelectorAll('.text-editor h2 span');
    if (titles.length === 0) {
        // Fallback se não encontrar spans
        const allTitles = document.querySelectorAll('.text-editor h2');
        const icons = ['📊', '⚠️', '📝'];
        allTitles.forEach((title, index) => {
            if (icons[index] && !title.innerHTML.includes(icons[index])) {
                title.innerHTML = `${icons[index]} ${title.textContent}`;
            }
        });
    }
    
    // Inicializa funcionalidades
    setupPlaceholderEffect();
    setupCharacterCounters();
    setupAutoSave();
    setupKeyboardNavigation();
    initializeCarousel();
    
    // Atualiza visualização inicial do relatório
    atualizarSaida();

    // Animação de entrada do corpo da página
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Atualiza visualização automaticamente ao digitar nos editores
    document.querySelectorAll('.editor').forEach(editor => {
        editor.addEventListener('input', debounce(atualizarSaida, CONFIG.DEBOUNCE_DELAY));
        
        editor.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.zIndex = '10';
        });
        
        editor.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
            this.parentElement.style.zIndex = '1';
        });
    });
});

// ========== FUNCIONALIDADES DO CARROSSEL ==========
function initializeCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) {
        console.error("Elemento 'carouselTrack' não encontrado.");
        return;
    }
    track.innerHTML = '';
    dashboards.forEach(dashboard => addSlideToDOM(dashboard));

    updateCarouselDisplay();
    updateCarouselControls();
}

function updateCarouselDisplay() {
    const track = document.getElementById('carouselTrack');
    const currentIndexEl = document.getElementById('currentIndex');
    const totalImagesEl = document.getElementById('totalImages');
    const carouselTitleEl = document.getElementById('carouselTitle');
    const indicatorsEl = document.getElementById('carouselIndicators');
    const removeBtnEl = document.getElementById('removeBtn');
    
    if (!track || !currentIndexEl || !totalImagesEl || !carouselTitleEl || !indicatorsEl || !removeBtnEl) {
        return;
    }

    currentIndexEl.textContent = dashboards.length > 0 ? currentSlide + 1 : 0;
    totalImagesEl.textContent = dashboards.length;
    carouselTitleEl.textContent = dashboards[currentSlide]?.title || (dashboards.length > 0 ? 'Dashboard' : 'Nenhum dashboard');
    
    const translateX = -currentSlide * 100;
    track.style.transform = `translateX(${translateX}%)`;
    
    indicatorsEl.innerHTML = '';
    dashboards.forEach((_, index) => {
        const indicator = document.createElement('span');
        indicator.className = `indicator ${index === currentSlide ? 'active' : ''}`;
        indicator.onclick = () => goToSlide(index);
        indicator.setAttribute('role', 'tab');
        indicator.setAttribute('aria-selected', index === currentSlide);
        indicator.setAttribute('aria-label', `Dashboard ${index + 1}`);
        indicator.setAttribute('tabindex', index === currentSlide ? '0' : '-1');
        indicatorsEl.appendChild(indicator);
    });
    
    removeBtnEl.style.display = dashboards.length > 1 ? 'flex' : 'none';
    
    atualizarSaida(); 
}

function updateCarouselControls() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!prevBtn || !nextBtn) return;
    
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide >= dashboards.length - 1 || dashboards.length === 0;
}

function previousImage() {
    if (currentSlide > 0) {
        currentSlide--;
        updateCarouselDisplay();
        updateCarouselControls();
        animateSlideTransitionEffect('prev');
    }
}

function nextImage() {
    if (currentSlide < dashboards.length - 1) {
        currentSlide++;
        updateCarouselDisplay();
        updateCarouselControls();
        animateSlideTransitionEffect('next');
    }
}

function goToSlide(index) {
    if (index >= 0 && index < dashboards.length && index !== currentSlide) {
        const direction = index > currentSlide ? 'next' : 'prev';
        currentSlide = index;
        updateCarouselDisplay();
        updateCarouselControls();
        animateSlideTransitionEffect(direction);
    }
}

function animateSlideTransitionEffect(direction) {
    const wrapper = document.querySelector('.carousel-wrapper');
    if (wrapper) {
        wrapper.style.transition = 'transform 0.15s ease-out';
        wrapper.style.transform = direction === 'next' ? 'translateX(-3px)' : 'translateX(3px)';
        setTimeout(() => {
            wrapper.style.transform = 'translateX(0)';
        }, 150);
    }
}

function addNewDashboard() {
    const fileInput = document.getElementById('imageUpload');
    fileInput.click();
}

function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            // Pré-visualização
            showUploadPreview(file);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                setTimeout(() => {
                    const defaultTitle = `Dashboard ${dashboards.length + 1}`;
                    const userTitle = prompt("Digite um título para este dashboard (opcional):", "");

                    const newDashboard = {
                        src: e.target.result,
                        title: userTitle || defaultTitle 
                    };
                    
                    dashboards.push(newDashboard);
                    addSlideToDOM(newDashboard);
                    
                    currentSlide = dashboards.length - 1;
                    updateCarouselDisplay();
                    updateCarouselControls();
                    
                    hideUploadPreview();
                    showNotification('✅ Dashboard adicionado com sucesso!', 'success');
                }, 1500);
            };
            reader.readAsDataURL(file);
        } else {
            showNotification('⚠️ Por favor, selecione apenas arquivos de imagem.', 'warning');
        }
    });
    event.target.value = '';
}

function showUploadPreview(file) {
    const preview = document.createElement('div');
    preview.className = 'upload-preview';
    preview.innerHTML = `
        <img src="${URL.createObjectURL(file)}" alt="Preview">
        <p>Processando imagem...</p>
    `;
    document.body.appendChild(preview);
    
    setTimeout(() => preview.classList.add('show'), 100);
}

function hideUploadPreview() {
    const preview = document.querySelector('.upload-preview');
    if (preview) {
        preview.classList.remove('show');
        setTimeout(() => preview.remove(), 300);
    }
}

function addSlideToDOM(dashboard) {
    const track = document.getElementById('carouselTrack');
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    
    const img = document.createElement('img');
    img.src = dashboard.src;
    img.alt = dashboard.title;
    img.setAttribute('data-title', dashboard.title);
    
    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'zoom-btn';
    zoomBtn.innerHTML = '🔍';
    zoomBtn.onclick = () => zoomImage(img);
    zoomBtn.setAttribute('title', 'Visualizar em tela cheia');
    zoomBtn.setAttribute('aria-label', 'Ampliar imagem');
    
    slide.appendChild(img);
    slide.appendChild(zoomBtn);
    track.appendChild(slide);
}

function confirmRemoveDashboard() {
    if (dashboards.length <= 1) {
        showNotification('ℹ️ Deve haver pelo menos um dashboard.', 'info');
        return;
    }
    
    const currentDashboard = dashboards[currentSlide];
    showConfirmModal(
        'Confirmar Remoção',
        `Tem certeza que deseja remover o dashboard "${currentDashboard?.title || 'Sem título'}"?`,
        () => removeDashboard(),
        'Remover',
        'danger'
    );
}

function removeDashboard() {
    const currentDashboardTitle = dashboards[currentSlide]?.title || "este dashboard";
    
    dashboards.splice(currentSlide, 1);
    
    const track = document.getElementById('carouselTrack');
    if (track.children[currentSlide]) {
        track.children[currentSlide].remove();
    }
    
    if (currentSlide >= dashboards.length && dashboards.length > 0) {
        currentSlide = dashboards.length - 1;
    } else if (dashboards.length === 0) {
        currentSlide = 0; 
    }
    
    updateCarouselDisplay();
    updateCarouselControls();
    showNotification(`🗑️ Dashboard "${currentDashboardTitle}" removido.`, 'success');
}

function getCurrentDashboard() {
    if (dashboards.length === 0 || currentSlide < 0 || currentSlide >= dashboards.length) {
        return { 
            src: 'image_placeholder.png', 
            title: 'Nenhum dashboard disponível' 
        };
    }
    return dashboards[currentSlide];
}

// ========== EDIÇÃO DE TÍTULOS ==========
function editTitle(element) {
    if (element.classList.contains('editing')) return;
    
    const originalText = element.textContent;
    element.classList.add('editing');
    element.contentEditable = true;
    element.focus();
    
    // Seleciona todo o texto
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    function finishEditing() {
        element.classList.remove('editing');
        element.contentEditable = false;
        
        const newTitle = element.textContent.trim();
        if (newTitle && newTitle !== originalText) {
            dashboards[currentSlide].title = newTitle;
            
            // Atualiza o alt da imagem
            const currentImg = document.querySelector('.carousel-slide.active img') || 
                             document.querySelector('.carousel-slide img');
            if (currentImg) {
                currentImg.alt = newTitle;
                currentImg.setAttribute('data-title', newTitle);
            }
            
            atualizarSaida();
            showNotification('✅ Título atualizado!', 'success');
        } else if (!newTitle) {
            element.textContent = originalText;
        }
    }
    
    element.addEventListener('blur', finishEditing, { once: true });
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            element.blur();
        } else if (e.key === 'Escape') {
            element.textContent = originalText;
            element.blur();
        }
    }, { once: true });
}

// ========== ZOOM DE IMAGEM ==========
function zoomImage(img) {
    const modal = document.createElement('div');
    modal.className = 'zoom-modal';
    modal.innerHTML = `
        <button class="zoom-close" aria-label="Fechar">×</button>
        <img src="${img.src}" alt="${img.alt}">
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 100);
    
    modal.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    modal.querySelector('.zoom-close').addEventListener('click', (e) => {
        e.stopPropagation();
        modal.click();
    });
    
    // Prevent scroll
    document.body.style.overflow = 'hidden';
    modal.addEventListener('click', () => {
        document.body.style.overflow = '';
    });
}

// ========== SISTEMA DE TEMPLATES ==========
function saveTemplate(fieldId) {
    const field = document.getElementById(fieldId);
    const content = field.innerText.trim();
    
    if (!content) {
        showNotification('⚠️ Campo vazio - nada para salvar.', 'warning');
        return;
    }
    
    const templateName = prompt('Nome do template:', `${fieldId}_template`);
    if (!templateName) return;
    
    const templates = getTemplates();
    templates[templateName] = { fieldId, content, created: new Date().toISOString() };
    
    localStorage.setItem(CONFIG.STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    showNotification(`💾 Template "${templateName}" salvo!`, 'success');
}

function loadTemplate(fieldId) {
    const templates = getTemplates();
    const templateNames = Object.keys(templates).filter(name => 
        templates[name].fieldId === fieldId
    );
    
    if (templateNames.length === 0) {
        showNotification('ℹ️ Nenhum template encontrado para este campo.', 'info');
        return;
    }
    
    let optionsHtml = templateNames.map(name => {
        const date = new Date(templates[name].created).toLocaleDateString('pt-BR');
        return `• ${name} (${date})`;
    }).join('\n');
    
    const selectedTemplate = prompt(`Templates disponíveis:\n${optionsHtml}\n\nDigite o nome do template:`);
    
    if (selectedTemplate && templates[selectedTemplate]) {
        const field = document.getElementById(fieldId);
        field.innerText = templates[selectedTemplate].content;
        atualizarSaida();
        showNotification(`📁 Template "${selectedTemplate}" carregado!`, 'success');
    }
}

function getTemplates() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TEMPLATES) || '{}');
    } catch {
        return {};
    }
}

// ========== ATUALIZAÇÃO E GERAÇÃO DE RELATÓRIO ==========
function atualizarSaida() {
    const analise = document.getElementById('analise').innerText.trim() || 'Nenhuma análise informada.';
    const criticos = document.getElementById('criticos').innerText.trim() || 'Nenhum ponto crítico informado.';
    const resumo = document.getElementById('resumo').innerText.trim() || 'Nenhum resumo informado.';
    
    const agora = new Date();
    const timestamp = agora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

    const currentDB = getCurrentDashboard();
    const dashboardImageSrc = currentDB.src;
    const dashboardImageTitle = currentDB.title;

    const imageHtml = (dashboardImageSrc === 'image_placeholder.png' && dashboardImageTitle === 'Nenhum dashboard disponível')
        ? `<p style="text-align:center; color:#666; padding: 20px 0;">${dashboardImageTitle}. Adicione um novo dashboard.</p>`
        : `<img src="${dashboardImageSrc}" alt="${dashboardImageTitle}" 
                style="max-width: 100%; max-height: 500px; object-fit: contain; display: block; margin: 0 auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">`;

    const saidaEl = document.getElementById('saida');
    saidaEl.innerHTML = `
        <h2>📋 Relatório Sicredi - Dashboard</h2>
        <div style="text-align: center; margin-bottom: 30px; color: #666; font-size: 0.9em; font-style: italic;">
            Gerado em: ${timestamp}
        </div>
        
        <div class="relatorio-secao">
            <strong>📊 Análise:</strong>
            <div style="margin-top: 10px; padding-left: 10px;">${analise.replace(/\n/g, '<br>')}</div>
        </div> <hr>
        <div class="relatorio-secao">
            <strong>⚠️ Pontos Críticos:</strong>
            <div style="margin-top: 10px; padding-left: 10px;">${criticos.replace(/\n/g, '<br>')}</div>
        </div> <hr>
        <div class="relatorio-secao">
            <strong>📝 Resumo Executivo:</strong>
            <div style="margin-top: 10px; padding-left: 10px;">${resumo.replace(/\n/g, '<br>')}</div>
        </div> <hr>
        <div class="relatorio-secao">
            <strong>📈 Dashboard: ${dashboardImageTitle}</strong>
            <div style="margin-top: 15px;"> ${imageHtml} </div>
        </div>
        
        <div style="margin-top: 40px; padding: 15px 20px; background: linear-gradient(135deg, #f8fffe, #e8f5f0); 
                    border-radius: 10px; border-left: 5px solid #00a651; text-align: center; font-size: 0.85em;">
            <small style="color: #555;">
                <strong>Sicredi</strong> - Sistema de Crédito Cooperativo<br>
                Relatório gerado automaticamente pelo sistema de dashboard.
            </small>
        </div>
    `;
    
    saidaEl.style.opacity = '0.7';
    saidaEl.style.transform = 'translateY(10px)';
    setTimeout(() => {
        saidaEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        saidaEl.style.opacity = '1';
        saidaEl.style.transform = 'translateY(0)';
    }, 50);
}

// ========== SISTEMA DE PDF AVANÇADO ==========
function showPDFOptions() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>📄 Opções de PDF</h3>
            <p>Configure as opções para o seu relatório:</p>
            
            <div style="text-align: left; margin: 20px 0;">
                <label style="display: block; margin-bottom: 10px;">
                    <input type="text" id="pdfFilename" value="relatorio-sicredi-${new Date().toISOString().slice(0,10)}" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <span style="display: block; font-size: 0.9em; color: #666; margin-top: 4px;">Nome do arquivo</span>
                </label>
                
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="includeAllDashboards"> Incluir todos os dashboards no PDF
                </label>
                
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="highQuality" checked> Alta qualidade (arquivo maior)
                </label>
            </div>
            
            <div class="modal-buttons">
                <button class="modal-btn secondary" onclick="closeModal()">Cancelar</button>
                <button class="modal-btn primary" onclick="generatePDF()">Gerar PDF</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 100);
    
    // Focus no primeiro input
    setTimeout(() => {
        const firstInput = modal.querySelector('#pdfFilename');
        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    }, 200);
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function generatePDF() {
    const modal = document.querySelector('.modal-overlay');
    const filename = document.getElementById('pdfFilename')?.value || CONFIG.PDF.DEFAULT_FILENAME;
    const includeAll = document.getElementById('includeAllDashboards')?.checked || false;
    const highQuality = document.getElementById('highQuality')?.checked || false;
    
    closeModal();
    
    if (includeAll) {
        generateMultiDashboardPDF(filename, highQuality);
    } else {
        baixarPDF(filename, highQuality);
    }
}

function generateMultiDashboardPDF(filename, highQuality) {
    const analise = document.getElementById('analise').innerText.trim() || 'Nenhuma análise informada.';
    const criticos = document.getElementById('criticos').innerText.trim() || 'Nenhum ponto crítico informado.';
    const resumo = document.getElementById('resumo').innerText.trim() || 'Nenhum resumo informado.';
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.background = 'white';
    tempDiv.style.fontFamily = '"Segoe UI", Arial, sans-serif';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.color = '#333';
    
    let dashboardsHtml = dashboards.map((dashboard, index) => `
        <div style="page-break-before: ${index > 0 ? 'always' : 'auto'}; padding: 20px;">
            <h3 style="color: #00a651; margin-bottom: 20px;">📈 ${dashboard.title}</h3>
            <img src="${dashboard.src}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </div>
    `).join('');
    
    const agora = new Date();
    const timestamp = agora.toLocaleString('pt-BR');
    
    tempDiv.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; border-bottom: 3px solid #00a651;">
            <h1 style="color: #00a651; margin: 0; font-size: 28px;">📋 Relatório Sicredi</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Gerado em: ${timestamp}</p>
        </div>
        
        <div style="padding: 30px 20px;">
            <div style="margin-bottom: 30px; padding: 20px; background: #f8fffe; border-radius: 8px; border-left: 4px solid #00a651;">
                <h2 style="color: #00a651; margin: 0 0 15px 0;">📊 Análise</h2>
                <div>${analise.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div style="margin-bottom: 30px; padding: 20px; background: #fff8f8; border-radius: 8px; border-left: 4px solid #dc3545;">
                <h2 style="color: #dc3545; margin: 0 0 15px 0;">⚠️ Pontos Críticos</h2>
                <div>${criticos.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9ff; border-radius: 8px; border-left: 4px solid #007bff;">
                <h2 style="color: #007bff; margin: 0 0 15px 0;">📝 Resumo Executivo</h2>
                <div>${resumo.replace(/\n/g, '<br>')}</div>
            </div>
        </div>
        
        ${dashboardsHtml}
        
        <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #f8fffe, #e8f5f0); border-radius: 8px; text-align: center; border-top: 3px solid #00a651;">
            <strong style="color: #00a651;">Sicredi</strong> - Sistema de Crédito Cooperativo<br>
            <small style="color: #666;">Relatório gerado automaticamente pelo sistema de dashboard.</small>
        </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    baixarPDFCustom(tempDiv, filename, highQuality, () => {
        document.body.removeChild(tempDiv);
    });
}

function baixarPDF(customFilename, isHighQuality) {
    const button = event?.currentTarget;
    let originalText = '';
    
    if (button) {
        originalText = button.innerHTML;
        button.innerHTML = '⏳ Gerando PDF...';
        button.disabled = true;
        button.style.background = '#6c757d';
    }
    
    const saida = document.getElementById('saida');
    if (!saida || saida.innerText.trim() === '' || saida.children.length < 2) {
        alert("❌ Conteúdo do relatório está vazio ou incompleto para gerar PDF.");
        resetButton();
        return;
    }
    
    baixarPDFCustom(saida, customFilename, isHighQuality, resetButton);
    
    function resetButton() {
        if (button) {
            button.innerHTML = originalText || '📄 Baixar PDF';
            button.disabled = false;
            button.style.background = '';
        }
    }
}

function baixarPDFCustom(element, filename, isHighQuality, callback) {
    const { jsPDF } = window.jspdf;
    const scale = isHighQuality ? window.devicePixelRatio * 2 : window.devicePixelRatio * 1.2;
    
    const options = {
        backgroundColor: "#ffffff",
        scale: scale,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 20000,
        onclone: (document) => {
            return new Promise((resolve) => {
                const images = Array.from(document.querySelectorAll('img'));
                if (images.length === 0) {
                    resolve();
                    return;
                }
                let loadedCount = 0;
                images.forEach(img => {
                    if (img.complete && img.naturalHeight !== 0) {
                        loadedCount++;
                    } else {
                        img.onload = img.onerror = () => {
                            loadedCount++;
                            if (loadedCount === images.length) resolve();
                        };
                    }
                });
                if (loadedCount === images.length) resolve();
            });
        }
    };

    html2canvas(element, options).then(canvas => {
        const imgData = canvas.toDataURL('image/png', CONFIG.PDF.QUALITY);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true 
        });

        // Adiciona cabeçalho
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text('Relatório Sicredi - Confidencial', CONFIG.PDF.MARGINS, 10);
        
        // Adiciona data no cabeçalho
        const now = new Date().toLocaleString('pt-BR');
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.text(now, pageWidth - CONFIG.PDF.MARGINS, 10, { align: 'right' });

        const pdfPageWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        const margin = CONFIG.PDF.MARGINS;
        const contentWidth = pdfPageWidth - (margin * 2);
        const headerFooterSpace = 20;
        const availableHeight = pdfPageHeight - headerFooterSpace;
        
        const canvasAspectRatio = canvas.width / canvas.height;
        const contentHeight = contentWidth / canvasAspectRatio;

        let remainingCanvasHeight = canvas.height;
        let yCanvas = 0;
        let pageNum = 1;

        while (remainingCanvasHeight > 0) {
            const sliceHeightOnCanvas = (availableHeight - margin * 2) * (canvas.width / contentWidth);
            const currentSliceHeight = Math.min(sliceHeightOnCanvas, remainingCanvasHeight);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = currentSliceHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, yCanvas, canvas.width, currentSliceHeight, 0, 0, canvas.width, currentSliceHeight);
            
            const sliceImgData = tempCanvas.toDataURL('image/png', CONFIG.PDF.QUALITY);
            const slicePdfHeight = (tempCanvas.height * contentWidth) / tempCanvas.width;

            if (yCanvas > 0) {
                pdf.addPage();
                // Adiciona cabeçalho nas páginas seguintes
                pdf.setFontSize(10);
                pdf.setTextColor(100);
                pdf.text('Relatório Sicredi - Confidencial', margin, 10);
                pdf.text(now, pageWidth - margin, 10, { align: 'right' });
                pageNum++;
            }
            
            pdf.addImage(sliceImgData, 'PNG', margin, 15, contentWidth, slicePdfHeight, undefined, 'FAST');
            
            // Adiciona rodapé
            pdf.setFontSize(8);
            pdf.text(`Página ${pageNum}`, pageWidth / 2, pdfPageHeight - 5, { align: 'center' });
            pdf.text('© Sicredi - Sistema de Crédito Cooperativo', margin, pdfPageHeight - 5);
            
            remainingCanvasHeight -= currentSliceHeight;
            yCanvas += currentSliceHeight;
        }
        
        const finalFilename = filename || CONFIG.PDF.DEFAULT_FILENAME;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        pdf.save(`${finalFilename}-${timestamp}.pdf`);
        
        showNotification('✅ PDF gerado com sucesso!', 'success');
        if (callback) callback();
        
    }).catch(error => {
        console.error('Erro ao gerar PDF:', error);
        showNotification('❌ Erro ao gerar o PDF. Tente novamente.', 'error');
        if (callback) callback();
    });
}

function scrollToReport() {
    document.getElementById('saida')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========== UTILITÁRIOS E UX ==========
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupPlaceholderEffect() {
    // CSS já cuida dos placeholders
}

function setupCharacterCounters() {
    document.querySelectorAll('.editor').forEach(editor => {
        const counterContainer = editor.parentElement;
        let counter = counterContainer.querySelector('.char-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'char-counter';
            counter.style.cssText = `font-size: 0.75em; color: #777; text-align: right; margin-top: 6px; padding-right: 3px; height: 1.1em;`;
            counterContainer.appendChild(counter);
        }
        
        const updateCounter = () => {
            const count = editor.innerText.length;
            counter.textContent = `${count} caracteres`;
            counter.style.color = count > 3000 ? '#e74c3c' : (count > 1500 ? '#f39c12' : '#777');
        };
        editor.addEventListener('input', updateCounter);
        updateCounter();
    });
}

function setupAutoSave() {
    document.querySelectorAll('.editor').forEach(editor => {
        const saved = localStorage.getItem(`${CONFIG.STORAGE_KEYS.AUTO_SAVE}${editor.id}`);
        if (saved) {
            editor.innerText = saved;
        }
        
        editor.addEventListener('input', debounce(() => {
            localStorage.setItem(`${CONFIG.STORAGE_KEYS.AUTO_SAVE}${editor.id}`, editor.innerText);
            showNotification('💾 Conteúdo salvo automaticamente!', 'info');
        }, CONFIG.AUTOSAVE_DELAY));
    });
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Navegação do carrossel com setas
        if (e.target.closest('.carousel-container')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                previousImage();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextImage();
            }
        }
        
        // Atalhos globais
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    showPDFOptions();
                    break;
                case 'r':
                    e.preventDefault();
                    scrollToReport();
                    break;
            }
        }
    });
    
    // Melhora navegação por indicadores
    document.addEventListener('keydown', function(e) {
        const indicator = e.target.closest('.indicator');
        if (indicator && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            indicator.click();
        }
    });
}

// ========== SISTEMA DE AJUDA ==========
function showHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal help-modal">
            <h3>📚 Como Usar o Sistema de Relatórios Sicredi</h3>
            
            <div class="help-section">
                <h4>📝 Campos de Texto</h4>
                <p>Preencha os três campos principais do relatório:</p>
                <ul>
                    <li><strong>📊 Análise:</strong> Descrição detalhada dos dados e tendências observadas</li>
                    <li><strong>⚠️ Pontos Críticos:</strong> Questões importantes que requerem atenção</li>
                    <li><strong>📝 Resumo:</strong> Síntese executiva das principais conclusões</li>
                </ul>
                <p>💾 <strong>Auto-save:</strong> Seu conteúdo é salvo automaticamente enquanto você digita!</p>
            </div>

            <div class="help-section">
                <h4>💾📁 Sistema de Templates</h4>
                <p>Economize tempo reutilizando textos padrão:</p>
                
                <div class="help-example">
                    <strong>💾 Para Salvar um Template:</strong><br>
                    1. Digite o texto no campo desejado<br>
                    2. Clique no botão <code>💾</code> ao lado do título<br>
                    3. Digite um nome descritivo (ex: "Análise Mensal Padrão")<br>
                    4. Confirme - aparecerá uma notificação de sucesso ✅
                </div>
                
                <div class="help-example">
                    <strong>📁 Para Carregar um Template:</strong><br>
                    1. Clique no botão <code>📁</code> ao lado do título<br>
                    2. Veja a lista de templates disponíveis com datas<br>
                    3. Digite o nome exato do template desejado<br>
                    4. O texto será inserido automaticamente no campo
                </div>
                
                <div class="help-warning">
                    <strong>⚠️ Importante:</strong> Templates são salvos localmente no seu navegador. Para compartilhar com a equipe, copie e cole os textos manualmente.
                </div>
            </div>

            <div class="help-section">
                <h4>📸 Gerenciamento de Dashboards</h4>
                <p>Adicione e organize suas imagens de dashboard:</p>
                <ul>
                    <li><strong>➕ Adicionar:</strong> Clique em "Adicionar Dashboard" e selecione imagem(s)</li>
                    <li><strong>📝 Editar título:</strong> Clique no título do dashboard para editá-lo</li>
                    <li><strong>🔍 Visualizar:</strong> Clique no ícone 🔍 para ver a imagem em tela cheia</li>
                    <li><strong>🗑️ Remover:</strong> Use o botão "Remover" (aparece quando há mais de 1 dashboard)</li>
                    <li><strong>⬅️➡️ Navegar:</strong> Use as setas ou clique nos indicadores embaixo</li>
                </ul>
            </div>

            <div class="help-section">
                <h4>📄 Geração de PDF</h4>
                <p>Crie relatórios profissionais em PDF:</p>
                
                <div class="help-example">
                    <strong>🔧 Opções Avançadas:</strong><br>
                    • <strong>Nome do arquivo:</strong> Personalize o nome do PDF<br>
                    • <strong>Todos os dashboards:</strong> Inclui todas as imagens em páginas separadas<br>
                    • <strong>Alta qualidade:</strong> Maior qualidade de imagem (arquivo maior)
                </div>
                
                <p>📄 O PDF inclui automaticamente:</p>
                <ul>
                    <li>Cabeçalho com data e informações da Sicredi</li>
                    <li>Rodapé com numeração de páginas</li>
                    <li>Formatação profissional e legível</li>
                </ul>
            </div>

            <div class="help-section">
                <h4>⌨️ Atalhos de Teclado</h4>
                <div class="help-shortcut">
                    <strong>Navegação do Carrossel:</strong><br>
                    • <code>←</code> <code>→</code> Navegar entre dashboards<br><br>
                    
                    <strong>Atalhos Globais:</strong><br>
                    • <code>Ctrl + S</code> Abrir opções de PDF<br>
                    • <code>Ctrl + R</code> Ir para o relatório<br>
                    • <code>Enter</code> ou <code>Espaço</code> Ativar indicadores do carrossel
                </div>
            </div>

            <div class="help-section">
                <h4>💡 Dicas de Produtividade</h4>
                <ul>
                    <li><strong>🏗️ Estruture templates:</strong> Crie versões para diferentes tipos de relatório</li>
                    <li><strong>📊 Organize nomes:</strong> Use nomes descritivos como "Análise Q1 Crescimento"</li>
                    <li><strong>🔄 Fluxo eficiente:</strong> Carregue template → Personalize → Gere PDF</li>
                    <li><strong>👁️ Visualize antes:</strong> Use "Ver Relatório" para revisar antes do PDF</li>
                    <li><strong>💾 Aproveite o auto-save:</strong> Seu trabalho nunca será perdido</li>
                </ul>
            </div>

            <div class="help-section">
                <h4>🆘 Solução de Problemas</h4>
                <ul>
                    <li><strong>PDF não gera:</strong> Verifique se há conteúdo nos campos de texto</li>
                    <li><strong>Imagem não aparece:</strong> Certifique-se que o arquivo é uma imagem válida</li>
                    <li><strong>Template não carrega:</strong> Digite o nome exatamente como foi salvo</li>
                    <li><strong>Performance lenta:</strong> Reduza o tamanho das imagens antes do upload</li>
                </ul>
            </div>

            <div class="modal-buttons">
                <button class="modal-btn primary" onclick="closeModal()">Entendi! 👍</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 100);
    
    // Scroll para o topo do modal
    setTimeout(() => {
        const helpModal = modal.querySelector('.help-modal');
        if (helpModal) helpModal.scrollTop = 0;
    }, 200);
}

// ========== SISTEMA DE MODAIS ==========
function showConfirmModal(title, message, onConfirm, confirmText = 'Confirmar', type = 'primary') {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="modal-buttons">
                <button class="modal-btn secondary" onclick="closeModal()">Cancelar</button>
                <button class="modal-btn ${type === 'danger' ? 'remove-btn' : 'primary'}" onclick="closeModal(); (${onConfirm})()">${confirmText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 100);
    
    // Focus no botão de cancelar por segurança
    setTimeout(() => {
        modal.querySelector('.secondary')?.focus();
    }, 200);
}

// ========== SISTEMA DE NOTIFICAÇÕES ==========
function showNotification(message, type = 'info') {
    document.querySelector('.notification-banner')?.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification-banner notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    const colors = { 
        success: '#28a745', 
        error: '#dc3545', 
        info: '#17a2b8', 
        warning: '#ffc107' 
    };
    
    notification.style.cssText = `
        position: fixed; top: 25px; right: 25px; padding: 14px 22px;
        border-radius: 8px; color: white; font-weight: 500; font-size: 0.9em;
        background-color: ${colors[type] || '#6c757d'};
        z-index: 10002; opacity: 0; transform: translateX(110%);
        transition: opacity 0.35s ease-out, transform 0.35s ease-out;
        box-shadow: 0 5px 20px rgba(0,0,0,0.18);
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 50);

    const duration = CONFIG.NOTIFICATIONS.DURATION[type.toUpperCase()] || 3000;
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(110%)';
        setTimeout(() => notification.remove(), 400);
    }, duration);
}