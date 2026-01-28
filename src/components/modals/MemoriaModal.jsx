
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import { createGift } from '../../services/gifts';

export default function MemoriaModal({ isOpen, onClose, onSuccess }) {
    const [memoriaForm, setMemoriaForm] = useState({ 
        customerName: '', 
        customerEmail: '', 
        recipientName: '',
        senderName: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await createGift({
                project: 'memoria',
                productType: 'memory-card',
                customerName: memoriaForm.customerName,
                customerEmail: memoriaForm.customerEmail,
                recipientName: memoriaForm.recipientName || memoriaForm.customerName,
                senderName: memoriaForm.senderName || memoriaForm.customerName,
                status: 'open',
                platform: 'manual',
                locked: false,
                setupStarted: false,
                viewed: false
            });
            onSuccess();
            onClose();
            setMemoriaForm({ customerName: '', customerEmail: '', recipientName: '', senderName: '' });
        } catch (error) {
            console.error("Failed to create memoria order", error);
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
                                <Heart className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold font-serif text-stone-900">Memoria Auftrag</h3>
                                <p className="text-stone-500 text-sm">Manuell anlegen</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Kunden Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="z.B. Maria Schmidt"
                                    value={memoriaForm.customerName}
                                    onChange={e => setMemoriaForm({ ...memoriaForm, customerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Kunden E-Mail</label>
                                <input
                                    type="email"
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="kunde@email.com"
                                    value={memoriaForm.customerEmail}
                                    onChange={e => setMemoriaForm({ ...memoriaForm, customerEmail: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Absender Name (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="Falls anders als Kunden Name"
                                    value={memoriaForm.senderName}
                                    onChange={e => setMemoriaForm({ ...memoriaForm, senderName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Empfänger Name (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="Falls anders als Kunden Name"
                                    value={memoriaForm.recipientName}
                                    onChange={e => setMemoriaForm({ ...memoriaForm, recipientName: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !memoriaForm.customerName.trim()}
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
