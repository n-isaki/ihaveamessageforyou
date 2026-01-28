/**
 * Anima Conditional Fields
 * Zeigt/versteckt Felder basierend auf der Personalisierungs-Auswahl
 */

console.log('[Anima] Script-Datei geladen!');

(function() {
    'use strict';
    
    console.log('[Anima] IIFE gestartet');
    
    // Verstecke alle Personalisierungsfelder SOFORT beim Laden (verhindert FOUC)
    function hideFieldsImmediately() {
        const fieldsToHide = [
            'input[name*="Physische Gravur"]',
            'textarea[name*="text"]',
            'textarea[name*="Link"]',
            'input[name*="pin"]'
        ];
        
        fieldsToHide.forEach(selector => {
            const fields = document.querySelectorAll(selector);
            fields.forEach(field => {
                const container = field.closest('.spacing-style, product-custom-property-component, [class*="custom-property"]') || field.parentElement;
                if (container && container.style.display !== 'none') {
                    container.style.display = 'none';
                    container.classList.add('anima-initially-hidden');
                }
            });
        });
        console.log('[Anima] Felder initial versteckt (FOUC-Schutz)');
    }
    
    // Führe sofort aus, auch wenn DOM noch nicht vollständig geladen ist
    hideFieldsImmediately();

    // Warte bis DOM geladen ist
    function init() {
        console.log('[Anima] Script geladen, starte Initialisierung...');
        
        // Verstecke Felder nochmal (falls neue geladen wurden)
        hideFieldsImmediately();
        
        // Warte kurz, damit alle Shopify-Komponenten geladen sind
        setTimeout(() => {
            const personalizationSelect = findPersonalizationSelect();
            
            if (!personalizationSelect) {
                console.warn('[Anima] Personalisierungs-Dropdown nicht gefunden');
                console.log('[Anima] Verfügbare Selects:', Array.from(document.querySelectorAll('select')).map(s => ({
                    id: s.id,
                    name: s.name,
                    options: Array.from(s.options).slice(0, 3).map(o => o.text)
                })));
                // Retry nach 1 Sekunde
                setTimeout(init, 1000);
                return;
            }

            console.log('[Anima] Personalisierungs-Dropdown gefunden:', personalizationSelect);
            console.log('[Anima] Aktuelle Auswahl:', personalizationSelect.value, personalizationSelect.options[personalizationSelect.selectedIndex]?.text);

            // Initiale Anzeige
            const initialValue = personalizationSelect.value || personalizationSelect.options[0]?.value;
            updateFields(initialValue);

            // Auf Änderungen hören
            personalizationSelect.addEventListener('change', function() {
                console.log('[Anima] Dropdown geändert zu:', this.value, this.options[this.selectedIndex]?.text);
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
        console.log('[Anima] Suche Personalisierungs-Dropdown...');
        const allSelects = document.querySelectorAll('select');
        console.log('[Anima] Gefundene Selects:', allSelects.length);
        
        // Methode 1: Suche nach Select mit "Personalisierung" im Label/Name
        for (const select of allSelects) {
            // Suche Label vor dem Select
            const label = select.closest('.field, .product-form__input, .variant-picker')?.querySelector('label');
            const labelText = (label?.textContent?.toLowerCase() || '') + (select.getAttribute('aria-label')?.toLowerCase() || '');
            
            if (labelText.includes('personalisierung') || labelText.includes('personalization')) {
                console.log('[Anima] Gefunden via Label:', labelText);
                return select;
            }
            
            // Prüfe auch das name-Attribut
            const name = select.name?.toLowerCase() || '';
            if (name.includes('personal') || name.includes('personalisierung')) {
                console.log('[Anima] Gefunden via name:', name);
                return select;
            }
        }

        // Methode 2: Suche nach Select mit Optionen die "gravur" enthalten
        for (const select of allSelects) {
            const options = Array.from(select.options).map(opt => opt.text.toLowerCase());
            const hasGravur = options.some(text => text.includes('gravur') || text.includes('ohne gravur'));
            
            if (hasGravur) {
                console.log('[Anima] Gefunden via Optionen mit "gravur":', options);
                return select;
            }
        }
        
        // Methode 3: Suche nach Variant-Picker der nicht die Hauptvariante ist
        // (Personalisierung könnte eine Option sein)
        const variantPickers = document.querySelectorAll('.variant-picker select, [data-variant-picker] select');
        for (const select of variantPickers) {
            const options = Array.from(select.options).map(opt => opt.text.toLowerCase());
            if (options.some(text => text.includes('gravur') || text.includes('ohne'))) {
                console.log('[Anima] Gefunden via Variant-Picker:', options);
                return select;
            }
        }

        console.warn('[Anima] Kein Personalisierungs-Dropdown gefunden');
        return null;
    }

    function updateFields(selectedValue) {
        // Hole auch den Text der ausgewählten Option für bessere Erkennung
        const personalizationSelect = findPersonalizationSelect();
        let selectedText = (selectedValue || '').toLowerCase();
        
        if (personalizationSelect) {
            const selectedOption = personalizationSelect.options[personalizationSelect.selectedIndex];
            if (selectedOption) {
                selectedText = selectedOption.text.toLowerCase();
            }
        }
        
        console.log('[Anima] Aktualisiere Felder für:', selectedValue, '→ Text:', selectedText);

        // Finde die Custom Property Felder
        const engravingField = findFieldByPropertyKey('Physische Gravur');
        const greetingField = findFieldByPropertyKey('text');
        const linkField = findFieldByPropertyKey('Link');
        const pinField = findFieldByPropertyKey('pin');

        // Bestimme welche Felder angezeigt werden sollen
        let showEngraving = false;
        let showDigital = false;

        // Prüfe zuerst auf "ohne gravur" (muss exakt sein)
        if (selectedText.includes('ohne gravur') || selectedText === 'ohne gravur' || selectedText.includes('without engraving')) {
            // Ohne Gravur → KEINE Personalisierungsfelder anzeigen
            showEngraving = false;
            showDigital = false;
            console.log('[Anima] Modus: Ohne Gravur → keine Felder');
        } 
        // Dann prüfe auf "gravur + digital" oder "gravur + botschaft"
        else if ((selectedText.includes('gravur') && selectedText.includes('digital')) || 
                 (selectedText.includes('gravur') && selectedText.includes('botschaft')) ||
                 (selectedText.includes('engraving') && selectedText.includes('digital'))) {
            // Mit Gravur + digital → alle Felder
            showEngraving = true;
            showDigital = true;
            console.log('[Anima] Modus: Mit Gravur + Digital → alle Felder');
        } 
        // Dann prüfe auf nur "gravur" (ohne digital/botschaft)
        else if (selectedText.includes('gravur') || selectedText.includes('engraving')) {
            // Nur Gravur → nur Gravur-Feld
            showEngraving = true;
            showDigital = false;
            console.log('[Anima] Modus: Nur Gravur → nur Gravur-Feld');
        } 
        else {
            // Default: keine Felder (falls nichts erkannt wird)
            showEngraving = false;
            showDigital = false;
            console.log('[Anima] Modus: Default → keine Felder');
        }

        console.log('[Anima] showEngraving:', showEngraving, 'showDigital:', showDigital);
        console.log('[Anima] Gefundene Felder:', {
            engraving: engravingField?.tagName || 'nicht gefunden',
            greeting: greetingField?.tagName || 'nicht gefunden',
            link: linkField?.tagName || 'nicht gefunden',
            pin: pinField?.tagName || 'nicht gefunden'
        });

        // Zeige/Verstecke Felder
        toggleField(engravingField, showEngraving);
        toggleField(greetingField, showDigital);
        toggleField(linkField, showDigital);
        toggleField(pinField, showDigital);
        
        console.log('[Anima] Felder aktualisiert');
    }

    function findFieldByPropertyKey(propertyKey) {
        console.log('[Anima] Suche Feld für:', propertyKey);
        
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
                console.log('[Anima] Feld gefunden via name:', selector, field);
                
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
                    console.log('[Anima] Container gefunden:', container);
                    return container;
                }
                
                // Letzter Fallback: Parent-Element
                console.warn('[Anima] Kein Container gefunden, verwende Parent:', field.parentElement);
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
                console.log('[Anima] Label gefunden:', label.textContent);
                
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
                        console.log('[Anima] Container via Label gefunden:', container);
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
                console.log('[Anima] Feld gefunden via Block-ID:', blockId);
                return byId.closest('.spacing-style, .product-form__input, .field') || byId.parentElement;
            }
        }

        console.warn('[Anima] Feld nicht gefunden für:', propertyKey);
        return null;
    }

    function toggleField(fieldContainer, show) {
        if (!fieldContainer) {
            console.warn('[Anima] Feld-Container ist null');
            return;
        }

        console.log('[Anima] Toggle Feld:', fieldContainer, 'show:', show);

        if (show) {
            // Entferne alle versteckenden Styles und Attribute
            fieldContainer.style.display = '';
            fieldContainer.style.visibility = '';
            fieldContainer.style.opacity = '';
            fieldContainer.style.height = '';
            fieldContainer.style.overflow = '';
            fieldContainer.style.margin = '';
            fieldContainer.style.padding = '';
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
            
            // Stelle auch sicher, dass das Input/Textarea selbst sichtbar ist
            const input = fieldContainer.querySelector('input, textarea');
            if (input) {
                input.style.display = '';
                input.style.visibility = '';
                input.removeAttribute('hidden');
            }
        } else {
            // Verwende display: none für sauberes Verstecken
            fieldContainer.style.display = 'none';
            fieldContainer.setAttribute('hidden', 'true');
            fieldContainer.classList.add('anima-hidden');
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
            console.log('[Anima] Re-Initialisierung durch MutationObserver');
            init();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
