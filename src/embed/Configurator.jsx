import React, { useState } from 'react';
import WizardMessageEditor from '../modules/anima/experiences/multimedia-gift/components/WizardMessageEditor';
import { createGift } from '../services/gifts';
import { Loader, CheckCircle, Save } from 'lucide-react';

export default function Configurator({ productId, mode = 'multimedia', onSave }) {
    // Mode can be: 'multimedia', 'engraving', 'full'
    const showEngraving = mode === 'engraving' || mode === 'full';
    const showMultimedia = mode === 'multimedia' || mode === 'full';

    const [formData, setFormData] = useState({
        project: 'kamlimos',
        productType: 'mug',
        messages: [],
        engravingText: '',
        recipientName: '',
        senderName: '',
        accessCode: '',
        status: 'draft',
        source: 'shopify_widget',
        shopifyProductId: productId
    });
    const [loading, setLoading] = useState(false);
    const [savedId, setSavedId] = useState(null);

    // Helpers
    const addMessage = (type) => {
        const newMessage = { id: Date.now(), type, author: '', content: '' };
        setFormData(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
    };
    const removeMessage = (id) => {
        setFormData(prev => ({ ...prev, messages: prev.messages.filter(m => m.id !== id) }));
    };
    const updateMessage = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            messages: prev.messages.map(msg => msg.id === id ? { ...msg, [field]: value } : msg)
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const id = await createGift(formData);
            setSavedId(id);
            if (onSave) onSave(id);
            // Dispatch event for Shopify listeners
            const event = new CustomEvent('anima:config-saved', { detail: { giftId: id } });
            window.dispatchEvent(event);

            // AUTO-INJECT logic: Ensure the hidden field exists in the form
            let hiddenInput = document.querySelector('input[name="properties[_giftId]"]');

            if (!hiddenInput) {
                // Try to find the specific product form
                const form = document.querySelector('form[action*="/cart/add"]');
                if (form) {
                    hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'properties[_giftId]';
                    form.appendChild(hiddenInput);
                } else {
                    console.warn("Anima Widget: Could not find Product Form to inject ID.");
                }
            }

            if (hiddenInput) hiddenInput.value = id;
        } catch (error) {
            console.error("Save failed", error);
            alert("Fehler beim Speichern.");
        } finally {
            setLoading(false);
        }
    };

    if (savedId) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center animate-fade-in">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-emerald-800 font-bold text-lg">Gespeichert!</h3>
                <p className="text-emerald-600 text-sm mb-4">Das Produkt liegt jetzt bereit.</p>
                <button onClick={() => setSavedId(null)} className="text-emerald-700 underline text-xs">Bearbeiten</button>
            </div>
        );
    }

    return (

        <div className="anima-widget space-y-4 w-full">

            {/* Header logic - Only show if combined or engraving mode */}
            {(!showMultimedia || showEngraving) && (
                <h3 className="text-lg font-bold font-serif text-stone-900 border-b border-stone-100 pb-2">
                    {showMultimedia ? "Deine persönliche Nachricht" : "Personalisiere dein Geschenk"}
                </h3>
            )}

            {/* Metadata Inputs (Recipient, Sender, PIN) */}
            <div className="space-y-4 pt-1">
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Für (Empfänger)</label>
                    <input
                        type="text"
                        value={formData.recipientName}
                        onChange={(e) => setFormData(p => ({ ...p, recipientName: e.target.value }))}
                        className="w-full p-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-200 outline-none text-sm transition-all"
                        placeholder="Name des Empfängers"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Von (Absender)</label>
                    <input
                        type="text"
                        value={formData.senderName}
                        onChange={(e) => setFormData(p => ({ ...p, senderName: e.target.value }))}
                        className="w-full p-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-200 outline-none text-sm transition-all"
                        placeholder="Dein Name"
                    />
                </div>

                <div className="pt-2 border-t border-stone-100">
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">PIN Code (von der Karte)</label>
                    <input
                        type="text"
                        value={formData.accessCode}
                        onChange={(e) => setFormData(p => ({ ...p, accessCode: e.target.value }))}
                        className="w-full p-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-200 outline-none text-sm font-mono tracking-wider text-center uppercase transition-all"
                        placeholder="1234AB"
                    />
                    <p className="text-xs text-stone-400 mt-1 text-center">
                        Bitte gib den Code ein, der auf deiner Karte aufgedruckt ist.
                    </p>
                </div>
            </div>

            {/* Engraving Section */}
            {showEngraving && (
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide">
                        Deine Gravur (Tassenboden)
                    </label>
                    <input
                        type="text"
                        value={formData.engravingText}
                        onChange={(e) => setFormData(items => ({ ...items, engravingText: e.target.value }))}
                        placeholder="z.B. Für Mama, 2024"
                        maxLength={30}
                        className="w-full p-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all font-serif text-lg text-center bg-stone-50"
                    />
                    <p className="text-xs text-stone-400 text-right">{formData.engravingText.length}/30 Zeichen</p>
                </div>
            )}

            {/* Messages Section */}
            {showMultimedia && (
                <div className={showEngraving ? "pt-4 border-t border-stone-100" : "pt-0"}>
                    <WizardMessageEditor
                        messages={formData.messages}
                        onAdd={addMessage}
                        onRemove={removeMessage}
                        onUpdate={updateMessage}
                        widgetMode={true}
                    />
                </div>
            )}

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-white text-stone-900 border border-stone-300 rounded-lg text-sm font-bold hover:bg-stone-50 transition-all flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Speichern</>}
                </button>
            </div>
        </div>
    );
}
