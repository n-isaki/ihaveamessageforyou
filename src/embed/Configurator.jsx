import React, { useState, useEffect } from 'react';
import WizardMessageEditor from '../modules/anima/experiences/multimedia-gift/components/WizardMessageEditor';
import { createGift } from '../services/gifts';
import { Loader, CheckCircle, Save } from 'lucide-react';

export default function Configurator({ productId, onSave }) {
    const [formData, setFormData] = useState({
        project: 'kamlimos', // Default to standard project
        productType: 'mug',
        messages: [],
        engravingText: '',
        status: 'draft', // Draft until checkout complete
        source: 'shopify_widget',
        shopifyProductId: productId
    });
    const [loading, setLoading] = useState(false);
    const [savedId, setSavedId] = useState(null);

    // Helpers from Wizard logic
    const addMessage = (type) => {
        const newMessage = {
            id: Date.now(),
            type,
            author: '',
            content: ''
        };
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

            // Populate hidden field if it exists
            const hiddenInput = document.querySelector('input[name="properties[_giftId]"]');
            if (hiddenInput) hiddenInput.value = id;

        } catch (error) {
            console.error("Save failed", error);
            alert("Fehler beim Speichern. Bitte versuche es erneut.");
        } finally {
            setLoading(false);
        }
    };

    if (savedId) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center animate-fade-in">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-emerald-800 font-bold text-lg">Konfiguration gespeichert!</h3>
                <p className="text-emerald-600 text-sm mb-4">Du kannst das Produkt jetzt in den Warenkorb legen.</p>
                <button
                    onClick={() => setSavedId(null)}
                    className="text-emerald-700 underline text-xs"
                >
                    Bearbeiten
                </button>
            </div>
        );
    }

    return (
        <div className="anima-widget bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-serif text-stone-900 border-b border-stone-100 pb-2">
                Personalisiere dein Geschenk
            </h3>

            {/* Engraving Section */}
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

            {/* Messages Section - Reusing the component */}
            <div className="pt-4 border-t border-stone-100">
                <WizardMessageEditor
                    messages={formData.messages}
                    onAdd={addMessage}
                    onRemove={removeMessage}
                    onUpdate={updateMessage}
                />
            </div>

            {/* Save Button */}
            <div className="pt-6">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader className="h-6 w-6 animate-spin" />
                    ) : (
                        <>
                            <Save className="h-5 w-5 mr-2" />
                            Konfiguration Speichern
                        </>
                    )}
                </button>
                <p className="text-center text-xs text-stone-400 mt-2">
                    Bitte speichere deine Personalisierung, bevor du das Produkt in den Warenkorb legst.
                </p>
            </div>
        </div>
    );
}
