import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGifts, deleteGift } from '../services/gifts';
import { Plus, Gift, Eye, EyeOff, Loader, Printer, ChevronDown, ChevronUp, Edit2, Video, MessageSquare, Trash2, AlertTriangle, X, Watch, Coffee, Zap } from 'lucide-react';
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
                    <div>
                        <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
                        <p className="text-stone-500 mt-1">Verwalte deine Connected Gifts</p>
                    </div>
                    <Link
                        to="/admin/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Neuer Auftrag
                    </Link>
                </div>

                <div className="space-y-4">
                    {gifts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                            <Gift className="h-12 w-12 mx-auto text-stone-300 mb-4" />
                            <h3 className="text-lg font-medium text-stone-900">Keine Aufträge</h3>
                            <p className="text-stone-500">Warte auf Bestellungen oder nutze den Simulator.</p>
                        </div>
                    ) : (
                        gifts.map((gift) => (
                            <motion.div
                                layout
                                key={gift.id}
                                className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6 cursor-pointer" onClick={() => toggleExpand(gift.id)}>
                                    <div className="flex items-start justify-between">

                                        {/* Left Side: Icon & Main Info */}
                                        <div className="flex items-start space-x-4">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${gift.productType === 'bracelet' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                {gift.productType === 'bracelet' ? <Watch className="h-6 w-6" /> : <Coffee className="h-6 w-6" />}
                                            </div>

                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-lg font-bold text-stone-900">
                                                        {gift.recipientName || 'Unbekannt'}
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${gift.productType === 'bracelet' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
                                                        }`}>
                                                        {gift.productType === 'bracelet' ? 'Armband' : 'Tasse'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-stone-500">
                                                    Bestellung <span className="font-mono bg-stone-100 px-1 rounded">{gift.orderId || 'MANUAL'}</span> von {gift.customerName}
                                                </p>

                                                {/* Quick Production Info Preview */}
                                                <div className="mt-2 flex items-center space-x-4 text-xs font-medium text-stone-400">
                                                    {gift.productType === 'mug' && gift.designImage && (
                                                        <span className="flex items-center text-emerald-600">
                                                            <div className="w-4 h-4 rounded-full bg-emerald-500 mr-2"></div>
                                                            Design vorhanden
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Status & Actions */}
                                        <div className="flex items-center space-x-4">
                                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${gift.viewed ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                                                }`}>
                                                {gift.viewed ? (
                                                    <><Eye className="h-3 w-3" /> <span>Gesehen</span></>
                                                ) : (
                                                    <><EyeOff className="h-3 w-3" /> <span>Offen</span></>
                                                )}
                                            </div>

                                            <div className="h-8 w-px bg-stone-200"></div>

                                            <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                                                <Link to={`/admin/print/${gift.id}`} target="_blank" className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg" title="QR Code">
                                                    <Printer className="h-5 w-5" />
                                                </Link>
                                                <Link to={`/admin/edit/${gift.id}`} className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Bearbeiten">
                                                    <Edit2 className="h-5 w-5" />
                                                </Link>
                                                <button onClick={(e) => handleDeleteClick(e, gift.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Löschen">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div className="pl-2">
                                                {expandedId === gift.id ? <ChevronUp className="h-5 w-5 text-stone-400" /> : <ChevronDown className="h-5 w-5 text-stone-400" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Production View */}
                                <AnimatePresence>
                                    {expandedId === gift.id && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="border-t border-stone-100 bg-stone-50/50"
                                        >
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                                                {/* Col 1: Production Data (THE IMPORTANT PART) */}
                                                <div className="md:col-span-2 space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Produktions-Daten (Laser)</h4>

                                                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                                                            {gift.productType === 'mug' ? (
                                                                <div className="flex items-start space-x-6">
                                                                    {gift.designImage ? (
                                                                        <div className="shrink-0">
                                                                            <img src={gift.designImage} alt="Design" className="h-32 w-32 object-cover rounded-lg border border-stone-100 shadow-sm" />
                                                                            <p className="mt-2 text-xs text-center text-stone-400">Gewähltes Design</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-32 w-32 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 text-xs">Kein Bild</div>
                                                                    )}
                                                                    <div className="flex-1">
                                                                        <h5 className="font-bold text-stone-900 mb-1">Tassen-Gravur</h5>
                                                                        <p className="text-sm text-stone-600 mb-4">Bitte das gewählte Design + QR Code lasern.</p>
                                                                        <a
                                                                            href={gift.designImage}
                                                                            target="_blank"
                                                                            className="inline-flex items-center text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                                                                        >
                                                                            Bild in voller Größe öffnen
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // BRACELET VIEW
                                                                <div>
                                                                    <h5 className="font-bold text-stone-900 mb-2">Armband-Gravur</h5>
                                                                    {gift.engravingText ? (
                                                                        <div className="p-4 bg-stone-100 rounded-lg border-l-4 border-indigo-500">
                                                                            <p className="font-mono text-xl text-stone-900 tracking-wide">{gift.engravingText}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-yellow-800 text-sm flex items-center">
                                                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                                                            Warte auf Kunden-Input (Ritual noch nicht beendet).
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Digital Content Preview */}
                                                    <div>
                                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Digitaler Inhalt (QR Ziel)</h4>
                                                        <div className="bg-white p-4 rounded-xl border border-stone-200">
                                                            <div className="flex items-center space-x-2 text-sm text-stone-600 mb-2">
                                                                <span className="font-semibold">Absender:</span>
                                                                <span>{gift.senderName || gift.customerName}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-sm text-stone-600">
                                                                <span className="font-semibold">Nachrichten:</span>
                                                                <span>{gift.messages?.length || 0} Elemente</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Col 2: Meta Data */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Metadaten</h4>
                                                        <dl className="space-y-3 text-sm">
                                                            <div className="flex justify-between pb-2 border-b border-stone-100">
                                                                <dt className="text-stone-500">Kunden E-Mail</dt>
                                                                <dd className="font-medium text-stone-900 truncate ml-2" title={gift.customerEmail}>{gift.customerEmail}</dd>
                                                            </div>
                                                            <div className="flex justify-between pb-2 border-b border-stone-100">
                                                                <dt className="text-stone-500">Erstellt am</dt>
                                                                <dd className="text-stone-900">{gift.createdAt?.seconds ? new Date(gift.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</dd>
                                                            </div>
                                                            <div className="flex justify-between pb-2 border-b border-stone-100">
                                                                <dt className="text-stone-500">PIN Code</dt>
                                                                <dd className="font-mono font-bold text-stone-900">{gift.accessCode || '-'}</dd>
                                                            </div>
                                                        </dl>
                                                    </div>

                                                    <button className="w-full py-2 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200">
                                                        Status Update (Versendet)
                                                    </button>
                                                </div>

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Modal (Same as before) */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        >
                            <h3 className="text-lg font-bold text-center text-stone-900 mb-2">Geschenk löschen?</h3>
                            <div className="flex space-x-3 mt-6">
                                <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium">Abbrechen</button>
                                <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Löschen</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
