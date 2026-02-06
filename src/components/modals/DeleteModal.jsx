
import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

export default function DeleteModal({ isOpen, onClose, onConfirm, isDeleting, itemName }) {
    const isBulk = typeof itemName === 'string' && itemName.includes('Geschenke');
    const count = isBulk ? parseInt(itemName.match(/\d+/)?.[0] || '0') : 1;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-bold text-center text-stone-900 mb-2">
                            {isBulk ? `${count} Geschenke löschen?` : 'Geschenk löschen?'}
                        </h3>
                        <p className="text-center text-stone-500 mb-6">
                            {isBulk
                                ? `Möchtest du wirklich ${count} ${count === 1 ? 'Geschenk' : 'Geschenke'} löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
                                : 'Diese Aktion kann nicht rückgängig gemacht werden.'}
                        </p>
                        <div className="flex space-x-3 mt-6">
                            <button onClick={onClose} disabled={isDeleting} className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50">Abbrechen</button>
                            <button onClick={onConfirm} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                                {isDeleting ? 'Löscht...' : isBulk ? `${count} löschen` : 'Löschen'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
