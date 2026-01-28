/**
 * Anima Conditional Fields
 * Zeigt/versteckt Felder basierend auf der Personalisierungs-Auswahl
 * 
 * Verwendung:
 * 1. Für jedes Custom Property Feld: Füge data-show-when="variant-text" hinzu
 *    z.B. data-show-when="gravur" zeigt das Feld nur wenn "gravur" in der Variante enthalten ist
 *    z.B. data-show-when="ohne gravur" zeigt das Feld nur wenn "ohne gravur" ausgewählt ist
 * 
 * 2. Mehrere Bedingungen: data-show-when="gravur|digital" (ODER) oder data-show-when="gravur+digital" (UND)
 * 
 * 3. Ohne data-show-when: Feld wird immer angezeigt (außer initial versteckt)
 */

(function() {
    'use strict';
    
    // Verstecke alle Personalisierungsfelder SOFORT beim Laden (verhindert FOUC)
    function hideFieldsImmediately() {
        // Finde ALLE Custom Property Felder (nicht mehr hardcoded)
        const allCustomPropertyFields = document.querySelectorAll(
            'input[name^="properties["], textarea[name^="properties["]'
        );
        
        allCustomPropertyFields.forEach(field => {
            // Finde den Container
            let container = field.closest('.spacing-style');
            if (!container) container = field.closest('product-custom-property-component');
            if (!container) container = field.closest('[class*="custom-property"]');
            if (!container) container = field.parentElement;
            
            if (container && container !== document.body) {
                // Verstecke komplett - kein Platz mehr
                container.style.display = 'none';
                container.style.visibility = 'hidden';
                container.style.height = '0';
                container.style.margin = '0';
                container.style.padding = '0';
                container.classList.add('anima-initially-hidden');
            }
        });
    }
    
    // Führe sofort aus, auch wenn DOM noch nicht vollständig geladen ist
    hideFieldsImmediately();

    // Warte bis DOM geladen ist
    function init() {
        // Verstecke Felder nochmal (falls neue geladen wurden)
        hideFieldsImmediately();
        
        // Warte kurz, damit alle Shopify-Komponenten geladen sind
        setTimeout(() => {
            const personalizationSelect = findPersonalizationSelect();
            
            if (!personalizationSelect) {
                // Retry nach 1 Sekunde
                setTimeout(init, 1000);
                return;
            }

            // Initiale Anzeige
            const initialValue = personalizationSelect.value || personalizationSelect.options[0]?.value;
            updateFields(initialValue);

            // Auf Änderungen hören
            personalizationSelect.addEventListener('change', function() {
                updateFields(this.value);
            });
            
            // Markiere als initialisiert
            personalizationSelect.dataset.animaInitialized = 'true';
        }, 500);

        // Auch auf Varianten-Änderungen hören (falls das Personalisierungs-Dropdown Teil der Varianten ist)
        const variantSelects = document.querySelectorAll('select[name="id"], select[data-variant-select]');
        variantSelects.forEach(select => {
            select.addEventListener('change', function() {
                // Kurze Verzögerung, damit das Personalisierungs-Dropdown aktualisiert wird
                setTimeout(() => {
                    const personalization = findPersonalizationSelect();
                    if (personalization) {
                        updateFields(personalization.value);
                    }
                }, 100);
            });
        });
    }

    function findPersonalizationSelect() {
        const allSelects = document.querySelectorAll('select');
        
        // Methode 1: Suche nach Select mit "Personalisierung" im Label/Name
        for (const select of allSelects) {
            // Suche Label vor dem Select
            const label = select.closest('.field, .product-form__input, .variant-picker')?.querySelector('label');
            const labelText = (label?.textContent?.toLowerCase() || '') + (select.getAttribute('aria-label')?.toLowerCase() || '');
            
            if (labelText.includes('personalisierung') || labelText.includes('personalization')) {
                return select;
            }
            
            // Prüfe auch das name-Attribut
            const name = select.name?.toLowerCase() || '';
            if (name.includes('personal') || name.includes('personalisierung')) {
                return select;
            }
        }

        // Methode 2: Suche nach Select mit Optionen die "gravur" enthalten
        for (const select of allSelects) {
            const options = Array.from(select.options).map(opt => opt.text.toLowerCase());
            const hasGravur = options.some(text => text.includes('gravur') || text.includes('ohne gravur'));
            
            if (hasGravur) {
                return select;
            }
        }
        
        // Methode 3: Suche nach Variant-Picker der nicht die Hauptvariante ist
        // (Personalisierung könnte eine Option sein)
        const variantPickers = document.querySelectorAll('.variant-picker select, [data-variant-picker] select');
        for (const select of variantPickers) {
            const options = Array.from(select.options).map(opt => opt.text.toLowerCase());
            if (options.some(text => text.includes('gravur') || text.includes('ohne'))) {
                return select;
            }
        }

        return null;
    }

    function updateFields(selectedValue, container = null) {
        // Hole auch den Text der ausgewählten Option für bessere Erkennung
        const searchContainer = container || document;
        const personalizationSelect = container 
            ? container.querySelector('select') || findPersonalizationSelect()
            : findPersonalizationSelect();
        let selectedText = (selectedValue || '').toLowerCase();
        
        if (personalizationSelect) {
            const selectedOption = personalizationSelect.options[personalizationSelect.selectedIndex];
            if (selectedOption) {
                selectedText = selectedOption.text.toLowerCase();
            }
        }
        
        // Finde Custom Property Felder im Container (oder im gesamten Dokument)
        const allCustomPropertyFields = searchContainer.querySelectorAll(
            'input[name^="properties["], textarea[name^="properties["]'
        );
        
        // Für jedes Feld prüfe, ob es angezeigt werden soll
        allCustomPropertyFields.forEach(field => {
            // Finde den Container
            let container = field.closest('.spacing-style');
            if (!container) container = field.closest('product-custom-property-component');
            if (!container) container = field.closest('[class*="custom-property"]');
            if (!container) container = field.parentElement;
            
            if (!container) return;
            
            // Prüfe data-show-when Attribut
            const showWhen = container.getAttribute('data-show-when') || 
                           field.getAttribute('data-show-when') ||
                           container.closest('[data-show-when]')?.getAttribute('data-show-when');
            
            let shouldShow = false;
            
            if (showWhen) {
                // Parse die Bedingung
                // Format: "gravur" oder "gravur|digital" (ODER) oder "gravur+digital" (UND)
                if (showWhen.includes('|')) {
                    // ODER-Bedingung: mindestens eine muss passen
                    const conditions = showWhen.split('|').map(c => c.trim().toLowerCase());
                    shouldShow = conditions.some(condition => selectedText.includes(condition));
                } else if (showWhen.includes('+')) {
                    // UND-Bedingung: alle müssen passen
                    const conditions = showWhen.split('+').map(c => c.trim().toLowerCase());
                    shouldShow = conditions.every(condition => selectedText.includes(condition));
                } else {
                    // Einfache Bedingung
                    shouldShow = selectedText.includes(showWhen.toLowerCase());
                }
            } else {
                // Fallback: Alte Logik für Tassen-Produkte (für Rückwärtskompatibilität)
                const propertyKey = field.name.match(/properties\[(.+)\]/)?.[1] || '';
                
                if (propertyKey === 'Physische Gravur') {
                    shouldShow = selectedText.includes('gravur') && !selectedText.includes('ohne gravur');
                } else if (propertyKey === 'text' || propertyKey === 'Link' || propertyKey === 'pin') {
                    // Digitale Felder: nur wenn nicht "ohne gravur" UND (gravur+digital ODER nur digital)
                    if (selectedText.includes('ohne gravur')) {
                        shouldShow = false;
                    } else if (selectedText.includes('gravur') && (selectedText.includes('digital') || selectedText.includes('botschaft'))) {
                        shouldShow = true;
                    } else if (!selectedText.includes('gravur')) {
                        // Wenn keine Gravur-Variante ausgewählt, zeige digitale Felder
                        shouldShow = true;
                    } else {
                        shouldShow = false;
                    }
                } else {
                    // Unbekanntes Feld: Standardmäßig versteckt
                    shouldShow = false;
                }
            }
            
            toggleField(container, shouldShow);
        });
    }

    function findFieldByPropertyKey(propertyKey) {
        // Methode 1: Suche nach name-Attribut mit dem property_key
        // Die Felder haben name="properties[property_key]"
        const nameSelectors = [
            `input[name*="${propertyKey}"]`,
            `textarea[name*="${propertyKey}"]`,
            `input[name="properties[${propertyKey}]"]`,
            `textarea[name="properties[${propertyKey}]"]`
        ];
        
        for (const selector of nameSelectors) {
            const field = document.querySelector(selector);
            if (field) {
                // Versuche verschiedene Container-Selektoren
                let container = field.closest('.spacing-style');
                if (!container) container = field.closest('product-custom-property-component');
                if (!container) container = field.closest('[class*="custom-property"]');
                if (!container) container = field.closest('.product-form__input');
                if (!container) container = field.closest('.field');
                
                // Wenn kein Container gefunden, suche nach dem nächsten Block-Element
                if (!container) {
                    let parent = field.parentElement;
                    while (parent && parent !== document.body) {
                        // Prüfe ob es ein Block-Element mit relevanten Klassen ist
                        const computedStyle = window.getComputedStyle(parent);
                        if (computedStyle.display === 'block' || 
                            computedStyle.display === 'flex' ||
                            parent.classList.contains('spacing-style') ||
                            parent.tagName === 'PRODUCT-CUSTOM-PROPERTY-COMPONENT') {
                            container = parent;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }
                
                if (container) {
                    return container;
                }
                
                // Letzter Fallback: Parent-Element
                return field.parentElement || field;
            }
        }

        // Methode 2: Suche nach Label mit dem Text und finde das zugehörige Feld
        const labels = document.querySelectorAll('label, p.__heading');
        for (const label of labels) {
            const labelText = label.textContent.toLowerCase();
            let matches = false;
            
            if (propertyKey === 'Physische Gravur' && (labelText.includes('gravur') && labelText.includes('wunschtext'))) {
                matches = true;
            } else if (propertyKey === 'text' && (labelText.includes('grußbotschaft') || labelText.includes('grussbotschaft'))) {
                matches = true;
            } else if (propertyKey === 'Link' && (labelText.includes('video') || labelText.includes('foto'))) {
                matches = true;
            } else if (propertyKey === 'pin' && labelText.includes('pin')) {
                matches = true;
            }
            
            if (matches) {
                // Finde das zugehörige Input/Textarea
                const field = label.parentElement?.querySelector('input, textarea') || 
                             label.closest('.spacing-style, product-custom-property-component')?.querySelector('input, textarea');
                
                if (field) {
                    // Verwende die gleiche Container-Suche wie oben
                    let container = field.closest('.spacing-style');
                    if (!container) container = field.closest('product-custom-property-component');
                    if (!container) container = field.closest('[class*="custom-property"]');
                    if (!container) container = field.closest('.product-form__input');
                    if (!container) container = field.closest('.field');
                    
                    if (!container) {
                        let parent = field.parentElement;
                        while (parent && parent !== document.body) {
                            const computedStyle = window.getComputedStyle(parent);
                            if (computedStyle.display === 'block' || 
                                computedStyle.display === 'flex' ||
                                parent.classList.contains('spacing-style') ||
                                parent.tagName === 'PRODUCT-CUSTOM-PROPERTY-COMPONENT') {
                                container = parent;
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    }
                    
                    if (container) {
                        return container;
                    }
                    
                    return field.parentElement || field;
                }
            }
        }

        // Methode 3: Suche nach Block-IDs (falls bekannt)
        // Die Block-IDs sind: VrNExA (Gravur), wa7hVT (Grußbotschaft), Ujfceb (Link), rd9AAX (PIN)
        const blockIdMap = {
            'Physische Gravur': 'VrNExA',
            'text': 'wa7hVT',
            'Link': 'Ujfceb',
            'pin': 'rd9AAX'
        };
        
        if (blockIdMap[propertyKey]) {
            const blockId = blockIdMap[propertyKey];
            // Suche nach Element mit dieser ID oder data-Attribut
            const byId = document.querySelector(`[id*="${blockId}"]`);
            if (byId) {
                return byId.closest('.spacing-style, .product-form__input, .field') || byId.parentElement;
            }
        }

        return null;
    }

    function toggleField(fieldContainer, show) {
        if (!fieldContainer) {
            return;
        }

        if (show) {
            // Entferne alle versteckenden Styles und Attribute
            fieldContainer.style.display = '';
            fieldContainer.style.visibility = '';
            fieldContainer.style.opacity = '';
            fieldContainer.style.height = '';
            fieldContainer.style.overflow = '';
            fieldContainer.style.margin = '';
            fieldContainer.style.padding = '';
            fieldContainer.style.marginBottom = ''; // Stelle sicher, dass margin-bottom zurückgesetzt wird
            fieldContainer.removeAttribute('hidden');
            fieldContainer.classList.remove('anima-hidden', 'anima-initially-hidden');
            
            // Stelle sicher, dass der Container sichtbar ist
            // Prüfe ob es ein Block-Element ist oder flex
            const computedStyle = window.getComputedStyle(fieldContainer);
            if (computedStyle.display === 'none') {
                // Wenn es ein product-custom-property-component ist, verwende 'block'
                if (fieldContainer.tagName === 'PRODUCT-CUSTOM-PROPERTY-COMPONENT') {
                    fieldContainer.style.display = 'block';
                } else if (fieldContainer.classList.contains('spacing-style')) {
                    fieldContainer.style.display = 'block';
                } else {
                    // Für andere Container, verwende den Standard-Display-Wert
                    fieldContainer.style.display = '';
                }
            }
            
            // Stelle sicher, dass genug Abstand nach unten ist (verhindert, dass es am Quantity Selector klebt)
            // NUR im Quick-Add-Modal, nicht auf der Standard-Produktseite
            const isInModal = fieldContainer.closest('#quick-add-modal-content, .quick-add-modal');
            
            if (isInModal) {
                // Prüfe ob es ein PIN-Feld ist (immer das letzte Feld)
                const pinField = fieldContainer.querySelector('input[name*="pin"], input[name*="PIN"]');
                if (pinField) {
                    // PIN-Feld bekommt immer extra margin-bottom im Modal
                    fieldContainer.style.marginBottom = '5rem';
                } else if (fieldContainer.classList.contains('spacing-style')) {
                    // Für andere Felder: Prüfe ob es das letzte sichtbare Feld ist
                    const formContainer = fieldContainer.closest('form, #quick-add-modal-content, .product-details') || document;
                    const allFields = Array.from(formContainer.querySelectorAll('.spacing-style:not(.anima-hidden):not([hidden])'));
                    const isLastField = allFields.length > 0 && allFields[allFields.length - 1] === fieldContainer;
                    
                    if (isLastField) {
                        fieldContainer.style.marginBottom = '5rem';
                    }
                }
            }
            
            // Stelle auch sicher, dass das Input/Textarea selbst sichtbar ist
            const input = fieldContainer.querySelector('input, textarea');
            if (input) {
                input.style.display = '';
                input.style.visibility = '';
                input.removeAttribute('hidden');
            }
            
            // Prüfe auch das parent product-custom-property-component (falls vorhanden)
            const webComponent = fieldContainer.closest('product-custom-property-component');
            if (webComponent && webComponent.style.display === 'none') {
                webComponent.style.display = '';
                webComponent.style.visibility = '';
                webComponent.removeAttribute('hidden');
            }
        } else {
            // Verwende display: none für sauberes Verstecken (kein Platz mehr)
            fieldContainer.style.display = 'none';
            fieldContainer.style.visibility = 'hidden';
            fieldContainer.setAttribute('hidden', 'true');
            fieldContainer.classList.add('anima-hidden');
            
            // Verstecke auch das parent product-custom-property-component (falls vorhanden)
            const webComponent = fieldContainer.closest('product-custom-property-component');
            if (webComponent && webComponent !== fieldContainer) {
                webComponent.style.display = 'none';
                webComponent.style.visibility = 'hidden';
                webComponent.setAttribute('hidden', 'true');
            }
        }
    }

    // Initialisierung
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Auch nach AJAX-Updates (falls Shopify das Theme dynamisch lädt)
    // Aber nur wenn noch nicht initialisiert
    let isInitialized = false;
    const observer = new MutationObserver(function(mutations) {
        // Prüfe nur alle 500ms, nicht bei jeder Mutation
        if (isInitialized) return;
        
        const personalizationSelect = findPersonalizationSelect();
        if (personalizationSelect && !personalizationSelect.dataset.animaInitialized) {
            isInitialized = true;
            personalizationSelect.dataset.animaInitialized = 'true';
            init();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initialisierung für Quick-Add-Modal
    function initModal() {
        const modalContent = document.getElementById('quick-add-modal-content');
        if (!modalContent) return;
        
        // Prüfe ob Personalisierungs-Select im Modal vorhanden ist
        // Suche ZUERST im Modal, nicht im gesamten Dokument
        const allSelectsInModal = modalContent.querySelectorAll('select');
        let personalizationSelect = null;
        
        // Suche nach Select mit "Personalisierung" im Label/Name
        for (const select of allSelectsInModal) {
            const label = select.closest('.field, .product-form__input, .variant-picker')?.querySelector('label');
            const labelText = (label?.textContent?.toLowerCase() || '') + (select.getAttribute('aria-label')?.toLowerCase() || '');
            
            if (labelText.includes('personalisierung') || labelText.includes('personalization')) {
                personalizationSelect = select;
                break;
            }
            
            const name = select.name?.toLowerCase() || '';
            if (name.includes('personal') || name.includes('personalisierung')) {
                personalizationSelect = select;
                break;
            }
        }
        
        // Falls nicht gefunden, suche nach Optionen mit "gravur"
        if (!personalizationSelect) {
            for (const select of allSelectsInModal) {
                const options = Array.from(select.options).map(opt => opt.text.toLowerCase());
                const hasGravur = options.some(text => text.includes('gravur') || text.includes('ohne gravur'));
                
                if (hasGravur) {
                    personalizationSelect = select;
                    break;
                }
            }
        }
        
        if (!personalizationSelect) return;
        
        // Prüfe ob bereits initialisiert
        if (personalizationSelect.dataset.animaModalInitialized) return;
        
        personalizationSelect.dataset.animaModalInitialized = 'true';
        
        // Verstecke Felder zuerst
        const fieldsInModal = modalContent.querySelectorAll('input[name^="properties["], textarea[name^="properties["]');
        fieldsInModal.forEach(field => {
            let container = field.closest('.spacing-style');
            if (!container) container = field.closest('product-custom-property-component');
            if (!container) container = field.closest('[class*="custom-property"]');
            if (!container) container = field.parentElement;
            
            if (container && container !== document.body) {
                container.style.display = 'none';
                container.style.visibility = 'hidden';
                container.style.height = '0';
                container.style.margin = '0';
                container.style.padding = '0';
                container.classList.add('anima-initially-hidden');
            }
        });
        
        // Initiale Anzeige basierend auf aktueller Auswahl (NUR im Modal)
        const initialValue = personalizationSelect.value || personalizationSelect.options[0]?.value;
        updateFields(initialValue, modalContent);
        
        // Auf Änderungen hören
        personalizationSelect.addEventListener('change', function() {
            updateFields(this.value, modalContent);
        });
        
        // Auch auf Varianten-Änderungen hören
        const variantSelects = modalContent.querySelectorAll('select[name="id"], select[data-variant-select]');
        variantSelects.forEach(select => {
            select.addEventListener('change', function() {
                setTimeout(() => {
                    const personalization = modalContent.querySelector('select');
                    if (personalization) {
                        // Prüfe ob es das Personalisierungs-Select ist
                        const options = Array.from(personalization.options).map(opt => opt.text.toLowerCase());
                        if (options.some(text => text.includes('gravur') || text.includes('ohne gravur'))) {
                            updateFields(personalization.value, modalContent);
                        }
                    }
                }, 100);
            });
        });
    }
    
    // Beobachte Änderungen im Modal-Content (wenn Inhalt per morph() geladen wird)
    const modalContentObserver = new MutationObserver(function(mutations) {
        const modalContent = document.getElementById('quick-add-modal-content');
        if (!modalContent) return;
        
        const modal = modalContent.closest('.quick-add-modal, dialog');
        if (!modal || !modal.hasAttribute('open')) return;
        
        // Prüfe ob neue Selects oder Felder hinzugefügt wurden
        let hasNewContent = false;
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                hasNewContent = true;
            }
        });
        
        if (hasNewContent) {
            setTimeout(() => {
                initModal();
            }, 500);
        }
    });
    
    // Starte Beobachtung des Modal-Contents sobald er existiert
    function startModalContentObservation() {
        const modalContent = document.getElementById('quick-add-modal-content');
        if (modalContent) {
            modalContentObserver.observe(modalContent, {
                childList: true,
                subtree: true
            });
        } else {
            setTimeout(startModalContentObservation, 500);
        }
    }
    startModalContentObservation();
    
    // Interval-Check entfernt - MutationObserver reicht aus
    
    // Auch direkt beim Öffnen des Dialogs
    const dialogObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
                const dialog = mutation.target;
                if (dialog.hasAttribute('open') && (dialog.classList.contains('quick-add-modal') || dialog.tagName === 'DIALOG')) {
                    // Warte bis Inhalt geladen ist (nach morph())
                    setTimeout(() => {
                        initModal();
                    }, 1000);
                    setTimeout(() => {
                        initModal();
                    }, 2000);
                }
            }
        });
    });
    
    // Beobachte alle Dialog-Elemente
    function observeDialogs() {
        const dialogs = document.querySelectorAll('dialog, .quick-add-modal, quick-add-dialog');
        dialogs.forEach(dialog => {
            dialogObserver.observe(dialog, {
                attributes: true,
                attributeFilter: ['open']
            });
        });
        
        // Wenn keine Dialogs gefunden, versuche später erneut
        if (dialogs.length === 0) {
            setTimeout(observeDialogs, 1000);
        }
    }
    observeDialogs();
    
    // Beobachte auch neue Dialog-Elemente
    const dialogContainerObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    const dialogs = node.querySelectorAll ? node.querySelectorAll('dialog, .quick-add-modal, quick-add-dialog') : [];
                    if (node.tagName === 'DIALOG' || node.classList.contains('quick-add-modal') || node.tagName === 'QUICK-ADD-DIALOG') {
                        dialogs.push(node);
                    }
                    dialogs.forEach(dialog => {
                        dialogObserver.observe(dialog, {
                            attributes: true,
                            attributeFilter: ['open']
                        });
                    });
                }
            });
        });
    });
    
    dialogContainerObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
