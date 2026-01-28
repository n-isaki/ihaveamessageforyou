/**
 * Debug Script: Prüft ob Custom Property Blocks im Modal geladen werden
 */
(function() {
    'use strict';
    
    function debugModalContent() {
        const modal = document.querySelector('.quick-add-modal[open], dialog.quick-add-modal[open]');
        if (!modal) return;
        
        const modalContent = document.getElementById('quick-add-modal-content');
        if (!modalContent) return;
        
        console.log('[Anima Debug] Modal geöffnet');
        console.log('[Anima Debug] Modal Content:', modalContent);
        
        // Prüfe auf Custom Property Felder
        const customFields = modalContent.querySelectorAll('input[name^="properties["], textarea[name^="properties["]');
        console.log('[Anima Debug] Gefundene Custom Property Felder:', customFields.length);
        customFields.forEach((field, index) => {
            console.log(`[Anima Debug] Feld ${index + 1}:`, {
                name: field.name,
                type: field.tagName,
                container: field.closest('.spacing-style, product-custom-property-component'),
                visible: field.offsetParent !== null
            });
        });
        
        // Prüfe auf Personalisierungs-Select
        const selects = modalContent.querySelectorAll('select');
        console.log('[Anima Debug] Gefundene Selects:', selects.length);
        selects.forEach((select, index) => {
            const label = select.closest('.field, .product-form__input, .variant-picker')?.querySelector('label');
            console.log(`[Anima Debug] Select ${index + 1}:`, {
                name: select.name,
                options: Array.from(select.options).map(opt => opt.text),
                label: label?.textContent,
                visible: select.offsetParent !== null
            });
        });
        
        // Prüfe auf product-details
        const productDetails = modalContent.querySelector('.product-details');
        console.log('[Anima Debug] Product Details gefunden:', !!productDetails);
        if (productDetails) {
            console.log('[Anima Debug] Product Details HTML:', productDetails.innerHTML.substring(0, 500));
        }
    }
    
    // Prüfe alle 500ms wenn Modal geöffnet ist
    setInterval(function() {
        const modal = document.querySelector('.quick-add-modal[open], dialog.quick-add-modal[open]');
        if (modal) {
            debugModalContent();
        }
    }, 500);
    
    // Auch beim Öffnen
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
                const dialog = mutation.target;
                if (dialog.hasAttribute('open') && dialog.classList.contains('quick-add-modal')) {
                    setTimeout(() => {
                        debugModalContent();
                    }, 1000);
                }
            }
        });
    });
    
    const dialogs = document.querySelectorAll('dialog, .quick-add-modal');
    dialogs.forEach(dialog => {
        observer.observe(dialog, {
            attributes: true,
            attributeFilter: ['open']
        });
    });
    
})();
