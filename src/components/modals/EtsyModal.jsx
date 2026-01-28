
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { createEtsyOrder, createGift } from '../../services/gifts';

export default function EtsyModal({ isOpen, onClose, onSuccess }) {
    const [etsyForm, setEtsyForm] = useState({ buyerName: '', personalizationText: '', productType: 'mug', buyerEmail: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Memoria uses createGift instead of createEtsyOrder
            if (etsyForm.productType === 'memory-card') {
                await createGift({
                    project: 'memoria',
                    productType: 'memory-card',
                    customerName: etsyForm.buyerName,
                    customerEmail: etsyForm.buyerEmail,
                    senderName: etsyForm.buyerName,
                    recipientName: '',
                    status: 'open',
                    platform: 'manual',
                    locked: false,
                    setupStarted: false,
                    viewed: false
                });
            } else {
                await createEtsyOrder({
                    ...etsyForm,
                    customerName: etsyForm.buyerName,
                    customerEmail: etsyForm.buyerEmail,
                    senderName: etsyForm.buyerName,
                    recipientName: '',
                    etsyOrderId: `MANUAL-${Math.floor(Math.random() * 10000)}`
                });
            }
            onSuccess();
            onClose();
            setEtsyForm({ buyerName: '', personalizationText: '', productType: 'mug', buyerEmail: '' }); // Reset
        } catch (error) {
            console.error("Failed to create order", error);
            alert("Fehler beim Erstellen.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
                            <X className="h-6 w-6" />
                        </button>
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-stone-100 rounded-full">
                                <ShoppingBag className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold font-serif text-stone-900">Etsy Simulieren</h3>
                                <p className="text-stone-500 text-sm">Bestellung manuell anlegen</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Produkt</label>
                                <select
                                    value={etsyForm.productType}
                                    onChange={e => setEtsyForm({ ...etsyForm, productType: e.target.value })}
                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                >
                                    <option value="mug">Multimedia Tasse</option>
                                    <option value="bracelet">Armband (Gravur)</option>
                                    <option value="memory-card">Memoria</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Name des Käufers (Etsy User)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="z.B. Stefan Müller"
                                    value={etsyForm.buyerName}
                                    onChange={e => setEtsyForm({ ...etsyForm, buyerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Kunden E-Mail (Optional)</label>
                                <input
                                    type="email"
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="kunde@email.com"
                                    value={etsyForm.buyerEmail || ''}
                                    onChange={e => setEtsyForm({ ...etsyForm, buyerEmail: e.target.value })}
                                />
                            </div>
                            {etsyForm.productType !== 'memory-card' && (
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Personalisierung (Etsy Text)</label>
                                    <textarea
                                        className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                        placeholder="Text den der Kunde bei Etsy eingegeben hat..."
                                        rows={3}
                                        value={etsyForm.personalizationText}
                                        onChange={e => setEtsyForm({ ...etsyForm, personalizationText: e.target.value })}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl mt-4 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-200 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Wird erstellt...' : 'Auftrag Anlegen'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
