import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGifts, deleteGift } from '../services/gifts';
import { Plus, Gift, Eye, EyeOff, Loader, Printer, ChevronDown, ChevronUp, Edit2, Video, MessageSquare, Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchGifts();
    }, []);

    const fetchGifts = async () => {
        try {
            const data = await getGifts();
            setGifts(data);
        } catch (error) {
            console.error("Failed to fetch gifts", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteGift(deleteId);
            // Remove from local state to update UI immediately
            setGifts(gifts.filter(g => g.id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete gift", error);
            alert("Fehler beim Löschen des Geschenks.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader className="h-8 w-8 animate-spin text-rose-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 p-8 relative">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-stone-900">Geschenk Dashboard</h1>
                    <Link
                        to="/admin/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Neues Geschenk
                    </Link>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-stone-200">
                        {gifts.length === 0 ? (
                            <li className="px-6 py-12 text-center text-stone-500">
                                Noch keine Geschenke erstellt. Klicke auf "Neues Geschenk" um zu starten.
                            </li>
                        ) : (
                            gifts.map((gift) => (
                                <li key={gift.id} className="hover:bg-stone-50 transition-colors">
                                    <div className="px-4 py-4 sm:px-6 cursor-pointer" onClick={() => toggleExpand(gift.id)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                        <Gift className="h-6 w-6 text-emerald-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-rose-600 truncate">
                                                        {gift.recipientName}
                                                    </div>
                                                    <div className="text-sm text-stone-500">
                                                        Von: {gift.customerName}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gift.viewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {gift.viewed ? (
                                                        <>
                                                            <Eye className="h-3 w-3 mr-1" /> Gesehen
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff className="h-3 w-3 mr-1" /> Ungesehen
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-sm text-stone-500">
                                                    PIN: <span className="font-mono font-bold">{gift.accessCode}</span>
                                                </div>
                                                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                    <Link
                                                        to={`/admin/edit/${gift.id}`}
                                                        className="text-stone-400 hover:text-rose-600 p-1"
                                                        title="Bearbeiten"
                                                    >
                                                        <Edit2 className="h-5 w-5" />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/print/${gift.id}`}
                                                        target="_blank"
                                                        className="text-stone-400 hover:text-stone-600 p-1"
                                                        title="QR Code drucken"
                                                    >
                                                        <Printer className="h-5 w-5" />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, gift.id)}
                                                        className="text-stone-400 hover:text-red-600 p-1"
                                                        title="Löschen"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                <div className="text-stone-400">
                                                    {expandedId === gift.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedId === gift.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 sm:px-6 border-t border-stone-100 bg-stone-50/50">
                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Details</h4>
                                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <dt className="text-stone-500">Bestellnummer:</dt>
                                                                    <dd className="text-stone-900 font-mono">{gift.orderId || '-'}</dd>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <dt className="text-stone-500">E-Mail:</dt>
                                                                    <dd className="text-stone-900">{gift.customerEmail}</dd>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <dt className="text-stone-500">Erstellt am:</dt>
                                                                    <dd className="text-stone-900">
                                                                        {gift.createdAt?.seconds ? new Date(gift.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                                    </dd>
                                                                </div>
                                                                {gift.viewed && (
                                                                    <div className="flex justify-between">
                                                                        <dt className="text-stone-500">Gesehen am:</dt>
                                                                        <dd className="text-stone-900">
                                                                            {gift.viewedAt?.seconds ? new Date(gift.viewedAt.seconds * 1000).toLocaleString() : 'N/A'}
                                                                        </dd>
                                                                    </div>
                                                                )}
                                                            </dl>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Nachrichten ({gift.messages?.length || 0})</h4>
                                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                                {gift.messages?.map((msg, idx) => (
                                                                    <div key={idx} className="text-sm bg-white p-2 rounded border border-stone-200">
                                                                        <div className="flex items-center mb-1">
                                                                            {msg.type === 'video' ? (
                                                                                <Video className="h-3 w-3 text-rose-500 mr-1" />
                                                                            ) : (
                                                                                <MessageSquare className="h-3 w-3 text-rose-500 mr-1" />
                                                                            )}
                                                                            <span className="font-medium text-stone-700 text-xs">{msg.author}</span>
                                                                        </div>
                                                                        <p className="text-stone-600 truncate">{msg.content}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mx-auto mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-center text-stone-900 mb-2">
                                Geschenk wirklich löschen?
                            </h3>
                            <div className="text-sm text-stone-500 text-center space-y-2 mb-6">
                                <p>Bist du sicher, dass du dieses Geschenk löschen möchtest?</p>
                                <p className="font-semibold text-red-600 bg-red-50 p-2 rounded">
                                    Warnung: Der QR-Code wird ungültig! Der Empfänger kann die Nachricht nicht mehr sehen.
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-medium"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:bg-red-400"
                                >
                                    {isDeleting ? 'Lösche...' : 'Ja, löschen'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
